import type { RaceInfo } from "@/lib/types";

/**
 * The race pages (/sykkelritt/[slug]). The notes are the club's own wording of
 * what the organisers' sites said when they were read in October 2026; the
 * organiser's page is always one click away and is the one to trust for dates,
 * prices and rules. What a site did not say is left out rather than guessed.
 * Dates the sites give for 2026 are past by now, so a page says «siste utgave».
 */
const CHECKED = "2026-10";

export const RACE_PAGES: Record<string, { slug: string; info: RaceInfo }> = {
  "r-tyrifjorden": {
    slug: "tyrifjorden-rundt",
    info: {
      lead: "Trim- og turritt rundt Tyrifjorden med start og mål i Sandvika. Du velger mellom en kort og en lang runde, og det er tidtaking for dem som vil ha det.",
      facts: [
        { label: "Distanser", value: "64 km og 145 km" },
        { label: "Start og mål", value: "Sandvika sentrum" },
        { label: "Aldersgrense", value: "Fra 13 år" },
      ],
      sections: [
        { title: "Løypa", items: ["Runden går på både øst- og vestsiden av Tyrifjorden.", "Den lange runden passerer blant annet Asker, Sylling, Vikersund og Sollihøgda."] },
        { title: "Slik er rittet", items: ["Du trenger en sykkel i god stand og en godkjent sykkelhjelm.", "Tidtaking for dem som vil, men rittet legger vekt på opplevelsen.", "Klubber kan stille i en egen lagkonkurranse."] },
        { title: "Historie", items: ["Opprinnelig et ritt arrangert av IK Hero, kjørt til 1987 og da over 200 km. Det ble tatt opp igjen som trim- og turritt."] },
      ],
      links: [
        { label: "Rittets nettside", url: "https://www.tyrifjordenrundt.no/" },
        { label: "Påmelding", url: "https://www.tyrifjordenrundt.no/paamelding" },
        { label: "Om rittet", url: "https://www.tyrifjordenrundt.no/alt-om-rittet/om-tyrifjorden-rundt/" },
      ],
      sources: ["https://www.tyrifjordenrundt.no/", "https://www.tyrifjordenrundt.no/trim-og-turritt/", "https://www.tyrifjordenrundt.no/alt-om-rittet/om-tyrifjorden-rundt/"],
      checked: CHECKED,
    },
  },
  "r-nordmarka": {
    slug: "nordmarka-rundt",
    info: {
      lead: "En lang dag rundt hele Nordmarka, 148 km på riks- og fylkesveier, med mål ved Årvoll i Oslo. Turritt for alle over 17 år.",
      facts: [
        { label: "Distanse", value: "148 km" },
        { label: "Høydemeter", value: "Rundt 1 600" },
        { label: "Aldersgrense", value: "Over 17 år" },
      ],
      sections: [
        { title: "Løypa", items: ["Rundt Nordmarka gjennom Oslo, Bærum og Akershus og opp mot Oppland.", "Den passerer blant annet Tyrifjorden, Sundvollen, Hadeland, Jevnaker, Roa, Nittedal og Gjelleråsen, før målgang ved Årvoll."] },
        { title: "Underveis", items: ["Det er matstasjoner ved Norderhov (Heslebergkrysset, etter omtrent 63 km) og ved Grua."] },
        { title: "Regler", items: ["Rittet følger Norsk sykkelrittforenings ritt- og sikkerhetsreglement.", "Det er turritt og lagkonkurranse for klubber."] },
        { title: "Historie", items: ["I 2026 ble Nordmarka Rundt arrangert for 49. gang."] },
      ],
      links: [
        { label: "Rittets nettside", url: "https://www.nordmarkarundt.no/" },
        { label: "Påmelding", url: "https://www.nordmarkarundt.no/paamelding" },
        { label: "Om rittet", url: "https://www.nordmarkarundt.no/alt-om-rittet/om-nordmarka-rundt/" },
      ],
      sources: ["https://www.nordmarkarundt.no/", "https://www.nordmarkarundt.no/alt-om-rittet/om-nordmarka-rundt/"],
      checked: CHECKED,
    },
  },
  "r-enebakk": {
    slug: "enebakk-rundt",
    info: {
      lead: "Vårens første klassiker for mange: 83 km fra Skullerud rundt Enebakk, arrangert av IK Hero 1. mai.",
      facts: [
        { label: "Distanse", value: "83 km" },
        { label: "Start", value: "Skullerudstua" },
        { label: "Arrangør", value: "IK Hero" },
      ],
      sections: [
        { title: "Praktisk", items: ["Startnummer deles ut torsdag 30. april kl. 16.00–19.00 og på rittdagen kl. 7.00–9.00 ved Skullerud Sportssenter.", "Det er begrenset med plasser. Arrangøren ber deg sykle, samkjøre eller reise kollektivt der det går.", "Parkering ved Skullerudstua og Vekstsenteret. Sekretariat og garderobe i Skullerud Sportssenter."] },
        { title: "Start og mål", items: ["Start fra parkeringsplassen ved Skullerudstua. Målet ligger i Olaf Helsets vei."] },
        { title: "Historie", items: ["I 2026 ble Enebakk Rundt arrangert for 53. gang."] },
      ],
      links: [
        { label: "Påmelding og informasjon (IK Hero)", url: "https://www.ikhero.no/p%C3%A5melding-enebakk-rundt-2025" },
        { label: "Påmelding hos EQ Timing", url: "https://signup.eqtiming.com/arrangement/enebakk-rundt-2026/g295.52140?event=ik_hero" },
      ],
      sources: ["https://www.ikhero.no/p%C3%A5melding-enebakk-rundt-2025"],
      checked: CHECKED,
    },
  },
  "r-oyeren": {
    slug: "oyeren-rundt",
    info: {
      lead: "124 km turritt rundt innsjøen Øyeren, med start og mål ved Rælingen videregående skole i Fjerdingby.",
      facts: [
        { label: "Distanse", value: "124 km" },
        { label: "Start og mål", value: "Fjerdingby, Rælingen" },
        { label: "Aldersgrense", value: "Over 17 år" },
      ],
      sections: [
        { title: "Løypa", items: ["Rundt Øyeren gjennom Enebakk, Fet, Rælingen, Trøgstad og Spydeberg, på riks- og fylkesveier."] },
        { title: "Slik er rittet", items: ["Turritt med fellesstart. Du trenger en sykkel i god stand og en godkjent sykkelhjelm.", "Tidtaking og lagkonkurranse er der for dem som vil.", "Mastercup (fra 30 år) ble ikke arrangert i 2026."] },
      ],
      links: [
        { label: "Rittets nettside", url: "https://www.oyerenrundt.no/" },
        { label: "Påmelding", url: "https://www.oyerenrundt.no/paamelding/" },
        { label: "Om rittet", url: "https://www.oyerenrundt.no/alt-om-rittet/om-oyeren-rundt/" },
      ],
      sources: ["https://www.oyerenrundt.no/", "https://www.oyerenrundt.no/turritt/", "https://www.oyerenrundt.no/alt-om-rittet/om-oyeren-rundt/"],
      checked: CHECKED,
    },
  },
  "r-randsfjorden": {
    slug: "randsfjorden-rundt",
    info: {
      lead: "Hadelands store ritt rundt Randsfjorden, med start og mål i Brandbu sentrum. I 2027 arrangeres det for 40. gang.",
      facts: [
        { label: "Start og mål", value: "Brandbu sentrum" },
        { label: "Arrangør", value: "Hadeland Cykleklubb" },
        { label: "Forventet", value: "Rundt 700 deltakere" },
      ],
      sections: [
        { title: "Klasser", items: ["Menn og kvinner i aldersklasser fra 17–19 til 70+, og en trimklasse.", "Du melder deg på som individuell, i trimklassen eller på lag."] },
        { title: "Påmelding og pris for 2027", items: ["Jubileumspriser som stiger jo nærmere rittet du melder deg på: kr 350 fra 1. juli til 30. november, kr 450–500 i desember, kr 550–600 januar til april og kr 650–700 i mai.", "Etteranmelding inntil en time før start koster kr 850–950.", "Ordinær påmelding stenger onsdag 26. mai kl. 23.59."] },
        { title: "Regler", items: ["Lisens kreves.", "Det er to forsyningssteder underveis."] },
      ],
      links: [
        { label: "Påmelding hos EQ Timing", url: "https://signup.eqtiming.com/?Event=Randsfjordenrundt&lang=norwegian" },
      ],
      sources: ["https://signup.eqtiming.com/?Event=Randsfjordenrundt&lang=norwegian"],
      checked: CHECKED,
    },
  },
  styrkeproven: {
    slug: "styrkeproven",
    info: {
      lead: "Verdens eldste og lengste turritt, siden 1967. Fire ruter mot Oslo, fra den lange Trondheim–Oslo til Eidsvoll–Oslo. BOC-gruppene kjører Trondheim–Oslo og Lillehammer–Oslo.",
      facts: [
        { label: "Neste utgave", value: "18.–20. juni 2027" },
        { label: "Trondheim–Oslo", value: "515 km" },
        { label: "Lillehammer–Oslo", value: "176 km" },
        { label: "Arrangør", value: "Styrkeprøven AS (Bærum og Omegn Cykleklubb er største aksjonær)" },
      ],
      sections: [
        {
          title: "Trondheim–Oslo",
          items: ["515 km og omtrent 4 200 stigningsmeter, over Oppdal og Dovre ned til Oslo.", "Start fra Trondheim torg tidlig om morgenen, mellom kl. 4.00 og 4.45.", "Åtte matstasjoner underveis: Soknedal, Oppdal, Folldal, Ringebu, Lillehammer, Skreia, Eidsvoll verk og Frogner."],
        },
        {
          title: "Lillehammer–Oslo",
          items: ["176 km og omtrent 1 330 høydemeter, langs Mjøsa og på vestsiden av E6 sørover.", "Start ved Hammartun skole i Lillehammer mellom kl. 11.15 og 12.15.", "To matstasjoner: Skreia/Totenvika (72 km) og Eidsvoll verk (121 km)."],
        },
        { title: "Andre ruter", items: ["Women Vélo (Lillehammer–Oslo), Eidsvoll–Oslo som korteste alternativ, og «Ung i Styrkeprøven»."] },
        {
          title: "Regler",
          items: ["Du må fylle 17 år i kalenderåret, ha NCF-lisens og forsikring.", "Vanlige trafikkregler gjelder, maks to i bredden, og følgebiler er ikke tillatt.", "Søppel kastes på matstasjonene eller i mål. Tiden stoppes ved avkjøring fra rv. 4 etter Gjelleråsen."],
        },
        { title: "Påmelding", items: ["Påmeldingen for 2027 åpner snart. I 2026 steg prisen trinnvis fra kr 1 100 (høsten før) til kr 1 850 (mai og juni)."] },
        {
          title: "Historie",
          items: ["Erik Gjems-Onstad startet rittet i 1967, på St. Hansaften, med 121 deltakere fra Trondheim.", "Kortere ruter kom fra 1996. Rekorden er 9 576 påmeldte i 2011, og siden 2009 er taket 9 000 deltakere."],
        },
      ],
      links: [
        { label: "Styrkeprøvens nettside", url: "https://styrkeproven.no/" },
        { label: "Rittmanual", url: "https://styrkeproven.no/rittmanual/" },
        { label: "Spørsmål og svar", url: "https://styrkeproven.no/faq/" },
        { label: "Historien", url: "https://styrkeproven.no/historien/" },
      ],
      sources: ["https://styrkeproven.no/", "https://styrkeproven.no/hovedside/trondheim-oslo/", "https://styrkeproven.no/hovedside/lillehammer-oslo/", "https://styrkeproven.no/historien/"],
      checked: CHECKED,
    },
  },
};

