import { ArrowRight, Check, EyeOff, Mail, ShieldCheck, TriangleAlert } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import bocMain from "@/components/assets/BOC-main.png";
import bocWhite from "@/components/assets/BOC-white.png";
import boc3 from "@/components/assets/boc3.jpg";
import barnesykling from "@/components/assets/barnesykling.jpg";
import spinning from "@/components/assets/spinning.jpg";
import zwiftHero from "@/components/assets/boc-zwift-hero.png";
import companionAccept from "@/components/assets/zwift/companion-4-godta.png";
import companionSearch from "@/components/assets/zwift/companion-2-sok.png";
import spondEvent from "@/components/assets/spond-zwift-event.png";
import { Deck, type DeckSlide } from "@/components/deck/deck";
import { Frame, Shot, Slants, Slashes } from "@/components/deck/parts";
import { cn } from "@/lib/cn";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Brukeropplevelse og design",
  description: "Hvordan BOCs nettside og administrasjon er tenkt: problemene, menneskene, et mykere førstevalg, bilder og samtykke, og samspillet med Spond.",
  robots: { index: false, follow: false },
};

/**
 * The design story for the board, as a keynote: one idea to a slide, large
 * type, the club's own colours and slants (components/deck). The numbers on
 * slide 5 are counted from the club's data; everything else is argument,
 * and where the site has no measurements yet the deck says so (slide 16)
 * rather than invent them. The personas are design archetypes, not people.
 *
 * Mock screens are drawn here from the same tokens as the site, so they
 * stay in the club's style and never show a real person.
 */

const EYEBROW = "BOC · Brukeropplevelse";

/* ─── Small building blocks ───────────────────────────────────────────── */

const Kicker = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("text-[22px] font-semibold tracking-[0.12em] text-[var(--club-link)] uppercase", className)}>{children}</p>
);

/** A statement slide: one big sentence and a small line under it. */
function Statement({ kicker, children, sub, tone = "dark", width = 1250 }: { kicker?: string; children: ReactNode; sub?: ReactNode; tone?: "dark" | "light" | "brand"; width?: number }) {
  return (
    <>
      <Slants />
      <div className="relative flex h-full flex-col justify-center px-[120px]">
        {kicker && <Kicker className={tone === "brand" ? "text-on-club/70" : undefined}>{kicker}</Kicker>}
        <h2 className="mt-6 font-display text-[104px] leading-[1.02] font-medium tracking-[-0.035em]" style={{ maxWidth: width }}>
          {children}
        </h2>
        {sub && <p className={cn("mt-10 max-w-[1000px] text-[34px] leading-[1.3]", tone === "brand" ? "text-on-club/80" : "text-ink-2")}>{sub}</p>}
      </div>
    </>
  );
}

/** A browser window around a mock screen. */
function Browser({ url, children, className }: { url: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-xl bg-surface text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.5)] ring-1 ring-black/10", className)}>
      <div className="flex items-center gap-3 border-b border-line bg-sunken px-5 py-3">
        <span className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-3 rounded-full bg-line-strong" />
          ))}
        </span>
        <span className="rounded-md bg-surface px-4 py-1 text-[16px] text-ink-3 ring-1 ring-line">{url}</span>
      </div>
      {children}
    </div>
  );
}

/** A phone around a mock screen. */
function Phone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-[44px] bg-surface text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.55)] ring-[10px] ring-[#101820]", className)}>
      <div className="mx-auto mt-3 h-6 w-28 rounded-full bg-[#101820]" />
      {children}
    </div>
  );
}

const Pill = ({ children, on }: { children: ReactNode; on?: boolean }) => (
  <span className={cn("inline-flex items-center rounded-md px-5 py-3 text-[22px] font-medium", on ? "bg-inverse text-ink-inverse" : "bg-surface text-ink ring-1 ring-line-strong")}>{children}</span>
);

const Tag = ({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "danger" | "warning" | "success" }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-4 py-1.5 text-[20px] font-semibold",
      tone === "neutral" && "bg-sunken text-ink-2",
      tone === "danger" && "bg-danger-surface text-danger",
      tone === "warning" && "bg-warning-surface text-ink",
      tone === "success" && "bg-success-surface text-ink",
    )}
  >
    {children}
  </span>
);

const Card = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn("rounded-lg bg-surface p-8 ring-1 ring-line", className)}>{children}</div>;

const Num = ({ n }: { n: number }) => (
  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--club-primary)] font-display text-[28px] font-semibold text-[var(--club-on-primary)]">{n}</span>
);

/* ─── The deck ────────────────────────────────────────────────────────── */

