import { parseSheet, TRIP } from "./trip-signup";
import type { TripSignup } from "./types";

/**
 * The club's own sheet («Mallorca 2027», Google Sheets) as the list of who has signed up. New sign-ups from the form are
 * written to it, and it is read back on every page that shows the list, so what the club edits in the sheet shows on the site.
 *
 * Set up in the environment (all three optional; without them the list is the site's own):
 *  - TRIP_SHEET_URL: the sheet's link, shared so that everyone with the link can view it (read as tab-separated text).
 *  - TRIP_SHEET_WEBHOOK: the address of a small Google Apps Script web app that adds a row to the sheet (docs/mallorca-regneark-script.gs).
 *  - TRIP_SHEET_SECRET: the secret the script checks, so only the site can add rows.
 *
 * The sheet is read as is, by position (WhatsApp, Navn, Ankommer, Retur, Tlf, Mail, rom, bor sammen med, sykkel, pårørende,
 * kontakttelefon: see `parseSheet`). Rows that came from the form and are in the sheet now are shown once, with what the form
 * knew (whether the name may be shown, the note).
 */

export type TripSignupView = TripSignup & {
  /** The row is in the sheet (and is edited or removed there, not on the site). */
  inSheet: boolean;
};

const sheetUrl = () => process.env.TRIP_SHEET_URL?.trim();
export const sheetConfigured = () => !!sheetUrl();
export const sheetWritable = () => !!(process.env.TRIP_SHEET_WEBHOOK && process.env.TRIP_SHEET_SECRET);

type Sheet = ReturnType<typeof parseSheet>;
let lastGood: { at: number; sheet: Pick<Sheet, "rows" | "info"> } | null = null;

/** The sheet's people and its information lines, kept for a minute; if the sheet cannot be read, the last good copy, or nothing. */
async function readSheet(): Promise<Pick<Sheet, "rows" | "info">> {
  const none = { rows: [], info: [] };
  const link = sheetUrl();
  if (!link) return none;
  if (lastGood && Date.now() - lastGood.at < 60_000) return lastGood.sheet;
  const m = link.match(/^https:\/\/docs\.google\.com\/spreadsheets\/d\/([\w-]{20,})/);
  if (!m) return none;
  const gid = link.match(/[#&?]gid=(\d{1,12})/)?.[1] ?? "0";
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${m[1]}/export?format=tsv&gid=${gid}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok || /text\/html/.test(res.headers.get("content-type") ?? "")) throw new Error(`status ${res.status}`);
    const { rows, info } = parseSheet((await res.text()).slice(0, 400_000));
    lastGood = { at: Date.now(), sheet: { rows, info } };
    return lastGood.sheet;
  } catch (error) {
    console.error("[mallorca] kunne ikke lese regnearket", error instanceof Error ? error.message : error);
    return lastGood?.sheet ?? none;
  }
}

export const readSheetRows = async () => (await readSheet()).rows;

/** Lines in the sheet that tell the participants something (a discount, a reminder) and are not people. Shown under the list, never counted. */
export const readSheetInfo = async () => (await readSheet()).info;

const key = (s: { name: string; email: string }) => (s.email ? s.email.toLowerCase() : s.name.trim().toLocaleLowerCase("nb"));
const dd = (iso: string) => iso.split("-").reverse().join(".");

/** Adds the sign-up to the sheet through the Apps Script web app. False when it is not set up or the call failed; the sign-up is kept on the site either way. */
export async function appendToSheet(s: Omit<TripSignup, "id" | "createdAt" | "tripId">): Promise<boolean> {
  const url = process.env.TRIP_SHEET_WEBHOOK?.trim();
  const secret = process.env.TRIP_SHEET_SECRET?.trim();
  if (!url || !secret) return false;
  const row = [
    "",
    s.name,
    dd(s.arrival),
    dd(s.departure),
    s.phone,
    s.email,
    s.room === "single" ? "Enkeltrom" : "Dobbeltrom",
    s.room === "double" ? (s.shareWith ?? "") : "",
    s.bike === "rent" ? "Leie" : "Egen",
    s.nextOfKinName,
    s.nextOfKinPhone,
  ];
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secret, row }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const body = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (!res.ok || !body?.ok) throw new Error(`status ${res.status}`);
    lastGood = null; // the next read picks the new row up
    return true;
  } catch (error) {
    console.error("[mallorca] kunne ikke skrive til regnearket", error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Everyone signed up: the sheet's rows in the sheet's order, each replaced by the site's own record of the same person
 * (same e-mail address, or the same name when there is none) so what only the form knows is kept; then the site's own
 * sign-ups that are not in the sheet (written there later, or the sheet is not set up).
 */
export async function allSignups(db: { tripSignups: TripSignup[] }): Promise<TripSignupView[]> {
  const own = db.tripSignups.filter((s) => s.tripId === TRIP.id);
  const sheet = await readSheetRows();
  const used = new Set<string>();
  const out: TripSignupView[] = sheet.map((r, i) => {
    const mine = own.find((o) => key(o) === key(r));
    if (mine) used.add(mine.id);
    // Those who signed up before the site took sign-ups (and the ones imported from the sheet) are put at TRIP.baselineAt.
    return mine
      ? { ...mine, createdAt: mine.imported ? TRIP.baselineAt : mine.createdAt, inSheet: true }
      : { ...r, id: `sheet-${i}`, tripId: TRIP.id, createdAt: TRIP.baselineAt, inSheet: true };
  });
  for (const o of own) if (!used.has(o.id)) out.push({ ...o, createdAt: o.imported ? TRIP.baselineAt : o.createdAt, inSheet: false });
  // Oldest first; the sheet's own order is kept among those with the same time.
  return out
    .map((r, i) => ({ r, i }))
    .sort((a, b) => a.r.createdAt.localeCompare(b.r.createdAt) || a.i - b.i)
    .map((x) => x.r);
}
