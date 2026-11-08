import type { Db, ISODate, Signup, SignupResponse } from "./types";

/**
 * The sign-ups made in admin (Påmeldinger, Signup in lib/types.ts). A sign-up is a form on the site (answers kept in
 * Db.signupResponses) or only a banner that sends people to Spond or another page. It is placed on the front page, on chosen
 * group pages, or both. Dates are whole days, both ends included. The Mallorca trip has its own sign-up (lib/trip-signup.ts).
 */

export const MAX_SIGNUPS = 60;
export const MAX_RESPONSES_PER_SIGNUP = 500;

export type SignupState = "archived" | "upcoming" | "open" | "closed";

/** Where a sign-up stands today: archived by an administrator, not yet open, open, or past its last day. */
export function signupState(s: Pick<Signup, "archived" | "opensOn" | "closesOn">, today: ISODate): SignupState {
  if (s.archived) return "archived";
  if (s.opensOn && today < s.opensOn) return "upcoming";
  if (s.closesOn && today > s.closesOn) return "closed";
  return "open";
}

export const SIGNUP_STATE_LABEL: Record<SignupState, string> = { archived: "Arkivert", upcoming: "Åpner senere", open: "Åpen", closed: "Stengt" };

export const responsesOf = (db: Pick<Db, "signupResponses">, signupId: string): SignupResponse[] => db.signupResponses.filter((r) => r.signupId === signupId);

/** A form that has reached its capacity takes no more answers. */
export const isFull = (db: Pick<Db, "signupResponses">, s: Signup) => s.kind === "form" && !!s.capacity && responsesOf(db, s.id).length >= s.capacity;

/** What the site shows today: open sign-ups only (not archived, not before the first day or after the last). */
export const shownSignups = (db: Pick<Db, "signups">, today: ISODate): Signup[] => db.signups.filter((s) => signupState(s, today) === "open");

export const signupsOnFront = (db: Pick<Db, "signups">, today: ISODate): Signup[] => shownSignups(db, today).filter((s) => s.onFront);

export const signupsOnNode = (db: Pick<Db, "signups">, today: ISODate, nodeId: string): Signup[] => shownSignups(db, today).filter((s) => s.nodeIds.includes(nodeId));

export interface SignupInput {
  title: string;
  summary: string;
  kind: string;
  href: string;
  linkLabel: string;
  opensOn: string;
  closesOn: string;
  capacity: string;
  onFront: boolean;
  nodeIds: string[];
}

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

/** Checks what an administrator wrote and returns the clean record fields, or the first problem in plain words. */
export function validateSignup(
  input: SignupInput,
  knownNodeIds: Set<string>,
):
  | { ok: true; value: Pick<Signup, "title" | "summary" | "kind" | "href" | "linkLabel" | "opensOn" | "closesOn" | "capacity" | "onFront" | "nodeIds"> }
  | { ok: false; error: string } {
  const t = (v: unknown, max: number) =>
    String(v ?? "")
      .trim()
      .replace(/[ \t]+/g, " ")
      .slice(0, max);
  const title = t(input.title, 90);
  const summary = t(input.summary, 400);
  const kind = input.kind === "banner" ? "banner" : input.kind === "form" ? "form" : undefined;
  if (!title) return { ok: false, error: "Gi påmeldingen en tittel." };
  if (!summary) return { ok: false, error: "Skriv noen linjer om hva påmeldingen gjelder." };
  if (!kind) return { ok: false, error: "Velg om påmeldingen er et skjema eller et banner." };
  const href = t(input.href, 500);
  if (kind === "banner" && !/^https:\/\/\S+$/.test(href)) return { ok: false, error: "Banneret trenger en lenke som begynner med https://, for eksempel til Spond." };
  const opensOn = t(input.opensOn, 10);
  const closesOn = t(input.closesOn, 10);
  if (opensOn && !isDate(opensOn)) return { ok: false, error: "Skriv en gyldig første dag." };
  if (closesOn && !isDate(closesOn)) return { ok: false, error: "Skriv en gyldig siste dag." };
  if (opensOn && closesOn && opensOn > closesOn) return { ok: false, error: "Siste dag kan ikke være før første dag." };
  const capacityText = t(input.capacity, 6);
  const capacity = kind === "form" && capacityText ? Number(capacityText) : undefined;
  if (capacity !== undefined && !(Number.isInteger(capacity) && capacity >= 1 && capacity <= MAX_RESPONSES_PER_SIGNUP))
    return { ok: false, error: `Antall plasser må være et helt tall fra 1 til ${MAX_RESPONSES_PER_SIGNUP}.` };
  const nodeIds = [...new Set((input.nodeIds ?? []).map(String))].filter((id) => knownNodeIds.has(id));
  if (!input.onFront && nodeIds.length === 0) return { ok: false, error: "Velg hvor påmeldingen skal stå: forsiden, en eller flere grupper, eller begge." };
  return {
    ok: true,
    value: {
      title,
      summary,
      kind,
      ...(kind === "banner" && { href }),
      ...(t(input.linkLabel, 40) && { linkLabel: t(input.linkLabel, 40) }),
      ...(opensOn && { opensOn }),
      ...(closesOn && { closesOn }),
      ...(capacity !== undefined && { capacity }),
      onFront: !!input.onFront,
      nodeIds,
    },
  };
}

export interface SignupResponseInput {
  name: string;
  email: string;
  phone: string;
  note: string;
  /** Hidden field: only a program fills it in. */
  website?: string;
}

export function validateResponse(
  input: SignupResponseInput,
): { ok: true; trap: boolean; value: Pick<SignupResponse, "name" | "email" | "phone" | "note"> } | { ok: false; error: string } {
  const t = (v: unknown, max: number) =>
    String(v ?? "")
      .trim()
      .replace(/[ \t]+/g, " ")
      .slice(0, max);
  const name = t(input.name, 100);
  const email = t(input.email, 200).toLowerCase();
  const phone = t(input.phone, 30);
  const note = String(input.note ?? "")
    .trim()
    .slice(0, 1000);
  if (name.split(" ").length < 2) return { ok: false, error: "Skriv fornavn og etternavn." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Skriv en gyldig e-postadresse." };
  if (phone && !(/^\+?[\d\s]{6,20}$/.test(phone) && phone.replace(/\D/g, "").length >= 6)) return { ok: false, error: "Skriv et gyldig telefonnummer, eller la feltet stå tomt." };
  return { ok: true, trap: !!input.website, value: { name, email, ...(phone && { phone }), ...(note && { note }) } };
}
