import type { OrgNode } from "./types";

/**
 * How the finder places a road rider in BOC 1–4, and what the result tells
 * them about the group's pace.
 *
 * The figures are the club's own (Jakob, October 2026), not measurements, and
 * are edited per group in admin (OrgNode.paceGuide). The defaults below apply
 * to a group that has none, so the finder never depends on a stored record:
 *  - longRide: average speed on the Sunday long ride, in the group;
 *  - ftp: typical FTP of the group's riders, for a man of 80 kg;
 *  - soloSpeed: km/h on a calm long ride ALONE that suits the group, lower
 *    than the group average because a group rides in each other's slipstream.
 * From these the finder derives W/kg = ftp ÷ 80 kg, so FTP ÷ body weight can
 * be compared for any weight. An open end is `null` in the guide and 0 or 99
 * in the ranges the finder compares with.
 */
export type PaceGuide = NonNullable<OrgNode["paceGuide"]>;

/** The weight the club's FTP figures are given for. */
export const REFERENCE_WEIGHT_KG = 80;

export const DEFAULT_PACE_GUIDE: Record<string, PaceGuide> = {
  "b-boc1": { longRide: [30, 33], ftp: [290, 350], soloSpeed: [28, null] },
  "b-boc2": { longRide: [28, 31], ftp: [250, 290], soloSpeed: [25, null] },
  "b-boc3": { longRide: [27, 30], ftp: [210, 250], soloSpeed: [22, 28] },
  "b-boc4": { longRide: [24, 27], ftp: [null, 210], soloSpeed: [null, 25] },
};

/** The guide in force for a group: its own, or the club's default for it. */
export const paceGuideOf = (node: Pick<OrgNode, "id" | "paceGuide">): PaceGuide | undefined => node.paceGuide ?? DEFAULT_PACE_GUIDE[node.id];

/** «opp til 210 W», «over 350 W» or «250–290 W». */
export function ftpText([from, to]: PaceGuide["ftp"]): string {
  if (from === null && to === null) return "";
  if (from === null) return `opp til ${to} W`;
  if (to === null) return `over ${from} W`;
  return `${from}–${to} W`;
}

export const longRideText = ([from, to]: PaceGuide["longRide"]) => `${from}–${to} km/t`;

/** What the finder shows and compares, derived from a guide. */
export interface RoadGroupFacts {
  longRidePace: string;
  ftp: string;
  fit: { soloSpeed: [number, number]; wattsPerKg: [number, number] };
}

export function roadFactsOf(guide: PaceGuide): RoadGroupFacts {
  return {
    longRidePace: longRideText(guide.longRide),
    ftp: ftpText(guide.ftp),
    fit: {
      soloSpeed: [guide.soloSpeed[0] ?? 0, guide.soloSpeed[1] ?? 99],
      wattsPerKg: [(guide.ftp[0] ?? 0) / REFERENCE_WEIGHT_KG, guide.ftp[1] === null ? 99 : guide.ftp[1] / REFERENCE_WEIGHT_KG],
    },
  };
}
