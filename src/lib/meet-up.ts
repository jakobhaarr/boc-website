import type { MeetUpMonth, MeetUpSlot } from "@/components/public/node/meet-up";
import { photoById } from "./content";
import type { Org } from "./org";
import type { Db } from "./types";

/**
 * «Når og hvor» for one group with a simple rhythm (OrgNode.simpleSchedule),
 * or for several that share it, as BOC 1–4 do on Landevei's page: a card per
 * meeting point and start time with its weekdays, and the months the rhythm
 * runs, with a break inside the season named from the nearest level that
 * sets one (Landevei's «Fellesferie»). Sessions the groups hold at the same
 * place and time count once.
 */
export function meetUpPlan(db: Db, org: Org, nodeIds: string[]): { slots: MeetUpSlot[]; months: MeetUpMonth[] } {
  const ids = new Set(nodeIds);
  const series = db.series.filter((s) => ids.has(s.nodeId));
  const keyOf = (s: (typeof series)[number]) => `${s.venueId ?? s.locationNote}|${s.start}`;

  const slots = [...new Map(series.map((s) => [keyOf(s), s])).values()]
    .map((s) => {
      const same = series.filter((o) => keyOf(o) === keyOf(s));
      const venue = db.venues.find((v) => v.id === s.venueId);
      return {
        key: `${s.venueId}-${s.start}`,
        title: s.title,
        weekdays: [...new Set(same.map((o) => o.weekday))].sort(),
        start: s.start,
        venue,
        photo: photoById(db, venue?.photoId),
      };
    })
    .sort((a, b) => a.weekdays[0] - b.weekdays[0]);

  const active = new Set(
    series.flatMap((s) => {
      const out: number[] = [];
      for (let m = Number(s.from.slice(5, 7)), end = Number(s.to.slice(5, 7)); ; m = (m % 12) + 1) {
        out.push(m);
        if (m === end || out.length === 12) break;
      }
      return out;
    }),
  );
  const first = Math.min(...active);
  const last = Math.max(...active);
  const breaks = nodeIds.length ? (org.lineage(nodeIds[0]).reverse().find((n) => n.breaks?.length)?.breaks ?? []) : [];
  const months = Array.from({ length: 12 }, (_, i): MeetUpMonth => {
    const month = i + 1;
    if (active.has(month)) return { month, state: "on" };
    if (month > first && month < last) {
      const label = breaks.find((b) => Number(b.from.slice(5, 7)) <= month && Number(b.to.slice(5, 7)) >= month)?.label.split(",")[0];
      return { month, state: "break", label };
    }
    return { month, state: "off" };
  });

  return { slots, months };
}

/** «BOC 1», «BOC 2», «BOC 3», «BOC 4» → «BOC 1–4»; otherwise the names as a list. */
export function groupNamesLabel(names: string[]): string {
  const parts = names.map((n) => /^(.*?)(\d+)$/.exec(n));
  if (parts.length > 1 && parts.every(Boolean)) {
    const prefix = parts[0]![1];
    const numbers = parts.map((p) => Number(p![2])).sort((a, b) => a - b);
    if (parts.every((p) => p![1] === prefix) && numbers.every((n, i) => i === 0 || n === numbers[i - 1] + 1)) return `${prefix}${numbers[0]}–${numbers.at(-1)}`;
  }
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} og ${names.at(-1)}` : (names[0] ?? "");
}
