import type { Org } from "./org";
import type { Article, Db, Person, Photo, User } from "./types";

/** What a club's stories are, unless it has said otherwise (`identity.newsKinds`). */
export const DEFAULT_NEWS_KINDS = "Kampreferater, beskjeder og historier";

export const articleHref = (a: Pick<Article, "slug">) => `/nyheter/${a.slug}`;

export function articlePhotoIds(a: Article): string[] {
  const ids = a.heroPhotoId ? [a.heroPhotoId] : [];
  for (const b of a.blocks) {
    if (b.type === "photo") ids.push(b.photoId);
    if (b.type === "gallery") ids.push(...b.photoIds);
  }
  return [...new Set(ids)];
}

export const byPublishedDesc = (a: Article, b: Article) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "");

export function publishedArticles(db: Db): Article[] {
  return db.articles.filter((a) => a.status === "published").sort(byPublishedDesc);
}

/**
 * Articles roll upward: a post on J16-2 appears on J16, Jenter and Fotball.
 */
export function articlesInSubtree(db: Db, org: Org, nodeId: string): Article[] {
  const ids = org.subtree(nodeId);
  return publishedArticles(db).filter((a) => ids.has(a.nodeId));
}

/** Posts published higher up that concern this group too (e.g. J16 news on J16-2). */
export function articlesFromParents(db: Db, org: Org, nodeId: string): Article[] {
  const parents = new Set(
    org
      .lineage(nodeId)
      .slice(0, -1)
      .filter((n) => n.kind === "ageGroup" || n.kind === "discipline")
      .map((n) => n.id),
  );
  return publishedArticles(db).filter((a) => parents.has(a.nodeId));
}

/** Front page: explicitly featured posts plus anything published at club level. */
export function homepageArticles(db: Db): Article[] {
  return publishedArticles(db).filter((a) => a.onHomepage || a.nodeId === db.club.id);
}

export const photoById = (db: Db, id?: string): Photo | undefined => (id ? db.photos.find((p) => p.id === id) : undefined);

/**
 * The photo that fronts a node's page — every page has one. In order: the
 * node's own cover, a photo published on the node, the nearest cover below
 * it, the nearest cover or photo above it, and finally the club's hero.
 * Withdrawn photos are never used.
 */
export function heroPhotoFor(db: Db, org: Org, nodeId: string): Photo | undefined {
  const usable = (p?: Photo) => (p && !p.withdrawn ? p : undefined);
  const cover = (id: string) => usable(photoById(db, org.get(id)?.coverPhotoId));
  const own = (id: string) => cover(id) ?? db.photos.find((p) => p.nodeId === id && !p.withdrawn);
  return (
    own(nodeId) ??
    org
      .descendants(nodeId)
      .map((n) => cover(n.id))
      .find(Boolean) ??
    org
      .lineage(nodeId)
      .slice(0, -1)
      .reverse()
      .map((n) => own(n.id))
      .find(Boolean) ??
    usable(photoById(db, db.club.heroPhotoId))
  );
}

export const userById = (db: Db, id?: string): User | undefined => (id ? db.users.find((u) => u.id === id) : undefined);

export const personById = (db: Db, id?: string | null): Person | undefined =>
  id ? db.people.find((p) => p.id === id) : undefined;

export const fullName = (p: Pick<Person, "firstName" | "lastName">) => `${p.firstName} ${p.lastName}`;

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const MEMBERSHIP_TITLE: Record<string, string> = {
  athlete: "Utøver",
  headCoach: "Hovedtrener",
  coach: "Trener",
  teamManager: "Lagleder",
  sectionLead: "Leder",
  generalManager: "Daglig leder",
  boardChair: "Styreleder",
  volunteer: "Frivillig",
};

export function membershipTitle(role: string, title?: string, sportId?: string): string {
  if (title) return title;
  if (role === "athlete") return sportId === "fotball" ? "Spiller" : "Utøver";
  return MEMBERSHIP_TITLE[role] ?? role;
}

