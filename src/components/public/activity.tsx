import { ArrowRight, ArrowUpRight, ChevronDown, Repeat } from "lucide-react";
import Link from "next/link";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import {
  dayOfMonth,
  diffDays,
  formatDayMonth,
  formatMonthShort,
  formatTime,
  formatTimeRange,
  formatWeekdayShort,
} from "@/lib/dates";
import type { ActivityView } from "@/lib/views";

/* ─── ActivityDate ─────────────────────────────────────────────────────── */

export function ActivityDate({ date, today, className }: { date: string; today: string; className?: string }) {
  const isToday = diffDays(date, today) === 0;
  return (
    <div className={cn("w-12 text-center leading-none", className)}>
      <div className={cn("t-overline", isToday ? "text-club" : "text-ink-3")}>{isToday ? "I dag" : formatWeekdayShort(date)}</div>
      <div className="mt-1 font-display text-[1.625rem] font-semibold tracking-[-0.02em] tnum text-ink">{dayOfMonth(date)}</div>
      <div className="mt-0.5 t-meta text-ink-3">{formatMonthShort(date)}</div>
    </div>
  );
}

/* ─── ActivityRow ──────────────────────────────────────────────────────── */

/**
 * Scannable row that expands in place (native <details>, so it works without
 * JavaScript and with the keyboard). Leading column is either the start time
 * (lists grouped by day) or a date block (mixed-date lists).
 */
