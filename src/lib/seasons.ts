import { relevantTo } from "./activities";
import { formatDayMonth, weekdayName } from "./dates";
import type { Org } from "./org";
import type { Activity, Db, ISODate, OrgNode, SeasonBreak } from "./types";

/**
 * SEASONS AND AGE CLASSES
 *
 * Norwegian club sport runs on the calendar year: the season is the year a
 * date falls in, and an age class is the age a player turns during that year.
 *
 *   birth years of a page in a season = season − ageRange
 *   G16 (ageRange 15–16) in 2026 → born 2010–2011, in 2027 → born 2011–2012
 *
 * So the page keeps its name — G16 is always G16 — and a new cohort arrives
 * on it every new year. Planning across the turn of the year works the other
 * way round: a cohort keeps its birth years, and `nodeInSeason` finds the
 * page that covers its new age, so a February session entered in November
 * lands on next season's page (G15 → G16) instead of on this season's.
 *
 * Groups with no upper age (seniors, open groups) have no cohort: people stay
 * in them from year to year.
 */

export const seasonOf = (date: ISODate): number => Number(date.slice(0, 4));

export const seasonStart = (season: number): ISODate => `${season}-01-01`;
export const seasonEnd = (season: number): ISODate => `${season}-12-31`;

export interface Cohort {
  season: number;
  /** Inclusive, oldest first: [2010, 2011] reads "born 2010–2011". */
  birthYears: [number, number];
}

/** The cohort on a page in a given season, or undefined for open groups. */
export function cohortOf(node: OrgNode, season: number): Cohort | undefined {
  if (!node.ageRange) return undefined;
  const [minAge, maxAge] = node.ageRange;
  if (maxAge >= 99 || maxAge - minAge > 4) return undefined;
  return { season, birthYears: [season - maxAge, season - minAge] };
}

export function birthYearLabel(cohort: Cohort): string {
  const [from, to] = cohort.birthYears;
  return from === to ? `Født ${from}` : `Født ${from}–${to}`;
}

/**
 * The page this page's cohort belongs on in another season. Candidates are
 * ranked by how well they fit: the same branch first, then the same team
 * number (J16-2 → the "-2" team), then the closest age class.
 */
export function nodeInSeason(org: Org, node: OrgNode, fromSeason: number, toSeason: number): OrgNode | undefined {
  const cohort = cohortOf(node, fromSeason);
  const sport = org.sportOf(node.id);
  if (!cohort || !sport || toSeason === fromSeason) return undefined;
  const oldest = toSeason - cohort.birthYears[0];
  const branchId = org.lineage(node.id).find((n) => n.kind === "discipline")?.id;
  const leaf = org.isLeaf(node.id);
  const suffix = node.name.match(/-(\d+)$/)?.[1];

  const scored = org
    .descendants(sport.id)
    .filter((n) => n.id !== node.id && n.ageRange && n.ageRange[0] <= oldest && n.ageRange[1] >= oldest)
    .map((n) => ({
      node: n,
      score:
        (branchId && org.contains(branchId, n.id) ? 4 : 0) +
        (suffix && n.name.endsWith(`-${suffix}`) ? 2 : 0) +
        (org.isLeaf(n.id) === leaf ? 1 : 0) +
        (n.ageRange![1] === oldest ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.node.sortOrder - b.node.sortOrder);

  return scored[0]?.node;
}

/** Nearest breaks above or on the node — a sport's summer holiday covers its teams. */
export function breaksFor(org: Org, nodeId: string, season: number): SeasonBreak[] {
  const owner = org
    .lineage(nodeId)
    .reverse()
    .find((n) => n.breaks?.length);
  return (owner?.breaks ?? []).filter((b) => seasonOf(b.from) === season || seasonOf(b.to) === season);
}

/** "18.–19. april" within a month, "27. juli – 1. august" across two. */
export function dateRangeLabel(from: ISODate, to?: ISODate): string {
  if (!to || to === from) return formatDayMonth(from);
  if (from.slice(0, 7) === to.slice(0, 7)) return `${Number(from.slice(8, 10))}.–${formatDayMonth(to)}`;
  return `${formatDayMonth(from)} – ${formatDayMonth(to)}`;
}

export interface SeasonRhythm {
  /** 1 = Monday … 7 = Sunday */
  weekdays: number[];
  /** "3 treninger i uken: mandag, onsdag og fredag" */
  text: string;
}

export interface SeasonHighlight {
  id: string;
  title: string;
  kindLabel: string;
  when: string;
  date: ISODate;
  place?: string;
  done: boolean;
}

export interface SeasonView {
  season: number;
  cohort?: Cohort;
  rhythm?: SeasonRhythm;
  breaks: SeasonBreak[];
  highlights: SeasonHighlight[];
  counts: { trainings: number; matches: number; played: number; races: number };
  /** Where this cohort continues next season, when the age class changes. */
  next?: { season: number; node: OrgNode; cohort: Cohort };
  /** The cohort that arrives on this page next season. */
  incoming?: Cohort;
}

const listNames = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} og ${names.at(-1)}` : (names[0] ?? ""));

/**
 * A team's year in one view: the weekly rhythm rather than every session,
 * the pauses, the cups and camps, and which cohort is on the page.
 */
export function seasonView(db: Db, org: Org, nodeId: string, season: number, today: ISODate): SeasonView {
  const node = org.get(nodeId)!;
  const inSeason = (a: Activity) => seasonOf(a.date) === season;
  const activities = relevantTo(db.activities, org, nodeId).filter(inSeason);

  const series = db.series.filter((s) => org.subtree(nodeId).has(s.nodeId) || s.nodeId === nodeId);
  const weekdays = [...new Set(series.map((s) => s.weekday))].sort();
  const rhythm: SeasonRhythm | undefined = weekdays.length
    ? {
        weekdays,
        text: `${weekdays.length} ${weekdays.length === 1 ? "trening" : "treninger"} i uken: ${listNames(weekdays.map((w) => weekdayName(w)))}`,
      }
    : undefined;

  const highlights = activities
    .filter((a) => a.kind === "camp" || a.kind === "race" || a.kind === "event" || a.endDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => ({
      id: a.id,
      title: a.title,
      kindLabel: a.kind === "camp" ? "Samling" : a.kind === "race" ? "Konkurranse" : "Arrangement",
      when: dateRangeLabel(a.date, a.endDate),
      date: a.date,
      place: a.locationNote ?? db.venues.find((v) => v.id === a.venueId)?.name,
      done: (a.endDate ?? a.date) < today,
    }));

  const cohort = cohortOf(node, season);
  const nextNode = nodeInSeason(org, node, season, season + 1);
  const nextCohort = cohort ? { season: season + 1, birthYears: cohort.birthYears } : undefined;

  return {
    season,
    cohort,
    rhythm,
    breaks: breaksFor(org, nodeId, season),
    highlights,
    counts: {
      trainings: activities.filter((a) => a.kind === "training" && a.status !== "cancelled").length,
      matches: activities.filter((a) => a.kind === "match").length,
      played: activities.filter((a) => a.kind === "match" && a.result).length,
      races: activities.filter((a) => a.kind === "race").length,
    },
    next: nextNode && nextCohort ? { season: season + 1, node: nextNode, cohort: nextCohort } : undefined,
    incoming: cohortOf(node, season + 1),
  };
}
