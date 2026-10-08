import { Download } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import camilla from "@/components/assets/camilla-37.png";
import christian from "@/components/assets/Christian-udø-Adriaenssens.png";
import esten from "@/components/assets/esten-oversjoen.png";
import silje from "@/components/assets/silje-34.png";
import trond from "@/components/assets/trond-58.png";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Brukeropplevelse og design: dokument for styret",
  description: "Problemene, menneskene og valgene bak nettsiden og administrasjonen til BOC.",
  robots: { index: false, follow: false },
};

/**
 * The written version of the board presentation (/user-experience): what the
 * talk has no room for. Sent before or after the meeting, and printed to PDF
 * (scripts/make-pdf.sh, served as /pdf/boc-brukeropplevelse-dokument.pdf).
 *
 * The text follows the deck's, and where the site's numbers are used they are
 * counted from the club data. Nothing here is measured from real use yet, and
 * the document says so. The personas are archetypes, not people; the portraits
 * are the example people from the site.
 *
 * Set as a paper document in fixed light colours, whatever the visitor's theme:
 * it is read on a screen and printed.
 */

const PDF = "/pdf/boc-brukeropplevelse-dokument.pdf";

const css = `
.doc { --d-ink:#14202b; --d-ink2:#3b4856; --d-ink3:#66737f; --d-line:#d9dee3; --d-tint:#f4f1ea; --d-accent:#125a6b; --d-yellow:#f4f64f;
  background:#fff; color:var(--d-ink); font-family:var(--font-sans, system-ui, sans-serif); font-size:16px; line-height:1.55; }
.doc * { box-sizing:border-box; }
.doc h1 { font-size:2.5rem; line-height:1.05; letter-spacing:-0.02em; font-weight:600; margin:0; }
.doc h2 { font-size:1.55rem; line-height:1.15; letter-spacing:-0.015em; font-weight:600; margin:0; }
.doc h3 { font-size:1.05rem; line-height:1.25; font-weight:600; margin:0; }
.doc p { margin:0; }
.doc .lead { font-size:1.2rem; line-height:1.45; color:var(--d-ink2); }
.doc .muted { color:var(--d-ink3); }
.doc .kicker { font-size:0.78rem; letter-spacing:0.12em; text-transform:uppercase; font-weight:600; color:var(--d-accent); }
.doc section.part { margin-top:3.2rem; }
.doc .rule { border-top:3px solid var(--d-yellow); width:3rem; margin-bottom:1rem; }
.doc .stack > * + * { margin-top:0.9rem; }
.doc .card { border:1px solid var(--d-line); border-radius:10px; padding:1.1rem 1.25rem; background:#fff; break-inside:avoid; }
.doc .tint { background:var(--d-tint); border:0; }
.doc table { width:100%; border-collapse:collapse; font-size:0.95rem; }
.doc th { text-align:left; font-size:0.78rem; letter-spacing:0.08em; text-transform:uppercase; color:var(--d-ink3); padding:0.5rem 0.75rem 0.5rem 0; border-bottom:2px solid var(--d-ink); }
.doc td { vertical-align:top; padding:0.7rem 0.75rem 0.7rem 0; border-bottom:1px solid var(--d-line); }
.doc tr { break-inside:avoid; }
.doc ul.plain { margin:0; padding-left:1.15rem; }
.doc ul.plain li + li { margin-top:0.3rem; }
.doc .need { background:var(--d-yellow); border-radius:6px; padding:0.45rem 0.7rem; font-size:0.92rem; }
.doc .fear { background:#f6c9c3; border-radius:6px; padding:0.45rem 0.7rem; font-size:0.92rem; }
.doc .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
.doc .grid3 { display:grid; grid-template-columns:repeat(3,1fr); gap:1rem; }
.doc .pill { display:inline-block; border-radius:999px; padding:0.1rem 0.7rem; font-size:0.8rem; font-weight:600; }
.doc .ok { background:#dff1e7; color:#0d5a37; }
.doc .todo { background:#fbefd0; color:#6b4a00; }
.doc a { color:var(--d-accent); }
.doc .download { position:fixed; top:1rem; right:1rem; display:inline-flex; gap:0.5rem; align-items:center; background:var(--d-ink); color:#fff !important; text-decoration:none; padding:0.6rem 1rem; border-radius:8px; font-weight:600; font-size:0.9rem; }
@media (max-width: 720px) { .doc .grid2, .doc .grid3 { grid-template-columns:1fr; } .doc h1 { font-size:1.9rem; } }
@page { size: A4; margin: 16mm 15mm; }
@media print {
  .doc { font-size:10.5pt; }
  .doc .download { display:none; }
  .doc { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc h2, .doc h3, .doc .kicker, .doc .rule { break-after: avoid; }
  .doc .part-head { break-after: avoid; break-inside: avoid; }
  .doc .stack > :first-child { break-before: avoid; }
  .doc .stack > p:has(+ .card, + .grid2, + .grid3, + table, + ol, + ul) { break-after: avoid; }
  .doc .grid2, .doc .grid3 { break-inside: avoid; }
  .doc section.part { margin-top:2rem; }
  .doc .pagebreak { break-before: page; }
}
`;

