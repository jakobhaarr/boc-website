import type { PrivacyContact } from "./types";

/**
 * The privacy form on Om klubben, checked in one place so the form and the
 * server action agree. The person who writes says whom they write for (them
 * selves, their child, someone else) and what they ask for; the club answers
 * by e-mail after finding out that it really is them.
 */

export const ON_BEHALF_OF: { id: PrivacyContact["onBehalfOf"]; label: string; hint: string }[] = [
  { id: "self", label: "Meg selv", hint: "Opplysninger om deg." },
  { id: "child", label: "Barnet mitt", hint: "Du er foresatt for et barn under 18 år." },
  { id: "other", label: "En annen person", hint: "Vi kan be om en fullmakt." },
];

export const WANTS: { id: PrivacyContact["wants"][number]; label: string; hint: string }[] = [
  { id: "innsyn", label: "Innsyn", hint: "Se hvilke opplysninger klubben har, og få en kopi." },
  { id: "anonymisering", label: "Ikke kunne kjennes igjen", hint: "Navn tas bort og personen dekkes til i bilder og artikler på nettsiden, også i gamle saker." },
  { id: "sletting", label: "Sletting", hint: "Personen slettes fra klubbens register. Det kan ikke angres." },
];

export const WANT_LABEL = Object.fromEntries(WANTS.map((w) => [w.id, w.label])) as Record<PrivacyContact["wants"][number], string>;
export const ON_BEHALF_LABEL = Object.fromEntries(ON_BEHALF_OF.map((o) => [o.id, o.label])) as Record<PrivacyContact["onBehalfOf"], string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export interface PrivacyContactInput {
  onBehalfOf?: unknown;
  fromName?: unknown;
  fromEmail?: unknown;
  subjectName?: unknown;
  where?: unknown;
  wants?: unknown;
  message?: unknown;
  /** A field people do not see: a program that fills in everything fills this in too. */
  website?: unknown;
}

export type PrivacyContactChecked =
  | { ok: true; trap: boolean; value: Pick<PrivacyContact, "onBehalfOf" | "fromName" | "fromEmail" | "subjectName" | "where" | "wants" | "message"> }
  | { ok: false; error: string };

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export function validatePrivacyContact(input: PrivacyContactInput): PrivacyContactChecked {
  const onBehalfOf = ON_BEHALF_OF.find((o) => o.id === input.onBehalfOf)?.id;
  if (!onBehalfOf) return { ok: false, error: "Si hvem du tar kontakt på vegne av." };
  const fromName = str(input.fromName, 80);
  if (!fromName) return { ok: false, error: "Skriv navnet ditt." };
  const fromEmail = str(input.fromEmail, 254).toLowerCase();
  if (!EMAIL.test(fromEmail)) return { ok: false, error: "Skriv en gyldig e-postadresse, så klubben kan svare deg." };
  const subjectName = onBehalfOf === "self" ? "" : str(input.subjectName, 80);
  if (onBehalfOf !== "self" && !subjectName) return { ok: false, error: onBehalfOf === "child" ? "Skriv navnet til barnet." : "Skriv navnet til personen." };
  const wants = WANTS.map((w) => w.id).filter((id) => Array.isArray(input.wants) && input.wants.includes(id));
  if (!wants.length) return { ok: false, error: "Velg hva du ber om." };
  return {
    ok: true,
    trap: !!str(input.website, 200),
    value: { onBehalfOf, fromName, fromEmail, subjectName: subjectName || undefined, where: str(input.where, 120) || undefined, wants, message: str(input.message, 2000) || undefined },
  };
}

/** What kind of record an administrator has tied a message to (PrivacyContact.identity). */
export const IDENTITY_KIND_LABEL = { person: "Medlem eller person", external: "Ekstern, for eksempel fotograf", user: "Bruker, for eksempel foresatt" } as const;
