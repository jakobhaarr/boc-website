import { ArrowUpRight } from "lucide-react";
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

/** "Hver uke fra april til september, unntatt juli." */
export function meetUpSummary(months: MeetUpMonth[]): string {
  const on = months.filter((m) => m.state === "on");
  if (!on.length) return "";
  const first = MONTH_NAMES[on[0].month - 1];
  const last = MONTH_NAMES[on.at(-1)!.month - 1];
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
export function MeetUpPlan({ slots, months }: { slots: MeetUpSlot[]; months: MeetUpMonth[] }) {
  const summary = meetUpSummary(months);
  return (
    <div>
      <div className="grid gap-[var(--grid-gap)] md:grid-cols-2">
        {slots.map((slot) => (
          <article key={slot.key} className="overflow-hidden rounded-lg bg-surface shadow-card ring-1 ring-line">
            {slot.photo && <Photo photo={slot.photo} ratio={16 / 9} sizes="(min-width: 1024px) 420px, 100vw" />}
            <div className="p-5 sm:p-6">
              <p className="t-eyebrow">{slot.title}</p>
              <p className="mt-2 font-display text-[1.625rem] leading-[1.1] font-medium tracking-[-0.022em] text-ink">{days(slot.weekdays)}</p>
              <p className="mt-1 font-display text-[2.5rem] leading-none font-medium tracking-[-0.03em] text-club">kl. {formatTime(slot.start)}</p>
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

      {summary && (
        <div className="mt-8">
          <p className="t-body font-medium text-ink">{summary}</p>
          <ol aria-label="Måneder med fellestrening" className="mt-3 grid grid-cols-12 gap-1">
            {months.map((m) => (
              <li key={m.month} className="min-w-0 text-center">
                <span
                  aria-hidden
                  title={m.label}
                  className={cn(
                    "block h-9 rounded-[2px]",
                    m.state === "on" && "bg-club-surface",
                    m.state === "off" && "bg-sunken",
                    m.state === "break" &&
                      "bg-sunken bg-[repeating-linear-gradient(111.25deg,transparent_0_5px,var(--border-strong)_5px_6px)]",
                  )}
                />
                <span className={cn("mt-1.5 block truncate t-meta", m.state === "on" ? "font-semibold text-ink" : "text-ink-3")}>
                  {MONTHS[m.month - 1]}
                </span>
                <span className="sr-only">
                  {MONTH_NAMES[m.month - 1]}: {m.state === "on" ? "fellestrening" : (m.label ?? "ingen fellestrening")}
                </span>
              </li>
            ))}
          </ol>
          {months.some((m) => m.state === "break" && m.label) && (
            <p className="mt-2 flex items-center gap-2 t-small text-ink-3">
              <span aria-hidden className="inline-block size-3 rounded-[1px] bg-sunken bg-[repeating-linear-gradient(111.25deg,transparent_0_2px,var(--border-strong)_2px_3px)]" />
              {months
                .filter((m) => m.state === "break" && m.label)
                .map((m) => `${upperFirst(MONTH_NAMES[m.month - 1])}: ${m.label}`)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
