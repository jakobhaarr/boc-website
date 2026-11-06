import type { Feedback } from "./types";

/**
 * TEMPORARY, with the group leaders' sign-up (lib/leader-signup.ts): the two tasks the group leaders were given at the
 * meeting on 4 November 2026, to be done within two weeks, and the feedback they send about them. The tasks are shown on
 * the overview in admin until `TASKS_UNTIL`, and the feedback is read on /feedback (club administrators only). Remove
 * this file, the card on the overview, `/admin/tilbakemelding`, `/feedback`, `Db.feedback` and the three feedback
 * actions when the round is over.
 */

export const TASKS_UNTIL = "2026-11-18";

export const TASKS = [
  { topic: "invite" as const, title: "Inviter en bidragsyter til gruppa", text: "Under Folk › Brukere og tilgang: inviter en annen til gruppa di og velg selv hva vedkommende skal få lov til." },
  { topic: "publish" as const, title: "Publiser en nyhet fra mobilen", text: "Skriv og publiser en nyhet til gruppa di fra telefonen, med et bilde hvis du har et." },
];

export const TOPIC_LABEL: Record<Feedback["topic"], string> = {
  invite: "Oppgave 1: invitere en bidragsyter",
  publish: "Oppgave 2: publisere en nyhet fra mobilen",
  other: "Noe annet",
};

export const MAX_FEEDBACK = 4000;
/** Screenshots per piece of feedback, and the biggest one the server takes (the browser scales them down first). */
export const MAX_SHOTS = 3;
export const MAX_SHOT_BYTES = 1_000_000;

export function validateFeedback(topic: string, message: string): string | undefined {
  if (!(topic in TOPIC_LABEL)) return "Velg hva tilbakemeldingen gjelder.";
  const text = message.trim();
  if (!text) return "Skriv tilbakemeldingen.";
  if (text.length > MAX_FEEDBACK) return `Tilbakemeldingen kan være opptil ${MAX_FEEDBACK} tegn.`;
  return undefined;
}