export default async function UserExperience() {
  const { db, org } = await loadSite();
  const groups = org.groups(org.root.id).length;
  const disciplines = org.nodes.filter((n) => n.kind === "discipline").length;
  const venues = db.venues.length;

  const slides: DeckSlide[] = [
    /* 1 ── Title */
    {
      id: "tittel",
      tone: "dark",
      title: "En klubb du har lyst til å prøve",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <Image src={bocWhite} alt="BOC" className="mb-14 h-14 w-auto self-start" />
            <Kicker className="text-[var(--club-primary)]">UX og webdesign · for styret i BOC</Kicker>
            <h2 className="mt-5 max-w-[1250px] font-display text-[120px] leading-[0.98] font-medium tracking-[-0.035em]">En klubb du har lyst til å prøve.</h2>
            <p className="mt-8 max-w-[1100px] text-[34px] leading-[1.3] text-ink-2">Slik er nettsiden og administrasjonen tenkt, fra første besøk til siste samtykke.</p>
          </div>
        </>
      ),
    },

    /* 2 ── Everyone is new once */
    {
      id: "alle-er-nye",
      tone: "dark",
      title: "Alle er nye en gang",
      content: (
        <Statement sub="Også de som kommer til å sykle for BOC om ti år, og de som i dag står ved siden av dem.">
          Alle er nye en gang.
        </Statement>
      ),
    },

    /* 3 ── Three questions */
    {
      id: "tre-sporsmal",
      tone: "light",
      title: "Tre spørsmål står mellom et besøk og en førstetrening",
      content: (
        <Frame eyebrow={EYEBROW} title="Tre spørsmål står mellom" muted="et besøk og en første trening." logo={bocMain}>
          <div className="grid grid-cols-3 gap-8">
            {[
              ["«Passer jeg her?»", "Alder, nivå og tempo. Ikke en liste over alt klubben gjør."],
              ["«Hvem spør jeg?»", "Et navn og et ansikt. Ikke et skjema som havner hos ingen."],
              ["«Hva skjer hvis jeg bare dukker opp?»", "Hvor, når, hva jeg tar med, og hvem jeg ser etter."],
            ].map(([q, a], i) => (
              <Card key={q} className="flex flex-col gap-6 p-10">
                <Num n={i + 1} />
                <p className="font-display text-[44px] leading-[1.08] font-medium tracking-[-0.025em]">{q}</p>
                <p className="text-[26px] leading-[1.35] text-ink-2">{a}</p>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 4 ── The other side */
    {
      id: "andre-siden",
      tone: "dark",
      title: "Og tre ting står mellom klubben og en nettside som holder",
      content: (
        <Frame eyebrow={EYEBROW} title="Og tre ting står mellom klubben" muted="og en nettside som holder." logo={bocWhite}>
          <div className="grid grid-cols-3 gap-8">
            {[
              ["Frivillige har ti minutter.", "Siden må kunne oppdateres fra mobilen, mellom to ting, uten opplæring."],
              ["Bilder av barn er ikke en detalj.", "Hvem som vises, hvem som har sagt ja, og hva som skjer når noen ombestemmer seg."],
              ["Alt hviler på én person.", "Når den ene slutter, må klubben fortsatt komme inn, og vite hvem som gjorde hva."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-lg bg-surface p-10 ring-1 ring-line">
                <p className="font-display text-[44px] leading-[1.08] font-medium tracking-[-0.025em]">{q}</p>
                <p className="mt-6 text-[26px] leading-[1.35] text-ink-2">{a}</p>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 5 ── What we built, in numbers */
    {
      id: "hva-vi-bygde",
      tone: "light",
      title: "Det vi har bygget",
      content: (
        <Frame eyebrow={EYEBROW} title="Det vi har bygget." muted="Tre rom i ett hus." logo={bocMain}>
          <dl className="grid grid-cols-3 border-t border-line">
            {[
              [String(groups), "grupper med hver sin side", "Nettsiden for dem som er nye"],
              [String(venues), "treningssteder, fra Bekkestua torg til Zwift-appen", "Administrasjonen for dem som holder den oppe"],
              [String(disciplines), "grener, fra barn til Zwift", "Personvernet som ligger i bunnen av alt"],
            ].map(([value, label, room]) => (
              <div key={label} className="relative flex flex-col gap-3 py-10 pr-8 pl-8 first:pl-0">
                <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-line" style={{ transform: "skewX(-21.25deg)" }} />
                <dd className="font-display text-[150px] leading-none font-medium tracking-[-0.04em] text-[var(--club-link)]">{value}</dd>
                <dt className="text-[26px] leading-[1.3] text-ink-2">{label}</dt>
                <p className="mt-6 border-t border-line pt-5 text-[26px] leading-[1.3] font-medium">{room}</p>
              </div>
            ))}
          </dl>
        </Frame>
      ),
    },

    /* 6 ── Personas: the visitors */
    {
      id: "personas-besokende",
      tone: "light",
      title: "Tre som besøker siden",
      content: (
        <Frame eyebrow={`${EYEBROW} · Personas, arketyper og ikke enkeltpersoner`} title="Tre som besøker." logo={bocMain}>
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                who: "Forelderen",
                words: "«Jeg vil at barnet mitt skal ha det gøy sammen med noen som passer på.»",
                needs: "Alder og nivå, hvem som er trener, hva som skjer med bildene.",
                fear: "Å sende barnet til noe jeg ikke forstår.",
                door: "/barn-og-ungdom",
              },
              {
                who: "Den voksne nybegynneren",
                words: "«Jeg tror jeg er for treg for en klubb.»",
                needs: "Se at folk som henne er med. En rolig gruppe. Et sted å starte.",
                fear: "Å henge etter, og å bli sett.",
                door: "Forsiden og «Finn gruppen din»",
              },
              {
                who: "Den erfarne syklisten",
                words: "«Jeg har sykla i mange år. Jeg leter etter en god treningsgruppe.»",
                needs: "Tydelig tempo, treningstider som passer, og hvem man sykler med.",
                fear: "Å havne i en gruppe som er for treg, eller å bruke kvelder på å finne ut av det.",
                door: "Forsiden, finneren og gruppesidenes fart",
              },
            ].map((p) => (
              <Card key={p.who} className="flex flex-col gap-3 p-7">
                <p className="font-display text-[38px] leading-[1.05] font-medium tracking-[-0.02em]">{p.who}</p>
                <p className="text-[22px] leading-[1.3] text-ink-2 italic">{p.words}</p>
                <div className="border-t border-line pt-3 text-[21px] leading-[1.3]">
                  <p>
                    <b className="font-semibold">Trenger:</b> {p.needs}
                  </p>
                  <p className="mt-3">
                    <b className="font-semibold">Frykter:</b> {p.fear}
                  </p>
                  <p className="mt-2 text-ink-3">Kommer inn via {p.door}</p>
                </div>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 7 ── Personas: behind the scenes */
    {
      id: "personas-bak-kulissene",
      tone: "dark",
      title: "To som holder siden oppe",
      content: (
        <Frame eyebrow={`${EYEBROW} · Personas`} title="To som holder den oppe." muted="Og som ikke er webredaktører." logo={bocWhite}>
          <div className="grid grid-cols-2 gap-8">
            {[
              {
                who: "Laglederen",
                words: "«Jeg er frivillig. Jeg har ti minutter.»",
                needs: "Logge inn uten passord, legge ut fra mobilen, ikke kunne ødelegge noe.",
                fear: "Å publisere feil bilde av feil barn.",
              },
              {
                who: "Styret og klubbadministratoren",
                words: "«Jeg må kunne stå inne for det.»",
                needs: "Oversikt over hva som skjer, kontroll over hvem som har tilgang, spor etter hver endring.",
                fear: "At alt er avhengig av én person, eller at noe går galt uten at noen vet det.",
              },
            ].map((p) => (
              <div key={p.who} className="rounded-lg bg-surface p-8 ring-1 ring-line">
                <p className="font-display text-[44px] leading-[1.05] font-medium tracking-[-0.02em]">{p.who}</p>
                <p className="mt-4 text-[26px] leading-[1.35] text-ink-2 italic">{p.words}</p>
                <div className="mt-5 border-t border-line pt-4 text-[24px] leading-[1.4]">
                  <p>
                    <b className="font-semibold">Trenger:</b> {p.needs}
                  </p>
                  <p className="mt-4">
                    <b className="font-semibold">Frykter:</b> {p.fear}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[22px] text-ink-3">Personaene bygger på det vi vet om klubben, ikke på intervjuer. Neste steg er å teste med fem ekte mennesker.</p>
        </Frame>
      ),
    },

    /* 8 ── The insight */
    {
      id: "innsikt",
      tone: "brand",
      title: "Innsikten",
      content: (
        <Statement tone="brand" kicker="Innsikten" width={1300} sub="Derfor starter siden med å hjelpe deg å finne ut om du passer, ikke med å be om at du melder deg inn.">
          Folk melder seg ikke inn for å finne ut om de passer.
        </Statement>
      ),
    },

    /* 9 ── The commitment ladder */
    {
      id: "stigen",
      tone: "dark",
      title: "Bli medlem er et løfte",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="«Bli medlem» er et løfte." muted="Det er for tidlig å be om det først." logo={bocWhite}>
          <div className="flex h-full items-end gap-4 pb-6">
            {[
              ["Se", "Hva slags klubb er dette?", 90],
              ["Finn", "Hvilken gruppe passer meg?", 160],
              ["Prøv", "En trening, ingen forpliktelse", 230],
              ["Bli med", "Gruppa jeg har prøvd", 320],
              ["Bli medlem", "Betale, forplikte, høre til", 430],
            ].map(([step, text, h], i) => (
              <div key={step as string} className="flex flex-1 flex-col justify-end">
                <div
                  className={cn("flex flex-col justify-end p-6", i === 2 ? "bg-[var(--club-primary)] text-[var(--club-on-primary)]" : i === 4 ? "bg-surface ring-1 ring-line-strong" : "bg-surface ring-1 ring-line")}
                  style={{ height: h as number }}
                >
                  <p className="font-display text-[38px] leading-none font-medium tracking-[-0.02em]">{step}</p>
                  <p className={cn("mt-3 text-[20px] leading-[1.3]", i === 2 ? "" : "text-ink-3")}>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 10 ── Two buttons compared */
    {
      id: "to-knapper",
      tone: "light",
      title: "Bli medlem mot Prøv en trening",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="To knapper." muted="To helt ulike spørsmål." logo={bocMain}>
          <div className="grid grid-cols-[300px_1fr_1fr] gap-x-8 gap-y-0 text-[26px] leading-[1.35]">
            <span />
            <p className="border-b-2 border-line-strong pb-4 font-display text-[40px] font-medium tracking-[-0.02em] text-ink-3">«Bli medlem»</p>
            <p className="border-b-2 border-[var(--club-primary)] pb-4 font-display text-[40px] font-medium tracking-[-0.02em]">«Prøv en trening»</p>
            {[
              ["Jeg må bestemme", "Gruppe, betaling og å høre til, før jeg har sett noe.", "Bare om jeg vil dukke opp en gang."],
              ["Jeg risikerer", "At det ikke passer, og at jeg har bundet meg.", "En time av kvelden."],
              ["Jeg får vite", "Ingenting nytt. Jeg har bare svart ja.", "Om tempoet, folka og stedet passer."],
              ["Det neste er", "Et skjema.", "Et sted, et klokkeslett og en person å se etter."],
            ].map(([k, a, b]) => (
              <div key={k} className="contents">
                <p className="border-b border-line py-4 font-semibold">{k}</p>
                <p className="border-b border-line py-4 text-ink-3">{a}</p>
                <p className="border-b border-line py-4">{b}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[22px] text-ink-3">«Bli medlem» står fortsatt i menyen og på egen side, for dem som har bestemt seg.</p>
        </Frame>
      ),
    },

    /* 11 ── Why it works */
    {
      id: "hvorfor",
      tone: "dark",
      title: "Hvorfor et mykere førstevalg fungerer",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="Hvorfor et mykere valg" muted="slår et hardt." logo={bocWhite}>
          <div className="grid grid-cols-3 gap-8">
            {[
              ["Mindre risiko", "Et ja som kan angres, er lettere å si. Folk tar gjerne små steg de kan snu fra, og blir ofte værende etter det."],
              ["Konkret", "«Tirsdag 18.00 på Bekkestua torg» er noe man kan gjøre. «Bli medlem» er noe man må tenke på."],
              ["Færre valg", "Jo flere veier som står åpne samtidig, desto lengre tid tar det å velge. Siden viser ett neste steg om gangen."],
            ].map(([h, t]) => (
              <div key={h} className="rounded-lg bg-surface p-10 ring-1 ring-line">
                <p className="font-display text-[48px] leading-[1.05] font-medium tracking-[-0.025em] text-[var(--club-primary)]">{h}</p>
                <p className="mt-6 text-[26px] leading-[1.4] text-ink-2">{t}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[22px] text-ink-3">Kjent som commitment ladder, foot in the door og Hicks lov. Prinsippene er veletablerte. Hvor mye de løfter akkurat BOC, har vi ikke målt ennå.</p>
        </Frame>
      ),
    },

    /* 12 ── The journey */
    {
      id: "reisen",
      tone: "light",
      title: "Reisen på nettsiden",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="Reisen." muted="Fem steg, ingen blindgater." logo={bocMain}>
          <ol className="grid grid-cols-5 gap-5">
            {[
              ["Forsiden", "Hvem er vi? Medlemmenes egne ord. Handlingen er «Finn gruppen din»."],
              ["Finneren", "Tre spørsmål: alder, gren og tempo. Hopper over de som ikke endrer svaret."],
              ["Gruppesiden", "Først det du trenger før første trening. Så resten."],
              ["Prøv en trening", "Knappen går til gruppas Spond. Ingen konto hos oss."],
              ["Bli medlem", "Når du har prøvd, og vil mer."],
            ].map(([h, t], i) => (
              <li key={h} className={cn("flex flex-col gap-4 rounded-lg p-6 ring-1", i === 3 ? "bg-[var(--club-primary)] text-[var(--club-on-primary)] ring-transparent" : "bg-surface ring-line")}>
                <span className="font-display text-[56px] leading-none font-medium tracking-[-0.03em] opacity-60">{i + 1}</span>
                <p className="font-display text-[34px] leading-[1.05] font-medium tracking-[-0.02em]">{h}</p>
                <p className={cn("text-[22px] leading-[1.35]", i === 3 ? "" : "text-ink-2")}>{t}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-[26px] text-ink-2">Og siden sier aldri at en gruppe er full. Hver gruppe skal lese som en man kan prøve.</p>
        </Frame>
      ),
    },

    /* 13 ── The finder */
    {
      id: "finneren",
      tone: "dark",
      title: "Finn gruppen din",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_760px] items-center gap-16 px-[120px]">
            <div>
              <Kicker>Steg 2 · Finneren</Kicker>
              <h2 className="mt-6 font-display text-[84px] leading-[1.02] font-medium tracking-[-0.03em]">Tre spørsmål. Ikke tretti.</h2>
              <p className="mt-8 text-[30px] leading-[1.35] text-ink-2">Svarene rangerer gruppene etter hvor nær de ligger deg, og ett spørsmål hoppes over når svaret ikke ville endret noe.</p>
            </div>
            <div className="rounded-xl bg-surface p-10 text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] ring-1 ring-line">
              <p className="text-[20px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Spørsmål 3 av 3</p>
              <p className="mt-3 font-display text-[44px] leading-[1.05] font-medium tracking-[-0.02em]">Hvordan er formen?</p>
              <div className="mt-8 grid gap-3">
                {[
                  ["Under 22 km/t", "Rolig tur, gjerne med stopp", false],
                  ["22–25 km/t", "Behagelig tempo uten å presse deg", true],
                  ["25–28 km/t", "Jevnt og godt tempo", false],
                  ["Usikker", "Vis alle nivåer", false],
                ].map(([l, h, on]) => (
                  <div key={l as string} className={cn("flex items-baseline justify-between rounded-md px-6 py-4", on ? "bg-inverse text-ink-inverse" : "ring-1 ring-line-strong")}>
                    <span className="text-[26px] font-semibold">{l}</span>
                    <span className={cn("text-[20px]", on ? "text-ink-inverse/70" : "text-ink-3")}>{h}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[20px] text-ink-3">«Usikker» er et eget svar. Det er det mange tenker.</p>
            </div>
          </div>
        </>
      ),
    },

    /* 14 ── Before the first training */
    {
      id: "foer-forste-trening",
      tone: "light",
      title: "Før første trening",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_820px] items-center gap-16 px-[120px]">
            <div>
              <Kicker>Steg 3 · Gruppesiden</Kicker>
              <h2 className="mt-6 font-display text-[68px] leading-[1.04] font-medium tracking-[-0.03em]">Svaret på «hva skjer hvis jeg bare dukker opp?»</h2>
              <p className="mt-8 text-[30px] leading-[1.35] text-ink-2">Hver gruppeside åpner med det en fremmed trenger, og som lagleder fyller ut selv. Står feltet tomt, arver det svaret fra nivået over.</p>
            </div>
            <div>
            <Browser url="boc.jakobjolstad.com/sykkel/landevei/boc-3">
              <div className="p-8">
                <p className="text-[18px] font-semibold tracking-[0.1em] text-[var(--club-link)] uppercase">Før første trening</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-5 text-[22px] leading-[1.3]">
                  {[
                    ["Hvor", "Bekkestua torg"],
                    ["Når", "Tirsdag og torsdag kl. 18.00"],
                    ["Hvor lenge", "Fra sesongstart til høsten"],
                    ["Når du kommer", "Noen minutter før"],
                    ["Meld deg på", "I Spond, før første gang"],
                    ["Se etter", "Gruppeleder i BOC-drakt"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-ink-3">{k}</dt>
                      <dd className="font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-8 flex items-center justify-between bg-[var(--club-primary)] px-7 py-6 text-[var(--club-on-primary)]">
                  <p className="font-display text-[30px] leading-[1.05] font-medium tracking-[-0.02em]">Prøv en trening med BOC 3</p>
                  <span className="flex items-center gap-2 bg-[var(--action,#125a6b)] px-5 py-3 text-[20px] font-semibold text-white">
                    Bli med i Spond <ArrowRight aria-hidden className="size-5" />
                  </span>
                </div>
              </div>
            </Browser>
            <p className="mt-4 text-[16px] text-ink-3">Illustrasjon av hva siden viser. Hver gruppe fyller ut sine egne svar.</p>
            </div>
          </div>
        </>
      ),
    },

    /* 15 ── Try one → Spond */
    {
      id: "prov-spond",
      tone: "dark",
      title: "Prøv en trening, og så Spond",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="«Prøv en trening»" muted="fører rett til der man melder seg på." logo={bocWhite}>
          <div className="grid grid-cols-[1fr_380px] items-start gap-16">
            <div className="grid gap-7">
              {[
                "Knappen i bunnen av gruppesiden åpner gruppas egen Spond-gruppe.",
                "Spond spør om du er «member» eller «parent». Siden forklarer på forhånd at du velger «member» selv om du ikke er meldt inn i BOC ennå.",
                "Du møter opp, og først etterpå er det en grunn til å si «Bli medlem».",
              ].map((t, i) => (
                <div key={t} className="flex items-start gap-6">
                  <Num n={i + 1} />
                  <p className="text-[30px] leading-[1.3]">{t}</p>
                </div>
              ))}
              <p className="mt-2 text-[24px] text-ink-3">Små ord på riktig sted fjerner det som ellers stopper folk i Spond: valget de ikke vet svaret på.</p>
            </div>
            <Shot src={spondEvent} alt="Spond: en økt med Attending og Decline" className="w-[380px]" />
          </div>
        </Frame>
      ),
    },

    /* 16 ── How we measure */
    {
      id: "maling",
      tone: "light",
      title: "Hvordan vi vet om det virker",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="Hvordan vi vet om det virker." muted="Vi har ingen tall ennå." logo={bocMain}>
          <div className="grid grid-cols-3 gap-8">
            {[
              ["1", "Hva folk trykker på", "«Prøv en trening» mot «Bli medlem». Bare med samtykke, fordi siden ikke har statistikk uten at besøkende sier ja."],
              ["2", "Hvem som kommer til Spond", "Nye i gruppenes Spond per måned, før og etter lansering. Tallene finnes allerede hos laglederne."],
              ["3", "Hvem som møter opp, og blir", "Antall på første trening, og hvor mange som er med igjen om en måned. Det er det klubben egentlig vil ha."],
            ].map(([n, h, t]) => (
              <Card key={h} className="p-9">
                <Num n={Number(n)} />
                <p className="mt-6 font-display text-[38px] leading-[1.08] font-medium tracking-[-0.02em]">{h}</p>
                <p className="mt-4 text-[24px] leading-[1.4] text-ink-2">{t}</p>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-[24px] text-ink-2">Forslag: mål én sesong, og la tallene avgjøre om førstevalget skal være enda mykere, eller litt tøffere.</p>
        </Frame>
      ),
    },

    /* 17 ── Section: behind the scenes */
    {
      id: "bak-kulissene",
      tone: "brand",
      title: "Bak kulissene",
      content: (
        <Statement tone="brand" kicker="Bak kulissene" sub="En nettside er bare så god som det som står på den, og det er frivillige som skriver det.">
          Frivillige er ikke webredaktører.
        </Statement>
      ),
    },

    /* 18 ── Roles */
    {
      id: "roller",
      tone: "light",
      title: "Hvem kan hva",
      content: (
        <Frame eyebrow={`${EYEBROW} · Administrasjon`} title="Hvem kan hva." muted="Tilgang følger ansvaret." logo={bocMain}>
          <div className="grid grid-cols-[1fr_520px] gap-14">
            <ol className="grid gap-3">
              {[
                ["Klubbadministrator", "Hele klubben: brukere, bilder, forsiden"],
                ["Seksjonsadmin", "Én gren, for eksempel Landevei"],
                ["Gruppeadmin", "Én gruppe, for eksempel BOC 3"],
                ["Bidragsyter", "Skriver innlegg som godkjennes"],
                ["Foresatt", "Knyttet til sitt barn"],
              ].map(([r, s], i) => (
                <li key={r} className="flex items-center gap-6 rounded-lg bg-surface px-7 py-5 ring-1 ring-line" style={{ marginLeft: i * 36 }}>
                  <span className="font-display text-[32px] leading-none font-medium tracking-[-0.02em]">{r}</span>
                  <span className="text-[22px] text-ink-3">{s}</span>
                </li>
              ))}
            </ol>
            <div className="grid content-start gap-5 text-[26px] leading-[1.35]">
              <p>
                <b className="font-semibold">Arves nedover.</b> Den som styrer en gren, styrer gruppene under.
              </p>
              <p>
                <b className="font-semibold">Aldri uten ansvarlig.</b> Klubben må alltid ha en aktiv klubbadministrator, og ingen kan låse seg selv ute.
              </p>
              <p>
                <b className="font-semibold">Alt logges.</b> Hvem gjorde hva, og når.
              </p>
            </div>
          </div>
        </Frame>
      ),
    },

    /* 19 ── Login */
    {
      id: "innlogging",
      tone: "dark",
      title: "Innlogging uten passord",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_380px] items-center gap-24 px-[120px]">
            <div>
              <Kicker>Administrasjon · Innlogging</Kicker>
              <h2 className="mt-6 font-display text-[88px] leading-[1.02] font-medium tracking-[-0.03em]">Ingen passord å glemme.</h2>
              <p className="mt-8 text-[30px] leading-[1.35] text-ink-2">Du skriver e-postadressen din og får en kode på seks siffer. På iPhone foreslår Safari koden fra e-posten selv, så den er innlogget ett trykk senere.</p>
              <p className="mt-6 text-[24px] text-ink-3">Nye administratorer inviteres av klubbadministrator og får en e-post med knapp rett til innloggingen.</p>
            </div>
            <Phone className="h-[720px]">
              <div className="p-8">
                <p className="mt-6 font-display text-[34px] leading-[1.05] font-medium tracking-[-0.02em]">Skriv inn koden</p>
                <p className="mt-3 text-[18px] leading-[1.35] text-ink-2">Vi har sendt en kode med seks siffer. Den gjelder i ti minutter.</p>
                <div className="mt-8 rounded-md ring-1 ring-line-strong">
                  <p className="py-5 text-center font-display text-[40px] tracking-[0.35em]">4 8 1 5 2 7</p>
                </div>
                <div className="mt-4 bg-[var(--action,#125a6b)] py-4 text-center text-[20px] font-semibold text-white">Logg inn</div>
                <div className="mt-10 rounded-md bg-sunken p-4 text-[16px] text-ink-2">
                  <p className="font-semibold text-ink">Fra Mail</p>
                  <p>481527</p>
                </div>
              </div>
            </Phone>
          </div>
        </>
      ),
    },

    /* 20 ── A new post */
    {
      id: "nytt-innlegg",
      tone: "light",
      title: "Nytt innlegg på under ett minutt",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_700px] items-center gap-16 px-[120px]">
            <div>
              <Kicker>Administrasjon · Nytt innlegg</Kicker>
              <h2 className="mt-6 font-display text-[68px] leading-[1.04] font-medium tracking-[-0.03em]">Fra tur til nettside på under ett minutt.</h2>
              <ol className="mt-8 grid gap-4 text-[26px] leading-[1.3]">
                {["Skriv noen setninger", "Legg til bilder fra telefonen", "Si hvem som tok dem, og hvem som er med", "Publiser, eller send til godkjenning"].map((t, i) => (
                  <li key={t} className="flex items-center gap-5">
                    <Num n={i + 1} />
                    {t}
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-[22px] text-ink-3">Bildetekst og alt-tekst lages av systemet, uten navn. Bildene skaleres, og posisjon og kameradata fjernes i telefonen før de sendes.</p>
            </div>
            <Browser url="boc.jakobjolstad.com/admin/publiser">
              <div className="p-8">
                <p className="font-display text-[34px] font-medium tracking-[-0.02em]">Søndagstur til Lommedalen</p>
                <p className="mt-3 text-[20px] leading-[1.4] text-ink-2">Strålende vær og god stemning. 23 stilte opp, og alle kom hjem med smil.</p>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[boc3, barnesykling, spinning].map((s, i) => (
                    <Image key={i} src={s} alt="" className="aspect-square w-full rounded-md object-cover" />
                  ))}
                </div>
                <div className="mt-6 grid gap-3 text-[18px]">
                  <div className="flex items-center justify-between rounded-md bg-sunken px-5 py-3">
                    <span className="text-ink-3">Fotograf</span>
                    <span className="font-semibold">BOC</span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-sunken px-5 py-3">
                    <span className="text-ink-3">Hvem er med på bildet?</span>
                    <span className="font-semibold">8 valgt</span>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-[18px] text-ink-3">Illustrasjon · publiseres direkte</p>
                  <span className="bg-[var(--action,#125a6b)] px-6 py-3 text-[20px] font-semibold text-white">Publiser</span>
                </div>
              </div>
            </Browser>
          </div>
        </>
      ),
    },

    /* 21 ── The system speaks up */
    {
      id: "varsler",
      tone: "dark",
      title: "Systemet sier ifra",
      content: (
        <Frame eyebrow={`${EYEBROW} · Administrasjon · Eksempler`} title="Systemet sier ifra." muted="Så ingen må huske alt." logo={bocWhite}>
          <div className="grid max-w-[1250px] gap-5">
            {[
              [<TriangleAlert key="a" className="size-8 text-danger" aria-hidden />, "2 bilder har ventet i over tre dager på kontroll", "Bildene er allerede på nettsiden. Rød varsel når de blir stående.", "danger"],
              [<TriangleAlert key="b" className="size-8 text-warning" aria-hidden />, "Grupper uten kontaktperson", "Gruppene markeres med rødt, så ingen som vil prøve står uten noen å spørre.", "warning"],
              [<Check key="c" className="size-8 text-success" aria-hidden />, "1 sitat venter på godkjenning for forsiden", "Laglederen foreslår. Klubbadministrator bestemmer hva forsiden sier om klubben.", "success"],
            ].map(([icon, h, t, tone], i) => (
              <div key={i} className="flex items-start gap-6 rounded-lg bg-surface p-8 ring-1 ring-line">
                <span className="mt-1">{icon as ReactNode}</span>
                <div>
                  <p className="font-display text-[36px] leading-[1.1] font-medium tracking-[-0.02em]">{h as string}</p>
                  <p className="mt-2 text-[24px] leading-[1.35] text-ink-2">{t as string}</p>
                </div>
                <span className="ml-auto shrink-0">
                  <Tag tone={tone as "danger" | "warning" | "success"}>{tone === "danger" ? "Haster" : tone === "warning" ? "Mangler" : "Til deg"}</Tag>
                </span>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 22 ── Section: consent */
    {
      id: "samtykke",
      tone: "brand",
      title: "Samtykke",
      content: (
        <Statement tone="brand" kicker="Samtykke" sub="Et bilde av et barn er personopplysninger. Siden er laget så den riktige veien også er den enkleste.">
          Bilder av barn er ikke en detalj.
        </Statement>
      ),
    },

    /* 23 ── The consent flow */
    {
      id: "samtykke-flyt",
      tone: "light",
      title: "Slik går et bilde fra mobil til nettside",
      content: (
        <Frame eyebrow={`${EYEBROW} · Samtykke`} title="Hvem er med på bildet?" muted="Spørsmålet stilles hver gang." logo={bocMain}>
          <div className="grid grid-cols-[1fr_60px_1fr_60px_1.5fr] items-center gap-3">
            <Card className="p-7">
              <p className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">Last opp</p>
              <p className="mt-3 text-[22px] leading-[1.35] text-ink-2">Fotograf må oppgis, og kan være «BOC».</p>
            </Card>
            <ArrowRight aria-hidden className="size-10 text-ink-3" />
            <Card className="p-7">
              <p className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">Merk personer</p>
              <p className="mt-3 text-[22px] leading-[1.35] text-ink-2">Velg alle i gruppa med ett trykk, eller «ingen kan kjennes igjen».</p>
            </Card>
            <ArrowRight aria-hidden className="size-10 text-ink-3" />
            <div className="grid gap-3">
              <Card className="flex items-center gap-5 p-6">
                <ShieldCheck aria-hidden className="size-9 shrink-0 text-success" />
                <p className="text-[24px] leading-[1.3]">
                  <b className="font-semibold">Alle har sagt ja:</b> publiseres med en gang.
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-[24px] leading-[1.3]">
                  <b className="font-semibold">Noen mangler samtykke:</b> publisering sperres, og tre veier åpnes.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Tag>Ta personen ut</Tag>
                  <Tag>
                    <EyeOff aria-hidden className="mr-2 size-5" />
                    Sladd ansiktet
                  </Tag>
                  <Tag>
                    <Mail aria-hidden className="mr-2 size-5" />
                    Be om samtykke
                  </Tag>
                </div>
              </Card>
            </div>
          </div>
          <p className="mt-6 max-w-[1200px] text-[24px] leading-[1.35] text-ink-2">Klubbadministrator kontrollerer svarene etterpå og kan rette dem. Kontrollen stopper aldri en publisering, men blir den liggende, kommer det en rød varsel.</p>
        </Frame>
      ),
    },

    /* 24 ── The e-mail */
    {
      id: "godkjenn-bildet",
      tone: "dark",
      title: "Godkjenn dette bildet",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_640px] items-center gap-20 px-[120px]">
            <div>
              <Kicker>Samtykke · På e-post</Kicker>
              <h2 className="mt-6 font-display text-[84px] leading-[1.02] font-medium tracking-[-0.03em]">Bildene venter på et ja.</h2>
              <ul className="mt-10 grid gap-5 text-[28px] leading-[1.3] text-ink-2">
                <li>Innlegget publiseres, men bildene er skjult til personen, eller en forelder, har svart.</li>
                <li>Svaret gjelder bare de bildene. Det er ikke et generelt samtykke.</li>
                <li>Et nei holder bildene skjult for alltid.</li>
              </ul>
            </div>
            <div className="overflow-hidden bg-white text-[#0b1315] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
              <div className="flex items-baseline gap-4 bg-[#0b1315] px-8 py-5 text-white">
                <span className="font-display text-[34px] font-bold tracking-[0.2em]">BOC</span>
                <span className="text-[16px] font-semibold">Bærum og Omegn Cykleklubb</span>
              </div>
              <div className="h-[6px] bg-[#f7fd00]" />
              <div className="px-8 py-8">
                <p className="font-display text-[34px] leading-[1.1] font-semibold">Godkjenn bildene</p>
                <p className="mt-4 text-[20px] leading-[1.4]">Laglederen vil legge ut 2 bilder der barnet ditt kan kjennes igjen, på nettsiden til BOC 3.</p>
                <p className="mt-3 text-[20px] leading-[1.4] text-[#425168]">Bildene legges ikke ut før du har sagt ja.</p>
                <span className="mt-6 inline-block bg-[#125a6b] px-7 py-3 text-[20px] font-semibold text-white">Se bildene og svar</span>
              </div>
            </div>
          </div>
        </>
      ),
    },

    /* 25 ── Names only with consent + anonymisation */
    {
      id: "navn-kun-med-samtykke",
      tone: "light",
      title: "Navn og ansikter bare med samtykke",
      content: (
        <Frame eyebrow={`${EYEBROW} · Samtykke`} title="Navn og ansikter" muted="bare med samtykke." logo={bocMain}>
          <div className="grid grid-cols-[1fr_640px] gap-16">
            <div className="grid content-start gap-5 text-[27px] leading-[1.35]">
              <p>
                På gruppesiden vises bare dem som har sagt ja til bilder og har lagt ut et bilde. Resten er et tall: <b className="font-semibold">«og 16 andre medlemmer».</b>
              </p>
              <p>Barn vises aldri med navn i en liste.</p>
              <p>
                <b className="font-semibold">Vil noen bort, er det permanent.</b> Navn i tekst byttes med en nøytral omtale, personen dekkes til i alle bilder, også gamle, og sitater fjernes.
              </p>
              <p className="text-[22px] text-ink-3">Gruppelederne har ingen e-postadresse på siden. De nås i Spond, og telefonnummeret er for turer og endringer samme dag.</p>
            </div>
            <Card className="self-start p-7">
              <p className="font-display text-[30px] font-medium tracking-[-0.02em]">7 utøvere i BOC 3</p>
              <ul className="mt-5 grid grid-cols-7 gap-3">
                {["Leder", "", "", "", "", "", ""].map((t, i) => (
                  <li key={i}>
                    <div className={cn("aspect-square rounded-md", i === 0 ? "bg-[var(--club-primary)]" : "bg-sunken ring-1 ring-line")} />
                    <p className="mt-1 truncate text-[14px] font-semibold text-ink-2">{t || "Navn"}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-[22px] text-ink-2">og 16 andre medlemmer</p>
              <p className="mt-3 text-[16px] text-ink-3">Illustrasjon. Ingen ekte personer vises her.</p>
            </Card>
          </div>
        </Frame>
      ),
    },

    /* 26 ── Spond: not replacing */
    {
      id: "spond",
      tone: "dark",
      title: "Vi erstatter ikke Spond",
      content: (
        <Frame eyebrow={`${EYEBROW} · Spond`} title="Vi erstatter ikke Spond." muted="Vi gjør den lettere å finne." logo={bocWhite}>
          <div className="grid grid-cols-[1fr_130px_1fr] items-stretch gap-4">
            <div className="rounded-lg bg-surface p-8 ring-1 ring-line">
              <p className="font-display text-[44px] font-medium tracking-[-0.02em] text-[var(--club-primary)]">Nettsiden</p>
              <p className="mt-2 text-[22px] text-ink-3">For dem som ennå ikke er med</p>
              <ul className="mt-5 grid gap-2 text-[24px] leading-[1.3]">
                {["Finne og forstå gruppene", "Se hvem man møter", "Ukerytmen og terminlisten", "Historier og bilder", "Prøve en trening"].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-center justify-center gap-6 text-center text-[18px] text-ink-3">
              <div>
                <ArrowRight aria-hidden className="mx-auto size-10 text-[var(--club-primary)]" />
                <p className="mt-1">«Prøv en trening»</p>
              </div>
              <div>
                <ArrowRight aria-hidden className="mx-auto size-10 rotate-180 text-[var(--club-primary)]" />
                <p className="mt-1">Medlemsliste inn</p>
              </div>
            </div>
            <div className="rounded-lg bg-surface p-8 ring-1 ring-line">
              <p className="font-display text-[44px] font-medium tracking-[-0.02em]">Spond</p>
              <p className="mt-2 text-[22px] text-ink-3">For dem som er med</p>
              <ul className="mt-5 grid gap-2 text-[24px] leading-[1.3]">
                {["Påmelding til hver økt", "Siste liten-endringer", "Meldinger til gruppa", "Medlemmene og deres svar"].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 text-[24px] text-ink-2">Én regel holder det rent: siden viser det som gjelder en hel sesong. Det som endres fra dag til dag, bor i Spond.</p>
        </Frame>
      ),
    },

    /* 27 ── The Spond import */
    {
      id: "spond-import",
      tone: "light",
      title: "Det vi henter fra Spond, og det vi aldri henter",
      content: (
        <Frame eyebrow={`${EYEBROW} · Spond`} title="Det vi henter," muted="og det vi aldri henter." logo={bocMain}>
          <div className="grid grid-cols-2 gap-10">
            <Card className="p-10">
              <Tag tone="success">Leser vi</Tag>
              <ul className="mt-6 grid gap-4 text-[32px] leading-[1.2] font-medium">
                <li>Navn</li>
                <li>Fødselsår</li>
                <li>Samtykke til bilder</li>
              </ul>
              <p className="mt-6 text-[22px] leading-[1.35] text-ink-2">Laglederen ser hver rad før noe lagres, og nye personer settes som «Ikke publiser» til noen har tatt stilling.</p>
            </Card>
            <Card className="p-10">
              <Tag tone="danger">Leser vi aldri</Tag>
              <ul className="mt-6 grid gap-4 text-[32px] leading-[1.2] font-medium text-ink-2">
                <li>E-post og telefon</li>
                <li>Adresse og skole</li>
                <li>Politiattest</li>
                <li>Opplysninger om foresatte</li>
              </ul>
              <p className="mt-6 text-[22px] leading-[1.35] text-ink-2">Det Spond allerede forvalter, skal ikke ligge to steder.</p>
            </Card>
          </div>
        </Frame>
      ),
    },

    /* 28 ── Zwift: two apps, one guide */
    {
      id: "zwift",
      tone: "dark",
      title: "To apper, én veiviser",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_700px] items-center gap-16 px-[120px]">
            <div>
              <Kicker>Eksempel · Zwift-gruppa</Kicker>
              <h2 className="mt-6 font-display text-[84px] leading-[1.02] font-medium tracking-[-0.03em]">Når tre systemer må snakke sammen.</h2>
              <p className="mt-8 text-[30px] leading-[1.35] text-ink-2">Zwift-gruppa trenger Zwift Companion, Spond og nettsiden samtidig. Veiviseren tar dem ett steg om gangen, med skjermbilder, og husker hvor du var når du kommer tilbake fra appen.</p>
              <p className="mt-6 text-[24px] text-ink-3">Seks steg. Pil høyre og venstre bytter steg. Knappene ligger øverst, så de ikke flytter seg.</p>
            </div>
            <div className="relative h-[620px]">
              <Image src={zwiftHero} alt="Rytter i BOC-drakt foran en TV med Zwift" className="absolute top-0 right-0 h-[330px] w-[560px] rounded-lg object-cover" />
              <Shot src={companionSearch} alt="Zwift Companion: søk etter gruppelederen" className="absolute bottom-0 left-0 w-[400px]" />
              <Shot src={companionAccept} alt="Zwift Companion: godta invitasjonen" className="absolute right-0 bottom-0 w-[300px]" />
            </div>
          </div>
        </>
      ),
    },

    /* 29 ── Principles */
    {
      id: "prinsipper",
      tone: "light",
      title: "Fire prinsipper",
      content: (
        <Frame eyebrow={EYEBROW} title="Fire prinsipper" muted="som alt annet følger av." logo={bocMain}>
          <div className="grid grid-cols-2 gap-8">
            {[
              ["Ingen blindgater", "Alt kan prøves. Siden sier aldri at en gruppe er full."],
              ["Folk, ikke skjemaer", "En gruppeleder med navn og bilde, og en vei til dem i Spond."],
              ["Én sannhet", "Det som endres hver dag bor i Spond. Det som gjelder en sesong bor på siden."],
              ["Personvern som standard", "Den enkleste veien for en frivillig er også den som er riktig."],
            ].map(([h, t], i) => (
              <Card key={h} className="flex gap-7 p-9">
                <span className="font-display text-[72px] leading-none font-medium tracking-[-0.04em] text-[var(--club-link)]">{i + 1}</span>
                <div>
                  <p className="font-display text-[42px] leading-[1.05] font-medium tracking-[-0.025em]">{h}</p>
                  <p className="mt-3 text-[26px] leading-[1.35] text-ink-2">{t}</p>
                </div>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 30 ── Status */
    {
      id: "status",
      tone: "dark",
      title: "Status: det som virker, og det som gjenstår",
      content: (
        <Frame eyebrow={EYEBROW} title="Der er vi." muted="Ærlig status." logo={bocWhite}>
          <div className="grid grid-cols-2 gap-10">
            <div>
              <Tag tone="success">Virker nå</Tag>
              <ul className="mt-6 grid gap-3 text-[26px] leading-[1.3]">
                {["Finner, gruppesider og «Før første trening»", "Innlogging med e-postkode og invitasjoner", "Roller, innlegg og kontroll av bilder", "Samtykke: sperre, sladding og e-postforespørsel", "Import fra Spond, og Zwift-veiviseren"].map((t) => (
                  <li key={t} className="flex gap-4">
                    <Check aria-hidden className="mt-1 size-6 shrink-0 text-success" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <Tag tone="warning">Gjenstår</Tag>
              <ul className="mt-6 grid gap-3 text-[26px] leading-[1.3] text-ink-2">
                {["Daglig sikkerhetskopi av dataene", "Slette en bruker helt", "Samtykke på e-post for gruppebilder", "Å knytte brukere til medlemmer", "E-postadresser for samtykke (Spond gir dem ikke)", "Test med ekte nybegynnere"].map((t) => (
                  <li key={t} className="flex gap-4">
                    <span aria-hidden className="mt-3 block size-3 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Frame>
      ),
    },

    /* 31 ── What we ask of the board */
    {
      id: "styret",
      tone: "light",
      title: "Det vi ber styret om",
      content: (
        <Frame eyebrow={EYEBROW} title="Det vi ber styret om." logo={bocMain}>
          <ol className="grid max-w-[1300px] gap-3">
            {[
              ["Et ja til førstevalget", "At «Prøv en trening» er klubbens inngang, og at vi måler én sesong."],
              ["Minst to klubbadministratorer", "Så siden ikke hviler på en person."],
              ["Noen som kontrollerer bilder", "Innen tre dager, så den røde varselen holder seg borte."],
              ["Noen som svarer på personvernhenvendelser", "Bli fjernet, innsyn, retting. Siden gjør jobben. Noen må eie den."],
              ["En pilot med lagledere", "Inviter dem, se hva som stopper dem, og rett det før alle får tilgang."],
            ].map(([h, t], i) => (
              <li key={h} className="flex items-start gap-6 rounded-lg bg-surface px-8 py-3 ring-1 ring-line">
                <Num n={i + 1} />
                <div>
                  <p className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.02em]">{h}</p>
                  <p className="mt-1 text-[22px] leading-[1.3] text-ink-2">{t}</p>
                </div>
              </li>
            ))}
          </ol>
        </Frame>
      ),
    },

    /* 32 ── Close */
    {
      id: "avslutning",
      tone: "brand",
      title: "Prøv en trening",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <h2 className="max-w-[1250px] font-display text-[150px] leading-[0.95] font-medium tracking-[-0.04em]">Prøv en trening.</h2>
            <p className="mt-10 max-w-[1100px] text-[36px] leading-[1.3] text-on-club/80">Det er hele ideen. Resten av nettsiden finnes for at den første timen skal bli en lett en.</p>
            <p className="mt-12 text-[28px] font-semibold tracking-[0.04em]">boc.jakobjolstad.com</p>
          </div>
        </>
      ),
    },
  ];

  return <Deck slides={slides} title="Brukeropplevelse og design for BOC" />;
}
