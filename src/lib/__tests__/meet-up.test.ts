import { describe, expect, it } from "vitest";
import { meetUpSummary } from "@/components/public/node/meet-up";
import { meetUpPlan } from "../meet-up";
import { createOrg } from "../org";

const node = (id: string, parentId: string | null, kind: string, extra: object = {}) => ({ id, parentId, kind, name: id, slug: id, sortOrder: 0, ...extra }) as never;
const orgWith = (breaks?: { label: string; from: string; to: string }[]) => createOrg([node("club", null, "club"), node("sport", "club", "sport", breaks ? { breaks } : {}), node("g", "sport", "team")]);
const series = (from: string, to: string, weekday = 2) => ({ id: `s-${from}-${weekday}`, nodeId: "g", title: "Trening", weekday, start: "18:00", end: "19:30", venueId: "v", locationNote: "", from, to });
const db = (...s: ReturnType<typeof series>[]) => ({ series: s, venues: [{ id: "v", name: "Sted", area: "Bærum", mapQuery: "x" }], photos: [] }) as never;
/** One character per month: X runs, - is off, b is a break inside the season. */
const strip = (months: { state: string }[]) => months.map((m) => (m.state === "on" ? "X" : m.state === "break" ? "b" : "-")).join("");

describe("meetUpPlan: the months a group runs", () => {
  it("a season inside one year", () => {
    const { months } = meetUpPlan(db(series("2026-04-01", "2026-10-31")), orgWith(), ["g"]);
    expect(strip(months)).toBe("---XXXXXXX--");
    expect(meetUpSummary(months)).toBe("Hver uke fra april til oktober.");
  });

  it("a pause inside the season is a break, with its label", () => {
    const { months } = meetUpPlan(db(series("2026-04-01", "2026-06-30"), series("2026-08-01", "2026-10-31")), orgWith([{ label: "Fellesferie, ingen fellestreninger", from: "2026-07-01", to: "2026-07-31" }]), ["g"]);
    expect(strip(months)).toBe("---XXXbXXX--");
    expect(months[6].label).toBe("Fellesferie");
    expect(meetUpSummary(months)).toBe("Hver uke fra april til oktober, unntatt juli.");
  });

  it("a season over New Year (Zwift) is November to March, not a break from April to October", () => {
    const { months } = meetUpPlan(db(series("2026-11-01", "2027-03-31", 1), series("2026-11-01", "2027-03-31", 3)), orgWith(), ["g"]);
    expect(strip(months)).toBe("XXX-------XX");
    expect(meetUpSummary(months)).toBe("Hver uke fra november til mars.");
  });

  it("a group with no sessions has no months to show", () => {
    const { months } = meetUpPlan(db(), orgWith(), ["g"]);
    expect(strip(months)).toBe("------------");
    expect(meetUpSummary(months)).toBe("");
  });

  it("sessions at the same place and time are one slot with all its days", () => {
    const { slots } = meetUpPlan(db(series("2026-04-01", "2026-10-31", 2), series("2026-04-01", "2026-10-31", 4)), orgWith(), ["g"]);
    expect(slots).toHaveLength(1);
    expect(slots[0].weekdays).toEqual([2, 4]);
  });
});
