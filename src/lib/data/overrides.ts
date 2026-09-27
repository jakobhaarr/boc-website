import type { Db } from "@/lib/types";

/**
 * What admin has changed, as the difference from the seed in the code.
 *
 * The seed stays the base, so content changed in the code still reaches the
 * site; only records someone has edited, added or removed in admin are
 * stored, and those win over the code. A record is compared whole (as
 * JSON), by id. The diff is taken against a seed built the same day, since
 * the seed places some dates relative to today, so a record nobody touched
 * never counts as changed and keeps following the code.
 */

const COLLECTIONS = ["themes", "nodes", "venues", "people", "users", "photos", "articles", "series", "activities", "races", "privacyRequests"] as const;
type Collection = (typeof COLLECTIONS)[number];

export interface Overrides {
  club?: Db["club"];
  audit?: Db["audit"];
  collections: Partial<Record<Collection, { upsert: Record<string, unknown>; removed: string[] }>>;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function diffFromSeed(seed: Db, db: Db): Overrides {
  const out: Overrides = { collections: {} };
  if (!same(seed.club, db.club)) out.club = db.club;
  // The log is admin's own; keep the latest entries only.
  if (!same(seed.audit, db.audit)) out.audit = db.audit.slice(0, 300);
  for (const key of COLLECTIONS) {
    const before = new Map((seed[key] as { id: string }[]).map((x) => [x.id, x]));
    const now = db[key] as { id: string }[];
    const upsert: Record<string, unknown> = {};
    for (const item of now) if (!before.has(item.id) || !same(before.get(item.id), item)) upsert[item.id] = item;
    const ids = new Set(now.map((x) => x.id));
    const removed = [...before.keys()].filter((id) => !ids.has(id));
    if (Object.keys(upsert).length || removed.length) out.collections[key] = { upsert, removed };
  }
  return out;
}

/** The seed with admin's changes laid over it: edited records replaced in place, new ones after, removed ones gone. */
export function applyOverrides(seed: Db, overrides: Overrides): Db {
  const db = seed;
  if (overrides.club) db.club = overrides.club;
  if (overrides.audit) db.audit = overrides.audit;
  for (const key of COLLECTIONS) {
    const change = overrides.collections[key];
    if (!change) continue;
    const list = db[key] as { id: string }[];
    const removed = new Set(change.removed);
    const known = new Set(list.map((x) => x.id));
    const merged = list.filter((x) => !removed.has(x.id)).map((x) => (change.upsert[x.id] as { id: string }) ?? x);
    for (const [id, item] of Object.entries(change.upsert)) if (!known.has(id)) merged.push(item as { id: string });
    (db as unknown as Record<Collection, unknown[]>)[key] = merged;
  }
  return db;
}
