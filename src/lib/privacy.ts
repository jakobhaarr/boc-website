import { articleHref, articlePhotoIds } from "./content";
import type { Org } from "./org";
import { mentionsPerson, neutralise, plain } from "./rich-text";
import type {
  Activity,
  ActivityPerson,
  AnonymisationReport,
  Article,
  Block,
  Db,
  Inline,
  LocalDateTime,
  Photo,
  Region,
} from "./types";

/* ──────────────────────────────────────────────────────────────────────────
   PUBLISHED PRESENCE
   Where a person can currently be found on the public site. Everything is
   derived from structural links (photo tags, mentions, activity slots) —
   never from searching for a name string.
   ────────────────────────────────────────────────────────────────────────── */

export interface PublicUse {
  kind: "article" | "page" | "venue";
  label: string;
  href: string;
}

/** Public places a photo is shown. */
export function photoUses(db: Db, org: Org, photoId: string): PublicUse[] {
  const uses: PublicUse[] = [];
  for (const a of db.articles) {
    if (a.status === "published" && articlePhotoIds(a).includes(photoId)) {
      uses.push({ kind: "article", label: plain(a.title), href: articleHref(a) });
    }
  }
  for (const n of db.nodes) {
    if (n.coverPhotoId === photoId) uses.push({ kind: "page", label: `Siden for ${n.name}`, href: org.href(n.id) });
  }
  for (const v of db.venues) {
    if (v.photoId === photoId) uses.push({ kind: "venue", label: v.name, href: "/aktiviteter" });
  }
  return uses;
}

export function isPhotoPublic(db: Db, org: Org, photo: Photo): boolean {
  return !photo.withdrawn && photoUses(db, org, photo.id).length > 0;
}

export type TextWhere = "title" | "lead" | "body" | "quote" | "caption";

export interface TextLocation {
  key: string;
  where: TextWhere;
  context: { label: string; href: string };
  before: Inline[];
  /** null — the whole passage is removed. */
  after: Inline[] | null;
}

export interface PresencePhoto {
  photo: Photo;
  region: Region | null;
  uses: PublicUse[];
}

export interface PresenceActivity {
  activity: Activity;
  role: ActivityPerson["role"];
}

export interface Presence {
  photos: PresencePhoto[];
  text: TextLocation[];
  activities: PresenceActivity[];
  articleIds: string[];
}

export function publishedPresence(db: Db, org: Org, personId: string): Presence {
  const photos: PresencePhoto[] = db.photos
    .filter((p) => p.people.some((pp) => pp.personId === personId))
    .map((photo) => ({
      photo,
      region: photo.people.find((pp) => pp.personId === personId)?.region ?? null,
      uses: photoUses(db, org, photo.id),
    }))
    .filter((p) => !p.photo.withdrawn && p.uses.length > 0);

  const text: TextLocation[] = [];
  const articleIds = new Set<string>();
  const seenCaptions = new Set<string>();

  for (const a of db.articles.filter((x) => x.status === "published")) {
    const context = { label: plain(a.title), href: articleHref(a) };
    const push = (loc: Omit<TextLocation, "context"> & { context?: TextLocation["context"] }) => {
      text.push({ context, ...loc });
      articleIds.add(a.id);
    };

    if (mentionsPerson(a.title, personId)) {
      push({ key: `${a.id}:title`, where: "title", before: a.title, after: neutralise(a.title, personId) });
    }
    if (a.lead && mentionsPerson(a.lead, personId)) {
      push({ key: `${a.id}:lead`, where: "lead", before: a.lead, after: neutralise(a.lead, personId) });
    }
    a.blocks.forEach((b, i) => {
      if (b.type === "list" && b.items.some((item) => mentionsPerson(item, personId))) {
        const before = b.items.flat();
        push({ key: `${a.id}:b${i}`, where: "body", before, after: neutralise(before, personId) });
      }
      if (b.type === "paragraph" && mentionsPerson(b.content, personId)) {
        const after = neutralise(b.content, personId);
        push({ key: `${a.id}:b${i}`, where: "body", before: b.content, after: plain(after).trim() ? after : null });
      }
      if (b.type === "quote" && (b.speakerPersonId === personId || mentionsPerson(b.content, personId))) {
        push({
          key: `${a.id}:b${i}`,
          where: "quote",
          before: b.content,
          after: b.speakerPersonId === personId ? null : neutralise(b.content, personId),
        });
      }
    });
    for (const photoId of articlePhotoIds(a)) {
      const photo = db.photos.find((p) => p.id === photoId);
      if (!photo?.caption || photo.withdrawn || seenCaptions.has(photoId)) continue;
      if (mentionsPerson(photo.caption, personId)) {
        seenCaptions.add(photoId);
        push({ key: `${photoId}:caption`, where: "caption", before: photo.caption, after: neutralise(photo.caption, personId) });
      }
    }
  }

  const activities: PresenceActivity[] = db.activities.flatMap((activity) =>
    (activity.people ?? []).filter((p) => p.personId === personId).map((p) => ({ activity, role: p.role })),
  );

  for (const p of photos) for (const u of p.uses) if (u.kind === "article") {
    const a = db.articles.find((x) => articleHref(x) === u.href);
    if (a) articleIds.add(a.id);
  }

  return { photos, text, activities, articleIds: [...articleIds] };
}

