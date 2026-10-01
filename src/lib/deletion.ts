import type { Org } from "./org";
import { anonymisePerson } from "./privacy";
import type { Article, Db, LocalDateTime } from "./types";

/**
 * Deleting things, as plain functions on the database so the rules can be
 * tested without a server. Who may delete is decided by the server actions
 * (lib/permissions.ts); what a deletion takes with it is decided here.
 *
 * Three kinds, by how much can be undone:
 *  - an article goes to the trash for TRASH_DAYS days, whole, and can be put back;
 *  - a group is deleted for good, after a summary of what goes with it;
 *  - a person is erased for good (anonymised first, then removed), because a
 *    copy kept «so it can be undone» would defeat the point.
 */

export const TRASH_DAYS = 30;

/** Where a path is linked from, by a short label. Used to stop a deletion that would leave a dead link. */
export function linkedFrom(db: Db, path: string, ignoreNodeId?: string): string[] {
  const hit = (value: unknown) => {
    const json = JSON.stringify(value) ?? "";
    let at = json.indexOf(path);
    while (at !== -1) {
      const next = json[at + path.length];
      // «/nyheter/a» must not match «/nyheter/ab»
      if (!next || !/[A-Za-z0-9æøåÆØÅ_-]/.test(next)) return true;
      at = json.indexOf(path, at + 1);
    }
    return false;
  };
  const out: string[] = [];
  if (hit([db.club.footerLinks, db.club.pages])) out.push("bunnmenyen eller en informasjonsside");
  for (const node of db.nodes) {
    if (node.id === ignoreNodeId) continue;
    if (hit([node.announcement, node.heroActions, node.externalLinks, node.sections, node.participation])) out.push(node.name);
  }
  return out;
}

/* ─── Articles ──────────────────────────────────────────────────────────── */

export interface ArticleDeletion {
  ok: boolean;
  /** Why the article cannot be deleted. */
  blocked?: string;
}

/** What stops an article from being deleted, if anything. */
export function articleDeletionBlock(db: Db, article: Article): string | undefined {
  const from = linkedFrom(db, `/nyheter/${article.slug}`);
  if (from.length) return `Innlegget er lenket til fra ${from.join(" og ")}. Fjern lenken først, så kan innlegget slettes.`;
  return undefined;
}

/**
 * Moves an article to the trash: removed from the site, kept whole in the log
 * for TRASH_DAYS days. Front-page quotes that pointed at it lose the link and
 * get it back if the article is restored.
 */
export function trashArticle(db: Db, articleId: string, actorUserId: string, now: LocalDateTime, summary: string) {
  const article = db.articles.find((a) => a.id === articleId);
  if (!article) throw new Error("Innlegget finnes ikke");
  const unlinked = (db.club.testimonials ?? []).filter((t) => t.articleSlug === article.slug).map((t) => t.personId);
  for (const t of db.club.testimonials ?? []) if (t.articleSlug === article.slug) delete t.articleSlug;
  db.articles = db.articles.filter((a) => a.id !== articleId);
  db.audit.unshift({
    id: `audit-${Date.now().toString(36)}`,
    at: now,
    actorUserId,
    action: "deleteArticle",
    articleId,
    summary,
    deletedArticle: { article: structuredClone(article), unlinkedTestimonials: unlinked },
  });
  purgeTrash(db, now);
}

/** Puts a trashed article back, with its photos and front-page links. */
export function restoreTrashedArticle(db: Db, org: Org, auditId: string, actorUserId: string, now: LocalDateTime, summary: string): Article {
  const entry = db.audit.find((a) => a.id === auditId && a.action === "deleteArticle" && a.deletedArticle);
  const saved = entry?.deletedArticle;
  if (!entry || !saved) throw new Error("Innlegget finnes ikke lenger i papirkurven");
  if (!org.get(saved.article.nodeId)) throw new Error("Gruppen innlegget hørte til er slettet");
  if (db.articles.some((a) => a.id === saved.article.id || a.slug === saved.article.slug)) throw new Error("Det finnes allerede et innlegg med samme adresse");
  const article = structuredClone(saved.article);
  db.articles.push(article);
  for (const personId of saved.unlinkedTestimonials) {
    const t = db.club.testimonials?.find((x) => x.personId === personId && !x.articleSlug);
    if (t) t.articleSlug = article.slug;
  }
  // The copy has done its job: it is not kept a second time.
  delete entry.deletedArticle;
  db.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId, action: "restoreArticle", articleId: article.id, summary });
  return article;
}

/** Copies in the trash older than TRASH_DAYS days are dropped for good. */
export function purgeTrash(db: Db, now: LocalDateTime) {
  const cutoff = new Date(`${now.slice(0, 10)}T00:00:00`).getTime() - TRASH_DAYS * 86_400_000;
  for (const entry of db.audit) {
    if (entry.deletedArticle && new Date(`${entry.at.slice(0, 10)}T00:00:00`).getTime() < cutoff) delete entry.deletedArticle;
  }
}

/* ─── Groups ────────────────────────────────────────────────────────────── */

export interface GroupImpact {
  /** Reasons the group cannot be deleted at all. */
  blockers: string[];
  /** What goes with it, for the confirmation. */
  members: number;
  weekly: number;
  activities: number;
  races: number;
  articles: number;
  access: number;
  quotes: number;
}