/** Public contacts for a node: its own staff first, then the nearest section lead. */
export function contactsFor(db: Db, org: Org, nodeId: string, { inherit = true } = {}) {
  const staffRoles = new Set(["headCoach", "coach", "teamManager", "sectionLead", "generalManager", "boardChair"]);
  const ids = org.isLeaf(nodeId) ? new Set([nodeId]) : org.subtree(nodeId);
  const direct = db.people.flatMap((p) =>
    p.memberships
      .filter((m) => staffRoles.has(m.role) && (org.isLeaf(nodeId) ? ids.has(m.nodeId) : m.nodeId === nodeId))
      .map((m) => ({ person: p, membership: m, inherited: false })),
  );
  if (!inherit || direct.some((c) => c.membership.role === "sectionLead")) return direct;
  const lead = org
    .lineage(nodeId)
    .slice(0, -1)
    .reverse()
    .flatMap((n) =>
      db.people.flatMap((p) =>
        p.memberships.filter((m) => m.nodeId === n.id && m.role === "sectionLead").map((m) => ({ person: p, membership: m, inherited: true })),
      ),
    )
    .slice(0, 1);
  return [...direct, ...lead];
}

/**
 * Who presents a group: the person a parent or a new rider meets first on its
 * page. The team manager if it has one — the lagleder — then its head coach,
 * any coach, and last the section lead it inherits. Takes contactsFor's list.
 */
export function presenterFor<C extends { membership: { role: string }; inherited: boolean }>(contacts: C[]): C | undefined {
  const order = ["teamManager", "headCoach", "coach", "sectionLead"];
  const own = contacts.filter((c) => !c.inherited);
  for (const role of order) {
    const hit = own.find((c) => c.membership.role === role);
    if (hit) return hit;
  }
  return own[0] ?? contacts[0];
}

/** A person's portrait, only while they are visible and have said yes to photos. */
export function portraitOf(db: Db, person: Person): Photo | undefined {
  if (person.privacy.status !== "visible" || person.privacy.photoConsent !== "granted") return undefined;
  const photo = photoById(db, person.portraitPhotoId);
  return photo && !photo.withdrawn ? photo : undefined;
}

export function athletesIn(db: Db, nodeId: string): Person[] {
  return db.people
    .filter((p) => p.memberships.some((m) => m.nodeId === nodeId && m.role === "athlete"))
    .sort((a, b) => a.firstName.localeCompare(b.firstName, "nb"));
}

export function authorLine(db: Db, org: Org, a: Article): string {
  const user = userById(db, a.authorUserId);
  if (!user) return "";
  const person = personById(db, user.personId);
  const m = person?.memberships[0];
  if (m && m.role !== "athlete") {
    const node = org.get(m.nodeId);
    const title = membershipTitle(m.role, m.title).toLowerCase();
    const nodeName = node && node.kind !== "club" && !m.title ? ` ${node.name}` : "";
    return `${user.name}, ${title}${nodeName}`;
  }
  if (user.guardianOfPersonIds.length) return `${user.name}, forelder`;
  return user.name;
}

/**
 * Article addresses must never contain a person's name. A URL outlives the
 * text it points to: anonymisation can rewrite the article, but not the
 * address someone has already shared, linked or indexed. So every word that
 * matches a first or last name in the club register is dropped from the slug
 * — including words that are also ordinary Norwegian words, since the wrong
 * direction to err is the one that leaks a name — and if nothing is left,
 * the caller's fallback (the group name and the article id) is used.
 */
export function articleSlug(db: Db, nodeName: string, title: string, fallback: string): string {
  const names = new Set(
    db.people
      .flatMap((p) => [slugify(p.firstName), slugify(p.lastName)])
      .flatMap((s) => s.split("-"))
      .filter(Boolean),
  );
  const slug = slugify(`${nodeName} ${title}`)
    .split("-")
    .filter((word) => word && !names.has(word))
    .join("-")
    .slice(0, 64)
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}
