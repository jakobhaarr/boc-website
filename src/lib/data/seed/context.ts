import { addDays, nextWeekday } from "@/lib/dates";
import type { ClockTime, ISODate, LocalDateTime } from "@/lib/types";

/**
 * Seed content is dated relative to the day the store is created, so the
 * prototype always shows "this week" regardless of when it is demoed.
 */
export interface SeedCtx {
  today: ISODate;
  /** The season being seeded — the calendar year of `today`. See lib/seasons.ts. */
  season: number;
  /** Date n days from today. */
  d: (n: number) => ISODate;
  /** Timestamp n days from today at a wall-clock time. */
  at: (n: number, time: ClockTime) => LocalDateTime;
  /** Next occurrence of weekday (1 = Monday), strictly after today. */
  next: (weekday: number) => ISODate;
  /** A fixed date in this season, or in a later one: on(7, 27, 1) is next year's 27 July. */
  on: (month: number, day: number, seasonsAhead?: number) => ISODate;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function createSeedCtx(today: ISODate): SeedCtx {
  const season = Number(today.slice(0, 4));
  return {
    today,
    season,
    d: (n) => addDays(today, n),
    at: (n, time) => `${addDays(today, n)}T${time}`,
    next: (weekday) => nextWeekday(today, weekday),
    on: (month, day, seasonsAhead = 0) => `${season + seasonsAhead}-${pad(month)}-${pad(day)}`,
  };
}
