/*
 * Henter medlemstabellen du ser i Spond (club.spond.com/boc/members) og laster den ned som en CSV-fil.
 * Kjøres i nettleserens konsoll, mens du er innlogget i Spond. Skriptet leser bare det som allerede vises på skjermen
 * i din egen innloggede økt. Det sender ingenting noe sted og åpner ikke hvert enkelt medlem.
 *
 * Før du kjører det:
 *  1. Fjern filteret («Grupper og avdelinger: …») med krysset ved siden av, så tabellen viser alle (f.eks. «731 av 731»).
 *  2. Trenger du fødselsdato eller fotosamtykke: velg dem i «Kolonne» øverst til høyre over tabellen først.
 *  3. Åpne konsollen (Cmd+Option+J i Chrome). Lim inn hele skriptet og trykk Enter. Skriver nettleseren
 *     «allow pasting» først, skriver du det og trykker Enter, og limer inn på nytt.
 *
 * Skriptet beholder bare kolonnene i KEEP under (personvern: ikke ta med mer enn du trenger). NIF-ID og
 * betalingskontakt (en annen persons navn) er derfor ikke med. Endre listen om du trenger noe annet.
 * Fornavn og etternavn slås sammen til én kolonne «Navn», som importen på nettsiden forventer.
 *
 * Filen inneholder personopplysninger, også om barn: ta vare på den bare på din egen maskin, ikke legg den i prosjektet
 * (git), og slett den når du har importert.
 */
(async () => {
  const KEEP = ["Fødselsdato", "Fotosamtykke", "Grupper"]; // i tillegg til Navn (Fornavn + Etternavn)
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const text = (el) => (el ? el.innerText.replace(/\s+/g, " ").trim() : "");
  const headerCells = () => [...document.querySelectorAll('[role="columnheader"], th')];
  const cellsOf = (row) => [...row.querySelectorAll('[role="gridcell"], [role="cell"], td')];
  const rowEls = () => [...document.querySelectorAll('[role="row"], tr')].filter((r) => cellsOf(r).length > 1);

  const headers = headerCells().map(text);
  if (!headers.length) return console.error("Fant ingen tabell. Er du på medlemslisten?");
  console.log("Kolonner jeg fant:", headers.filter(Boolean).join(" | "));

  const first = headers.indexOf("Fornavn");
  const last = headers.indexOf("Etternavn");
  if (first < 0 || last < 0) return console.error("Fant ikke kolonnene Fornavn og Etternavn.");
  const keepIdx = KEEP.map((h) => ({ h, i: headers.indexOf(h) }));
  const missing = keepIdx.filter((k) => k.i < 0).map((k) => k.h);
  if (missing.length) console.warn("Disse kolonnene finnes ikke i tabellen og blir ikke med:", missing.join(", "), "(legg dem til under «Kolonne»)");

  // Tabellen laster flere rader når du ruller ned: rull til slutten til det ikke kommer flere.
  const seen = new Map();
  let still = 0;
  while (still < 6) {
    for (const row of rowEls()) {
      const cells = cellsOf(row).map(text);
      if (cells.length < headers.length - 2) continue;
      seen.set(cells.join("|"), cells);
    }
    const before = seen.size;
    const rows = rowEls();
    rows.at(-1)?.scrollIntoView({ block: "end" });
    window.scrollBy(0, 600);
    await sleep(700);
    for (const row of rowEls()) seen.set(cellsOf(row).map(text).join("|"), cellsOf(row).map(text));
    still = seen.size === before ? still + 1 : 0;
    console.log(`${seen.size} rader …`);
  }

  const used = keepIdx.filter((k) => k.i >= 0);
  const header = ["Navn", ...used.map((k) => k.h)];
  const lines = [header, ...[...seen.values()].map((c) => [`${c[first]} ${c[last]}`.trim(), ...used.map((k) => c[k.i] ?? "")])];
  const csv = "﻿" + lines.map((l) => l.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n");

  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `spond-medlemmer-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  console.log(`Ferdig: ${lines.length - 1} medlemmer lastet ned. Sjekk at tallet stemmer med «Viser totalt …» i Spond.`);
  console.table(lines.slice(0, 4));
})();
