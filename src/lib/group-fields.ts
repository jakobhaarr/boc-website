import type { PaceGuide } from "./rider-fit";
import type { FirstTrainingFacts, OrgNode } from "./types";

/**
 * The fields a group's admin edits, as fixed fields with a length limit and a
 * note on where the text is shown. Shared by the form (what to ask) and the
 * server action (what to accept), so a limit is only written once.
 *
 * What a group admin may NOT edit is everything that decides where the group
 * sits and what it is called: name, address, parent, ages, creation and
 * removal. Those belong to section and club administrators (permissions.ts).
 */

export interface TextField<K extends string = string> {
  key: K;
  label: string;
  /** Where on the public site the text appears, shown under the field. */
  shownAt: string;
  max: number;
  rows: number;
  placeholder?: string;
}

export type AboutKey = "summary" | "description" | "joinInfo";

export const ABOUT_FIELDS: TextField<AboutKey>[] = [
  {
    key: "summary",
    label: "Kort beskrivelse",
    shownAt: "Vises i gruppefinderen og i lister over grupper. Én til to setninger.",
    max: 160,
    rows: 2,
  },
  {
    key: "description",
    label: "Om gruppa",
    shownAt: "Vises øverst på gruppens egen side. Skriv hvem gruppa passer for og hva dere gjør.",
    max: 1200,
    rows: 7,
  },
  {
    key: "joinInfo",
    label: "Slik blir du med",
    shownAt: "Vises under «Slik blir du med» på gruppens side. La stå tomt hvis det ikke trengs.",
    max: 400,
    rows: 3,
  },
];

export type FirstTrainingKey = keyof FirstTrainingFacts;

/** The labels are the ones the public page uses (lib/first-training.ts). */
export const FIRST_TRAINING_FIELDS: TextField<FirstTrainingKey>[] = [
  { key: "pace", label: "Tempo", shownAt: "For eksempel «27–30 km/t».", max: 80, rows: 1 },
  { key: "distance", label: "Distanse", shownAt: "For eksempel «Typisk 40–60 km».", max: 80, rows: 1 },
  { key: "arrive", label: "Når du bør komme", shownAt: "Når nye bør være på plass, og hvem de skal hilse på.", max: 240, rows: 2 },
  { key: "signUp", label: "Påmelding", shownAt: "Om du må melde deg på før første trening, og hvordan.", max: 240, rows: 2 },
  { key: "spondFirstTime", label: "Spond før første trening", shownAt: "Hva nye må gjøre i Spond før de kommer, hvis noe.", max: 300, rows: 3 },
  { key: "bring", label: "Ta med", shownAt: "Utstyr og drikke.", max: 200, rows: 2 },
  { key: "lookFor", label: "Se etter", shownAt: "Hvem eller hva nye skal se etter på oppmøtestedet. Tomt: navn på lagleder vises.", max: 200, rows: 2 },
  { key: "keepUp", label: "Hvis du ikke henger med", shownAt: "Hva som skjer hvis tempoet blir for høyt. Bare det gruppa faktisk gjør.", max: 300, rows: 3 },
  { key: "trial", label: "Medlemskap", shownAt: "Om man kan prøve før man melder seg inn, og hva som krever medlemskap.", max: 300, rows: 3 },
];

/** Text the public site must not contain (AGENTS.md): the long dash reads as machine-written. */
const LONG_DASH = String.fromCharCode(0x2014);

export function checkText(label: string, value: string, max: number): string | null {
  if (value.length > max) return `${label} er for lang: ${value.length} av ${max} tegn.`;
  if (value.includes(LONG_DASH)) return `${label}: bruk punktum, komma eller kolon i stedet for lang tankestrek.`;
  return null;
}

/** What a group edit may carry. Anything else is ignored by the server. */
export interface GroupEdit {
  summary?: string;
  description?: string;
  joinInfo?: string;
  firstTraining?: Partial<Record<FirstTrainingKey, string>>;
  paceGuide?: PaceGuide;
}

export const EDITABLE_KEYS = ["summary", "description", "joinInfo", "firstTraining", "paceGuide"] as const;

const isRange = (v: unknown): v is [number | null, number | null] =>
  Array.isArray(v) && v.length === 2 && v.every((n) => n === null || (typeof n === "number" && Number.isFinite(n)));

/** The first message that stops an edit from being saved, or null. */
export function validateGroupEdit(edit: GroupEdit): string | null {
  for (const f of ABOUT_FIELDS) {
    const value = edit[f.key];
    if (value !== undefined) {
      const error = checkText(f.label, value, f.max);
      if (error) return error;
    }
  }
  for (const f of FIRST_TRAINING_FIELDS) {
    const value = edit.firstTraining?.[f.key];
    if (value !== undefined) {
      const error = checkText(f.label, value, f.max);
      if (error) return error;
    }
  }
  const g = edit.paceGuide;
  if (g) {
    if (!isRange(g.longRide) || g.longRide[0] === null || g.longRide[1] === null) return "Fyll inn farten på langtur, fra og til.";
    if (g.longRide[0] <= 0 || g.longRide[1] > 80 || g.longRide[0] > g.longRide[1]) return "Farten på langtur må være fra og til, i km/t.";
    if (!isRange(g.ftp) || !isRange(g.soloSpeed)) return "Ugyldige tall for FTP eller fart alene.";
    for (const [label, [a, b], top] of [["FTP", g.ftp, 600], ["Fart alene", g.soloSpeed, 80]] as const) {
      if (a !== null && (a < 0 || a > top)) return `${label}: «fra» må være mellom 0 og ${top}.`;
      if (b !== null && (b < 0 || b > top)) return `${label}: «til» må være mellom 0 og ${top}.`;
      if (a !== null && b !== null && a > b) return `${label}: «fra» kan ikke være høyere enn «til».`;
      if (a === null && b === null) return `${label}: fyll inn minst én av «fra» og «til».`;
    }
  }
  return null;
}

/** What the form starts from: the group's own values, never inherited ones. */
export function formValuesOf(node: OrgNode) {
  return {
    summary: node.summary ?? "",
    description: node.description ?? "",
    joinInfo: node.joinInfo ?? "",
    firstTraining: Object.fromEntries(FIRST_TRAINING_FIELDS.map((f) => [f.key, node.firstTraining?.[f.key] ?? ""])) as Record<FirstTrainingKey, string>,
  };
}
