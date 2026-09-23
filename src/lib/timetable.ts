import { byStart } from "./activities";
import { minutesOf } from "./dates";
import type { Org } from "./org";
import type { Activity, ClockTime, Db, ISODate } from "./types";

/**
 * TRAINING TIMES VS THE TERMINLISTE
 *
 * The club plans in Spond: every single session, who is coming, and what
 * changed this afternoon. The website carries the part that stays true for
 * months, so nothing here is built from one Spond occurrence:
 *
 *   · training times come from the recurring series — the weekly rhythm,
 *   · the terminliste is what the club publishes deliberately: matches,
 *     races, cups, camps, dugnad and events open to people outside Spond.
 *
 * A single session that is cancelled is still shown, because the club can
 * cancel it from admin when the change matters publicly; it is marked on the
 * weekday it belongs to rather than listed as its own entry.
 *
 * Some sessions have no fixed clock at all — the weekend long ride leaves
 * "9, 9.30 or 10" depending on who is at home. The site must not invent one:
 * such a series sets `startApprox`, keeps the earliest likely time as its
 * sort key, and says the rest in `note`. Views with room print "ca." before
 * the range; the tight weekday columns print the bare earliest time, and the
 * note travels with the session for anyone who opens it.
 */

export interface TimetableEntry {
  id: string;
  /** 1 = Monday … 7 = Sunday */
  weekday: number;
  start: ClockTime;
  end: ClockTime;
  /** The start is a window settled in Spond — see the note at the top. */
  startApprox?: boolean;
  /** Session name when it differs from plain training, e.g. "Langtur". */
  title?: string;
  nodeId: string;
  nodeName: string;
  nodeHref: string;
  /** The branch the group sits in (Landevei, Terreng …), for grouping. */
  branchName?: string;
  sportName?: string;
  place?: string;
  note?: string;
  spondUrl?: string;
  /** Dates when this session does not happen, with the club's reason. */
  exceptions: { date: ISODate; note: string }[];
  from: ISODate;
  to: ISODate;
}

/** Every recurring session at or below a node that is still running. */
export function timetable(db: Db, org: Org, rootId: string, today: ISODate): TimetableEntry[] {
  const ids = org.subtree(rootId);
  return db.series
    .filter((s) => ids.has(s.nodeId) && s.to >= today)
    .map((s) => {
      const node = org.get(s.nodeId);
      const venue = s.venueId ? db.venues.find((v) => v.id === s.venueId) : undefined;
      const lineage = org.lineage(s.nodeId);
      return {
        id: s.id,
        weekday: s.weekday,
        start: s.start,
        end: s.end,
        startApprox: s.startApprox,
        title: s.title === "Trening" ? undefined : s.title,
        nodeId: s.nodeId,
        nodeName: node?.name ?? "",
        nodeHref: org.href(s.nodeId),
        branchName: lineage.find((n) => n.kind === "discipline")?.name,
        sportName: org.sportOf(s.nodeId)?.name,
        place: [venue?.name, s.locationNote].filter(Boolean).join(", ") || undefined,
        note: s.note,
        spondUrl: node?.externalLinks?.find((l) => l.kind === "spond")?.url,
        exceptions: s.exceptions ?? [],
        from: s.from,
        to: s.to,
      };
    })
    .sort(
      (a, b) =>
        a.weekday - b.weekday ||
        minutesOf(a.start) - minutesOf(b.start) ||
        a.nodeName.localeCompare(b.nodeName, "nb"),
    );
}

/** Is this session running on that date, and was it called off? */
export const runsOn = (entry: TimetableEntry, date: ISODate, weekday: number) =>
  entry.weekday === weekday && entry.from <= date && entry.to >= date;

export const cancelledOn = (entry: TimetableEntry, date: ISODate) => entry.exceptions.find((e) => e.date === date);

/**
 * The dated things the club publishes. Recurring sessions are left out —
 * they are the timetable — so what remains is matches, races, cups, camps,
 * dugnad and open events.
 */
export function terminliste(activities: Activity[], from: ISODate, to?: ISODate): Activity[] {
  return activities.filter((a) => !a.seriesId && (a.endDate ?? a.date) >= from && (!to || a.date <= to)).sort(byStart);
}

/** Sessions of a weekday, for the front page's week view. */
export const onWeekday = (entries: TimetableEntry[], date: ISODate, weekday: number) =>
  entries.filter((e) => runsOn(e, date, weekday));
