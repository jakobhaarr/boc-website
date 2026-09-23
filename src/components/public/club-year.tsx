"use client";

import { Snowflake, Sun } from "lucide-react";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { CategoryFilter, categoryStyle } from "@/components/public/category-filter";
import { type ClubYear, formatSpan, monthStart, type YearItem, type YearLane, yearPosition } from "@/lib/club-year";
import { cn } from "@/lib/cn";
import { diffDays, formatDayMonth, formatMonthShort } from "@/lib/dates";

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const dateText = (i: YearItem) => formatSpan(i.start, i.end);

type CalendarSeason = "summer" | "winter";

/** Calendar backdrop: summer is April–October, winter is November–March. */
const calendarSeason = (iso: string): CalendarSeason => {
  const month = Number(iso.slice(5, 7));
  return month >= 4 && month <= 10 ? "summer" : "winter";
};

function seasonBands(from: string) {
  return Array.from({ length: 12 }, (_, month) => ({ month, season: calendarSeason(monthStart(from, month)) })).reduce<
    { start: number; end: number; season: CalendarSeason }[]
  >((bands, current) => {
    const previous = bands.at(-1);
    if (previous?.season === current.season) previous.end = current.month + 1;
    else bands.push({ start: current.month, end: current.month + 1, season: current.season });
    return bands;
  }, []);
}

/**
 * The club year: every lane on one twelve-month axis. Pointing at a mark
 * selects it, and the readout under the chart names it — no tooltips to clip
 * or miss on touch. A period links on to where it is described in full.
 *
 * Encoding: a filled dot is a date the organiser has published; a hollow dot
 * is next edition projected from the last one (see lib/club-year.ts); the
 * club's own race has the club colour inside. Every marking takes its
 * branch's colour, the same as the branch's label in the filter.
 */