const Part = ({ id, kicker, title, children, pageBreak }: { id: string; kicker: string; title: string; children: ReactNode; pageBreak?: boolean }) => (
  <section id={id} className={`part ${pageBreak ? "pagebreak" : ""}`}>
    <div className="part-head">
      <div className="rule" />
      <p className="kicker">{kicker}</p>
      <h2 style={{ marginTop: "0.35rem" }}>{title}</h2>
    </div>
    <div className="stack" style={{ marginTop: "1.1rem" }}>
      {children}
    </div>
  </section>
);

const PROBLEMS = [
  {
    n: 1,
    label: "To systemer",
    problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system.",
    why: "Spond er lukket for dem som ikke er med. Nettsiden er åpen for alle. Uten en tydelig grense blir det to sannheter og dobbeltarbeid for frivillige.",
    what: "Én regel: nettsiden viser det som gjelder en hel sesong (ukerytme, terminliste, ritt, hvem man møter). Det som endres fra dag til dag, påmelding og siste liten-endringer, bor i Spond. «Prøv en trening» sender deg til gruppas Spond, og siden forklarer hva du velger der. Medlemslisten kommer inn fra Spond som en eksport, og bare navn, fødselsår og samtykke til bilder leses.",
    where: "Gruppesidene, «Slik blir du med første gang», importen under Medlemmer.",
  },
  {
    n: 2,
    label: "Nye medlemmer",
    problem: "De som vil prøve, vet ikke om de passer.",
    why: "Folk melder seg ikke inn for å finne ut om de passer. De må først se at noen som dem er med, hvor og når, og hva som skjer hvis de bare dukker opp.",
    what: "«Finn gruppen din» stiller tre spørsmål (alder, gren og tempo) og anbefaler en gruppe. Gruppesidene åpner med det en fremmed trenger, med klubbens egne ord og med et navn og et ansikt å se etter. Første steg er «Prøv en trening», ikke «Bli medlem».",
    where: "Forsiden, veiviseren, gruppesidene, «Bli medlem» og «Barn og ungdom».",
  },
  {
    n: 3,
    label: "Innhold",
    problem: "Frivillige har fem minutter, og siden blir fort utdatert.",
    why: "En nettside er bare så god som det som står på den, og det er frivillige som skriver det. Hvis det tar lang tid eller er skummelt, blir det ikke gjort.",
    what: "Et innlegg med bilder på under ett minutt fra mobilen. Gruppesiden redigeres felt for felt, med angre. Tomme felt arver fra nivået over, så ingen skriver det samme to ganger. Oversikten forteller hva som venter, i stedet for å være en meny.",
    where: "Administrasjon: Nytt innlegg, Mine grupper og Oversikt.",
  },
  {
    n: 4,
    label: "Personvern",
    problem: "Navn og bilder på nett er personopplysninger.",
    why: "Et bilde av et menneske er en personopplysning, voksen eller barn. Hvem som vises, hvem som har sagt ja, og hva som skjer når noen ombestemmer seg, må kunne forklares.",
    what: "Samtykke til bilder hentes fra Spond. Hvert bilde må si hvem som tok det og hvem som er med. Den som mangler samtykke, må tas ut av bildet, sladdes med mosaikk på telefonen, eller spørres på e-post. Etterpå kontrollerer en administrator. Vil noen bort, er det permanent anonymisering.",
    where: "Nytt innlegg, Bilder, Medlemmer og personsiden.",
  },
  {
    n: 5,
    label: "Kontinuitet",
    problem: "Alt hviler på noen få personer.",
    why: "Når den ene slutter, må klubben fortsatt komme inn, og vite hvem som gjorde hva.",
    what: "Fem roller på riktig nivå i klubbens oppbygging, innlogging for hver enkelt med kode på e-post, invitasjoner fra klubbadministrator og en logg over endringer. Klubben må alltid ha en aktiv klubbadministrator.",
    where: "Brukere og tilgang, Struktur og loggen.",
  },
  {
    n: 6,
    label: "Én klubb",
    problem: "18 grupper i seks grener skal fremstå som én klubb.",
    why: "Hver gruppe har eget tempo, tidspunkt og kontakt. Skal de fremstå som én klubb, må de se ut og fungere likt.",
    what: "Ett hierarki (klubb, idrett, gren, gruppe) og én mal som alle sider bygges fra, i klubbens egen stil. Menyen, finneren og sidene bygges fra samme oppbygging.",
    where: "Hele nettsiden, og Struktur i administrasjon.",
  },
  {
    n: 7,
    label: "Kostnad",
    problem: "Spond-nettsiden koster klubben 6 000 kr i året.",
    why: "Det er et løpende utgiftsledd som ikke er nevnt før. Det gjelder Spond-nettsiden, ikke Spond selv: medlemsregister, påmelding og meldinger bor fortsatt i Spond.",
    what: "Dette er et valg for styret: skal klubben betale for Spond-nettsiden, eller bruke denne nettsiden i stedet? Vi har holdt grensen mellom nettsiden og Spond (medlemsregister, påmelding og meldinger) tydelig, så valget kan tas uten å bygge noe om.",
    where: "«Det vi ber om» sist i dokumentet.",
  },
];