/* ──────────────────────────────────────────────────────────────────────────
   PERMANENT ANONYMISATION
   Rewrites stored content. There is no flag to flip back: names are replaced
   by neutral wording, identifying passages and quotes are deleted, photo
   links are replaced by redaction regions, and activity slots lose the
   person id. Only an audit entry without the name remains.
   ────────────────────────────────────────────────────────────────────────── */

/** Redactions extend well beyond the tagged body so posture and kit are hidden too. */
export function expandRegion(r: Region): Region {
  const padX = r.w * 0.22 + 2;
  const padTop = r.h * 0.07 + 1;
  const padBottom = r.h * 0.06 + 1;
  const x = Math.max(0, r.x - padX);
  const y = Math.max(0, r.y - padTop);
  return {
    x,
    y,
    w: Math.min(100 - x, r.w + padX * 2),
    h: Math.min(100 - y, r.h + padTop + padBottom),
  };
}

export function anonymisePerson(
  db: Db,
  org: Org,
  personId: string,
  actorUserId: string,
  now: LocalDateTime,
): AnonymisationReport {
  const person = db.people.find((p) => p.id === personId);
  if (!person) throw new Error("Personen finnes ikke");
  if (person.privacy.status === "anonymised") throw new Error("Personen er allerede anonymisert");

  const presence = publishedPresence(db, org, personId);
  const report: AnonymisationReport = {
    photosRedacted: [],
    photosWithdrawn: [],
    textLocations: presence.text.map((t) => ({
      articleId: t.key.split(":")[0],
      where: t.where,
    })),
    activities: presence.activities.map((a) => a.activity.id),
    articlesChanged: [],
  };
  const touchedPhotos = new Set<string>();

  for (const photo of db.photos) {
    const links = photo.people.filter((pp) => pp.personId === personId);
    if (links.length === 0) {
      if (photo.caption && mentionsPerson(photo.caption, personId)) {
        photo.caption = neutralise(photo.caption, personId);
        touchedPhotos.add(photo.id);
      }
      continue;
    }
    for (const link of links) {
      if (link.region) photo.redactions.push(expandRegion(link.region));
      else photo.withdrawn = { at: now, reason: "Person anonymisert, kunne ikke skjules automatisk i bildet" };
    }
    (photo.withdrawn ? report.photosWithdrawn : report.photosRedacted).push(photo.id);
    photo.people = photo.people.filter((pp) => pp.personId !== personId);
    if (photo.caption) photo.caption = neutralise(photo.caption, personId);
    touchedPhotos.add(photo.id);
  }

  for (const a of db.articles) {
    const before = JSON.stringify([a.title, a.lead, a.blocks]);
    rewriteArticle(a, personId);
    const changed = JSON.stringify([a.title, a.lead, a.blocks]) !== before;
    if (changed || articlePhotoIds(a).some((id) => touchedPhotos.has(id))) {
      a.privacyEditedAt = now;
      report.articlesChanged.push(a.id);
    }
  }

  for (const activity of db.activities) {
    if (activity.people?.some((p) => p.personId === personId)) {
      activity.people = activity.people.map((p) => (p.personId === personId ? { ...p, personId: null } : p));
    }
  }

  person.privacy = {
    ...person.privacy,
    status: "anonymised",
    photoConsent: "declined",
    anonymisedAt: now,
    anonymisedByUserId: actorUserId,
  };

  for (const r of db.privacyRequests) {
    if (r.personId === personId && r.status === "open") {
      r.status = "completed";
      r.completedAt = now;
    }
  }

  const photoCount = report.photosRedacted.length + report.photosWithdrawn.length;
  db.audit.unshift({
    id: `audit-${db.audit.length + 1}-${Date.now().toString(36)}`,
    at: now,
    actorUserId,
    action: "anonymise",
    personId,
    summary: `Anonymisering fullført. ${photoCount} bilder, ${report.textLocations.length} tekstlige omtaler og ${report.activities.length} aktiviteter ble endret.`,
    report,
  });

  return report;
}

function rewriteArticle(a: Article, personId: string) {
  a.title = neutralise(a.title, personId);
  if (a.lead) a.lead = neutralise(a.lead, personId);
  a.blocks = a.blocks.flatMap((b): Block[] => {
    if (b.type === "quote") {
      if (b.speakerPersonId === personId) return [];
      return [{ ...b, content: neutralise(b.content, personId), attribution: neutralise(b.attribution, personId) }];
    }
    if (b.type === "paragraph") {
      const content = neutralise(b.content, personId);
      return plain(content).trim() ? [{ ...b, content }] : [];
    }
    if (b.type === "list") {
      const items = b.items.map((item) => neutralise(item, personId)).filter((item) => plain(item).trim());
      return items.length ? [{ ...b, items }] : [];
    }
    return [b];
  });
}

export const WHERE_LABEL: Record<TextWhere, string> = {
  title: "Overskrift",
  lead: "Ingress",
  body: "Brødtekst",
  quote: "Sitat",
  caption: "Bildetekst",
};

export const ACTIVITY_ROLE_LABEL: Record<ActivityPerson["role"], string> = {
  scorer: "Målscorer",
  selected: "Tatt ut",
  duty: "Vakt",
};