export function ClubYearView({ year, categories = [] }: { year: ClubYear; categories?: string[] }) {
  const [hidden, setHidden] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* A branch's race dates and training season belong to the same story. Pair
     matching lanes for the chart and filter, while retaining the source lane
     on each item for list labels and interaction. */
  const groupedLaneIds = new Set<string>();
  /* Trips ride in their branch's row, among its races, rather than in a row
     of their own — for BOC, Mallorca is part of Landevei. They keep a row
     only when no branch row takes them. */
  const tripLane = year.lanes.find((lane) => lane.kind === "trip");
  const tripHost = tripLane?.category ? year.lanes.find((lane) => lane.kind === "race" && lane.category === tripLane.category) : undefined;
  if (tripLane && tripHost) groupedLaneIds.add(tripLane.id);
  const laneGroups = year.lanes.flatMap((lane) => {
    if (groupedLaneIds.has(lane.id)) return [];
    const season = lane.kind === "race" ? year.lanes.find((candidate) => candidate.id === `season-${lane.id}`) : undefined;
    groupedLaneIds.add(lane.id);
    if (season) groupedLaneIds.add(season.id);
    const lanes = [lane, ...(season ? [season] : []), ...(tripLane && lane === tripHost ? [tripLane] : [])];
    return [{ id: lane.id, label: lane.label, category: lane.category, lanes }];
  });
  /* One label per category
     (the branch), in the same order and so the same colours. Spinning and
     Zwift are both Innendørs, and the trips go with their groups' branch.
     Every category starts shown; pressing one takes its rows out of the chart,
     and pressing it again brings them back. Rows follow the
     category order, so a branch's rows stand together. */
  const categoryKey = (group: (typeof laneGroups)[number]) => group.category ?? group.label;
  const rank = (key: string) => (categories.includes(key) ? categories.indexOf(key) : categories.length);
  laneGroups.sort((a, b) => rank(categoryKey(a)) - rank(categoryKey(b)));
  const filterKeys = [...new Set(laneGroups.map(categoryKey))];
  const filterOptions = filterKeys.map((key, n) => ({
    id: key,
    label: key,
    icon: key,
    index: categories.includes(key) ? categories.indexOf(key) : categories.length + n,
    shown: !hidden.includes(key),
  }));
  const colourOf = (group: (typeof laneGroups)[number]) => categoryStyle(filterOptions.find((o) => o.id === categoryKey(group))!.index);
  const visibleGroups = laneGroups.filter((group) => !hidden.includes(categoryKey(group)));
  const all = visibleGroups.flatMap((group) => group.lanes.flatMap((lane) => lane.items.map((item) => ({ ...item, lane, groupId: group.id }))));
  const active = all.find((i) => i.id === activeId);
  const upcoming = all.filter((i) => (i.end ?? i.start) >= year.today).sort((a, b) => a.start.localeCompare(b.start));
  const readout = active ?? upcoming[0];


  const pos = (iso: string) => `${yearPosition(year, iso) * 100}%`;
  const width = (i: YearItem) => `max(0.5rem, ${(yearPosition(year, i.end ?? i.start) - yearPosition(year, i.start)) * 100}%)`;
  const seasons = seasonBands(year.from);

  return (
    <div className="grid-page gap-y-8">
      {/* Chart */}
      <div className="col-span-full overflow-hidden rounded-xl bg-surface shadow-raised ring-1 ring-line">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <CategoryFilter
            options={filterOptions}
            onPress={(key) => {
              setHidden((h) => (h.includes(key) ? h.filter((k) => k !== key) : [...h, key]));
              setActiveId(null);
            }}
            onReset={hidden.length ? () => setHidden([]) : undefined}
            className="-mx-4 px-4 sm:mx-0 sm:px-0"
          />
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 t-meta text-ink-3" aria-label="Forklaring">
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-ink-2" />
              Dato kunngjort
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-surface ring-[1.5px] ring-ink-2 ring-inset" />
              Anslått fra i fjor
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-full bg-club-surface ring-2 ring-ink-2" />
              Klubbens eget ritt
            </li>
          </ul>
        </div>

        <div className="scroll-x">
          <div className="relative min-w-[46rem] px-4 pt-4 pb-2 sm:px-6">
            {/* The two club seasons sit behind the complete twelve-month axis. */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-4 left-[calc(1rem+8.5rem)] z-0 overflow-hidden sm:right-6 sm:left-[calc(1.5rem+8.5rem)]">
              {seasons.map((season) => {
                const left = yearPosition(year, monthStart(year.from, season.start)) * 100;
                const right = yearPosition(year, monthStart(year.from, season.end)) * 100;
                const summer = season.season === "summer";
                return (
                  <span
                    key={`${season.season}-${season.start}`}
                    className={cn(
                      "absolute inset-y-0 border-r border-white/55",
                      summer
                        ? "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--warning)_16%,var(--surface)),color-mix(in_srgb,var(--warning)_6%,var(--surface)))]"
                        : "bg-[linear-gradient(180deg,color-mix(in_srgb,var(--cat-1-bg)_80%,var(--surface)),color-mix(in_srgb,var(--cat-1-bg)_35%,var(--surface)))]",
                    )}
                    style={{ left: `${left}%`, width: `${right - left}%` }}
                  >
                    <span
                      className={cn(
                        "absolute top-1.5 left-1.5 flex items-center gap-1 text-[10px] leading-4 font-semibold tracking-[0.04em] uppercase",
                        summer ? "text-warning" : "[color:var(--cat-1)]",
                      )}
                    >
                      {summer ? <Sun className="size-3.5" /> : <Snowflake className="size-3.5" />}
                      {summer ? "Sommer" : "Vinter"}
                    </span>
                  </span>
                );
              })}
            </div>

            {/* Month grid and today, drawn once behind every lane */}
            <div aria-hidden className="pointer-events-none absolute inset-y-0 right-4 left-[calc(1rem+8.5rem)] z-0 sm:right-6 sm:left-[calc(1.5rem+8.5rem)]">
              {Array.from({ length: 12 }, (_, m) => (
                <span key={m} className="absolute inset-y-0 w-px bg-line/70" style={{ left: pos(monthStart(year.from, m)) }} />
              ))}
              <span className="absolute top-0 bottom-0 w-px bg-club" style={{ left: pos(year.today) }}>
                <span className="absolute top-0 left-1.5 rounded-xs bg-club px-1 text-[10px] leading-4 font-semibold whitespace-nowrap text-white">I dag</span>
              </span>
            </div>

            <div className="relative z-10 grid grid-cols-[8.5rem_minmax(0,1fr)]">
              <span />
              <div aria-hidden className="relative h-10">
                {Array.from({ length: 12 }, (_, m) => {
                  const start = monthStart(year.from, m);
                  return (
                    <span key={m} className="absolute top-0 pl-1.5 t-meta text-ink-3" style={{ left: pos(start) }}>
                      {/* The year sits above January, so the axis reads across the turn of the year. */}
                      <span className={cn("block text-ink", !start.endsWith("-01-01") && "invisible")}>{start.slice(0, 4)}</span>
                      {formatMonthShort(start)}
                    </span>
                  );
                })}
              </div>
            </div>

            {visibleGroups.map((group) => (
              <Lane
                key={group.id}
                lane={group.lanes[0]}
                seasonLane={group.lanes.find((lane) => lane.kind === "season")}
                tripLane={group.lanes[0].kind === "race" ? group.lanes.find((lane) => lane.kind === "trip") : undefined}
                colour={colourOf(group)}
                activeId={activeId}
                onActive={setActiveId}
                pos={pos}
                width={width}
              />
            ))}
          </div>
        </div>

        {/* Readout */}
        <div aria-live="polite" className="flex min-h-14 items-center gap-3 border-t border-line bg-sunken px-4 py-3 t-small sm:px-6">
          {readout && (
            <>
              <span className="shrink-0 font-semibold text-ink tnum">{upperFirst(dateText(readout))}</span>
              <span className="min-w-0 truncate text-ink-2">
                <span className="font-medium text-ink">{readout.title}</span>
                {readout.place && ` · ${readout.place}`}
                {!readout.confirmed && readout.previous && <span className="text-ink-3"> · dato ikke kunngjort, var {formatDayMonth(readout.previous)} i {readout.previous.slice(0, 4)}</span>}
              </span>
              {!active && <span className="ml-auto shrink-0 t-meta text-ink-3 max-sm:hidden">Neste i klubbåret</span>}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

function Lane({
  lane,
  seasonLane,
  tripLane,
  colour,
  activeId,
  onActive,
  pos,
  width,
}: {
  lane: YearLane;
  seasonLane?: YearLane;
  /** Trips drawn among the races, when the branch's row carries them. */
  tripLane?: YearLane;
  /** The branch's `--c` pair, as on its label in the filter. */
  colour: CSSProperties;
  activeId: string | null;
  onActive: (id: string | null) => void;
  pos: (iso: string) => string;
  width: (i: YearItem) => string;
}) {
  // Races and trips close together stack in rows, so no mark hides another.
  const marks = [...lane.items, ...(tripLane?.items ?? [])].sort((a, b) => a.start.localeCompare(b.start));
  const rows: string[] = [];
  const rowOf = new Map<string, number>();
  for (const i of marks) {
    let r = rows.findIndex((last) => diffDays(i.start, last) > 9);
    if (r === -1) r = rows.push(i.start) - 1;
    else rows[r] = i.end ?? i.start;
    rowOf.set(i.id, r);
  }
  const combined = lane.kind === "race" && !!seasonLane;
  const height = combined ? 68 + Math.max(0, rows.length - 1) * 16 : lane.kind === "race" ? 16 + rows.length * 16 : 40;
  const items = combined ? [...seasonLane.items, ...marks] : marks;
  const rowTop = (i: YearItem) =>
    combined
      ? `calc(100% - 18px + ${(rowOf.get(i.id)! - (rows.length - 1) / 2) * 16}px)`
      : `calc(50% + ${(rowOf.get(i.id)! - (rows.length - 1) / 2) * 16}px)`;
  const trips = tripLane?.items.length ?? 0;

  return (
    <div className="relative z-10 grid grid-cols-[8.5rem_minmax(0,1fr)] border-t border-line" style={colour}>
      <div className="py-2.5 pr-3">
        <p className="truncate text-[13px] leading-5 font-semibold text-ink">{lane.label}</p>
        <p className="t-meta text-ink-3">
          {combined
            ? [`${lane.items.length} ritt`, trips && `${trips} ${trips === 1 ? "tur" : "turer"}`, "Trening"].filter(Boolean).join(" · ")
            : lane.kind === "race"
              ? `${lane.items.length} ritt`
              : lane.kind === "trip"
                ? `${lane.items.length} ${lane.items.length === 1 ? "tur" : "turer"}`
                : "Trening"}
        </p>
      </div>
      <div className="relative" style={{ height: Math.max(height, 52) }}>
        {items.map((i) => {
          const active = i.id === activeId;
          const handlers = {
            onPointerEnter: () => onActive(i.id),
            onPointerLeave: () => onActive(null),
            onFocus: () => onActive(i.id),
            onBlur: () => onActive(null),
          };
          if (i.kind === "race") {
            return (
              <button
                key={i.id}
                type="button"
                aria-label={`${i.title}, ${dateText(i)}`}
                {...handlers}
                onClick={() => onActive(i.id)}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full p-1"
                style={{ left: pos(i.start), top: rowTop(i) }}
              >
                <span
                  className={cn(
                    "block size-2.5 rounded-full transition-transform duration-150",
                    i.ownEvent ? "bg-club-surface ring-2 ring-[var(--c)]" : i.confirmed ? "bg-[var(--c)]" : "bg-surface ring-[1.5px] ring-[var(--c)] ring-inset",
                    active && "scale-[1.6]",
                  )}
                />
              </button>
            );
          }
          const markProps = {
            "aria-label": `${i.title}, ${dateText(i)}`,
            ...handlers,
            className: cn(
              "absolute flex -translate-y-1/2 items-center rounded-md text-left whitespace-nowrap transition-shadow duration-150",
              // A trip among the races sits on their rows; a season runs along the top.
              i.kind === "trip" && tripLane ? undefined : combined ? "top-[22px]" : "top-1/2",
              // A season is the filter's label drawn out over its months: same background, same text.
              // A trip is a short mark, filled in the text colour like a race dot, or it would not show.
              i.kind === "season" ? "h-7 bg-[var(--c-bg)] px-2.5 text-[12.5px] font-semibold text-[var(--c)]" : "h-2.5 bg-[var(--c)]",
              // A border in the branch colour always, so a pale block holds its edge on the season backdrop; the glow on hover.
              active
                ? "shadow-[inset_0_0_0_1px_var(--c),0_0_0_3px_color-mix(in_srgb,var(--c)_25%,transparent)]"
                : "shadow-[inset_0_0_0_1px_var(--c)]",
            ),
            style: { left: pos(i.start), width: width(i), ...(i.kind === "trip" && tripLane ? { top: rowTop(i) } : {}) },
          };
          const label = i.kind === "season" && <span className="truncate">{i.detail}</span>;
          // A period links to the activities page, where its sessions or dates are.
          return i.href ? (
            <Link key={i.id} href={i.href} {...markProps}>
              {label}
            </Link>
          ) : (
            <button key={i.id} type="button" onClick={() => onActive(i.id)} {...markProps}>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
