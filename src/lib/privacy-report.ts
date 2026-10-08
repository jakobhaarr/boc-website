import { fullName, membershipTitle, userById } from "./content";
import type { Org } from "./org";
import { ACTIVITY_ROLE_LABEL, photoUses } from "./privacy";
import { plain } from "./rich-text";
import type { Db, Person } from "./types";

/**
 * The access report (innsynsrapport, GDPR art. 15) on one person: everything
 * this system holds about them, gathered in one place so an administrator can
 * hand it to the member, or to a guardian for a child, after checking who is
 * asking. It reads the database as it is and invents nothing: a section with
 * nothing in it says so.
 *
 * Covered: the register entry, consent, memberships, a user account if there
 * is one, the pictures they are tagged in or took, where they are named in
 * published text, quotes and activity roles, requests about them, and the
 * actions logged under them. Not covered: what Spond, Google, Vercel and the
 * other services hold; the report says that.
 */

export interface PersonReport {
  issuedAt: string;
  issuedBy: string;
  /** Who it is about. */
  person: {
    name: string;
    born?: string;
    status: string;
    consent: string;
    consentUpdatedAt?: string;
    consentBy?: string;
    anonymisedAt?: string;
    contact: { label: string; value: string }[];
  };
  memberships: { group: string; role: string }[];
  account?: { name: string; email: string; active: boolean; signIn: string; roles: string[] };
  guardians: { name: string; email?: string }[];
  guardianOf: string[];
  pictures: { id: string; group: string; uploadedAt?: string; uploadedBy?: string; photographer?: string; usedAt: string[]; hidden: boolean; note?: string }[];
  picturesTaken: number;
  portrait?: string;
  text: { where: string; in: string; wording: string }[];
  quotes: { group: string; text: string }[];
  activities: { title: string; role: string }[];
  requests: { kind: string; at: string; status: string }[];
  log: { at: string; what: string }[];
}

const STATUS_LABEL = { visible: "Synlig", restricted: "Ikke publiser (skal ikke vises offentlig)", anonymised: "Anonymisert" } as const;
const CONSENT_LABEL = { granted: "Samtykke til bilder er gitt", declined: "Samtykke til bilder er avslått", unknown: "Samtykke til bilder er ikke registrert" } as const;

