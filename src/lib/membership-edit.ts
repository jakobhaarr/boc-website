import { checkText } from "./group-fields";
import type { Club } from "./types";

/**
 * The club's membership rates and the words around them, as admin edits them and as the server accepts them. This is the one place
 * the prices are set: Bli med, Barn og ungdom and the front page all read `Club.membership`.
 */
export type MembershipEdit = Club["membership"];

export const MAX_RATES = 12;

/** The first message that stops an edit from being saved, or null. */
export function validateMembershipEdit(edit: MembershipEdit): string | null {
  if (edit.rates.length === 0) return "Legg inn minst ett medlemskap.";
  if (edit.rates.length > MAX_RATES) return `Du kan ha opptil ${MAX_RATES} medlemskap.`;
  for (const r of edit.rates) {
    if (!r.label.trim()) return "Hvert medlemskap trenger et navn.";
    if (!Number.isFinite(r.amount) || !Number.isInteger(r.amount) || r.amount < 0 || r.amount > 100000) return `Prisen for «${r.label.trim()}» må være et helt antall kroner mellom 0 og 100 000.`;
    const bad = checkText("Navnet", r.label, 40) ?? checkText("Teksten under", r.hint ?? "", 60);
    if (bad) return bad;
  }
  return checkText("Merknaden", edit.note, 400) ?? checkText("Teksten om hva medlemskap trengs til", edit.requiredFor ?? "", 240);
}
