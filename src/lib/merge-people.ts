import { fullName } from "./content";
import type { Db, LocalDateTime, Person } from "./types";

/**
 * Merging duplicates in the person register: several records for one human become one. Done by a club administrator from
 * the member list (the «Slå sammen» action). The ones kept apart are removed; everything that pointed at them points at the
 * one that is kept: photos they are tagged in, mentions in published text, quotes, dates, consent and privacy requests, who
 * took a picture, and the account and guardian links of users.
 */
export const MAX_MERGE = 10;

const sameName = (a: Person, b: Person) => fullName(a).replace(/\s+/g, " ").trim().toLocaleLowerCase("nb") === fullName(b).replace(/\s+/g, " ").trim().toLocaleLowerCase("nb");

/**
 * Why these people must not be merged into one, or undefined. Only records with the same name can be merged (two different
 * names are two people, or one that must be renamed first); two different birth years or birth dates mean two people (a father
 * and a son with one name); and at most one of them can have an account of their own (merge the accounts first, under Brukere).
 */
export function mergeProblem(db: Db, ids: string[], keepId: string): string | undefined {
  const found = ids.map((id) => db.people.find((p) => p.id === id));
  if (found.some((p) => !p)) return "Fant ikke en av personene.";
  const people = found as Person[];
  if (new Set(ids).size < 2) return "Velg minst to personer.";
  if (people.length > MAX_MERGE) return `Du kan slå sammen høyst ${MAX_MERGE} om gangen.`;
  if (!ids.includes(keepId)) return "Velg hvilken du vil beholde.";
  if (people.some((p) => p.privacy.status === "anonymised")) return "En anonymisert person kan ikke slås sammen.";
  if (people.some((p) => !sameName(p, people[0]))) return "Personene har ikke samme navn. Bare duplikater med samme navn kan slås sammen.";
  if (new Set(people.flatMap((p) => (p.birthYear ? [p.birthYear] : []))).size > 1) return "De har ulikt fødselsår, så det er trolig ikke samme person.";
  if (new Set(people.flatMap((p) => (p.birthDate ? [p.birthDate] : []))).size > 1) return "De har ulik fødselsdato, så det er trolig ikke samme person.";
  if (new Set(people.flatMap((p) => (p.userId ? [p.userId] : []))).size > 1) return "Mer enn én av dem har en egen bruker. Slå sammen brukerne først, under Brukere.";
  return undefined;
}

const CONSENT_RANK = { granted: 0, unknown: 1, declined: 2 } as const;

/** Runs inside a write, on the database it is given. Throws the reason if the people cannot be merged. */
export function mergePeople(db: Db, keepId: string, ids: string[], actorUserId: string, now: LocalDateTime): void {
  const problem = mergeProblem(db, ids, keepId);
  if (problem) throw new Error(problem);
  const keep = db.people.find((p) => p.id === keepId)!;
  const others = ids.filter((id) => id !== keepId).map((id) => db.people.find((p) => p.id === id)!);

  for (const o of others) {
    for (const m of o.memberships) if (!keep.memberships.some((k) => k.nodeId === m.nodeId && k.role === m.role)) keep.memberships.push(m);
    keep.birthYear ??= o.birthYear;
    keep.birthDate ??= o.birthDate;
    keep.consentEmail ??= o.consentEmail;
    if (o.publicContact) keep.publicContact = { ...o.publicContact, ...keep.publicContact };
    keep.stravaUrl ??= o.stravaUrl;
    keep.portraitPhotoId ??= o.portraitPhotoId;
    keep.cardStyle ??= o.cardStyle;
    keep.userId ??= o.userId;
    if (o.guardianUserIds?.length) keep.guardianUserIds = [...new Set([...(keep.guardianUserIds ?? []), ...o.guardianUserIds])];
    // The stricter answer wins: someone marked «Ikke publiser» stays so, and a «no» or an unknown photo consent is not turned into a yes.
    if (o.privacy.status === "restricted") keep.privacy.status = "restricted";
    if (CONSENT_RANK[o.privacy.photoConsent] > CONSENT_RANK[keep.privacy.photoConsent]) keep.privacy.photoConsent = o.privacy.photoConsent;
  }

  // Everything that pointed at one of the others points at the one kept. Found by the field names (…personId, …personIds, a
  // photographer or an identity that is a member), so a field added later with such a name follows along.
  const gone = new Set(others.map((o) => o.id));
  const swap = (v: unknown) => (typeof v === "string" && gone.has(v) ? keepId : v);
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    const o = value as Record<string, unknown>;
    for (const [key, v] of Object.entries(o)) {
      if (/personId$/i.test(key) && typeof v === "string") o[key] = swap(v);
      else if ((/personIds$/i.test(key) || key === "awaitingConsent" || key === "unlinkedTestimonials") && Array.isArray(v)) o[key] = [...new Set(v.map(swap))];
      else walk(v);
    }
    if ((o.kind === "person" || o.kind === "member") && typeof o.refId === "string") o.refId = swap(o.refId);
  };
  const { people: _people, ...rest } = db;
  void _people;
  walk(rest);

  // The same person twice in a list after the swap is one entry.
  const once = <T,>(list: T[], id: (x: T) => string | undefined) => list.filter((x, i, all) => id(x) === undefined || all.findIndex((y) => id(y) === id(x)) === i);
  for (const photo of db.photos) photo.people = once(photo.people, (p) => p.personId);
  for (const node of db.nodes) if (node.quotes) node.quotes = once(node.quotes, (q) => q.personId);
  if (db.club.testimonials) db.club.testimonials = once(db.club.testimonials, (t) => t.personId);

  db.people = db.people.filter((p) => !gone.has(p.id));
  // The log never names a person, only that it happened.
  db.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId, action: "editPerson", personId: keepId, summary: `Slo sammen ${others.length + 1} personer til én` });
}
