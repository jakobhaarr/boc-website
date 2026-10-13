import type { Club, ISODate } from "./types";

type Stats = NonNullable<Club["grasrotandelenStats"]>;

/**
 * The club's running Grasrotandelen total and number of givers, read from
 * Norsk Tipping's own recipient page's data source:
 *
 *   https://api.norsk-tipping.no/Charity/v2/api/statistics?orgId=<orgnr>
 *
 * It is the JSON that norsk-tipping.no/grasrotandelen/mottaker/<orgnr> draws
 * its figures from. It is not a documented API, so nothing here may depend on
 * it: any failure (offline, a changed shape, a slow answer) gives back the
 * figures in the seed (`Club.grasrotandelenStats`) unchanged, with their own
 * date.
 *
 * Method: the newest entry in `statistics` is the current year. Its `amount`
 * is the sum of the year's periods so far, rounded here to whole kroner, and
 * its `numberOfPersons` is the number of givers in the latest period, the
 * same two numbers the recipient page shows as «generert hittil i år» and
 * «grasrotgivere». Norsk Tipping updates the current period per the previous
 * day, so the date shown is yesterday's. The answer is kept for an hour.
 */
export async function grasrotStats(orgNumber: string | undefined, fallback: Stats | undefined, today: ISODate): Promise<Stats | undefined> {
  if (!orgNumber || !/^\d{9}$/.test(orgNumber)) return fallback;
  try {
    const res = await fetch(`https://api.norsk-tipping.no/Charity/v2/api/statistics?orgId=${orgNumber}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return fallback;
    const body = (await res.json()) as { statistics?: { year?: unknown; amount?: unknown; numberOfPersons?: unknown }[] };
    const latest = body.statistics?.at(-1);
    if (!latest || typeof latest.year !== "number" || typeof latest.amount !== "number" || typeof latest.numberOfPersons !== "number") return fallback;
    // Only the current year's running figure is «hittil i år»; if Norsk Tipping has not started the new year, keep the seed's.
    if (latest.year !== Number(today.slice(0, 4))) return fallback;
    const yesterday = new Date(Date.parse(`${today}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10) as ISODate;
    return { year: latest.year, amountNok: Math.round(latest.amount), givers: latest.numberOfPersons, asOf: yesterday };
  } catch {
    return fallback;
  }
}