const VISITORS = [
  {
    who: "Forelderen",
    photo: camilla,
    words: "«Jeg vil at barnet mitt skal ha det gøy sammen med noen som passer på.»",
    needs: "Alder og nivå, hvem som er trener, hva som skjer med bildene.",
    fear: "Å sende barnet til noe jeg ikke forstår.",
    door: "Barn og ungdom",
  },
  {
    who: "Den voksne nybegynneren",
    photo: silje,
    words: "«Jeg tror jeg er for treg for en klubb.»",
    needs: "Se at folk som henne er med. En rolig gruppe. Et sted å starte.",
    fear: "Å henge etter, og å bli sett.",
    door: "Forsiden og «Finn gruppen din»",
  },
  {
    who: "Den erfarne syklisten",
    photo: trond,
    words: "«Jeg har sykla i mange år. Jeg leter etter en god treningsgruppe.»",
    needs: "Tydelig tempo, treningstider som passer, og hvem man sykler med.",
    fear: "Å havne i en gruppe som er for treg, eller å bruke kvelder på å finne ut av det.",
    door: "Forsiden, finneren og gruppesidenes fart",
  },
];

const ADMINS = [
  {
    who: "Laglederen",
    photo: esten,
    words: "«Jeg er frivillig. Jeg har fem minutter.»",
    needs: "Logge inn uten passord, legge ut fra mobilen, ikke kunne ødelegge noe.",
    fear: "Å publisere feil bilde av feil barn.",
  },
  {
    who: "Styret og klubbadministratoren",
    photo: christian,
    words: "«Jeg må kunne stå inne for det.»",
    needs: "Oversikt over hva som skjer, kontroll over hvem som har tilgang, spor etter hver endring.",
    fear: "At alt er avhengig av én person, eller at noe går galt uten at noen vet det.",
  },
];

