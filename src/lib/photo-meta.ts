import { diffDays, formatDateFull } from "./dates";
import { fullName } from "./content";
import type { Org } from "./org";
import type { Db, ISODate, LocalDateTime, Person, Photo, Photographer, PhotographerKind, User } from "./types";

/**
 * What every uploaded picture must carry, as plain functions on the database:
 * who took it, who is in it (or that nobody who can be recognised is), the
 * alt text, which the system writes, and the check a club administrator does
 * afterwards. A picture goes live at once; the check never holds an upload up,
 * but one that waits too long becomes a red warning (`PHOTO_REVIEW_DAYS`).
 */

/** After this many days unreviewed, the warning for the administrators turns red. */
export const PHOTO_REVIEW_DAYS = 3;

/**
 * Whether the people said to be recognisable in a picture may be shown: each
 * must have given photo consent. Someone without consent must be taken out of
 * the picture or covered up on the device before the upload, and then is not
 * ticked. Returns the names to complain about, empty when all is well.
 */
export const withoutPhotoConsent = (tagged: Pick<Person, "firstName" | "lastName" | "privacy">[]) =>
  tagged.filter((p) => p.privacy.photoConsent !== "granted").map((p) => `${p.firstName} ${p.lastName}`.trim());

const ADULT_AGE = 18;

/* ─── Photographer ──────────────────────────────────────────────────────── */

export interface PhotographerChoice {
  kind: PhotographerKind;
  refId?: string;
}

export interface PhotographerOption extends Photographer {
  /** Where it sits in the list: «meg selv», the group's own adults, other adults in the club, the externals, the club. */
  group: "me" | "members" | "others" | "externals" | "club";
}

/** A choice as one string, for a form control. */
export const choiceKey = (c: PhotographerChoice) => (c.kind === "club" ? "club" : `${c.kind}:${c.refId ?? ""}`);

export function parseChoice(key: string): PhotographerChoice | null {
  if (key === "club") return { kind: "club" };
  const [kind, ...rest] = key.split(":");
  const refId = rest.join(":");
  return (kind === "user" || kind === "member" || kind === "external") && refId ? { kind, refId } : null;
}

export const isAdultPerson = (person: Person, today: ISODate) => person.birthYear !== undefined && person.birthYear <= Number(today.slice(0, 4)) - ADULT_AGE;

/**
 * Who can be named as photographer for a picture on `nodeId`. A child is never
 * named (the credit is public); a parent or anyone else who does not want a
 * name on it is credited as the club.
 */
export function photographerOptions(
  db: Db,
  org: Org,
  meUserId: string,
  nodeId: string,
  today: ISODate,
  { members = true, scope }: { members?: boolean; /** Who else in the club may be offered besides the group's own adults. Default: nobody. */ scope?: Person[] } = {},
): PhotographerOption[] {
  const me = db.users.find((u) => u.id === meUserId);
  const options: PhotographerOption[] = [];
  if (me) options.push({ group: "me", kind: "user", refId: me.id, name: me.name });
  for (const p of members ? db.people : []) {
    if (p.privacy.status !== "visible" || !isAdultPerson(p, today)) continue;
    if (!p.memberships.some((m) => m.nodeId === nodeId || org.contains(nodeId, m.nodeId))) continue;
    if (me?.personId === p.id) continue;
    options.push({ group: "members", kind: "member", refId: p.id, name: fullName(p) });
  }
  // Adults from other groups: the photographer is often someone who is not in this group.
  const listed = new Set(options.map((o) => o.refId));
  for (const p of members ? (scope ?? []) : []) {
    if (listed.has(p.id) || p.privacy.status !== "visible" || !isAdultPerson(p, today) || me?.personId === p.id) continue;
    options.push({ group: "others", kind: "member", refId: p.id, name: fullName(p) });
  }
  const rank = { me: 0, members: 1, others: 2, externals: 3, club: 4 } as const;
  options.sort((a, b) => rank[a.group] - rank[b.group] || a.name.localeCompare(b.name, "nb"));
  for (const e of [...db.externals].sort((a, b) => a.name.localeCompare(b.name, "nb"))) options.push({ group: "externals", kind: "external", refId: e.id, name: e.name });
  options.push({ group: "club", kind: "club", name: db.club.shortName });
  return options;
}

