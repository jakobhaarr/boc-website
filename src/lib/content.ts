import { bylineTitle } from "./access";
import type { Org } from "./org";
import type { Article, Db, OrgNode, Person, Photo, User } from "./types";

/** What a club's stories are, unless it has said otherwise (`identity.newsKinds`). */
export const DEFAULT_NEWS_KINDS = "Kampreferater, beskjeder og historier";

/**
 * How long ago `since` was, rounded to the nearest decade and said the way a
 * person would: 58 years → «Snart 60 år», 62 → «Over 60 år», 60 → «60 år».
 * Five or more years past a decade rounds up. Under ten years it is exact.
 */
export function yearsInDecades(since: number, today: string): string {
  const years = Number(today.slice(0, 4)) - since;
  if (years < 10) return `${years} år`;
  const decade = Math.round(years / 10) * 10;
  if (years === decade) return `${decade} år`;
  return years < decade ? `Snart ${decade} år` : `Over ${decade} år`;
}

/** A person's member story («Les … historie»), when one is published about them. */
export const storyOf = (db: Db, personId: string): Article | undefined => db.articles.find((a) => a.memberStory && a.status === "published" && a.aboutPersonId === personId);

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
  // Member stories are reached from their quote, not listed as news.
  return db.articles.filter((a) => a.status === "published" && !a.memberStory).sort(byPublishedDesc);
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

