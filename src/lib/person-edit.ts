import { checkText } from "./group-fields";
import type { MembershipRole } from "./types";

/**
 * What a person's page lets an admin change, and what the server accepts:
 * the name, how to reach them (only shown for people in public roles), and
 * which groups they are in and as what. Erasing a person is separate
 * (lib/deletion.ts) and is for club administrators only.
 */

export interface PersonEdit {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  /** Private: where a request for picture consent is sent. */
  consentEmail: string;
}

/** The roles a person can hold in a group, with the words the club uses. */
export const MEMBERSHIP_ROLES: { id: MembershipRole; label: string }[] = [
  { id: "athlete", label: "Utøver" },
  { id: "teamManager", label: "Lagleder" },
  { id: "headCoach", label: "Hovedtrener" },
  { id: "coach", label: "Trener" },
  { id: "sectionLead", label: "Leder" },
  { id: "generalManager", label: "Daglig leder" },
  { id: "boardChair", label: "Styreleder" },
  { id: "volunteer", label: "Frivillig" },
];

export function validatePersonEdit(edit: PersonEdit): string | null {
  if (!edit.firstName.trim()) return "Fornavn mangler.";
  if (!edit.lastName.trim()) return "Etternavn mangler.";
  const text = checkText("Fornavn", edit.firstName, 60) ?? checkText("Etternavn", edit.lastName, 60) ?? checkText("Telefon", edit.phone, 30);
  if (text) return text;
  if (edit.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.email.trim())) return "E-postadressen ser ikke riktig ut.";
  if (edit.consentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(edit.consentEmail.trim())) return "E-postadressen for samtykke ser ikke riktig ut.";
  return null;
}

export const validateMembershipTitle = (title: string) => checkText("Tittel", title, 40);