/** The race ids that share a page: both Styrkeprøven routes are one page. */
export const RACE_PAGE_OF: Record<string, string> = {
  "r-tyrifjorden": "r-tyrifjorden",
  "r-nordmarka": "r-nordmarka",
  "r-enebakk": "r-enebakk",
  "r-oyeren": "r-oyeren",
  "r-randsfjorden": "r-randsfjorden",
  "r-styrkeproven-to": "styrkeproven",
  "r-styrkeproven-lo": "styrkeproven",
};

/**
 * Short notes for the rides that have no page of their own (/sykkelritt/andre-ritt), in the club's words and from the
 * organisers' sites in October 2026. Only what is stable from year to year: prices, rules and dates are the organiser's.
 */
export const OTHER_RACE_NOTES: Record<string, { lines: string[]; links: { label: string; url: string }[] }> = {
  "r-follo": {
    lines: ["Arrangert av Follo Sykkelklubb, med runder i kulturlandskapet rundt Årungen i Ås.", "I 2026 var målløypa lagt om på grunn av veiarbeid."],
    links: [
      { label: "Rittets nettside", url: "https://www.follorittet.no/" },
      { label: "Påmelding hos EQ Timing", url: "https://signup.eqtiming.com/?Event=Follorittet" },
    ],
  },
  "r-ceres": {
    lines: ["83 km på Romerike med start ved Leirsund stadion. Turritt, lagkonkurranse og Master Cup.", "Går tradisjonelt tidlig i mai."],
    links: [{ label: "Sportsklubben Ceres", url: "https://skceres.no/" }],
  },
};
