import { formatDateFull } from "./dates";
import { BIKE_LABEL, ROOM_LABEL, TRIP } from "./trip-signup";
import type { TripSignup } from "./types";

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The confirmation the person gets by e-mail: what they signed up for, and that the invoice comes in December. */
export function tripSignupMail(s: Pick<TripSignup, "name" | "arrival" | "departure" | "room" | "shareWith" | "bike">, clubShortName: string) {
  const price = s.room === "single" ? TRIP.priceSingle : TRIP.priceDouble;
  const rows: [string, string][] = [
    ["Tur", `${TRIP.title}, ${formatDateFull(TRIP.from)} til ${formatDateFull(TRIP.to)}`],
    ["Ankomst", formatDateFull(s.arrival)],
    ["Retur", formatDateFull(s.departure)],
    ["Rom", `${ROOM_LABEL[s.room]}${s.shareWith ? `, sammen med ${s.shareWith}` : ""}`],
    ["Sykkel", BIKE_LABEL[s.bike]],
    ["Pris", `${price} euro per person, halvpensjon inkludert`],
  ];
  const first = s.name.split(" ")[0];
  const text = [
    `Hei ${first}!`,
    "",
    `Vi har mottatt påmeldingen din til ${TRIP.title}.`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "Påmeldingen er bindende når fakturaen er betalt. Fakturaen sendes i desember.",
    "Svar på denne e-posten hvis noe skal endres.",
    "",
    clubShortName,
  ].join("\n");
  const html = `<div style="font-family:Inter,-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;max-width:520px;color:#0b1315;font-size:16px;line-height:24px"><p>Hei ${escapeHtml(first)}!</p><p>Vi har mottatt påmeldingen din til <strong>${escapeHtml(TRIP.title)}</strong>.</p><table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:4px 16px 4px 0;color:#66758a">${escapeHtml(k)}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`)
    .join(
      "",
    )}</table><p>Påmeldingen er bindende når fakturaen er betalt. Fakturaen sendes i desember. Svar på denne e-posten hvis noe skal endres.</p><p>${escapeHtml(clubShortName)}</p></div>`;
  return { subject: `Påmelding til ${TRIP.title} er mottatt`, html, text };
}
