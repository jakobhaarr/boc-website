import type { ClockTime, ISODate, LocalDateTime } from "./types";

/**
 * All club dates are wall-clock values in Europe/Oslo. Calendar maths is done
 * on UTC midnights so results never depend on the server or browser zone.
 */

const CLUB_TZ = "Europe/Oslo";

function partsInClubZone(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CLUB_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

export function todayISO(now = new Date()): ISODate {
  return partsInClubZone(now).date;
}

export function nowLocal(now = new Date()): LocalDateTime {
  const p = partsInClubZone(now);
  return `${p.date}T${p.time}`;
}

function utc(iso: ISODate): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** a − b in whole days. */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((utc(a).getTime() - utc(b).getTime()) / 86_400_000);
}

/** 1 = Monday … 7 = Sunday */
export function weekdayOf(iso: ISODate): number {
  const w = utc(iso).getUTCDay();
  return w === 0 ? 7 : w;
}

/** Next date with the given weekday, strictly after `from`. */
export function nextWeekday(from: ISODate, weekday: number): ISODate {
  let n = (weekday - weekdayOf(from) + 7) % 7;
  if (n === 0) n = 7;
  return addDays(from, n);
}

export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, 1 - weekdayOf(iso));
}

/** ISO week number, used for "Uke 38" labels. */
export function isoWeek(iso: ISODate): number {
  const d = utc(iso);
  const day = weekdayOf(iso);
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

const nb = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("nb-NO", { ...opts, timeZone: "UTC" });

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const WEEKDAYS = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"] as const;
export const WEEKDAYS_SHORT = ["man", "tir", "ons", "tor", "fre", "lør", "søn"] as const;

export function weekdayName(weekday: number, plural = false): string {
  const name = WEEKDAYS[weekday - 1];
  return plural ? `${name}er` : name;
}

/** "tirsdag" */
export function formatWeekday(iso: ISODate): string {
  return WEEKDAYS[weekdayOf(iso) - 1];
}

/** "tir" */
export function formatWeekdayShort(iso: ISODate): string {
  return WEEKDAYS_SHORT[weekdayOf(iso) - 1];
}

/** "15. september" */
export function formatDayMonth(iso: ISODate): string {
  return nb({ day: "numeric", month: "long" }).format(utc(iso));
}

/** "15. sep" */
export function formatDayMonthShort(iso: ISODate): string {
  return nb({ day: "numeric", month: "short" }).format(utc(iso)).replace(".", "").replace(/\.$/, "");
}

/** "sep" */
export function formatMonthShort(iso: ISODate): string {
  return nb({ month: "short" }).format(utc(iso)).replace(".", "");
}

export function dayOfMonth(iso: ISODate): number {
  return utc(iso).getUTCDate();
}

/** "tirsdag 15. september" */
export function formatDateLong(iso: ISODate): string {
  return `${formatWeekday(iso)} ${formatDayMonth(iso)}`;
}

/** "september 2026" */
export function formatMonthYear(iso: ISODate): string {
  return nb({ month: "long", year: "numeric" }).format(utc(iso));
}

/** "15. september 2026" */
export function formatDateFull(iso: ISODate): string {
  return nb({ day: "numeric", month: "long", year: "numeric" }).format(utc(iso));
}

/** "I dag", "I morgen", "I går", otherwise "Torsdag". */
export function relativeDay(iso: ISODate, today: ISODate): string {
  const diff = diffDays(iso, today);
  if (diff === 0) return "I dag";
  if (diff === 1) return "I morgen";
  if (diff === -1) return "I går";
  return capitalise(formatWeekday(iso));
}

/** Day heading used in activity lists: "I dag · tirsdag 15. september" */
export function dayHeading(iso: ISODate, today: ISODate): { primary: string; secondary: string } {
  const diff = diffDays(iso, today);
  if (diff >= -1 && diff <= 1) return { primary: relativeDay(iso, today), secondary: formatDateLong(iso) };
  const withinYear = Math.abs(diff) < 300;
  return {
    primary: capitalise(formatWeekday(iso)),
    secondary: withinYear ? formatDayMonth(iso) : formatDateFull(iso),
  };
}

/** Norwegian clock notation: "18.00" */
export function formatTime(t: ClockTime): string {
  return t.replace(":", ".");
}

/** `approx` for a session whose exact start is settled in Spond: "ca. 09.00–12.00". */
export function formatTimeRange(start: ClockTime, end?: ClockTime, approx?: boolean): string {
  const range = end ? `${formatTime(start)}–${formatTime(end)}` : formatTime(start);
  return approx ? `ca. ${range}` : range;
}

/** "for 3 timer siden", "i går", "for 5 dager siden", "12. august" */
export function relativeTime(at: LocalDateTime, now: LocalDateTime): string {
  const days = diffDays(now.slice(0, 10), at.slice(0, 10));
  if (days === 0) {
    const [h1, m1] = at.slice(11, 16).split(":").map(Number);
    const [h2, m2] = now.slice(11, 16).split(":").map(Number);
    const minutes = h2 * 60 + m2 - (h1 * 60 + m1);
    if (minutes < 2) return "akkurat nå";
    if (minutes < 60) return `for ${minutes} minutter siden`;
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? "for en time siden" : `for ${hours} timer siden`;
  }
  if (days === 1) return "i går";
  if (days < 7) return `for ${days} dager siden`;
  if (days < 300) return formatDayMonth(at.slice(0, 10));
  return formatDateFull(at.slice(0, 10));
}

export function minutesOf(t: ClockTime): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
