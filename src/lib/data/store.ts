import type { ClubId } from "@/lib/club";
import { todayISO } from "@/lib/dates";
import type { Db } from "@/lib/types";
import { applyOverrides, diffFromSeed } from "./overrides";
import { buildSeed, SEED_REVISION } from "./seed";
import { deleteOverrides, persistent, readOverrides, readVersion, writeOverrides } from "./supabase";

/**
 * The database, one per club: the seed in the code, with admin's changes
 * laid over it (./overrides.ts).
 *
 * Without Supabase configured (local development) the changes live in
 * memory, on globalThis so they survive module re-evaluation in `next dev`,
 * and are gone when the server restarts. With it (./supabase.ts) they are
 * stored there and read back on every request, so every server instance
 * and every deploy sees the same content; the parsed result is cached per
 * instance until the stored version or the day changes.
 *
 * Reading the whole stored row is the expensive part (it is every change made
 * in admin, over a megabyte), and it counts as outgoing data at Supabase, whose
 * free plan allows 5 GB a month. So a request asks only for the version (a few
 * bytes) and fetches the row only when the version is not the one cached; and
 * a copy checked in the last few seconds is used without asking at all.
 */

interface Cached {
  db: Db;
  /** The stored version this copy was built from (0: nothing stored). */
  stored: number;
  day: string;
  /** When the stored version was last asked for, so a burst of requests asks once. */
  checkedAt: number;
}

/** Milliseconds a copy is trusted without asking Supabase whether it is still the latest. Other instances see a change within this. */
const TRUST_MS = 3000;
type Holder = { dbs: Partial<Record<ClubId, Cached>>; revision: string };
const g = globalThis as typeof globalThis & { __klubbStore?: Holder };

function holder(): Holder {
  if (!g.__klubbStore || g.__klubbStore.revision !== SEED_REVISION) {
    g.__klubbStore = { dbs: {}, revision: SEED_REVISION };
  }
  return g.__klubbStore;
}

export async function getDb(clubId: ClubId): Promise<Db> {
  const store = holder();
  const day = todayISO();
  const cached = store.dbs[clubId];

  if (!persistent()) {
    if (!cached || cached.day !== day) store.dbs[clubId] = { db: buildSeed(day, clubId), stored: 0, day, checkedAt: Date.now() };
    return store.dbs[clubId]!.db;
  }

  // A copy of today's content that is still the latest: no need to read the row again.
  if (cached && cached.day === day) {
    if (Date.now() - cached.checkedAt < TRUST_MS) return cached.db;
    try {
      if ((await readVersion(clubId)) === cached.stored) {
        cached.checkedAt = Date.now();
        return cached.db;
      }
    } catch {
      return cached.db;
    }
  }

  // If Supabase cannot be read (a missing table, an outage), the site shows the
  // content in the code rather than failing; saving then fails with a message.
  let row: Awaited<ReturnType<typeof readOverrides>>;
  try {
    row = await readOverrides(clubId);
  } catch (error) {
    console.error("[store] kunne ikke lese fra Supabase, viser innholdet i koden", error);
    if (cached) return cached.db;
    const db = buildSeed(day, clubId);
    db.version = 0;
    return db;
  }
  const stored = row?.version ?? 0;
  if (cached && cached.stored === stored && cached.day === day) {
    cached.checkedAt = Date.now();
    return cached.db;
  }
  const db = row ? applyOverrides(buildSeed(day, clubId), row.data) : buildSeed(day, clubId);
  // Open pages poll `version` to know when to refresh (LiveRefresh).
  db.version = stored;
  store.dbs[clubId] = { db, stored, day, checkedAt: Date.now() };
  return db;
}

/**
 * Apply a change and keep it. With Supabase the change is saved before this
 * returns; if another admin saved in the meantime, the latest content is
 * loaded and the change applied to that instead (up to three tries), so
 * `fn` must only read and write the database it is given.
 */
export async function mutate<T>(clubId: ClubId, fn: (db: Db) => T): Promise<T> {
  if (!persistent()) {
    const db = await getDb(clubId);
    const result = fn(db);
    db.version += 1;
    return result;
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    const db = await getDb(clubId);
    const base = holder().dbs[clubId];
    // Work on a copy, so a failed save leaves the cached content untouched.
    const draft = structuredClone(db);
    const result = fn(draft);
    if (!base) throw new Error("Lagring er ikke tilgjengelig akkurat nå. Endringen ble ikke lagret.");
    const saved = await writeOverrides(clubId, diffFromSeed(buildSeed(base.day, clubId), draft), base.stored);
    if (saved) {
      draft.version = base.stored + 1;
      holder().dbs[clubId] = { db: draft, stored: base.stored + 1, day: base.day, checkedAt: Date.now() };
      return result;
    }
    delete holder().dbs[clubId];
  }
  throw new Error("Innholdet ble endret av noen andre samtidig. Prøv igjen.");
}

/** Back to the seed: every change made in admin is dropped. */
export async function resetDb(clubId: ClubId): Promise<void> {
  const store = holder();
  const previous = store.dbs[clubId]?.db.version ?? 0;
  if (persistent()) await deleteOverrides(clubId);
  const day = todayISO();
  const db = buildSeed(day, clubId);
  db.version = persistent() ? 0 : previous + 1;
  store.dbs[clubId] = { db, stored: 0, day, checkedAt: Date.now() };
}

const versionSeen: Partial<Record<ClubId, { at: number; version: number }>> = {};

/** The version open pages poll for: one small read when stored in Supabase, and not more than one every few seconds however many pages ask. */
export async function currentVersion(clubId: ClubId): Promise<number> {
  if (persistent()) {
    const seen = versionSeen[clubId];
    if (seen && Date.now() - seen.at < TRUST_MS) return seen.version;
    const version = await readVersion(clubId).catch(() => 0);
    versionSeen[clubId] = { at: Date.now(), version };
    return version;
  }
  return (await getDb(clubId)).version;
}