export function groupImpact(db: Db, org: Org, nodeId: string): GroupImpact {
  const node = org.get(nodeId);
  const blockers: string[] = [];
  if (!node) return { blockers: ["Fant ikke gruppen."], members: 0, weekly: 0, activities: 0, races: 0, articles: 0, access: 0, quotes: 0 };
  if (!node.parentId) blockers.push("Klubben selv kan ikke slettes.");
  if (node.kind === "sport") blockers.push("Idretter slettes ikke her.");
  const below = org.children(nodeId);
  if (below.length) blockers.push(`Gruppen har ${below.length} ${below.length === 1 ? "undergruppe" : "undergrupper"} (${below.slice(0, 3).map((n) => n.name).join(", ")}${below.length > 3 ? " …" : ""}). Slett dem først.`);
  const from = linkedFrom(db, org.href(nodeId), nodeId);
  if (from.length) blockers.push(`Siden til gruppen er lenket til fra ${from.join(" og ")}. Fjern lenken først.`);
  for (const article of db.articles.filter((a) => a.nodeId === nodeId)) {
    const block = articleDeletionBlock(db, article);
    if (block) blockers.push(`Et innlegg i gruppen kan ikke slettes: ${block}`);
  }
  return {
    blockers,
    members: db.people.filter((p) => p.memberships.some((m) => m.nodeId === nodeId)).length,
    weekly: db.series.filter((s) => s.nodeId === nodeId).length,
    activities: db.activities.filter((a) => a.nodeId === nodeId).length,
    races: db.races.filter((r) => r.nodeId === nodeId).length,
    articles: db.articles.filter((a) => a.nodeId === nodeId).length,
    access: db.users.reduce((n, u) => n + u.roles.filter((r) => r.nodeId === nodeId).length, 0),
    quotes: node.quotes?.length ?? 0,
  };
}

/**
 * Deletes a group for good. People stay in the register and only lose their
 * place in it; their photos stay with the club and move up to the parent.
 * What belonged only to the group (its sessions, dates, races, articles and
 * the access given on it) goes. Articles go to the trash like any other.
 */
export function deleteGroup(db: Db, org: Org, nodeId: string, actorUserId: string, now: LocalDateTime, summary: string): GroupImpact {
  const impact = groupImpact(db, org, nodeId);
  if (impact.blockers.length) throw new Error(impact.blockers[0]);
  const node = org.get(nodeId)!;

  for (const article of db.articles.filter((a) => a.nodeId === nodeId)) {
    trashArticle(db, article.id, actorUserId, now, `Slettet «${article.slug}» da gruppen ble slettet`);
  }
  for (const person of db.people) person.memberships = person.memberships.filter((m) => m.nodeId !== nodeId);
  for (const user of db.users) user.roles = user.roles.filter((r) => r.nodeId !== nodeId);
  for (const photo of db.photos) if (photo.nodeId === nodeId) photo.nodeId = node.parentId!;
  db.series = db.series.filter((s) => s.nodeId !== nodeId);
  db.activities = db.activities.filter((a) => a.nodeId !== nodeId);
  db.races = db.races.filter((r) => r.nodeId !== nodeId);
  db.nodes = db.nodes.filter((n) => n.id !== nodeId);

  db.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId, action: "deleteGroup", summary });
  return impact;
}

/* ─── People ────────────────────────────────────────────────────────────── */

/** What stops a person from being erased, if anything. */
export function personDeletionBlock(db: Db, personId: string): string | undefined {
  const person = db.people.find((p) => p.id === personId);
  if (!person) return "Fant ikke personen.";
  const account = person.userId ? db.users.find((u) => u.id === person.userId) : undefined;
  if (account?.roles.length) return `${account.name} har tilgang til administrasjonen. Fjern tilgangen først.`;
  return undefined;
}

/**
 * Erases a person for good: first the usual anonymisation (photos hidden,
 * names in published text and dates rewritten), then the record itself, the
 * account that belonged to them and their place as someone's guardian. A
 * quote of theirs on a group page is removed with them. The log keeps only
 * that it happened, never who.
 */
export function erasePerson(db: Db, org: Org, personId: string, actorUserId: string, now: LocalDateTime): void {
  const block = personDeletionBlock(db, personId);
  if (block) throw new Error(block);
  const person = db.people.find((p) => p.id === personId)!;
  if (person.privacy.status !== "anonymised") anonymisePerson(db, org, personId, actorUserId, now);

  for (const node of db.nodes) if (node.quotes?.some((q) => q.personId === personId)) node.quotes = node.quotes.filter((q) => q.personId !== personId);
  if (db.club.testimonials?.some((t) => t.personId === personId)) db.club.testimonials = db.club.testimonials.filter((t) => t.personId !== personId);
  for (const user of db.users) {
    user.guardianOfPersonIds = user.guardianOfPersonIds.filter((id) => id !== personId);
    if (user.personId === personId) user.personId = undefined;
  }
  db.users = db.users.filter((u) => !(u.id === person.userId && u.roles.length === 0));
  for (const other of db.people) if (other.guardianUserIds && person.userId) other.guardianUserIds = other.guardianUserIds.filter((id) => id !== person.userId);
  for (const article of db.articles) if (article.aboutPersonId === personId) article.aboutPersonId = undefined;
  db.privacyRequests = db.privacyRequests.filter((r) => r.personId !== personId);
  // An id can carry a name («p-nora»), so the log must not keep it either.
  for (const entry of db.audit) if (entry.personId === personId) entry.personId = undefined;
  db.people = db.people.filter((p) => p.id !== personId);

  db.audit.unshift({
    id: `audit-${Date.now().toString(36)}`,
    at: now,
    actorUserId,
    action: "erasePerson",
    summary: "Slettet en person fra registeret",
  });
}
