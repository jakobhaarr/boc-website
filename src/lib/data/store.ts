import type { ClubId } from "@/lib/club";
import { todayISO } from "@/lib/dates";
import type { Db } from "@/lib/types";
import { buildSeed, SEED_REVISION } from "./seed";

/**
 * In-memory mock database, one per club.
 *
 * Lives on globalThis so it survives module re-evaluation in `next dev` and is
 * shared by every route, server action and browser tab talking to this server.
 * State resets when the server restarts (or via the demo reset action).
 *
 * Replace this module with a Supabase client later; everything else talks to
 * the repository functions in ./queries.ts and the actions in app/actions.ts.
 * The club id is what a tenant column would be there.
 */

type Holder = { dbs: Partial<Record<ClubId, Db>>; revision: string };
const g = globalThis as typeof globalThis & { __klubbStore?: Holder };

function holder(): Holder {
  if (!g.__klubbStore || g.__klubbStore.revision !== SEED_REVISION) {
    g.__klubbStore = { dbs: {}, revision: SEED_REVISION };
  }
  return g.__klubbStore;
}

export function getDb(clubId: ClubId): Db {
  const store = holder();
  store.dbs[clubId] ??= buildSeed(todayISO(), clubId);
  return store.dbs[clubId];
}

/** Apply a mutation and bump the version that open pages poll for. */
export function mutate<T>(clubId: ClubId, fn: (db: Db) => T): T {
  const db = getDb(clubId);
  const result = fn(db);
  db.version += 1;
  return result;
}

export function resetDb(clubId: ClubId): void {
  const store = holder();
  const previous = store.dbs[clubId]?.version ?? 0;
  store.dbs[clubId] = buildSeed(todayISO(), clubId);
  store.dbs[clubId].version = previous + 1;
}
