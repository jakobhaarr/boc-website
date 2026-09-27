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
 *
 * The steps are described by what someone has done, not what they are:
 * people are poor at placing themselves on «nybegynner … aktiv mosjonist»,
 * but know whether they have ridden in a group. A discipline can word the
 * same three steps in its own terms (OrgNode.levelOptions: Landevei asks
 * about riding in a group, Terreng about technical trail).
 */
export const LEVELS: { id: LevelId; label: string; hint: string }[] = [
  { id: "ny", label: "Har syklet lite", hint: "Du er ny, eller har aldri trent sammen med andre" },
  { id: "litt", label: "Sykler av og til", hint: "Du sykler turer på egen hånd, men trener ikke fast" },
  { id: "aktiv", label: "Trener jevnlig", hint: "Du sykler flere ganger i uka og vil ha fart og lengre økter" },
];

export const levelIndex = (id: LevelId) => LEVELS.findIndex((l) => l.id === id);
