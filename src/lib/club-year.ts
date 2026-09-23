import { addDays, diffDays, formatDayMonth, formatDayMonthShort, formatTime, weekdayName } from "./dates";
import type { Org } from "./org";
import type { Db, ISODate, Race } from "./types";

/**
 * "Klubbåret": the next twelve months of what members do together beyond the
 * weekly training — races, training trips and seasonal programmes (Zwift in
 * winter) — laid out on one axis.
 *
 * Sources, in the club's own data:
 *   · races     — db.races, one lane per branch
 *   · trips     — activities of kind "camp"
 *   · seasons   — training series flagged `seasonal`, merged by their
 *                 `clubYearGroupId` (or by group when no shared id is set)
 *
 * Race dates: organisers publish one edition at a time. An edition still to
 * come is shown as confirmed. An edition in the past is projected to the same
 * day in the first later year that is still ahead, and kept apart as
 * unconfirmed with the date it came from, so the page never presents a guess
 * as the organiser's date.
 */

export type YearItemKind = "race" | "trip" | "season";

export interface YearItem {
  id: string;
  kind: YearItemKind;
  laneId: string;
  title: string;
  start: ISODate;
  end?: ISODate;
  /** False when the date is projected from an earlier edition. */
  confirmed: boolean;
  /** The edition a projected date comes from. */
  previous?: ISODate;
  place?: string;
  detail?: string;
  href?: string;
  ownEvent?: boolean;
}

export interface YearLane {
  id: string;
  label: string;
  kind: YearItemKind;
  items: YearItem[];
  /**
   * The category the lane belongs to: the branch in a
   * one-sport club, the sport otherwise. It gives the lane that category's
   * colour and icon, so Spinning and Zwift both read as Innendørs. Trips
   * take their groups' category (BOC's are Landevei), and have none only
   * when they belong to more than one.
   */
  category?: string;
}

export interface ClubYear {
  /** First day of the current month. */
  from: ISODate;
  /** Last day of the twelfth month. */
  to: ISODate;
  today: ISODate;
  lanes: YearLane[];
}

const pad = (n: number) => String(n).padStart(2, "0");

function shiftYears(iso: ISODate, years: number): ISODate {
  const [y, m, d] = iso.split("-");
  // 29 February becomes 28 February in a year without it.
  const day = m === "02" && d === "29" ? "28" : d;
  return `${Number(y) + years}-${m}-${day}`;
}

/** Month n months after the month of `iso`, as its first day. */
export function monthStart(iso: ISODate, n = 0): ISODate {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7)) - 1 + n;
  return `${y + Math.floor(m / 12)}-${pad((((m % 12) + 12) % 12) + 1)}-01`;
}

/** The next edition of a race, confirmed or projected. See the file comment. */
export function nextEdition(race: Race, today: ISODate): Pick<YearItem, "start" | "end" | "confirmed" | "previous"> {
  if ((race.endDate ?? race.date) >= today) return { start: race.date, end: race.endDate, confirmed: true };
  let years = 1;
  while ((race.endDate ? shiftYears(race.endDate, years) : shiftYears(race.date, years)) < today) years++;
  return {
    start: shiftYears(race.date, years),
    end: race.endDate && shiftYears(race.endDate, years),
    confirmed: false,
    previous: race.date,
  };
}

/** "29. september", "10.–17. oktober", "1. nov – 31. mar" */
export function formatSpan(start: ISODate, end?: ISODate): string {
  if (!end || end === start) return formatDayMonth(start);
  if (start.slice(0, 7) === end.slice(0, 7)) return `${Number(start.slice(8))}.–${formatDayMonth(end)}`;
  return `${formatDayMonthShort(start)} – ${formatDayMonthShort(end)}`;
}

/** Position of a date on the year axis, 0–1. */
export function yearPosition(year: Pick<ClubYear, "from" | "to">, iso: ISODate): number {
  const span = diffDays(year.to, year.from) + 1;
  return Math.min(1, Math.max(0, diffDays(iso, year.from) / span));
}

