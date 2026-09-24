import type { ClubId } from "@/lib/club";
import { addDays, todayISO, weekdayOf } from "@/lib/dates";
import type { Activity, Db, TrainingSeries } from "@/lib/types";
import { activitySeed, seriesSeed } from "./activities";
import { articleSeed } from "./articles";
import { bocSeed } from "./boc";
import { createSeedCtx, type SeedCtx } from "./context";
import { clubSeed, nodeSeed, themeSeed, venueSeed } from "./org";
import { peopleSeed, privacyRequestSeed, userSeed } from "./people";
import { photoSeed } from "./photos";

/**
 * Bump when seed content changes shape, so a running dev server rebuilds
 * the in-memory store instead of serving stale data.
 */
export const SEED_REVISION = "2026-09-20.35";

/**
 * Recurring series are materialised into dated occurrences, each with its own
 * id, so a single session can be cancelled without touching the rule.
 * Occurrence id: `${seriesId}@${date}`.
 */
export function expandSeries(series: TrainingSeries[], windowStart: string, windowEnd: string): Activity[] {
  const out: Activity[] = [];
  for (const s of series) {
    const start = s.from > windowStart ? s.from : windowStart;
    const end = s.to < windowEnd ? s.to : windowEnd;
    let date = addDays(start, (s.weekday - weekdayOf(start) + 7) % 7);
    while (date <= end) {
      const exception = s.exceptions?.find((e) => e.date === date);
      out.push({
        id: `${s.id}@${date}`,
        nodeId: s.nodeId,
        kind: "training",
        title: s.title,
        date,
        start: s.start,
        end: s.end,
        startApprox: s.startApprox,
        venueId: s.venueId,
        locationNote: s.locationNote,
        seriesId: s.id,
        status: exception ? "cancelled" : "scheduled",
        statusNote: exception?.note,
      });
      date = addDays(date, 7);
    }
  }
  return out;
}

/** Oslo Sportsklubb — the multi-sport club. */
function oskSeed(ctx: SeedCtx): Db {
  return {
    version: 1,
    seededOn: ctx.today,
    club: clubSeed(),
    themes: themeSeed(),
    nodes: nodeSeed(ctx),
    venues: venueSeed(),
    people: peopleSeed(ctx),
    users: userSeed(),
    photos: photoSeed(),
    articles: articleSeed(ctx),
    series: seriesSeed(ctx),
    activities: activitySeed(ctx),
    races: [],
    privacyRequests: privacyRequestSeed(ctx),
    audit: [],
  };
}

/**
 * One store per club. Recurring series are expanded into dated occurrences
 * here, so both clubs get the same treatment.
 */
export function buildSeed(today = todayISO(), clubId: ClubId = "osk"): Db {
  const ctx = createSeedCtx(today);
  const db = clubId === "boc" ? bocSeed(ctx) : oskSeed(ctx);
  return { ...db, activities: [...expandSeries(db.series, ctx.d(-35), ctx.d(70)), ...db.activities] };
}
