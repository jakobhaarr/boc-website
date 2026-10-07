import type { ParticipationStep } from "./types";

/**
 * What it takes to ride a ride on the calendar (/sykkelritt): membership in a
 * club and a licence from Norges Cykleforbund (NCF). Written from NCF's own
 * pages (sykling.no/lisens/lisens-fordeler, read October 2026) and its licence
 * table, last updated 14 August 2026. NCF's pages are the ones to trust for
 * prices and rules, and the page says so. Training with the club needs neither.
 */

export const LICENCE_BUY_URL = "https://signup.eqtiming.com/?Event=SykkelLisens";
export const LICENCE_INFO_URL = "https://sykling.no/lisens/lisens-fordeler/";
export const LICENCE_UPDATED = "14. august 2026";

/** NCF's table simplified for the wizard: which kinds of ride each licence allows, without prices (from NCF's table of 14 August 2026). */
const LICENCE_OVERVIEW: NonNullable<ParticipationStep["table"]> = {
  columns: ["Aktive ritt", "NM 17 år+", "Tur", "Trim"],
  rows: [
    { label: "3–12 år", marks: [true, false, false, true] },
    { label: "13–16 år", marks: [true, false, false, true] },
    { label: "17–18 år", marks: [true, true, true, true] },
    { label: "19 år+, tur og trim", marks: [false, false, true, true], emphasis: true },
    { label: "Master 30 år+", marks: [true, false, true, true] },
    { label: "Elite, U23 og proff", marks: [true, true, true, true] },
    { label: "Engangs 17 år+", marks: [false, false, true, true] },
  ],
  note: "De fleste i klubben kjører tur og trim.",
};

/** The steps of «Slik blir du med på ritt», for JoinWizard. `signupUrl` is the club's own membership form in Spond (Club.signupUrl), which step one links straight to. */
export const rideSteps = (signupUrl?: string): ParticipationStep[] => [
  {
    title: "Bli medlem i klubben",
    text: "Norges Cykleforbund selger ikke lisens før du er medlem i en klubb. Medlemskapet ordner du i Spond. Å trene med klubben krever hverken medlemskap eller lisens, men ritt i terminlista krever begge deler.",
    link: signupUrl ? { label: "Meld deg inn i klubben i Spond", url: signupUrl } : { label: "Slik blir du medlem", url: "/bli-med" },
    illustration: "spond-membership",
  },
  {
    title: "Velg og kjøp lisens",
    text: "Lisensen kjøper du hos Norges Cykleforbund, ikke hos klubben, og du må ha medlemskapet i orden først. For de fleste i klubben er det tur- og trimlisens for voksne, 900 kr i 2026. Du kan ta lisens for hele året eller for ett arrangement.",
    points: [
      "Helårslisens gjelder fra den registreres og ut desember samme år. Forsikringen gjelder fra du betaler og ut februar året etter, og dekker også treningsturer, alene og med klubben.",
      "Engangslisens gjelder for ritt i det arrangementet du kjøper den for, og gir samme dekning som en trim- og turlisens, men forsikringen gjelder bare for det arrangementet. Kjører du bare ett ritt, kan den holde.",
    ],
    link: { label: "Kjøp lisens hos NCF", url: LICENCE_BUY_URL },
    table: LICENCE_OVERVIEW,
  },
  {
    title: "Meld deg på rittet",
    text: "Påmelding, pris og startnummer ligger hos arrangøren, og lisensen trenger du når du melder deg på. Rittene klubben kjører, med datoer og arrangørens side, står i kalenderen under.",
    illustration: "ride-entry",
  },
];

/** NCF's licence table as it stood on 14 August 2026: type, price in kr, and which rides it allows. */
export const LICENCES: { type: string; price: string; rides: string[] }[] = [
  { type: "Elite 23+ år og U23 19–22 år", price: "1 170", rides: ["Aktive ritt", "NM 17 år+", "Tur", "Trim"] },
  { type: "Master 30+ år", price: "1 170", rides: ["Aktive ritt", "Tur", "Trim"] },
  { type: "Profflisens", price: "2 700", rides: ["Aktive ritt", "NM 17 år+", "Tur", "Trim"] },
  { type: "3–12 år", price: "0", rides: ["Aktive ritt", "Trim"] },
  { type: "13–16 år", price: "250", rides: ["Aktive ritt", "Trim"] },
  { type: "17–18 år", price: "500", rides: ["Aktive ritt", "NM 17 år+", "Tur", "Trim"] },
  { type: "19 år+ Challenge BMX", price: "900", rides: ["Aktive ritt", "Tur", "Trim"] },
  { type: "19 år+ Tur og trim (gjelder bare aldersklasser)", price: "900", rides: ["Tur", "Trim"] },
  { type: "PARA", price: "1 170", rides: ["Klassifisering avtales med NCF"] },
  { type: "Engangs 17 år+, tur og trim", price: "Se NCF", rides: ["Tur", "Trim"] },
  { type: "Engangs 13–16 år, ungdom", price: "50", rides: ["Aktive ritt", "Trim"] },
];

/** The notes under NCF's table. */
export const LICENCE_NOTES = [
  "Master-lisensen kan brukes i både elite- og masterklasser. Deltakelse i mesterskap avklarer du direkte med arrangøren eller NCF.",
  "Engangslisens for 13–16 år gjelder bare for medlemmer av en sykkelklubb. Aktive klasser kan kjøres parallelt med turritt i samme arrangement.",
];