export function buildClubYear(db: Db, org: Org, today: ISODate): ClubYear {
  const from = monthStart(today);
  const to = addDays(monthStart(today, 12), -1);
  const within = (start: ISODate, end?: ISODate) => (end ?? start) >= from && start <= to;
  const lanes: YearLane[] = [];
  const singleSport = org.sports().length === 1;
  const categoryOf = (nodeId: string) =>
    singleSport ? org.lineage(nodeId).find((n) => n.kind === "discipline")?.name : org.sportOf(nodeId)?.name;

  /* Races, one lane per branch in the club's own order */
  const raceNodes = [...new Set(db.races.map((r) => r.nodeId))]
    .map((id) => org.get(id))
    .filter((n) => !!n)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  for (const node of raceNodes) {
    const items = db.races
      .filter((r) => r.nodeId === node.id)
      .map((r): YearItem => ({
        id: r.id,
        kind: "race",
        laneId: node.id,
        title: r.name,
        ...nextEdition(r, today),
        place: r.place,
        detail: [r.format, r.organiser].filter(Boolean).join(" · ") || undefined,
        href: r.url,
        ownEvent: r.ownEvent,
      }))
      .filter((i) => within(i.start, i.end))
      .sort((a, b) => a.start.localeCompare(b.start));
    if (items.length) lanes.push({ id: node.id, label: node.name, kind: "race", items, category: categoryOf(node.id) });
  }

  /* Training trips */
  const trips = db.activities
    .filter((a) => a.kind === "camp" && a.status === "scheduled" && within(a.date, a.endDate))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(
      (a): YearItem => ({
        id: a.id,
        kind: "trip",
        laneId: "turer",
        title: a.title,
        start: a.date,
        end: a.endDate,
        confirmed: true,
        place: a.locationNote ?? org.get(a.nodeId)?.name,
        detail: org.get(a.nodeId)?.name,
        // The trip's entry in the terminliste, where the dates and details are.
        href: `/aktiviteter?gruppe=${a.nodeId}#terminliste`,
      }),
    );
  if (trips.length) {
    const tripCategories = new Set(
      db.activities.filter((a) => trips.some((t) => t.id === a.id)).map((a) => categoryOf(a.nodeId)),
    );
    const category = tripCategories.size === 1 ? [...tripCategories][0] : undefined;
    lanes.push({ id: "turer", label: "Treningsturer", kind: "trip", items: trips, category });
  }

  /* Seasonal programmes. Related weekly series share one band through
     clubYearGroupId: all road groups become "Landevei", while Spinning and
     Zwift remain separate even though both belong to Innendørs.

     A seasonal weekly series repeats annually. Its month/day pair is expanded
     for every calendar year touching this twelve-month window, then clipped
     to the visible bounds. This is why a September–August chart can show both
     the end of this summer and the beginning of the next one without painting
     a false band through winter. */
  const seasonal = db.series.filter((s) => s.seasonal);
  for (const groupId of [...new Set(seasonal.map((s) => s.clubYearGroupId ?? s.nodeId))]) {
    const series = seasonal.filter((s) => (s.clubYearGroupId ?? s.nodeId) === groupId).sort((a, b) => a.weekday - b.weekday);
    const node = org.get(groupId) ?? org.get(series[0]?.nodeId);
    if (!node) continue;
    const fromMonthDay = series.map((s) => s.from.slice(5)).sort()[0];
    const toMonthDay = series.map((s) => s.to.slice(5)).sort().at(-1)!;
    const crossesNewYear = toMonthDay < fromMonthDay;
    const days = [...new Set(series.map((s) => weekdayName(s.weekday, true)))];
    const dayText = days.length > 1 ? `${days.slice(0, -1).join(", ")} og ${days.at(-1)}` : days[0];
    const label = series.find((s) => s.clubYearLabel)?.clubYearLabel ?? node.name;
    const items: YearItem[] = [];
    const firstYear = Number(from.slice(0, 4)) - 1;
    const lastYear = Number(to.slice(0, 4));
    for (let calendarYear = firstYear; calendarYear <= lastYear; calendarYear++) {
      const sourceStart = `${calendarYear}-${fromMonthDay}`;
      const sourceEnd = `${calendarYear + (crossesNewYear ? 1 : 0)}-${toMonthDay}`;
      if (!within(sourceStart, sourceEnd)) continue;
      const start = sourceStart < from ? from : sourceStart;
      const end = sourceEnd > to ? to : sourceEnd;
      items.push({
        id: `season-${groupId}-${calendarYear}`,
        kind: "season",
        laneId: `season-${groupId}`,
        title: `${label}-sesongen`,
        start,
        end,
        confirmed: true,
        place: series[0].locationNote,
        // The clock only when every session shares it: Landevei's weekdays are 17.30 and its Saturday 10.00.
        detail: `${dayText.charAt(0).toUpperCase()}${dayText.slice(1)}${new Set(series.map((x) => x.start)).size === 1 ? ` ${formatTime(series[0].start)}` : ""}`,
        // The weekly rhythm behind the season, filtered to the groups in it.
        href: `/aktiviteter?gruppe=${node.id}#treningstider`,
      });
    }
    /* A programme that runs all year comes out as one season per calendar
       year, 31 December against 1 January. Seasons that touch are one
       season, so the chart draws it as one band; one that fills the
       whole window is named for what it is. */
    for (let n = items.length - 1; n > 0; n--) {
      if (addDays(items[n - 1].end!, 1) !== items[n].start) continue;
      items[n - 1].end = items[n].end;
      items.splice(n, 1);
    }
    for (const item of items) if (item.start === from && item.end === to) item.title = `${label} hele året`;
    if (!items.length) continue;
    lanes.push({
      id: `season-${groupId}`,
      label,
      kind: "season",
      items,
      category: categoryOf(node.id),
    });
  }

  return { from, to, today, lanes };
}

