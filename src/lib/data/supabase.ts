import type { Overrides } from "./overrides";

/**
 * Admin's changes, one row per club, in Supabase over its REST API (plain
 * fetch, no client package). Server-side only: the service-role key never
 * reaches the browser. Without SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * the store keeps everything in memory, as before.
 *
 * Table (run once in Supabase's SQL editor):
 *
 *   create table club_overrides (
 *     club_id text primary key,
 *     version integer not null default 1,
 *     data jsonb not null,
 *     updated_at timestamptz not null default now()
 *   );
 *   alter table club_overrides enable row level security;
 *
 * Row level security with no policies keeps the table closed to the public
 * keys; the service-role key bypasses it.
 *
 * `version` is compared on every write, so two admins saving at once cannot
 * silently overwrite each other: the second write finds a newer version and
 * the store reloads and applies its change again.
 */

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const persistent = () => !!(url && key);

const headers = () => ({
  apikey: key!,
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
});

const table = `${url}/rest/v1/club_overrides`;

export async function readOverrides(clubId: string): Promise<{ version: number; data: Overrides } | null> {
  const res = await fetch(`${table}?club_id=eq.${encodeURIComponent(clubId)}&select=version,data`, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Supabase: kunne ikke lese (${res.status})`);
  const rows = (await res.json()) as { version: number; data: Overrides }[];
  return rows[0] ?? null;
}

/** The stored version alone, for the pages that poll for changes. */
export async function readVersion(clubId: string): Promise<number> {
  const res = await fetch(`${table}?club_id=eq.${encodeURIComponent(clubId)}&select=version`, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Supabase: kunne ikke lese (${res.status})`);
  return ((await res.json()) as { version: number }[])[0]?.version ?? 0;
}

/** Writes when the stored version is still `expected` (0: no row yet). False when someone else saved first. */
export async function writeOverrides(clubId: string, data: Overrides, expected: number): Promise<boolean> {
  const body = JSON.stringify({ club_id: clubId, data, version: expected + 1, updated_at: new Date().toISOString() });
  const res =
    expected === 0
      ? await fetch(table, { method: "POST", headers: { ...headers(), Prefer: "return=representation" }, body })
      : await fetch(`${table}?club_id=eq.${encodeURIComponent(clubId)}&version=eq.${expected}`, {
          method: "PATCH",
          headers: { ...headers(), Prefer: "return=representation" },
          body,
        });
  if (res.status === 409) return false;
  if (!res.ok) throw new Error(`Supabase: kunne ikke lagre (${res.status})`);
  return ((await res.json()) as unknown[]).length === 1;
}

export async function deleteOverrides(clubId: string): Promise<void> {
  const res = await fetch(`${table}?club_id=eq.${encodeURIComponent(clubId)}`, { method: "DELETE", headers: headers() });
  if (!res.ok) throw new Error(`Supabase: kunne ikke slette (${res.status})`);
}

/* ─── Portraits (Supabase Storage) ──────────────────────────────────────── */

const BUCKET = "portraits";

/**
 * Stores an uploaded portrait and returns its public address. The bucket is
 * public (the site shows portraits, with consent) and is created on the
 * first upload; file names are random, so an address cannot be guessed.
 */
export async function uploadPortrait(bytes: Uint8Array, contentType: string, name: string): Promise<string> {
  const put = () =>
    fetch(`${url}/storage/v1/object/${BUCKET}/${name}`, {
      method: "POST",
      headers: { apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": contentType, "x-upsert": "true" },
      body: bytes as unknown as BodyInit,
    });
  let res = await put();
  if (!res.ok && /bucket not found/i.test(await res.clone().text())) {
    const made = await fetch(`${url}/storage/v1/bucket`, { method: "POST", headers: headers(), body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }) });
    if (!made.ok && made.status !== 409) throw new Error(`Supabase: kunne ikke opprette lagring for bilder (${made.status})`);
    res = await put();
  }
  if (!res.ok) throw new Error(`Supabase: kunne ikke laste opp bildet (${res.status})`);
  return `${url}/storage/v1/object/public/${BUCKET}/${name}`;
}

/**
 * Deletes a file this site uploaded, given the public address `uploadPortrait`
 * returned. Anything else (a data address, another host) is left alone. Used
 * when a picture is replaced or removed, so the old file does not stay in a
 * public bucket after the person has taken it down.
 */
export async function removeUpload(src: string): Promise<void> {
  const prefix = `${url}/storage/v1/object/public/${BUCKET}/`;
  if (!url || !key || !src.startsWith(prefix)) return;
  const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${src.slice(prefix.length)}`, { method: "DELETE", headers: headers() }).catch(() => undefined);
  if (res && !res.ok) console.error("[storage] kunne ikke slette filen", res.status);
}
