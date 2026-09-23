import type { LevelId } from "./types";

/**
 * The level scale the finder asks about.
 *
 * Three steps, all of them below racing. Someone who already races knows
 * which group is theirs and does not need a finder; everyone else is placing
 * themselves against people they have never met, and the further up a scale
 * goes the more cautiously people answer — a fourth, faster step made the
 * whole ladder read as a club for fast riders. Each group lists every step it
 * welcomes, so a group can span several.
 */
export const LEVELS: { id: LevelId; label: string; hint: string }[] = [
  { id: "ny", label: "Nybegynner", hint: "Har lite eller ingen erfaring med å sykle i gruppe" },
  { id: "litt", label: "Har syklet en del", hint: "Sykler av og til, og vil gjerne sykle mer" },
  { id: "aktiv", label: "Aktiv mosjonist", hint: "Trener jevnlig og vil ha fart og lengre turer" },
];

export const levelIndex = (id: LevelId) => LEVELS.findIndex((l) => l.id === id);