export interface TerminlisteSeason {
  id: string;
  title: string;
  start: ISODate;
  end: ISODate;
  /** "Mandager og onsdager 19.30" */
  detail: string;
  href: string;
}

/**
 * The seasons a node's terminliste carries (OrgNode.seasonsInTerminliste,
 * inherited from above): for each group named, its seasonal series as one
 * season — the one under way today, or else the next — with its days, and
 * the clock when every session shares it. Zwift runs November to March, so
 * on 21 September Landevei's terminliste shows the season starting 1 November.
 */
export function terminlisteSeasons(db: Db, org: Org, nodeId: string, today: ISODate): TerminlisteSeason[] {
  const groupIds = [...new Set(org.lineage(nodeId).flatMap((n) => n.seasonsInTerminliste ?? []))];
  return groupIds.flatMap((groupId) => {
    const series = db.series.filter((s) => s.seasonal && (s.clubYearGroupId ?? s.nodeId) === groupId);
    const node = org.get(groupId);
    if (!series.length || !node) return [];
    const fromMonthDay = series.map((s) => s.from.slice(5)).sort()[0];
    const toMonthDay = series.map((s) => s.to.slice(5)).sort().at(-1)!;
    const crossesNewYear = toMonthDay < fromMonthDay;
    const year = Number(today.slice(0, 4));
    const occurrences = [year - 1, year, year + 1].map((y) => ({
      start: `${y}-${fromMonthDay}`,
      end: `${y + (crossesNewYear ? 1 : 0)}-${toMonthDay}`,
    }));
    const season = occurrences.find((o) => o.end >= today);
    if (!season) return [];
    const days = [...new Set(series.sort((a, b) => a.weekday - b.weekday).map((s) => weekdayName(s.weekday, true)))];
    const dayText = days.length > 1 ? `${days.slice(0, -1).join(", ")} og ${days.at(-1)}` : days[0];
    const clock = new Set(series.map((s) => s.start)).size === 1 ? ` ${formatTime(series[0].start)}` : "";
    const label = series.find((s) => s.clubYearLabel)?.clubYearLabel ?? node.name;
    return [
      {
        id: `season-${groupId}-${season.start}`,
        title: `${label}-sesongen`,
        start: season.start,
        end: season.end,
        detail: `${dayText.charAt(0).toUpperCase()}${dayText.slice(1)}${clock}`,
        href: org.href(groupId),
      },
    ];
  });
}