function Persona({ p }: { p: { who: string; photo: (typeof camilla); words: string; needs: string; fear: string; door?: string } }) {
  return (
    <div className="card" style={{ display: "grid", gap: "0.6rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
        <Image src={p.photo} alt="" width={56} height={56} style={{ width: 56, height: 56, borderRadius: 999, objectFit: "cover" }} />
        <h3>{p.who}</h3>
      </div>
      <p style={{ fontStyle: "italic" }}>{p.words}</p>
      <p className="need">
        <b>Trenger:</b> {p.needs}
      </p>
      <p className="fear">
        <b>Frykter:</b> {p.fear}
      </p>
      {p.door && <p className="muted" style={{ fontSize: "0.88rem" }}>Kommer inn via {p.door}</p>}
    </div>
  );
}

export default async function Dokument() {
  const { db, org } = await loadSite();
  const sport = org.sports()[0];
  const groupCount = sport ? org.groups(sport.id).length : 0;
  const branchCount = sport ? org.children(sport.id).length : 0;

  return (
    <div className="doc">
      <style>{css}</style>
      <a className="download" href={PDF} download>
        <Download aria-hidden size={16} /> Last ned som PDF
      </a>

      <main style={{ maxWidth: 820, margin: "0 auto", padding: "3.5rem 1.5rem 5rem" }}>
        <header className="stack">
          <p className="kicker">{db.club.name} · for styret</p>
          <h1>Nettsiden og administrasjonen: problemene, menneskene og valgene.</h1>
          <p className="lead">
            Dette er den skriftlige delen av presentasjonen. Presentasjonen tar rundt tolv minutter og viser løsningen. Her står det som ikke får plass: hvem det er laget for, hvilke problemer
            det skal løse, og hvorfor det er gjort slik.
          </p>
          <p className="muted">Oktober 2026 · Fra Jakob Jølstad</p>
        </header>

        <Part id="kort" kicker="Kort fortalt" title="Fem ting å vite">
          <ul className="plain">
            <li>
              <b>Hovedideen:</b> folk melder seg ikke inn for å finne ut om de passer. Siden hjelper deg først til å finne en gruppe du kan prøve, og først etterpå til å bli medlem.
            </li>
            <li>
              <b>Spond blir:</b> medlemsregister, påmelding og siste liten-endringer bor i Spond. Nettsiden erstatter ikke Spond, den gjør den lettere å finne.
            </li>
            <li>
              <b>Frivillige først:</b> administrasjonen er laget for en lagleder med fem minutter og en mobil, uten passord og uten mulighet til å ødelegge noe.
            </li>
            <li>
              <b>Personvern som standard:</b> den enkleste veien for en frivillig er også den som er riktig. Bilder krever at man sier hvem som er med, og den som ikke har samtykke, tas ut eller sladdes.
            </li>
            <li>
              <b>Ærlig status:</b> løsningen er en prototype med eksempeldata. Ingenting er målt hos ekte brukere ennå, og personaene bygger på det vi vet om klubben, ikke på intervjuer.
            </li>
          </ul>
        </Part>

        <Part id="problemer" kicker="Problemene" title="Syv problemer vi prøver å løse">
          <p className="muted">Hvert problem har et svar i løsningen, og et sted du kan se det.</p>
          {PROBLEMS.map((p) => (
            <div key={p.n} className="card" style={{ display: "grid", gap: "0.55rem" }}>
              <p className="kicker">
                {p.n} · {p.label}
              </p>
              <h3 style={{ fontSize: "1.2rem" }}>{p.problem}</h3>
              <p>
                <b>Hvorfor det er et problem.</b> {p.why}
              </p>
              <p>
                <b>Hva vi gjør.</b> {p.what}
              </p>
              <p className="muted" style={{ fontSize: "0.9rem" }}>
                Se det: {p.where}
              </p>
            </div>
          ))}
        </Part>

        <Part id="personas" kicker="Menneskene" title="Fem personas" pageBreak>
          <p>
            Personaene er arketyper, ikke enkeltpersoner. De bygger på det vi vet om klubben, ikke på intervjuer. Portrettene er eksempelpersonene fra nettsiden.
          </p>
          <h3 style={{ marginTop: "1.2rem" }}>Tre som besøker siden</h3>
          <div className="grid3">
            {VISITORS.map((p) => (
              <Persona key={p.who} p={p} />
            ))}
          </div>
          <h3 style={{ marginTop: "1.2rem" }}>To som holder siden oppe</h3>
          <div className="grid2">
            {ADMINS.map((p) => (
              <Persona key={p.who} p={p} />
            ))}
          </div>
        </Part>

        <Part id="veien-inn" kicker="Nye medlemmer" title="Veien inn: fra første besøk til første trening">
          <p className="lead">Fem steg, og ingen blindgater. Siden sier aldri at en gruppe er full. Hver gruppe skal lese som en man kan prøve.</p>
          <table>
            <thead>
              <tr>
                <th style={{ width: "22%" }}>Steg</th>
                <th>Hva som skjer</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["1 Forsiden", "Hvem er klubben? Medlemmenes egne ord. Handlingen er «Finn gruppen din»."],
                ["2 Finneren", "Tre spørsmål: alder, gren og tempo. «Usikker» er et eget svar på tempo, og da vises de rolige gruppene først."],
                ["3 Gruppesiden", "Først det du trenger før første trening: tempo, distanse, utstyr, hvem du ser etter og hva som skjer om du ikke henger med. Så resten, og hva som skjer om vinteren."],
                ["4 Prøv en trening", "Knappen går til gruppas Spond. Siden forklarer at du velger «member» selv om du ikke er meldt inn."],
                ["5 Bli medlem", "Når du har prøvd, og vil mer."],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td>
                    <b>{a}</b>
                  </td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="card tint">
            <h3>Hvorfor «Prøv en trening» før «Bli medlem»</h3>
            <ul className="plain" style={{ marginTop: "0.5rem" }}>
              <li>
                <b>Mindre risiko.</b> Et ja som kan angres er lett å si.
              </li>
              <li>
                <b>Konkret.</b> «Tirsdag 18.00 på Bekkestua torg» er noe man kan gjøre.
              </li>
              <li>
                <b>Færre valg.</b> Ett neste steg om gangen.
              </li>
            </ul>
            <p className="muted" style={{ marginTop: "0.6rem", fontSize: "0.9rem" }}>
              Prinsippene er kjente (commitment ladder, Hicks lov). Effekten hos BOC er ikke målt ennå. «Bli medlem» står fortsatt i menyen, for dem som har bestemt seg.
            </p>
          </div>
          <h3>Hvordan vi vil vite om det virker</h3>
          <ol className="plain">
            <li>
              <b>Hva folk trykker på.</b> «Prøv en trening» mot «Bli medlem». Bare med samtykke, fordi siden ikke har statistikk uten at besøkende sier ja.
            </li>
            <li>
              <b>Hvem som kommer til Spond.</b> Nye i gruppenes Spond per måned, før og etter lansering. Tallene finnes allerede hos laglederne.
            </li>
            <li>
              <b>Hvem som møter opp, og blir.</b> Antall på første trening, og hvor mange som er med igjen om en måned. Det er det klubben egentlig vil ha.
            </li>
          </ol>
          <p className="muted">Forslag: mål én sesong, og la tallene avgjøre om førstevalget skal være enda mykere, eller litt tøffere.</p>
        </Part>

        <Part id="oppbygging" kicker="Informasjonshierarkiet" title="Ett hierarki styrer alt" pageBreak>
          <p>
            Klubben er bygget opp som et tre: klubb, idrett, gren og gruppe. Menyen, finneren, gruppesidene, innleggene, rollene og tilgangen følger samme tre. Det som publiseres på en gruppe,
            vises også på nivåene over.
          </p>
          <div className="grid3">
            <div className="card">
              <h3>Gren</h3>
              <p>Menyen og grensiden: velg mellom gruppene.</p>
            </div>
            <div className="card">
              <h3>Gruppe</h3>
              <p>Gruppesiden: alt man trenger før første trening.</p>
            </div>
            <div className="card" style={{ background: "#f4f64f", borderColor: "#f4f64f" }}>
              <h3>Arver nedover</h3>
              <p>Tomme felt og regler hentes fra nivået over. Ingen skriver det samme to ganger.</p>
            </div>
          </div>
          <p className="muted">
            Tallene er talt fra klubbens data: {sport?.name ?? "Sykkel"} har {branchCount} grener og {groupCount} lag og grupper.
          </p>
        </Part>

        <Part id="administrasjon" kicker="Administrasjon" title="For dem som holder siden oppe">
          <h3>Fem roller, på riktig nivå</h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: "28%" }}>Rolle</th>
                <th>Gjelder</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Klubbadministrator", "Hele klubben: brukere, bilder, forsiden, personvern."],
                ["Seksjonsadministrator", "Én gren, for eksempel Landevei, og alt under."],
                ["Lagadministrator", "Én gruppe, for eksempel BOC 3. Publiserer direkte og holder siden oppdatert."],
                ["Bidragsyter", "Skriver innlegg som en administrator godkjenner før de publiseres."],
                ["Foresatt", "Knyttet til sitt barn. Kan sende inn innlegg til barnets lag for godkjenning."],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td>
                    <b>{a}</b>
                  </td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="plain">
            <li>
              <b>Arves nedover.</b> Den som styrer en gren, styrer gruppene under.
            </li>
            <li>
              <b>Aldri uten ansvarlig.</b> Klubben må alltid ha en aktiv klubbadministrator, og ingen kan låse seg selv ute.
            </li>
            <li>
              <b>Alt logges.</b> Hvem gjorde hva, og når.
            </li>
          </ul>
          <div className="grid2">
            <div className="card">
              <h3>Ingen passord å glemme</h3>
              <p style={{ marginTop: "0.4rem" }}>
                Du skriver e-postadressen din og får en kode på seks siffer. På iPhone foreslår tastaturet koden fra e-posten. Nye administratorer inviteres av klubbadministrator og får en e-post med
                knapp rett til innloggingen.
              </p>
            </div>
            <div className="card">
              <h3>Fra tur til nettside på under ett minutt</h3>
              <p style={{ marginTop: "0.4rem" }}>
                Legg til bilder fra telefonen, si hvem som tok dem og hvem som er med, og publiser eller send til godkjenning. Bildetekst og alt-tekst lages av systemet, uten navn. Bildene
                skaleres, og posisjon og kameradata fjernes på telefonen før de sendes.
              </p>
            </div>
          </div>
          <div className="card tint">
            <h3>Systemet sier ifra, så ingen må huske alt</h3>
            <p style={{ marginTop: "0.4rem" }}>
              Oversikten viser det som venter på deg: bilder som skal kontrolleres (og blir røde etter tre dager), innlegg som venter på godkjenning, personer som mangler fotosamtykke, grupper uten
              kontaktperson og personvernhenvendelser.
            </p>
          </div>
        </Part>

        <Part id="personvern" kicker="Personvern" title="Samtykke og bilder: den enkleste veien er den riktige" pageBreak>
          <p>
            Et bilde av et menneske er en personopplysning, voksen eller barn. Siden er laget slik at en frivillig som gjør det enkleste, også gjør det riktige.
          </p>
          <ol className="plain">
            <li>
              <b>Last opp.</b> Fotograf må oppgis, og kan være «BOC».
            </li>
            <li>
              <b>Merk personer.</b> Velg alle i gruppa med ett trykk, eller si at ingen kan kjennes igjen. Å la det stå tomt er ikke et svar.
            </li>
            <li>
              <b>Alle har sagt ja:</b> innlegget publiseres med en gang.
            </li>
            <li>
              <b>Noen mangler samtykke:</b> publiseringen sperres, og tre veier åpnes: ta personen ut av bildet, sladde hele personen, eller be om samtykke på e-post.
            </li>
          </ol>
          <div className="grid2">
            <div className="card">
              <h3>Sladding på telefonen</h3>
              <ul className="plain" style={{ marginTop: "0.4rem" }}>
                <li>Dra en boks over hele personen som ikke har sagt ja, ikke bare ansiktet.</li>
                <li>Bildet endres på telefonen før det sendes. Originalen forlater aldri enheten.</li>
                <li>Mosaikken er så grov at ingen kjennes igjen, og den kan ikke fjernes etterpå.</li>
                <li>Gjelder også medlemmer som er satt til «Ikke publiser»: de kan merkes i bildet, men må sladdes.</li>
              </ul>
            </div>
            <div className="card">
              <h3>På e-post</h3>
              <ul className="plain" style={{ marginTop: "0.4rem" }}>
                <li>Innlegget publiseres, men bildene er skjult til personen, eller en forelder, har svart.</li>
                <li>Svaret gjelder bare de bildene. Det er ikke et generelt samtykke.</li>
                <li>Et nei holder bildene skjult for alltid.</li>
              </ul>
            </div>
          </div>
          <h3>Navn og anonymisering</h3>
          <ul className="plain">
            <li>På gruppesiden vises bare dem som har sagt ja til bilder og har lagt ut et bilde. Resten er et tall: «og 16 andre medlemmer».</li>
            <li>Barn vises aldri med navn i en liste.</li>
            <li>
              <b>Vil noen bort, er det permanent.</b> Navn i tekst byttes med en nøytral omtale, personen dekkes til i alle bilder, også gamle, og sitater fjernes.
            </li>
            <li>Gruppelederne har ingen e-postadresse på siden. De nås i Spond, og telefonnummeret er for turer og endringer samme dag.</li>
          </ul>
          <div className="card tint">
            <h3>Det vi gjør etterpå, og hvorfor</h3>
            <p style={{ marginTop: "0.4rem" }}>
              Bilder publiseres med en gang. En klubbadministrator kontrollerer etterpå hvem som tok dem og hvem som er med, og kan rette. Kontrollen stopper aldri en publisering, men blir et bilde liggende
              ukontrollert i mer enn tre dager, blir varselet rødt. Det krever at noen faktisk kontrollerer.
            </p>
          </div>
        </Part>

        <Part id="spond" kicker="Spond" title="Vi erstatter ikke Spond. Vi gjør den lettere å finne.">
          <div className="grid2">
            <div className="card">
              <h3>Nettsiden: for dem som ennå ikke er med</h3>
              <ul className="plain" style={{ marginTop: "0.4rem" }}>
                <li>Finne og forstå gruppene</li>
                <li>Se hvem man møter</li>
                <li>Ukerytmen og terminlisten</li>
                <li>Historier og bilder</li>
                <li>Prøve en trening</li>
              </ul>
            </div>
            <div className="card">
              <h3>Spond: for dem som er med</h3>
              <ul className="plain" style={{ marginTop: "0.4rem" }}>
                <li>Påmelding til hver økt</li>
                <li>Siste liten-endringer</li>
                <li>Meldinger til gruppa</li>
                <li>Medlemmene og deres svar</li>
              </ul>
            </div>
          </div>
          <p>
            <b>Én regel holder det rent:</b> siden viser det som gjelder en hel sesong. Det som endres fra dag til dag, bor i Spond.
          </p>
          <div className="grid2">
            <div className="card">
              <h3>Importen fra Spond leser</h3>
              <ul className="plain" style={{ marginTop: "0.4rem" }}>
                <li>Navn</li>
                <li>Fødselsår</li>
                <li>Samtykke til bilder</li>
              </ul>
              <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
                Laglederen ser hver rad før noe lagres, og nye personer settes som «Ikke publiser» til noen har tatt stilling.
              </p>
            </div>
            <div className="card">
              <h3>Importen leser aldri</h3>
              <ul className="plain" style={{ marginTop: "0.4rem" }}>
                <li>E-post og telefon</li>
                <li>Adresse og skole</li>
                <li>Politiattest</li>
                <li>Opplysninger om foresatte</li>
              </ul>
              <p className="muted" style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>Det Spond allerede forvalter, skal ikke ligge to steder.</p>
            </div>
          </div>
        </Part>

        <Part id="prinsipper" kicker="Prinsipper" title="Fire prinsipper som alt annet følger av">
          <div className="grid2">
            {[
              ["Alt kan prøves", "Siden sier aldri at en gruppe er full."],
              ["Folk, ikke skjemaer", "En gruppeleder med navn og bilde, og en vei til dem i Spond."],
              ["Én sannhet", "Det som endres hver dag bor i Spond. Det som gjelder en sesong bor på siden."],
              ["Personvern som standard", "Den enkleste veien for en frivillig er også den som er riktig."],
            ].map(([a, b]) => (
              <div key={a} className="card">
                <h3>{a}</h3>
                <p style={{ marginTop: "0.3rem" }}>{b}</p>
              </div>
            ))}
          </div>
        </Part>

        <Part id="status" kicker="Status" title="Det som virker, og det som gjenstår" pageBreak>
          <div className="grid2">
            <div className="card">
              <span className="pill ok">Virker nå</span>
              <ul className="plain" style={{ marginTop: "0.6rem" }}>
                <li>Finner, gruppesider og «Før første trening»</li>
                <li>Innlogging med e-postkode og invitasjoner</li>
                <li>Roller, innlegg og kontroll av bilder</li>
                <li>Samtykke: sperre, sladding og e-postforespørsel</li>
                <li>Import fra Spond og sladding av bilder</li>
              </ul>
            </div>
            <div className="card">
              <span className="pill todo">Gjenstår</span>
              <ul className="plain" style={{ marginTop: "0.6rem" }}>
                <li>Daglig sikkerhetskopi av dataene</li>
                <li>Slette en bruker helt</li>
                <li>Samtykke på e-post for gruppebilder</li>
                <li>Å knytte brukere til medlemmer</li>
                <li>E-postadresser for samtykke (Spond gir dem ikke)</li>
                <li>Test med ekte nybegynnere</li>
              </ul>
            </div>
          </div>
          <div className="card tint">
            <h3>Hva som ikke er gjort</h3>
            <p style={{ marginTop: "0.4rem" }}>
              Løsningen er en prototype med eksempeldata. Ingenting er målt hos ekte brukere, og ingen ekte nybegynner eller lagleder har testet den. Personaene bygger på hva vi vet om klubben.
              Før den tas i bruk av alle, anbefaler vi en pilot med et par lagledere og en test med fem ekte mennesker som er nye i klubben.
            </p>
          </div>
        </Part>

        <Part id="tidslinje" kicker="Fremdrift" title="Hvor vi er nå" pageBreak>
          <p className="muted">Seks steg. Vi er på det tredje.</p>
          <table>
            <thead>
              <tr>
                <th style={{ width: "9rem" }}>Status</th>
                <th>Steg</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Gjort", "Styret har besluttet at Spond-nettsiden er for dyr."],
                ["Gjort", "Nettside bygget: nettsiden og administrasjonen, med BOC som klubb."],
                ["Her er vi", "Demo for styret."],
                ["Neste", "Beslutning om veien videre."],
                ["Neste", "Eventuell revisjon."],
                ["Neste", "Implementering av ny nettside."],
              ].map(([d, t]) => (
                <tr key={t}>
                  <td>
                    <b>{d}</b>
                  </td>
                  <td>{t}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Part>

        <Part id="systemer" kicker="Systemene" title="Hva som ligger bak siden">
          <p>
            Nettsiden hviler på noen få tjenester. Alle er beskrevet i personvernerklæringen (boc.jakobjolstad.com/personvern), med hva de ser og hvorfor. Hver gjør én ting.
          </p>
          <table>
            <thead>
              <tr>
                <th style={{ width: "6rem" }}>Tjeneste</th>
                <th style={{ width: "7rem" }}>Gjør</th>
                <th>Hva den ser</th>
                <th style={{ width: "13rem" }}>Pris</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Vercel", "Kjører nettsiden", "Besøkende (IP-adresse og side i serverlogg), og selve nettsiden.", "Trolig gratis. Den gratis planen er til personlig, ikke-kommersiell bruk, og siden kjøres fra Jakobs konto uten inntekter, så Vercel kan likevel kreve Pro: 200 kr i måneden (20 USD), én plass, siden admins ikke teller som utviklere."],
                ["Supabase", "Lagrer og logger inn", "Innhold som er endret i administrasjonen, bilder og portretter, og e-postadresser til dem som har tilgang.", "Trolig gratis. Grensene er 1 GB filer, 500 MB database og 5 GB utgående data i måneden (databasen er i dag på ca. 30 MB). Prosjektet pauses bare om ingen besøker siden på en uke. Pro: 250 kr i måneden (25 USD)."],
                ["Resend", "Sender e-post", "Mottakerens e-postadresse og innholdet i meldingen: invitasjoner, innloggingskoder og forespørsler om samtykke til bilder.", "Gratis opp til 3 000 e-poster i måneden og 100 om dagen, nok for rundt 20 admins. Trolig fortsatt gratis. Pro: 200 kr i måneden (20 USD)."],
                ["GitHub", "Beholder koden", "Kildekoden og historikken over endringer.", "Dekkes av Jakob: koden ligger sammen med hans andre prosjekter."],
                ["Claude", "Hjelper med koden", "Det som står i koden og i tilbakemeldingene som sendes til bocnettside@gmail.com.", "Dekkes av Jakob: brukes i flere av hans prosjekter."],
              ].map(([n, g, s2, c]) => (
                <tr key={n}>
                  <td>
                    <b>{n}</b>
                  </td>
                  <td>{g}</td>
                  <td>{s2}</td>
                  <td>{c}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <b>Ingenting er gratis for alltid.</b> Med rundt 20 admins og dagens datamengde er det trolig at Vercel, Supabase og Resend kan holdes på gratisplanene. Gratis har likevel grenser og vilkår: vokser klubben ut av dem, eller Vercel krever Pro, blir det rundt 600 kr i måneden, 7 500 kr i året, i tillegg til eget domene. Betales alle fem, blir det rundt 800 kr i måneden. Beløpene er listeprisene hos tjenestene i oktober 2026, regnet om med 9,60 kr per dollar og rundet til nærmeste 50 kr.
          </p>
          <div className="card tint">
            <h3>Lenker ut</h3>
            <p style={{ marginTop: "0.4rem" }}>
              Nettsiden lenker til <b>Spond</b> (påmelding), <b>Strava</b> (følg klubben og medlemmer), <b>Norges idrettsforbund</b> (slik søker frivillige om politiattest) og <b>Norsk Tipping</b> (Grasrotandelen). Du er først hos dem
              når du selv klikker, og nettsiden gir dem ingen opplysninger.
            </p>
          </div>
        </Part>

        <Part id="tilbakemelding" kicker="Tilbakemelding" title="Slik blir siden bedre">
          <p>
            All tilbakemelding sendes til <b>bocnettside@gmail.com</b>. Etter første revisjon får styret en oppdatering, og alle kan bidra med utfordringer, riktig informasjon og forbedringsforslag.
          </p>
          <ol className="plain">
            <li>
              <b>Du skriver.</b> Hvilken side, hva som er feil, og hva som bør stå. «BOC 2, treningstider: tirsdag er 18.30, ikke 18.00» er en god tilbakemelding.
            </li>
            <li>
              <b>Claude leser</b> og lager et forslag til endring.
            </li>
            <li>
              <b>Vi godkjenner</b> forslaget med ett tastetrykk, og siden oppdateres.
            </li>
          </ol>
          <p className="muted">Automatikken settes opp fortløpende. Skriv ikke personopplysninger om andre i en tilbakemelding.</p>
        </Part>

        <Part id="styret" kicker="Det vi ber om" title="Syv ting vi ber om">
          <ol className="plain">
            <li>
              <b>Et ja til førstevalget.</b> At «Prøv en trening» er klubbens inngang, og at vi får måle én sesong.
            </li>
            <li>
              <b>Et valg om Spond-nettsiden.</b> Den koster 6 000 kr i året. Skal vi bruke denne nettsiden i stedet? Medlemsregisteret, påmeldingen og meldingene blir i Spond.
            </li>
            <li>
              <b>Tilgang til baerumock.no.</b> Så vi kan koble nettsiden til klubbens eget domene. Bare nettsidens adresse flyttes, e-posten på domenet røres ikke.
            </li>
            <li>
              <b>Minst to klubbadministratorer.</b> Så siden ikke hviler på én person.
            </li>
            <li>
              <b>Noen som kontrollerer bilder.</b> Innen tre dager, så den røde varselen holder seg borte.
            </li>
            <li>
              <b>Noen som svarer på personvernhenvendelser.</b> Bli fjernet, innsyn, retting. Siden gjør jobben, men noen må eie den.
            </li>
            <li>
              <b>En pilot med lagledere.</b> Inviter dem, se hva som stopper dem, og rett det før alle får tilgang.
            </li>
          </ol>
        </Part>
      </main>
    </div>
  );
}