/** Checks a choice against the database and turns it into the photographer to store. */
export function resolvePhotographer(
  db: Db,
  choice: PhotographerChoice | null | undefined,
  { meUserId, today }: { meUserId: string; today: ISODate },
): { ok: true; photographer: Photographer } | { ok: false; error: string } {
  if (!choice) return { ok: false, error: "Velg hvem som tok bildet. Er det ingen som vil krediteres, velg «" + db.club.shortName + "»." };
  if (choice.kind === "club") return { ok: true, photographer: { kind: "club", name: db.club.shortName } };
  if (choice.kind === "user") {
    const user = db.users.find((u) => u.id === choice.refId);
    return user && user.id === meUserId ? { ok: true, photographer: { kind: "user", refId: user.id, name: user.name } } : { ok: false, error: "Fotografen finnes ikke." };
  }
  if (choice.kind === "member") {
    const person = db.people.find((p) => p.id === choice.refId);
    if (!person || person.privacy.status !== "visible") return { ok: false, error: "Fotografen kan ikke nevnes offentlig." };
    if (!isAdultPerson(person, today)) return { ok: false, error: "Barn og unge krediteres ikke med navn. Velg klubben som fotograf." };
    return { ok: true, photographer: { kind: "member", refId: person.id, name: fullName(person) } };
  }
  const external = db.externals.find((e) => e.id === choice.refId);
  return external ? { ok: true, photographer: { kind: "external", refId: external.id, name: external.name } } : { ok: false, error: "Fotografen finnes ikke." };
}

/* ─── Alt text ──────────────────────────────────────────────────────────── */

/**
 * The alt text, written by the system and never by hand: where and when the
 * picture is from, and how many members are in it, but never a name, so it
 * cannot identify anyone. It says only what the system knows; it does not
 * guess at what the picture shows.
 */
export function autoAlt({ placeName, date, tagged, index, total }: { placeName: string; date: ISODate; tagged: number; index?: number; total?: number }): string {
  const series = total && total > 1 && index ? `Bilde ${index} av ${total}` : "Bilde";
  const people = tagged > 0 ? ` ${tagged === 1 ? "Ett medlem" : `${tagged} medlemmer`} er med.` : "";
  return `${series} fra ${placeName}, ${formatDateFull(date)}.${people}`.replace(/\.\./g, ".");
}

/**
 * The same alt text with the number of members in it brought up to date, for
 * when an administrator corrects who is in the picture. Only the sentence about
 * members is replaced, so the place, the date and «Bilde 2 av 5» stay as they were.
 */
export function altWithPeople(alt: string, tagged: number): string {
  const base = alt.replace(/\s*(Ett medlem|\d+ medlemmer) er med\./, "").trimEnd();
  const people = tagged > 0 ? ` ${tagged === 1 ? "Ett medlem" : `${tagged} medlemmer`} er med.` : "";
  return `${base}${people}`;
}

/* ─── Review ────────────────────────────────────────────────────────────── */

export type ReviewState = "none" | "pending" | "overdue";

export function reviewState(photo: Pick<Photo, "review">, now: LocalDateTime): ReviewState {
  if (!photo.review || photo.review.status === "approved") return "none";
  return diffDays(now.slice(0, 10), photo.review.uploadedAt.slice(0, 10)) >= PHOTO_REVIEW_DAYS ? "overdue" : "pending";
}

/** The pictures waiting for a check, the longest-waiting first. */
export const pendingPhotos = (db: Db) =>
  db.photos.filter((p) => p.review?.status === "pending").sort((a, b) => a.review!.uploadedAt.localeCompare(b.review!.uploadedAt));

/** How the review of an upload starts: waiting, unless a club administrator uploaded it, who is the one who checks. */
export function newReview(uploader: User, isClubAdminUploader: boolean, now: LocalDateTime): NonNullable<Photo["review"]> {
  return isClubAdminUploader
    ? { status: "approved", uploadedAt: now, uploadedByUserId: uploader.id, approvedAt: now, approvedByUserId: uploader.id }
    : { status: "pending", uploadedAt: now, uploadedByUserId: uploader.id };
}
