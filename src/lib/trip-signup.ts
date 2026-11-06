import type { ISODate, TripSignup } from "./types";

/**
 * The sign-up for the club trip to Mallorca (/mallorca/pamelding). One trip at a time, set here: the dates, the rooms and the
 * prices are the ones the Landevei group announced (October 2026): Mallorca 14–21 March 2027, 40 rooms (45 first announced), 58 euro per person
 * in a double room and 68 euro in a single room, half board included, for members of the club (membership must be in place before the trip), binding when the
 * invoice (sent in December) is paid. Change them here when the next trip comes. Everything a person writes is kept in
 * `Db.tripSignups` and read only by those who run the sign-up (`canSeeSignups`, lib/permissions.ts), under /admin/mallorca.
 */
export const TRIP = {
  id: "mallorca-2027-var",
  title: "Mallorca med BOC",
  from: "2027-03-14" as ISODate,
  to: "2027-03-21" as ISODate,
  rooms: 40,
  priceDouble: 58,
  priceSingle: 68,
  /** Arrival and return can differ from the week, but not by more than this many days. */
  slackDays: 5,
  /** Most sign-ups kept, a guard against a flood. */
  max: 300,
  open: true,
  /**
   * Rooms the club counts as taken that are not in the sign-up list (November 2026: the club says 30 are taken, the sheet
   * gives 27 by the rule in `roomsTaken`, with the sheet's information line left out). Set it back to 0 when the list is complete.
   */
  roomsOutsideList: 3,
  /** The club's own count of rooms taken (30 in November 2026), shown only while there is no list at all to count from. */
  roomsKnownTaken: 30,
  /** When the sign-ups that came before the site took them (the sheet's rows, the imported ones) are said to have been made. */
  baselineAt: "2026-11-01T00:00",
};

export const ROOM_LABEL: Record<TripSignup["room"], string> = { single: "Enkeltrom", double: "Dobbeltrom" };
export const BIKE_LABEL: Record<TripSignup["bike"], string> = { own: "Egen sykkel", rent: "Leier sykkel" };

export interface TripSignupInput {
  name: string;
  email: string;
  phone: string;
  arrival: string;
  departure: string;
  room: string;
  shareWith: string;
  bike: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  note: string;
  /** The member's own confirmation that they know they must be a member before the trip and that the sign-up is binding. */
  confirmMember: boolean;
  confirmBinding: boolean;
  /** May the name stand in the public list of participants. */
  listed: boolean;
  /** Hidden field: only a program fills it in. */
  website?: string;
}