export function buildPersonReport(db: Db, org: Org, person: Person, issuedBy: string, now: string): PersonReport {
  const nodeName = (id: string) => org.get(id)?.name ?? "Ukjent gruppe";
  const user = person.userId ? userById(db, person.userId) : db.users.find((u) => u.personId === person.id);
  const name = fullName(person);

  const contact: PersonReport["person"]["contact"] = [];
  if (person.publicContact?.email) contact.push({ label: "E-post som vises offentlig", value: person.publicContact.email });
  if (person.publicContact?.phone) contact.push({ label: "Telefon som vises offentlig", value: person.publicContact.phone });
  if (person.consentEmail) contact.push({ label: "E-post for forespørsler om samtykke (vises ikke)", value: person.consentEmail });
  if (person.stravaUrl) contact.push({ label: "Strava-profil", value: person.stravaUrl });

  const tagged = db.photos.filter((p) => p.people.some((x) => x.personId === person.id));
  const pictures: PersonReport["pictures"] = tagged.map((p) => ({
    id: p.id,
    group: nodeName(p.nodeId),
    uploadedAt: p.review?.uploadedAt?.slice(0, 10),
    uploadedBy: userById(db, p.review?.uploadedByUserId)?.name,
    photographer: p.photographer?.name ?? p.credit,
    usedAt: photoUses(db, org, p.id).map((u) => u.label),
    hidden: !!p.withdrawn,
    note: p.withdrawn ? `Skjult: ${p.withdrawn.reason}` : undefined,
  }));
  const taken = db.photos.filter((p) => p.photographer && ((p.photographer.kind === "member" && p.photographer.refId === person.id) || (p.photographer.kind === "user" && user && p.photographer.refId === user.id))).length;
  const portrait = person.portraitPhotoId && db.photos.find((p) => p.id === person.portraitPhotoId) ? "Det er registrert et portrettbilde." : undefined;

  // Wherever the name stands in published text, with the words as they are published now.
  const text: PersonReport["text"] = [];
  const mentions = (inlines: { type: string; personId?: string }[]) => inlines.some((i) => i.type === "mention" && i.personId === person.id);
  for (const a of db.articles.filter((x) => x.status === "published")) {
    const where = plain(a.title);
    const add = (label: string, content: Parameters<typeof plain>[0]) => text.push({ where: label, in: where, wording: plain(content) });
    if (mentions(a.title)) add("Overskrift", a.title);
    if (a.lead && mentions(a.lead)) add("Ingress", a.lead);
    for (const b of a.blocks) {
      if (b.type === "paragraph" && mentions(b.content)) add("Tekst", b.content);
      if (b.type === "list") for (const item of b.items) if (mentions(item)) add("Liste", item);
      if (b.type === "quote" && (b.speakerPersonId === person.id || mentions(b.content))) add(b.speakerPersonId === person.id ? "Sitat fra deg" : "Sitat", b.content);
    }
  }

  const quotes: PersonReport["quotes"] = org.nodes.flatMap((n) => (n.quotes ?? []).filter((q) => q.personId === person.id).map((q) => ({ group: n.name, text: q.quote })));
  const testimonial = db.club.testimonials?.find((t) => t.personId === person.id);
  if (testimonial?.quote) quotes.push({ group: "Forsiden", text: testimonial.quote });

  const activities = db.activities.flatMap((a) => (a.people ?? []).filter((p) => p.personId === person.id).map((p) => ({ title: a.title, role: ACTIVITY_ROLE_LABEL[p.role] })));

  const requests: PersonReport["requests"] = [
    ...db.privacyRequests.filter((r) => r.personId === person.id).map((r) => ({ kind: "Anonymisering", at: r.receivedAt, status: r.status === "completed" ? "Løst" : "Åpen" })),
    ...db.consentRequests
      .filter((r) => r.personId === person.id)
      .map((r) => ({ kind: "Forespørsel om samtykke til bilder", at: r.createdAt.slice(0, 10), status: r.status === "granted" ? "Samtykke gitt" : r.status === "declined" ? "Avslått" : "Venter på svar" })),
  ];

  const log = db.audit
    .filter((e) => e.personId === person.id || (user && (e.actorUserId === user.id || e.userId === user.id)))
    .map((e) => ({ at: e.at.slice(0, 16).replace("T", " "), what: `${e.actorUserId === user?.id ? "Gjort av deg: " : ""}${e.summary}` }));

  return {
    issuedAt: now,
    issuedBy,
    person: {
      name,
      born: person.birthDate ?? (person.birthYear ? String(person.birthYear) : undefined),
      status: STATUS_LABEL[person.privacy.status],
      consent: CONSENT_LABEL[person.privacy.photoConsent],
      consentUpdatedAt: person.privacy.consentUpdatedAt,
      consentBy: person.privacy.consentBy,
      anonymisedAt: person.privacy.anonymisedAt,
      contact,
    },
    memberships: person.memberships.map((m) => ({ group: nodeName(m.nodeId), role: membershipTitle(m.role, m.title, org.sportOf(m.nodeId)?.id) })),
    account: user
      ? {
          name: user.name,
          email: user.email,
          active: user.active !== false,
          signIn: user.authProviders.length ? user.authProviders.map((p) => (p === "google" ? "Google" : "E-postkode")).join(", ") : "E-postkode",
          roles: user.roles.map((r) => `${r.role} i ${nodeName(r.nodeId)}`),
        }
      : undefined,
    guardians: (person.guardianUserIds ?? []).flatMap((id) => db.users.filter((u) => u.id === id)).map((u) => ({ name: u.name, email: u.email })),
    guardianOf: user ? user.guardianOfPersonIds.flatMap((id) => db.people.filter((p) => p.id === id)).map(fullName) : [],
    pictures,
    picturesTaken: taken,
    portrait,
    text,
    quotes,
    activities,
    requests,
    log,
  };
}
