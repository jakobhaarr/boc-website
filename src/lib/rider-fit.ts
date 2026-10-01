import type { OrgNode } from "./types";

/**
 * How the finder places a road rider in BOC 1–4, by group id.
 *
 * Kept in code, not on the group records, on purpose: a group edited in admin
 * is stored whole and replaces the seed's record (lib/data/overrides.ts), so
 * data placed on the record disappears from the live site the moment someone
 * edits that group — and a group without these ranges would match everyone.
 *
 * All figures are the club's own (Jakob, October 2026), not measurements:
 *  - longRidePace: average speed on the Sunday long ride, in the group;
 *  - ftp: typical FTP of the group's riders, for a man of 80 kg;
 *  - soloSpeed: km/h on a calm long ride ALONE that suits the group — lower
 *    than the group average because a group rides in each other's slipstream;
 *  - wattsPerKg: ftp ÷ 80 kg, so FTP ÷ body weight can be compared for any
 *    weight. Open ends use 0 and 99.
 */
export interface RoadGroupFacts {
  longRidePace: string;
  ftp: string;
  fit: NonNullable<OrgNode["riderFit"]>;
}

export const ROAD_GROUP_FACTS: Record<string, RoadGroupFacts> = {
  "b-boc1": { longRidePace: "30–33 km/t", ftp: "290–350 W", fit: { soloSpeed: [28, 99], wattsPerKg: [290 / 80, 99] } },
  "b-boc2": { longRidePace: "28–31 km/t", ftp: "250–290 W", fit: { soloSpeed: [25, 99], wattsPerKg: [250 / 80, 290 / 80] } },
  "b-boc3": { longRidePace: "27–30 km/t", ftp: "210–250 W", fit: { soloSpeed: [22, 28], wattsPerKg: [210 / 80, 250 / 80] } },
  "b-boc4": { longRidePace: "24–28 km/t", ftp: "opp til 210 W", fit: { soloSpeed: [0, 25], wattsPerKg: [0, 210 / 80] } },
};
