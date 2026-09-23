import { CalendarDays, Sun } from "lucide-react";
import Link from "next/link";
import { HoverArrow } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { WEEKDAYS_SHORT } from "@/lib/dates";
import { birthYearLabel, dateRangeLabel, type SeasonView } from "@/lib/seasons";

/**
 * The year at a glance for one group: the weekly rhythm rather than every
 * session, the pauses in the season, the cups and camps, and which cohort is
 * on the page (see lib/seasons.ts).
 */
export function SeasonSummary({ view, nodeName, nextHref }: { view: SeasonView; nodeName: string; nextHref?: string }) {
  const { rhythm, breaks, highlights, counts, cohort, next, incoming } = view;

  return (
    <div className="space-y-10">
      <div className="grid gap-x-[var(--grid-gap)] gap-y-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {rhythm ? (
            <>
              <p className="t-h3">{rhythm.text}</p>
              <div aria-hidden className="mt-4 grid grid-cols-7 gap-1">
                {WEEKDAYS_SHORT.map((d, i) => (
                  <div
                    key={d}
                    className={cn(
                      "flex h-9 items-center justify-center rounded-sm t-meta capitalize",
                      rhythm.weekdays.includes(i + 1) ? "bg-club-surface text-on-club" : "bg-sunken text-ink-3",
                    )}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="t-h3">Ingen faste treninger i {nodeName} denne sesongen.</p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-6 self-end lg:grid-cols-1 lg:gap-y-5">
          <div className="border-t border-guide pt-3">
            <dd className="font-display text-[1.5rem] leading-none font-medium tracking-[-0.03em] tnum">{counts.trainings}</dd>
            <dt className="mt-1.5 t-small text-ink-3">treninger i {view.season}</dt>
          </div>
          {/* Team sports count matches played; a cycling group counts races. */}
          {counts.matches > 0 ? (
            <div className="border-t border-guide pt-3">
              <dd className="font-display text-[1.5rem] leading-none font-medium tracking-[-0.03em] tnum">
                {counts.played}
                <span className="text-ink-3">/{counts.matches}</span>
              </dd>
              <dt className="mt-1.5 t-small text-ink-3">kamper spilt</dt>
            </div>
          ) : (
            counts.races > 0 && (
              <div className="border-t border-guide pt-3">
                <dd className="font-display text-[1.5rem] leading-none font-medium tracking-[-0.03em] tnum">{counts.races}</dd>
                <dt className="mt-1.5 t-small text-ink-3">ritt og konkurranser</dt>
              </div>
            )
          )}
        </dl>
      </div>

      {breaks.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 border-b border-line pb-2.5 t-label font-semibold">
            <Sun aria-hidden className="size-4 text-ink-3" />
            Pauser i sesongen
          </h3>
          <ul className="divide-y divide-line">
            {breaks.map((b) => (
              <li key={b.label} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 t-small">
                <span className="text-ink">{b.label}</span>
                <span className="text-ink-3">{dateRangeLabel(b.from, b.to)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {highlights.length > 0 && (
        <div>
          <h3 className="flex items-center gap-2 border-b border-line pb-2.5 t-label font-semibold">
            <CalendarDays aria-hidden className="size-4 text-ink-3" />
            Cuper, samlinger og arrangementer
          </h3>
          <ul className="divide-y divide-line">
            {highlights.map((h) => (
              <li key={h.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 gap-y-1 py-3.5">
                <span className="min-w-0">
                  <span className={cn("block text-[15px] leading-snug font-semibold", h.done ? "text-ink-2" : "text-ink")}>{h.title}</span>
                  <span className="block truncate t-small text-ink-3">
                    {h.kindLabel}
                    {h.place ? ` · ${h.place}` : ""}
                  </span>
                </span>
                <span className={cn("text-right t-small tnum", h.done ? "text-ink-3" : "font-medium text-ink")}>
                  {h.when}
                  {!h.done && <span className="mt-0.5 block t-meta font-normal text-club">Kommer</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(cohort || next) && (
        <div className="rounded-lg bg-club-tint p-5">
          <h3 className="t-label font-semibold">Årskull og neste sesong</h3>
          <p className="mt-2 t-small text-ink-2">
            {cohort && (
              <>
                I sesongen {view.season} er {nodeName} årskullet {birthYearLabel(cohort).toLowerCase()}.{" "}
              </>
            )}
            {next && (
              <>
                Fra 1. januar {next.season} fortsetter det samme kullet som <span className="font-medium text-ink">{next.node.name}</span>
                {incoming ? `, og ${nodeName} tar over ${birthYearLabel(incoming).toLowerCase()}` : ""}. Aktiviteter etter nyttår legges derfor inn på{" "}
                {next.node.name}.
              </>
            )}
          </p>
          {next && nextHref && (
            <Link href={nextHref} className="mt-3 inline-flex items-center t-small font-medium text-club hover:text-club-hover">
              Planer for {next.season} på {next.node.name}
              <HoverArrow />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
