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

const COLLECTIONS = ["themes", "nodes", "venues", "people", "users", "photos", "articles", "series", "activities", "races", "privacyRequests", "privacyContacts", "externals", "consentRequests"] as const;
type Collection = (typeof COLLECTIONS)[number];

export interface Overrides {
  club?: Db["club"];
  audit?: Db["audit"];
  collections: Partial<Record<Collection, { upsert: Record<string, unknown>; removed: string[] }>>;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Collections stored field by field. For groups, venues and weekly sessions an
 * edit stores only the top-level fields that differ from the seed; every other
 * field keeps following the code. A record stored whole by an earlier version
 * is read the same way (the seed under it, its own fields over), so a field
 * added to the seed later reaches the site instead of being hidden by an old
 * copy. This is only safe because admin never removes a field from these
 * records: a cleared text is stored as an empty string, not as a missing key.
 *
 * The other collections (people, articles, activities …) are stored whole,
 * since removing fields is how a person is anonymised.
 */
const FIELDWISE = new Set<Collection>(["nodes", "venues", "series"]);

function patchOf(before: Record<string, unknown>, now: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = { id: now.id };
  for (const key of Object.keys(now)) if (!same(before[key], now[key])) patch[key] = now[key];
  return patch;
}

export function diffFromSeed(seed: Db, db: Db): Overrides {
  const out: Overrides = { collections: {} };
  if (!same(seed.club, db.club)) out.club = db.club;
  // The log is admin's own; keep the latest entries only.
  if (!same(seed.audit, db.audit)) out.audit = db.audit.slice(0, 300);
  for (const key of COLLECTIONS) {
    const before = new Map((seed[key] as { id: string }[]).map((x) => [x.id, x]));
    const now = db[key] as { id: string }[];
    const upsert: Record<string, unknown> = {};
    for (const item of now) {
      const seeded = before.get(item.id);
      if (seeded && same(seeded, item)) continue;
      upsert[item.id] = seeded && FIELDWISE.has(key) ? patchOf(seeded as Record<string, unknown>, item as Record<string, unknown>) : item;
    }
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
    const fieldwise = FIELDWISE.has(key);
    const merged = list
      .filter((x) => !removed.has(x.id))
      .map((x) => {
        const stored = change.upsert[x.id] as { id: string } | undefined;
        if (!stored) return x;
        return fieldwise ? { ...x, ...stored } : stored;
      });
    for (const [id, item] of Object.entries(change.upsert)) if (!known.has(id)) merged.push(item as { id: string });
    (db as unknown as Record<Collection, unknown[]>)[key] = merged;
  }
  return pruneDangling(db);
}

/**
 * A group deleted in admin stays deleted, but the code may still describe
 * things that belong to it (a session, a date, a membership). Whatever points
 * at a group that is not there is dropped, so a page never meets a group id
 * it cannot find.
 */
export function pruneDangling(db: Db): Db {
  const ids = new Set(db.nodes.map((n) => n.id));
  const has = (x: { nodeId: string }) => ids.has(x.nodeId);
  db.series = db.series.filter(has);
  db.activities = db.activities.filter(has);
  db.races = db.races.filter(has);
  db.articles = db.articles.filter(has);
  for (const photo of db.photos) if (!ids.has(photo.nodeId)) photo.nodeId = db.nodes.find((n) => n.parentId === null)?.id ?? photo.nodeId;
  for (const person of db.people) person.memberships = person.memberships.filter(has);
  for (const user of db.users) user.roles = user.roles.filter(has);
  return db;
}
