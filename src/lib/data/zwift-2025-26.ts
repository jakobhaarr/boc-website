/**
 * The Zwift group's season 2025/26, for its presentation
 * (/presentasjon/zwift-2025-26).
 *
 * Sources, both exported by the group lead:
 *   · riders per session — the participants Zwift Companion recorded in each
 *     Meetup, 15 October 2025 – 11 March 2026 (39 sessions). Companion counts
 *     who actually rode, which is more than Spond's attendance: fewer riders
 *     kept marking themselves present in Spond as the winter went on.
 *   · different riders — only Spond's attendance carries names, so the number
 *     of different riders over those sessions (40) is Spond's, and a minimum.
 * Only counts are kept here; no rider is named.
 *
 * Derived (computed below, not typed in):
 *   total    = Σ riders over the sessions
 *   average  = total / sessions
 *   median   = middle value of the sorted counts
 *   weekday  = average per Monday and per Wednesday session
 *   months   = average per session in each calendar month
 */

export const ZWIFT_2025_26_SESSIONS: { date: string; riders: number }[] = [
  { date: "2025-10-15", riders: 10 },
  { date: "2025-10-20", riders: 10 },
  { date: "2025-10-22", riders: 12 },
  { date: "2025-10-27", riders: 15 },
  { date: "2025-10-29", riders: 11 },
  { date: "2025-11-03", riders: 12 },
  { date: "2025-11-05", riders: 11 },
  { date: "2025-11-10", riders: 14 },
  { date: "2025-11-12", riders: 7 },
  { date: "2025-11-17", riders: 12 },
  { date: "2025-11-19", riders: 13 },
  { date: "2025-11-24", riders: 15 },
  { date: "2025-11-26", riders: 13 },
  { date: "2025-12-01", riders: 20 },
  { date: "2025-12-03", riders: 8 },
  { date: "2025-12-08", riders: 17 },
  { date: "2025-12-10", riders: 13 },
  { date: "2025-12-15", riders: 7 },
  { date: "2025-12-17", riders: 8 },
  { date: "2026-01-05", riders: 12 },
  { date: "2026-01-07", riders: 12 },
  { date: "2026-01-12", riders: 13 },
  { date: "2026-01-14", riders: 9 },
  { date: "2026-01-19", riders: 12 },
  { date: "2026-01-21", riders: 12 },
  { date: "2026-01-26", riders: 14 },
  { date: "2026-01-28", riders: 9 },
  { date: "2026-02-02", riders: 15 },
  { date: "2026-02-04", riders: 9 },
  { date: "2026-02-09", riders: 14 },
  { date: "2026-02-11", riders: 8 },
  { date: "2026-02-16", riders: 10 },
  { date: "2026-02-18", riders: 9 },
  { date: "2026-02-23", riders: 9 },
  { date: "2026-02-25", riders: 9 },
  { date: "2026-03-02", riders: 14 },
  { date: "2026-03-04", riders: 9 },
  { date: "2026-03-09", riders: 8 },
  { date: "2026-03-11", riders: 8 },
];

/** Different riders over the same sessions, from Spond — a minimum. */
export const ZWIFT_2025_26_RIDERS_AT_LEAST = 40;

const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export function zwiftSeasonStats(sessions = ZWIFT_2025_26_SESSIONS) {
  const counts = sessions.map((s) => s.riders);
  const sorted = [...counts].sort((a, b) => a - b);
  const peak = sessions.reduce((best, s) => (s.riders > best.riders ? s : best));
  const byMonth = new Map<string, number[]>();
  for (const s of sessions) byMonth.set(s.date.slice(0, 7), [...(byMonth.get(s.date.slice(0, 7)) ?? []), s.riders]);
  return {
    sessions: sessions.length,
    first: sessions[0].date,
    last: sessions.at(-1)!.date,
    total: counts.reduce((a, b) => a + b, 0),
    average: mean(counts),
    median: sorted[Math.floor(sorted.length / 2)],
    peak,
    monday: mean(sessions.filter((s) => weekday(s.date) === 1).map((s) => s.riders)),
    wednesday: mean(sessions.filter((s) => weekday(s.date) === 3).map((s) => s.riders)),
    months: [...byMonth].map(([month, xs]) => ({ month, average: mean(xs) })),
    ridersAtLeast: ZWIFT_2025_26_RIDERS_AT_LEAST,
  };
}