const addDays = (d: ISODate, n: number): ISODate => new Date(Date.parse(`${d}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
/** Six to fifteen digits, with a leading + and spaces allowed. */
const phoneOk = (v: string) => /^\+?[\d\s]{6,20}$/.test(v) && v.replace(/\D/g, "").length >= 6 && v.replace(/\D/g, "").length <= 15;

export const earliest = () => addDays(TRIP.from, -TRIP.slackDays);
export const latest = () => addDays(TRIP.to, TRIP.slackDays);

export function validateTripSignup(input: TripSignupInput): { ok: true; trap: boolean; value: Omit<TripSignup, "id" | "createdAt" | "tripId"> } | { ok: false; error: string } {
  const t = (v: unknown, max: number) => String(v ?? "").trim().replace(/\s+/g, " ").slice(0, max);
  const name = t(input.name, 100);
  const email = t(input.email, 200).toLowerCase();
  const phone = t(input.phone, 30);
  const nextOfKinName = t(input.nextOfKinName, 100);
  const nextOfKinPhone = t(input.nextOfKinPhone, 30);
  if (name.split(" ").length < 2) return { ok: false, error: "Skriv fornavn og etternavn." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Skriv en gyldig e-postadresse." };
  if (!phoneOk(phone)) return { ok: false, error: "Skriv et gyldig telefonnummer." };
  if (!isDate(input.arrival) || !isDate(input.departure)) return { ok: false, error: "Velg ankomst og retur." };
  if (input.arrival > input.departure) return { ok: false, error: "Returen kan ikke være før ankomsten." };
  if (input.arrival < earliest() || input.departure > latest()) return { ok: false, error: "Ankomst og retur må ligge nær turuka." };
  if (input.room !== "single" && input.room !== "double") return { ok: false, error: "Velg enkeltrom eller dobbeltrom." };
  if (input.bike !== "own" && input.bike !== "rent") return { ok: false, error: "Velg om du tar med egen sykkel eller leier." };
  if (!nextOfKinName) return { ok: false, error: "Skriv navnet til nærmeste pårørende." };
  if (!phoneOk(nextOfKinPhone)) return { ok: false, error: "Skriv telefonnummeret til nærmeste pårørende." };
  if (!input.confirmMember) return { ok: false, error: "Turen er for medlemmer av BOC. Bekreft at du vet at du må være medlem før turen." };
  if (!input.confirmBinding) return { ok: false, error: "Bekreft at påmeldingen er bindende når fakturaen er betalt." };
  const shareWith = input.room === "double" ? t(input.shareWith, 100) : "";
  const note = t(input.note, 500);
  return { ok: true, trap: !!input.website, value: { name, email, phone, arrival: input.arrival, departure: input.departure, room: input.room, shareWith: shareWith || undefined, bike: input.bike, nextOfKinName, nextOfKinPhone, note: note || undefined, listed: !!input.listed } };
}

/* ─── Import from the club's sheet ──────────────────────────────────────── */

/**
 * The columns of the sheet the Landevei group keeps («Mallorca 2027»), in this order, pasted from Google Sheets (tab-separated,
 * with or without the header row): WhatsApp, Navn, Ankomst, Retur, Tlf, Mail, Enkeltrom/dobbeltrom, Bor sammen med,
 * Leie/egen sykkel, Nærmeste pårørende, Kontaktelefon. Written by hand, so read leniently: a date that cannot be read gets the
 * dates of the week and is counted, so the administrator can correct it; a missing address or number is left empty.
 */
export function parseSheet(text: string): { rows: Omit<TripSignup, "id" | "createdAt" | "tripId">[]; datesGuessed: number; skipped: string[]; /** Lines in the sheet that are information for the participants, not people (a discount, a reminder). */ info: string[] } {
  const rows: Omit<TripSignup, "id" | "createdAt" | "tripId">[] = [];
  const skipped: string[] = [];
  const info: string[] = [];
  let datesGuessed = 0;
  const date = (raw: string | undefined, fallback: ISODate): ISODate => {
    const m = String(raw ?? "").trim().match(/^(\d{1,2})[.,/](\d{1,2})\.?(?:[.,/]?(\d{2,4}))?$/);
    if (m) {
      const day = Number(m[1]);
      const month = Number(m[2]);
      let year = m[3] ? Number(m[3]) : 2027;
      if (year < 100) year += 2000;
      const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      if (isDate(iso) && iso >= earliest() && iso <= latest()) return iso;
    }
    datesGuessed += 1;
    return fallback;
  };
  for (const line of text.split(/\r?\n/)) {
    const c = line.split("\t").map((x) => x.trim());
    if (c.every((x) => !x)) continue;
    const name = c[1] ?? "";
    if (/^navn$/i.test(name) || /^whats\s*app$/i.test(c[0] ?? "")) continue;
    // A line of text with nothing else on the row (no dates, number, address or room) is information for the participants, not a person.
    if (c.every((x, i) => i === 1 || !x) && (name.length > 40 || name.split(/\s+/).length >= 5)) {
      info.push(name);
      continue;
    }
    if (!/\p{L}{2}/u.test(name)) {
      skipped.push(line.slice(0, 40));
      continue;
    }
    const roomText = (c[6] ?? "").toLowerCase();
    rows.push({
      name: name.replace(/\s+/g, " "),
      email: (c[5] ?? "").toLowerCase(),
      phone: c[4] ?? "",
      arrival: date(c[2], TRIP.from),
      departure: date(c[3], TRIP.to),
      room: roomText.startsWith("dobbel") ? "double" : "single",
      shareWith: roomText.startsWith("dobbel") && c[7] && !/^(ingen|n\/a|-|0)$/i.test(c[7]) ? c[7] : undefined,
      bike: /^leie/i.test(c[8] ?? "") ? "rent" : "own",
      nextOfKinName: c[9] ?? "",
      nextOfKinPhone: c[10] ?? "",
      listed: true,
      imported: true,
    });
  }
  return { rows, datesGuessed, skipped, info };
}

/** What the public list of participants shows: no contact details, and no name (nor roommate) for someone who did not tick the box. */
export interface PublicSignupRow {
  name: string;
  hidden: boolean;
  arrival: ISODate;
  departure: ISODate;
  room: TripSignup["room"];
  shareWith?: string;
  bike: TripSignup["bike"];
}

export function publicSignups(all: TripSignup[]): PublicSignupRow[] {
  return all
    .filter((s) => s.tripId === TRIP.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((s) => ({ name: s.listed ? s.name : "Navn skjult", hidden: !s.listed, arrival: s.arrival, departure: s.departure, room: s.room, shareWith: s.listed ? s.shareWith : undefined, bike: s.bike }));
}

/**
 * Rooms taken, for the progress ring: every single room; two people in double rooms who name each other («Bor sammen med»
 * on one of them is enough, matched on first name) are one room; a double-room person nobody is matched with keeps a room
 * of their own, since the room is theirs until the club pairs them up; plus `TRIP.roomsOutsideList`.
 */
export function roomsTaken(all: TripSignup[]): number {
  const mine = all.filter((s) => s.tripId === TRIP.id);
  if (!mine.length) return TRIP.roomsKnownTaken;
  const singles = mine.filter((s) => s.room === "single").length;
  const first = (v: string) => v.trim().split(/\s+/)[0]?.toLocaleLowerCase("nb") ?? "";
  const doubles = mine.filter((s) => s.room === "double");
  const used = new Set<string>();
  let rooms = 0;
  for (const a of doubles) {
    if (used.has(a.id)) continue;
    used.add(a.id);
    rooms += 1;
    const mate = doubles.find((b) => !used.has(b.id) && ((a.shareWith && first(a.shareWith) === first(b.name)) || (b.shareWith && first(b.shareWith) === first(a.name))));
    if (mate) used.add(mate.id);
  }
  return singles + rooms + TRIP.roomsOutsideList;
}