export function ActivityRow({
  activity: a,
  today,
  leading = "time",
  showTrail = true,
}: {
  activity: ActivityView;
  today?: string;
  leading?: "time" | "date";
  showTrail?: boolean;
}) {
  const emphasised = a.kind !== "training";
  const meta = [
    a.endDate ? `Til ${formatDayMonth(a.endDate)}` : leading === "date" ? formatTimeRange(a.start, a.end, a.startApprox) : null,
    a.subtitle !== a.kindLabel ? a.subtitle : null,
    showTrail ? a.trail : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <details id={a.id} className="disclosure group/row scroll-mt-40 border-b border-line">
      <summary
        className={cn(
          "-mx-3 grid cursor-pointer items-start gap-x-3 rounded-lg px-3 py-3.5 transition-colors duration-150 hover:bg-sunken group-open/row:bg-sunken sm:gap-x-5",
          leading === "date"
            ? "grid-cols-[3rem_minmax(0,1fr)_1.25rem] md:grid-cols-[3rem_minmax(0,1fr)_13rem_1.25rem]"
            : "grid-cols-[3.25rem_minmax(0,1fr)_1.25rem] md:grid-cols-[4.5rem_minmax(0,1fr)_15rem_1.25rem]",
        )}
      >
        {leading === "date" && today ? (
          <ActivityDate date={a.date} today={today} />
        ) : (
          <div className="pt-px tnum">
            <div className={cn("text-[15px] leading-tight font-semibold", a.cancelled ? "text-ink-3 line-through" : "text-ink")}>
              {formatTime(a.start)}
            </div>
            {a.end && <div className="mt-0.5 t-meta text-ink-3">{formatTime(a.end)}</div>}
          </div>
        )}

        <div className="min-w-0">
          {emphasised && (
            <div className={cn("mb-0.5 t-meta font-semibold", a.cancelled ? "text-ink-3" : "text-club")}>{a.kindLabel}</div>
          )}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span
              className={cn(
                "text-[15px] leading-snug font-semibold",
                a.cancelled ? "text-ink-3 line-through decoration-ink-3/60" : "text-ink",
              )}
            >
              {a.title}
            </span>
            {a.result && (
              <span className="rounded-xs bg-inverse px-1.5 text-[13px] leading-5 font-semibold tnum text-ink-inverse">
                {a.result.label}
              </span>
            )}
            {a.cancelled && <Status tone="danger">Avlyst</Status>}
            {a.recurring && !a.cancelled && (
              <Repeat aria-label={a.recurring} className="size-3.5 text-ink-3" />
            )}
          </div>
          {meta && <p className="mt-0.5 truncate t-small text-ink-3">{meta}</p>}
          {a.place && <p className="mt-0.5 truncate t-small text-ink-2 md:hidden">{a.place.name}</p>}
          {a.cancelled && a.statusNote && <p className="mt-1 t-small text-danger">{a.statusNote}</p>}
        </div>

        <div className="hidden min-w-0 pt-px t-small md:block">
          {a.place ? (
            <>
              <p className="truncate text-ink-2">{a.place.name}</p>
              {a.place.detail && <p className="truncate text-ink-3">{a.place.detail}</p>}
            </>
          ) : (
            <p className="text-ink-3">Sted kommer</p>
          )}
        </div>

        <ChevronDown aria-hidden className="mt-1 size-4 text-ink-3 transition-transform duration-200 group-open/row:rotate-180" />
      </summary>

      <div
        className={cn(
          "grid gap-x-8 gap-y-4 pt-1 pb-5 pr-2 md:grid-cols-[minmax(0,1fr)_15rem]",
          leading === "date" ? "pl-[3.75rem] sm:pl-[4.25rem]" : "pl-[4rem] sm:pl-[4.5rem] md:pl-[5.75rem]",
        )}
      >
        <div className="space-y-3 t-small">
          {a.description && <p className="max-w-prose text-ink-2">{a.description}</p>}
          <dl className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5">
            <dt className="text-ink-3">Tid</dt>
            <dd className="text-ink tnum">
              {formatTimeRange(a.start, a.end, a.startApprox)}
              {a.meetTime && <span className="text-ink-2">, oppmøte {formatTime(a.meetTime)}</span>}
            </dd>
            {a.recurring && (
              <>
                <dt className="text-ink-3">Gjentas</dt>
                <dd className="text-ink">{a.recurring}</dd>
              </>
            )}
            {a.people.map((p) => (
              <div key={p.label} className="contents">
                <dt className="text-ink-3">{p.label}</dt>
                <dd className="text-ink">{p.text}</dd>
              </div>
            ))}
          </dl>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
            {a.nodeHref !== "/" && (
              <Link href={a.nodeHref} className="group/l inline-flex items-center gap-1 font-medium text-ink hover:text-club">
                Til {a.nodeName}
                <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover/l:translate-x-0.5" />
              </Link>
            )}
            {a.signup && (
              <a href={a.signup.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 font-medium text-ink hover:text-club">
                {a.signup.label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            )}
          </div>
        </div>
        {a.place && (
          <div className="border-line t-small md:border-l md:pl-5">
            <p className="font-medium text-ink">{a.place.name}</p>
            {a.place.detail && <p className="text-ink-3">{a.place.detail}</p>}
            {a.place.note && <p className="mt-1.5 text-ink-2">{a.place.note}</p>}
            {a.place.mapUrl && (
              <a
                href={a.place.mapUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-flex items-center gap-1 font-medium text-ink hover:text-club"
              >
                Veibeskrivelse
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

/* ─── ActivityLine ─────────────────────────────────────────────────────── */

/** One-line version for rails ("Dette skjer"). Links to the group. */
export function ActivityLine({ activity: a }: { activity: ActivityView }) {
  const href = a.nodeHref !== "/" && (a.kind === "training" || a.kind === "match") ? a.nodeHref : `/aktiviteter#${a.id}`;
  const second =
    a.kind === "training"
      ? [a.sportName, a.place?.name].filter(Boolean).join(" · ")
      : [a.kindLabel, a.place?.name ?? (a.nodeHref === "/" ? "Hele klubben" : a.sportName)].filter(Boolean).join(" · ");
  return (
    <li className="border-b border-line">
      <Link href={href} className="group -mx-2 grid grid-cols-[3rem_minmax(0,1fr)] gap-x-3 rounded-md px-2 py-2.5 transition-colors duration-150 hover:bg-sunken">
        <span className={cn("pt-px t-label font-semibold tnum", a.cancelled ? "text-ink-3 line-through" : "text-ink")}>
          {formatTime(a.start)}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "truncate text-[15px] leading-snug font-medium transition-colors group-hover:text-club",
                a.cancelled ? "text-ink-3 line-through" : "text-ink",
              )}
            >
              {a.title}
            </span>
            {a.cancelled && <Status tone="danger">Avlyst</Status>}
            {a.result && <span className="t-meta font-semibold text-ink-2 tnum">{a.result.label}</span>}
          </span>
          <span className="block truncate t-small text-ink-3">{second}</span>
        </span>
      </Link>
    </li>
  );
}