export const personById = (db: Db, id?: string | null): Person | undefined => (id ? db.people.find((p) => p.id === id) : undefined);

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
  // The group's leader first, then its other coaches; everyone else keeps their order.
  const rank = (role: string) => ({ teamManager: 0, headCoach: 1, coach: 2 })[role] ?? 3;
  direct.sort((a, b) => rank(a.membership.role) - rank(b.membership.role));
  if (!inherit || direct.some((c) => c.membership.role === "sectionLead")) return direct;
  const lead = org
    .lineage(nodeId)
    .slice(0, -1)
    .reverse()
    .flatMap((n) =>
      db.people.flatMap((p) => p.memberships.filter((m) => m.nodeId === n.id && m.role === "sectionLead").map((m) => ({ person: p, membership: m, inherited: true }))),
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

/**
 * The picture on a person's quote cards: their own quote picture (Person.quotePhotoId) if they have one, otherwise their
 * portrait. Shown under the same rules as the portrait: only while the person is visible and has said yes to photos.
 */
export function quotePhotoOf(db: Db, person: Person): Photo | undefined {
  if (person.privacy.status !== "visible" || person.privacy.photoConsent !== "granted") return undefined;
  const own = photoById(db, person.quotePhotoId);
  return own && !own.withdrawn ? own : portraitOf(db, person);
}

/** The profile picture, when the quote cards use a picture of their own for the person (quotePhotoOf) and the person also has a profile picture to show. */
export function profileBesideQuotePhoto(db: Db, person: Person): Photo | undefined {
  const quote = quotePhotoOf(db, person);
  const profile = portraitOf(db, person);
  return quote && profile && quote.id !== profile.id ? profile : undefined;
}

/**
 * A portrait is wide enough for the «Naturlig» card when it is more than 50 % wider than it is tall
 * (width / height above 1.5): those cards use the picture across the card. A square or upright picture suits «Farget kort».
 * Method: ratio = width / height, wide when ratio > 1.5.
 */
export const WIDE_PORTRAIT_RATIO = 1.5;
export const isWidePortrait = (photo?: Pick<Photo, "width" | "height">) => !!photo && photo.height > 0 && photo.width / photo.height > WIDE_PORTRAIT_RATIO;

/**
 * What the «Hvit studio» card requires of a portrait: a plain white or see-through background (Photo.background), and a shape
 * that is not wider than 120 % of its height (width / height at most 1.2), since the card sets the person upright on white.
 * Returns why the picture does not qualify, in the words admin shows, or undefined when it does.
 * Method: ratio = width / height; too wide when ratio > 1.2. A picture is turned down for its background only when it is
 * known to have neither (background «other»); one nobody has checked (missing) is allowed, so a portrait uploaded before the
 * background was recorded keeps the style someone chose for it.
 */
export const STUDIO_MAX_RATIO = 1.2;
export function studioProblem(photo?: Pick<Photo, "width" | "height" | "background">): string | undefined {
  if (!photo) return "Det er ikke lagt inn noe bilde.";
  if (photo.background === "other") return "Bildet har ikke hvit eller gjennomsiktig bakgrunn.";
  if (photo.height > 0 && photo.width / photo.height > STUDIO_MAX_RATIO) return "Bildet er mer enn 20 % bredere enn det er høyt.";
  return undefined;
}

/**
 * How a person's quote cards are styled: their own choice, else the portrait's default. A portrait that is not wide
 * enough for the picture cards gets «Farget kort» unless someone has chosen otherwise (admin warns about that choice). «Hvit
 * studio» is never used for a portrait that does not qualify (studioProblem), whoever chose it: it falls back to «Farget kort».
 */
export const cardStyleOf = (person: Pick<Person, "cardStyle">, photo?: Pick<Photo, "cardStyle" | "width" | "height" | "background">) => {
  const style = person.cardStyle ?? (photo && !isWidePortrait(photo) && photo.cardStyle !== "studio" ? "color" : photo?.cardStyle);
  return style === "studio" && studioProblem(photo) ? "color" : style;
};

/** The style a person's choice may stand as for this portrait: «Hvit studio» only when it qualifies, «Naturlig» only when wide. */
export function allowedStyle(style: "natural" | "studio" | "color" | undefined, photo: Pick<Photo, "width" | "height" | "background">): "natural" | "studio" | "color" | undefined {
  if (style === "studio" && studioProblem(photo)) return "color";
  if (style === "natural" && !isWidePortrait(photo)) return "color";
  return style;
}

export interface TestimonialView {
  cardStyle?: "natural" | "studio" | "color";
  id: string;
  firstName: string;
  /** From the birth year alone, so it can be a year high until the birthday. */
  age?: number;
  groups: string[];
  /** The same groups, each with the address of its page, so the names can be links. */
  groupLinks: { name: string; href: string }[];
  /**
   * The groups as breadcrumb trails, discipline first («Innendørs › Zwift»; a discipline with several groups is one trail,
   * «Landevei › BOC 2 · BOC 3»). Shown in place of `groups` where it is not empty.
   */
  groupTrails: { name: string; href: string }[][];
  quote: string;
  photo?: Photo;
  /**
   * The person's profile picture, set only when `photo` is their own quote picture (Person.quotePhotoId) and they have both.
   * The slanted wide card uses it in place of the quote picture when the card style is «Naturlig» (a wide natural picture is
   * cropped badly by the slanted edge), see QuoteStage.
   */
  profilePhoto?: Photo;
  example: boolean;
  /** The member's story, when it is published. */
  href?: string;
  inDeck: boolean;
  shade?: "light" | "dark";
}

/** The club's member quotes (Club.testimonials), for people who may be shown. */
export function testimonialsFor(db: Db, org: Org, today: string): TestimonialView[] {
  return [...clubTestimonials(db, org, today), ...frontPageGroupQuotes(db, org, today)];
}

/** Group quotes the club administrator has approved for the front page (OrgNode.quotes with front «approved»). */
function frontPageGroupQuotes(db: Db, org: Org, today: string): TestimonialView[] {
  const taken = new Set((db.club.testimonials ?? []).map((t) => t.personId));
  return org.nodes.flatMap((node) =>
    (node.quotes ?? []).flatMap((q) => {
      if (q.front !== "approved" || taken.has(q.personId)) return [];
      const person = personById(db, q.personId);
      if (!person || person.privacy.status !== "visible") return [];
      taken.add(q.personId);
      const age = q.relation ? undefined : ageOn(person, q.givenAt ?? today);
      const lineage = org.lineage(node.id);
      const discipline = lineage.find((n) => n.kind === "discipline" && n.id !== node.id);
      return [
        {
          id: `${node.id}-${q.personId}`,
          firstName: person.firstName,
          age,
          groups: [q.relation ?? (discipline && !node.name.includes(discipline.name) ? `${discipline.name} · ${node.name}` : node.name)],
          groupLinks: [{ name: q.relation ?? (discipline && !node.name.includes(discipline.name) ? `${discipline.name} · ${node.name}` : node.name), href: org.href(node.id) }],
          groupTrails: [
            q.relation
              ? [{ name: q.relation, href: org.href(node.id) }]
              : discipline && !node.name.includes(discipline.name)
                ? [
                    { name: discipline.name, href: org.href(discipline.id) },
                    { name: node.name, href: org.href(node.id) },
                  ]
                : [{ name: node.name, href: org.href(node.id) }],
          ],
          quote: q.quote,
          photo: quotePhotoOf(db, person),
          profilePhoto: profileBesideQuotePhoto(db, person),
          cardStyle: cardStyleOf(person, quotePhotoOf(db, person)),
          example: !!q.example,
          href: storyHref(db, q.personId),
          inDeck: false,
        },
      ];
    }),
  );
}

function storyHref(db: Db, personId: string, articleSlug?: string): string | undefined {
  const named = articleSlug && db.articles.find((a) => a.slug === articleSlug && a.status === "published");
  const story = named || storyOf(db, personId);
  return story ? articleHref({ slug: story.slug }) : undefined;
}

/**
 * The group quote the front page says for a person who is in the club's list of member quotes: the one marked «På forsiden»
 * in /admin/sitater, otherwise the first they have. A person can have a quote on several groups' pages.
 */
export function frontQuoteOf(db: Db, personId: string): { nodeId: string; quote: string } | undefined {
  const all = db.nodes.flatMap((n) => (n.quotes ?? []).filter((q) => q.personId === personId).map((q) => ({ nodeId: n.id, quote: q.quote, front: q.front })));
  const chosen = all.find((q) => q.front === "approved") ?? all[0];
  return chosen && { nodeId: chosen.nodeId, quote: chosen.quote };
}

function clubTestimonials(db: Db, org: Org, today: string): TestimonialView[] {
  return (db.club.testimonials ?? []).flatMap((t) => {
    const person = personById(db, t.personId);
    if (!person || person.privacy.status !== "visible") return [];
    // The person's quote on a group's page comes first, so a change in /admin/sitater reaches the front page; `t.quote` is for
    // someone who has none there.
    const quote = frontQuoteOf(db, t.personId)?.quote ?? t.quote;
    if (!quote) return [];
    // «BMX · Gruppe 3»: a group's own name says little without its discipline, which is named once for the groups under it
    // («Landevei · BOC 2 · BOC 3 · Innendørs · Spinning», not «Landevei · BOC 2 · Landevei · BOC 3 …»).
    const athlete = person.memberships.filter((m) => m.role === "athlete");
    const byDiscipline = new Map<string, { name: string; href: string }[]>();
    const disciplineHref = new Map<string, string>();
    for (const m of athlete.length > 0 ? athlete : person.memberships) {
      const node = org.get(m.nodeId);
      if (!node) continue;
      const discipline = org.lineage(m.nodeId).find((n) => n.kind === "discipline" && n.id !== node.id);
      const key = discipline && !node.name.includes(discipline.name) ? discipline.name : "";
      if (discipline) disciplineHref.set(discipline.name, org.href(discipline.id));
      byDiscipline.set(key, [...(byDiscipline.get(key) ?? []), { name: node.name, href: org.href(node.id) }]);
    }
    const groupLinks = [...byDiscipline].flatMap(([discipline, nodes]) => (discipline ? [{ name: discipline, href: disciplineHref.get(discipline) ?? "/" }, ...nodes] : nodes));
    const groups = groupLinks.map((g) => g.name);
    const groupTrails = [...byDiscipline].flatMap(([discipline, nodes]) =>
      discipline ? [[{ name: discipline, href: disciplineHref.get(discipline) ?? "/" }, ...nodes]] : nodes.map((n) => [n]),
    );
    return [
      {
        id: t.personId,
        firstName: person.firstName,
        age: person.birthYear ? Number(today.slice(0, 4)) - person.birthYear : undefined,
        groups,
        groupLinks,
        groupTrails,
        quote,
        photo: quotePhotoOf(db, person),
        profilePhoto: profileBesideQuotePhoto(db, person),
        cardStyle: cardStyleOf(person, quotePhotoOf(db, person)),
        example: !!t.example,
        inDeck: !t.notInDeck,
        shade: t.shade,
        href: storyHref(db, t.personId, t.articleSlug),
      },
    ];
  });
}

export function athletesIn(db: Db, nodeId: string): Person[] {
  return db.people.filter((p) => p.memberships.some((m) => m.nodeId === nodeId && m.role === "athlete")).sort((a, b) => a.firstName.localeCompare(b.firstName, "nb"));
}

/** An article's author as a name and, where they have one, a role: «Gruppeleder Zwift», «Forelder». */
export function authorParts(db: Db, org: Org, a: Article): { name: string; role?: string } {
  // An external who wrote it is named alone: they have no role in the club's register.
  const external = a.externalAuthorId ? db.externals.find((e) => e.id === a.externalAuthorId) : undefined;
  if (external) return { name: external.name };
  const user = userById(db, a.authorUserId);
  if (!user) return { name: "" };
  const person = personById(db, user.personId);
  const m = person?.memberships[0];
  // Someone who is only a «Frivillig» in the register, but was given access as «Lagleder» (or «Trener») for the group the article is
  // on, is called what the club calls them there. A role the register states itself (a Road Captain, a gruppeleder) goes first.
  if (!m || m.role === "volunteer" || m.role === "athlete") {
    for (const r of user.roles) {
      const title = bylineTitle(r);
      const at = org.get(r.nodeId);
      if (title && at && at.kind !== "club" && org.contains(r.nodeId, a.nodeId)) return { name: user.name, role: `${title} ${at.name}` };
    }
  }
  if (m && m.role !== "athlete") {
    const node = org.get(m.nodeId);
    const title = membershipTitle(m.role, m.title);
    const nodeName = node && node.kind !== "club" && !m.title ? ` ${node.name}` : "";
    return { name: user.name, role: `${title}${nodeName}` };
  }
  if (user.guardianOfPersonIds.length) return { name: user.name, role: "Forelder" };
  return { name: user.name };
}

/** The author on one line, «Jakob Jølstad, Gruppeleder Zwift», for cards and lists. */
export function authorLine(db: Db, org: Org, a: Article): string {
  const { name, role } = authorParts(db, org, a);
  return role ? `${name}, ${role}` : name;
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

export interface GroupQuoteView {
  id: string;
  personId: string;
  name: string;
  /** «47 år» for a rider; a parent is named by `relation` instead. */
  detail?: string;
  age?: number;
  relation?: string;
  photo?: Photo;
  cardStyle?: "natural" | "studio" | "color";
  quote: string;
  example: boolean;
  front?: "requested" | "approved";
  /** The person's story, when one is published. */
  href?: string;
}

/** A group's quotes (OrgNode.quotes) for people who may be shown. */
export function groupQuotesFor(db: Db, node: OrgNode, today: string): GroupQuoteView[] {
  return (node.quotes ?? []).flatMap((q) => {
    const person = personById(db, q.personId);
    if (!person || person.privacy.status !== "visible") return [];
    const age = ageOn(person, q.givenAt ?? today);
    return [
      {
        id: `${node.id}-${q.personId}`,
        personId: q.personId,
        name: person.firstName,
        detail: q.relation ?? (age !== undefined ? `${age} år` : undefined),
        age: q.relation ? undefined : age,
        relation: q.relation,
        photo: quotePhotoOf(db, person),
        profilePhoto: profileBesideQuotePhoto(db, person),
        cardStyle: cardStyleOf(person, quotePhotoOf(db, person)),
        quote: q.quote,
        example: !!q.example,
        front: q.front,
        href: storyHref(db, q.personId),
      },
    ];
  });
}

/**
 * A person's age on a date: exact from the birth date where it is on file,
 * otherwise from the birth year alone (which runs a year high until the
 * birthday). Undefined when neither is known.
 */
export function ageOn(person: Pick<Person, "birthYear" | "birthDate">, date: string): number | undefined {
  if (person.birthDate) {
    const years = Number(date.slice(0, 4)) - Number(person.birthDate.slice(0, 4));
    return date.slice(5, 10) < person.birthDate.slice(5, 10) ? years - 1 : years;
  }
  return person.birthYear ? Number(date.slice(0, 4)) - person.birthYear : undefined;
}
