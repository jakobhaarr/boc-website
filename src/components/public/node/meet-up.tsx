import { ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Photo } from "@/components/public/photo";
import { cn } from "@/lib/cn";
import { formatTime, weekdayName } from "@/lib/dates";
import type { Photo as PhotoRecord, Venue } from "@/lib/types";
import { mapUrl } from "@/lib/views";

export interface MeetUpSlot {
  key: string;
  title: string;
  weekdays: number[];
  start: string;
  venue?: Venue;
  photo?: PhotoRecord;
}

export interface MeetUpMonth {
  /** 1–12 */
  month: number;
  state: "on" | "off" | "break";
  /** What an off month inside the season is, e.g. «Fellesferie». */
  label?: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Des"];
const MONTH_NAMES = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const days = (weekdays: number[]) => {
  const names = weekdays.map((w) => weekdayName(w, true));
  return upperFirst(names.length > 1 ? `${names.slice(0, -1).join(", ")} og ${names.at(-1)}` : names[0]);
};

/** «Tir og tor 18.00» over «Bekkestua torg»: one meeting point as a fact for the hero's strip, short enough for a cell. */
export function slotFact(slot: MeetUpSlot): { value: string; label: string } {
  const names = slot.weekdays.map((w) => upperFirst(weekdayName(w).slice(0, 3).toLowerCase()));
  const short = names.length > 1 ? `${names.slice(0, -1).join(", ")} og ${names.at(-1)!.toLowerCase()}` : names[0];
  return { value: `${short} ${formatTime(slot.start)}`, label: slot.venue?.name ?? slot.title };
}

/** "Hver uke fra april til september, unntatt juli." */
export function meetUpSummary(months: MeetUpMonth[]): string {
  const on = months.filter((m) => m.state === "on");
  if (!on.length) return "";
  // The season can run over New Year (November to March): it starts at an active month whose month before is not part of it.
  const inSeason = (m: number) => months[m - 1].state !== "off";
  const startMonth = on.find((m) => !inSeason(((m.month + 10) % 12) + 1))?.month ?? on[0].month;
  const endMonth = [...on].reverse().find((m) => !inSeason((m.month % 12) + 1))?.month ?? on.at(-1)!.month;
  const first = MONTH_NAMES[startMonth - 1];
  const last = MONTH_NAMES[endMonth - 1];
  const breaks = months.filter((m) => m.state === "break").map((m) => MONTH_NAMES[m.month - 1]);
  return `Hver uke fra ${first} til ${last}${breaks.length ? `, unntatt ${breaks.join(" og ")}` : ""}.`;
}

/**
 * Where and when to turn up, for a group whose year is one simple rhythm
 * (OrgNode.simpleSchedule): a card per meeting point with its days and its
 * clock set large, and the months it runs as one strip. It replaces the
 * season summary and the weekly plan, which say the same thing at length —
 * someone deciding whether to come along needs a place, a time and a month.
 */
export function MeetUpPlan({ slots, months, today, children }: { slots: MeetUpSlot[]; months: MeetUpMonth[]; today?: string; children?: ReactNode }) {
  return (
    <div>
      <div className="grid gap-[var(--grid-gap)] md:grid-cols-2">
        {slots.map((slot) => (
          <article key={slot.key} className="overflow-hidden rounded-lg bg-surface shadow-card ring-1 ring-line">
            {slot.photo && <Photo photo={slot.photo} ratio={16 / 9} sizes="(min-width: 1024px) 420px, 100vw" />}
            <div className="p-5 sm:p-6">
              <p className="t-eyebrow">{slot.title}</p>
              <p className="mt-2 font-display text-[1.625rem] leading-[1.1] font-medium tracking-[-0.013em] text-ink">{days(slot.weekdays)}</p>
              <p className="mt-1 font-display text-[2.5rem] leading-none font-medium tracking-[-0.019em] text-club">kl. {formatTime(slot.start)}</p>
              {slot.venue && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-[15px] font-semibold text-ink">{slot.venue.name}</p>
                  <p className="t-small text-ink-3">{slot.venue.area}</p>
                  <a
                    href={mapUrl(slot.venue.mapQuery)}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover"
                  >
                    Veibeskrivelse <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      <MonthStrip months={months} today={today} className="mt-8" />
      {/* What follows the months: «Om vinteren» (where the riders go out of season) belongs right under the strip that shows the gap. */}
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}

/**
 * An out-of-season month is a faint block of the text colour, not the «sunken» surface: the strip sits on white and on the sunken grey
 * alike (and on dark), and a block in the sunken grey vanishes on the sunken ground.
 */
const OFF_BLOCK = "bg-ink/[0.08]";

/**
 * The months a group runs as one sentence and a strip of twelve: green where it meets, hatched for a pause inside the season.
 * With `today` (an ISO date, the site's own «i dag», not the browser's), a small green dot blinks in the current month, so
 * «now» can be found in the strip at a glance; with reduced motion it stays lit and does not blink.
 */
export function MonthStrip({ months, today, className }: { months: MeetUpMonth[]; today?: string; className?: string }) {
  const summary = meetUpSummary(months);
  if (!summary) return null;
  const current = today ? Number(today.slice(5, 7)) : undefined;
  return (
    <div className={className}>
          <p className="t-body font-medium text-ink">{summary}</p>
          {/* The sentence above says it in words, so the strip is only a picture: a screen reader would read twelve near-identical lines. */}
          <ol aria-hidden className="mt-3 grid grid-cols-12 gap-1">
            {months.map((m) => (
              <li key={m.month} className="min-w-0 text-center">
                <span
                  aria-hidden
                  title={m.month === current ? [`Nå: ${MONTH_NAMES[m.month - 1]}`, m.label].filter(Boolean).join(". ") : m.label}
                  className={cn(
                    "relative block h-6 rounded-[2px]",
                    // A hairline of the darkened tint, so the yellow block has an edge on white and on dark alike.
                    m.state === "on" && "bg-club-surface ring-1 ring-black/15 ring-inset",
                    m.state === "off" && OFF_BLOCK,
                    m.state === "break" &&
                      `${OFF_BLOCK} bg-[repeating-linear-gradient(111.25deg,transparent_0_5px,var(--border-strong)_5px_6px)]`,
                  )}
                >
                  {m.month === current && <span className="now-dot absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-success ring-2 ring-surface" />}
                </span>
                <span className={cn("mt-1.5 block truncate t-meta", m.state === "on" ? "font-semibold text-ink" : "text-ink-3")}>
                  {MONTHS[m.month - 1]}
                </span>
              </li>
            ))}
          </ol>
          {months.some((m) => m.state === "break" && m.label) && (
            <p className="mt-2 flex items-center gap-2 t-small text-ink-3">
              <span aria-hidden className="inline-block size-3 rounded-[1px] bg-ink/[0.08] bg-[repeating-linear-gradient(111.25deg,transparent_0_2px,var(--border-strong)_2px_3px)]" />
              {months
                .filter((m) => m.state === "break" && m.label)
                .map((m) => `${upperFirst(MONTH_NAMES[m.month - 1])}: ${m.label}`)
                .join(" · ")}
            </p>
          )}
    </div>
  );
}
