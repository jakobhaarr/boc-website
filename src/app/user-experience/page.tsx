import { ArrowRight, Camera, Check, Database, ExternalLink, EyeOff, ShieldAlert, FileClock, GitBranch, Globe, Image as ImageIcon, LayoutDashboard, Mail, ShieldCheck, Smartphone, Sparkles, Triangle, UserRoundX } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import bocWhite from "@/components/assets/BOC-white.png";
import boc3 from "@/components/assets/boc3.jpg";
import barnesykling from "@/components/assets/barnesykling.jpg";
import spinning from "@/components/assets/spinning.jpg";
import silje from "@/components/assets/silje-34.png";
import trond from "@/components/assets/trond-58.png";
import camilla from "@/components/assets/camilla-37.png";
import esten from "@/components/assets/esten-oversjoen.png";
import christian from "@/components/assets/Christian-udø-Adriaenssens.png";
import boc3Full from "@/components/assets/boc3.jpg";
import { Deck, PrintDeck, type DeckSlide } from "@/components/deck/deck";
import { ProblemBuild, ProblemSolutions } from "@/components/deck/problem-build";
import { CensorDemo } from "@/components/deck/censor-demo";
import { Frame as DeckFrame, Slants, Slashes } from "@/components/deck/parts";
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
 * and where the site has no measurements yet the deck says so (slide 14)
 * rather than invent them. The personas are design archetypes, not people.
 *
 * Mock screens are drawn here from the same tokens as the site, so they
 * stay in the club's style and never show a real person.
 */

const EYEBROW = "BOC · Brukeropplevelse";

/** The deck's frame: smaller headlines than the Zwift deck, so none wraps to three lines. */
function Frame({ eyebrow, title, muted, children }: { eyebrow?: string; title: string; muted?: string; children?: ReactNode }) {
  return (
    <DeckFrame eyebrow={eyebrow} title={title} muted={muted} size={62} logo={bocWhite}>
      {children}
    </DeckFrame>
  );
}

/* ─── Small building blocks ───────────────────────────────────────────── */

const Kicker = ({ children, className }: { children: ReactNode; className?: string }) => (
  <p className={cn("text-[22px] font-semibold tracking-[0.12em] text-[var(--club-link)] uppercase", className)}>{children}</p>
);

/** A statement slide: one big sentence and a small line under it. `accent` sets the sentence in the club's yellow. */
function Statement({ kicker, children, sub, accent, width = 1250 }: { kicker?: string; children: ReactNode; sub?: ReactNode; accent?: boolean; width?: number }) {
  return (
    <>
      <Slants />
      <div className="relative flex h-full flex-col justify-center px-[120px]">
        {kicker && <Kicker>{kicker}</Kicker>}
        <h2 className={cn("mt-6 font-display text-[92px] leading-[1.04] font-medium tracking-[-0.022em]", accent && "text-[var(--club-primary)]")} style={{ maxWidth: width }}>
          {children}
        </h2>
        {sub && <p className="mt-10 max-w-[1000px] text-[32px] leading-[1.3] text-ink-2">{sub}</p>}
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

/** What the persona needs (yellow box) and fears (red box). */
function NeedFear({ needs, fear, size = 20 }: { needs: string; fear: string; size?: number }) {
  return (
    <div className="grid gap-2" style={{ fontSize: size, lineHeight: 1.28 }}>
      <p className="rounded-md bg-[var(--club-primary)] px-4 py-2.5 text-[var(--club-on-primary)]">
        <b className="font-semibold">Trenger:</b> {needs}
      </p>
      <p className="rounded-md bg-danger px-4 py-2.5 text-[#0b1315]">
        <b className="font-semibold">Frykter:</b> {fear}
      </p>
    </div>
  );
}

const Num = ({ n }: { n: number }) => (
  <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--club-primary)] font-display text-[28px] font-semibold text-[var(--club-on-primary)]">{n}</span>
);

/** Three whole people in the group photo (head to feet), as fractions of the picture, for the covering-up demo. */
const SENSOR_DEMO = [
  { x: 0.345, y: 0.36, w: 0.12, h: 0.55 },
  { x: 0.435, y: 0.36, w: 0.075, h: 0.5 },
  { x: 0.675, y: 0.337, w: 0.105, h: 0.55 },
];

/** The sign-in code page on an iPhone with the number pad up and the code offered from Mail, centred above the keys. */
function IPhone() {
  const key = "flex h-[58px] flex-col items-center justify-center rounded-[6px] bg-white shadow-[0_1px_0_rgb(0_0_0/0.3)]";
  return (
    <div className="relative h-[780px] w-[390px] overflow-hidden rounded-[56px] bg-white text-[#0b1315] shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)] ring-[10px] ring-[#0d0f12]">
      {/* Status bar and the island */}
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-9 pt-4 text-[15px] font-semibold">
        <span>9:41</span>
        <span className="absolute top-3 left-1/2 h-[32px] w-[112px] -translate-x-1/2 rounded-full bg-black" />
        <span className="flex items-center gap-1.5">
          <span className="flex items-end gap-[2px]">
            {[5, 8, 11, 14].map((h) => (
              <span key={h} className="w-[3px] rounded-[1px] bg-[#0b1315]" style={{ height: h }} />
            ))}
          </span>
          <span className="h-[12px] w-[24px] rounded-[4px] ring-1 ring-[#0b1315]">
            <span className="m-[1.5px] block h-[9px] w-[16px] rounded-[2px] bg-[#0b1315]" />
          </span>
        </span>
      </div>
      <div className="px-7 pt-[84px]">
        <p className="font-display text-[26px] font-bold tracking-[0.25em] text-[#125a6b]">BOC</p>
        <p className="mt-6 font-display text-[30px] leading-[1.05] font-semibold tracking-[-0.012em]">Skriv inn koden</p>
        <p className="mt-2 text-[15px] leading-[1.35] text-[#425168]">Hvis adressen er registrert, har vi sendt en kode med seks siffer. Den gjelder i ti minutter.</p>
        <p className="mt-5 text-[14px] font-medium">Kode</p>
        <div className="mt-1.5 rounded-md border-2 border-[#125a6b] px-4 py-3 text-center font-display text-[28px] tracking-[0.35em]">
          481527<span className="ml-[2px] inline-block h-[28px] w-[2px] translate-y-[5px] bg-[#125a6b]" />
        </div>
        <div className="mt-3 bg-[#125a6b] py-3 text-center text-[17px] font-semibold text-white">Logg inn</div>
      </div>
      {/* The number pad, with the code offered in the middle of the bar above it */}
      <div className="absolute inset-x-0 bottom-0 bg-[#d2d5db] pb-7">
        <div className="grid h-[48px] grid-cols-3 items-stretch border-b border-black/10 bg-[#e3e5e9] text-center">
          <span />
          <div className="flex flex-col items-center justify-center border-x border-black/10 leading-none">
            <span className="text-[11px] text-[#66758a]">Fra Mail</span>
            <span className="mt-1 text-[20px] font-medium tracking-[0.05em]">481527</span>
          </div>
          <span />
        </div>
        <div className="grid grid-cols-3 gap-[7px] px-[7px] pt-[9px]">
          {[
            ["1", ""],
            ["2", "ABC"],
            ["3", "DEF"],
            ["4", "GHI"],
            ["5", "JKL"],
            ["6", "MNO"],
            ["7", "PQRS"],
            ["8", "TUV"],
            ["9", "WXYZ"],
          ].map(([n, l]) => (
            <span key={n} className={key}>
              <span className="text-[26px] leading-none">{n}</span>
              {l && <span className="mt-0.5 text-[10px] font-semibold tracking-[0.12em] text-[#66758a]">{l}</span>}
            </span>
          ))}
          <span />
          <span className={key}>
            <span className="text-[26px] leading-none">0</span>
          </span>
          <span className="flex h-[58px] items-center justify-center text-[22px] text-[#0b1315]">⌫</span>
        </div>
        <span className="absolute bottom-2 left-1/2 h-[5px] w-[130px] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}

/* ─── The deck ────────────────────────────────────────────────────────── */

export default async function UserExperience({ searchParams }: { searchParams: Promise<{ alle?: string; pdf?: string }> }) {
  const { alle, pdf } = await searchParams;
  const { db, org } = await loadSite();
  // The tree the menu, the finder and the pages are all built from: sport, branches, groups.
  const sport = org.sports()[0];
  const branches = (sport ? org.children(sport.id) : []).map((d) => ({ name: d.name, groups: org.groups(d.id).map((g) => g.name) }));

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
            <h2 className="mt-5 max-w-[1250px] font-display text-[120px] leading-[0.98] font-medium tracking-[-0.022em]">En klubb du har lyst til å prøve.</h2>
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
        <Statement accent sub="Også de som kommer til å sykle for BOC om ti år, og de som i dag står ved siden av dem.">
          Alle er nye en gang.
        </Statement>
      ),
    },

    /* Problems: the overview, 0 of 6 gone through */
    {
      id: "problemer-0",
      tone: "dark",
      steps: 2,
      title: "Seks problemer vi løser",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="vi prøver å løse.">
          <ProblemBuild
            done={0}
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer." },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb." }
            ]}
          />
        </Frame>
      ),
    },

    /* 26 ── Spond: not replacing */
    {
      id: "spond",
      tone: "dark",
      title: "Vi erstatter ikke Spond",
      content: (
        <Frame eyebrow={`${EYEBROW} · Problem 1: to systemer`} title="Vi erstatter ikke Spond." muted="Vi gjør den lettere å finne.">
          <div className="grid grid-cols-[1fr_130px_1fr] items-stretch gap-4">
            <div className="rounded-lg bg-surface p-8 ring-1 ring-line">
              <p className="font-display text-[44px] font-medium tracking-[-0.012em] text-[var(--club-primary)]">Nettsiden</p>
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
              <p className="font-display text-[44px] font-medium tracking-[-0.012em]">Spond</p>
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
      tone: "dark",
      title: "Det vi henter fra Spond, og det vi aldri henter",
      content: (
        <Frame eyebrow={`${EYEBROW} · Problem 1: to systemer`} title="Det vi henter," muted="og det vi aldri henter.">
          <div className="grid grid-cols-2 gap-10">
            <Card className="p-10">
              <Tag tone="success">Importen leser</Tag>
              <ul className="mt-6 grid gap-4 text-[32px] leading-[1.2] font-medium">
                <li>Navn</li>
                <li>Fødselsår</li>
                <li>Samtykke til bilder</li>
              </ul>
              <p className="mt-6 text-[22px] leading-[1.35] text-ink-2">Til å begynne med gjøres importen for hånd, en gang i måneden, så bildesamtykkene er oppdaterte. Laglederen ser hver rad før noe lagres, og nye personer settes som «Ikke publiser» til noen har tatt stilling.</p>
            </Card>
            <Card className="p-10">
              <Tag tone="danger">Importen leser aldri</Tag>
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

    /* Problems: the overview, 1 of 6 gone through */
    {
      id: "problemer-1",
      tone: "dark",
      steps: 2,
      title: "Seks problemer vi løser",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="vi prøver å løse.">
          <ProblemBuild
            done={1}
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer." },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb." }
            ]}
          />
        </Frame>
      ),
    },

    /* 3 ── Three questions */
    {
      id: "tre-sporsmal",
      tone: "dark",
      title: "Tre spørsmål står mellom et besøk og en førstetrening",
      content: (
        <Frame eyebrow={`${EYEBROW} · Problem 2: nye medlemmer`} title="Tre spørsmål står mellom" muted="et besøk og en første trening.">
          <div className="grid grid-cols-3 gap-8">
            {[
              ["«Passer jeg her?»", "Alder, nivå og tempo. Ikke en liste over alt klubben gjør."],
              ["«Hvem spør jeg?»", "Et navn og et ansikt. Ikke et skjema som havner hos ingen."],
              ["«Hva skjer hvis jeg bare dukker opp?»", "Hvor, når, hva jeg tar med, og hvem jeg ser etter."],
            ].map(([q, a], i) => (
              <Card key={q} className="flex flex-col gap-6 p-10">
                <Num n={i + 1} />
                <p className="font-display text-[38px] leading-[1.1] font-medium tracking-[-0.015em]">{q}</p>
                <p className="text-[24px] leading-[1.35] text-ink-2">{a}</p>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 6 ── Personas: the visitors */
    {
      id: "personas-besokende",
      tone: "dark",
      title: "Tre som besøker siden",
      content: (
        <Frame eyebrow={`${EYEBROW} · Personas, arketyper og ikke enkeltpersoner`} title="Tre som besøker.">
          <div className="grid grid-cols-3 gap-6">
            {[
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
            ].map((p) => (
              <Card key={p.who} className="flex flex-col gap-3 p-6">
                <div className="flex items-center gap-5">
                  <Image src={p.photo} alt="" sizes="96px" loading="eager" className="size-[88px] shrink-0 rounded-full object-cover object-top ring-2 ring-[var(--club-primary)]" />
                  <p className="font-display text-[34px] leading-[1.05] font-medium tracking-[-0.012em]">{p.who}</p>
                </div>
                <p className="text-[21px] leading-[1.3] text-ink-2 italic">{p.words}</p>
                <NeedFear needs={p.needs} fear={p.fear} size={18} />
                <p className="text-[18px] text-ink-3">Kommer inn via {p.door}</p>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-[16px] text-ink-3">Portrettene er eksempelpersonene fra nettsiden.</p>
        </Frame>
      ),
    },

    /* People first, and social proof: the reason for quotes and pictures */
    {
      id: "mennesker-forst",
      tone: "dark",
      title: "Mennesker først",
      content: (
        <Frame eyebrow="Potensielle medlemmer · Mennesker først" title="Mennesker først." muted="Så kommer skjemaene.">
          <div className="grid grid-cols-3 gap-6">
            {[
              ["Navn og ansikt", "Siden viser en gruppeleder med navn og bilde før den ber om noe, og en vei til dem i Spond."],
              ["Social proof", "Vi melder oss inn der vi ser folk som oss. Er målet flere medlemmer, er medlemmenes egne ord og bilder det sterkeste vi har."],
              ["Det mangler vi", "Flere sitater fra medlemmer, og flere bilder fra treningene. Prinsippet er kjent, effekten hos BOC er ikke målt ennå."],
            ].map(([h, t], i) => (
              // The third, what is missing, is red: it is the one that asks for something.
              <div key={h} className={cn("flex flex-col gap-5 rounded-lg p-9 ring-1", i === 2 ? "bg-[color-mix(in_srgb,var(--danger)_26%,var(--background))] ring-danger/50" : "bg-surface ring-line")}>
                <span className={cn("font-display text-[56px] leading-none font-medium tracking-[-0.019em]", i === 2 ? "text-danger" : "opacity-60")}>{i + 1}</span>
                <p className={cn("font-display text-[44px] leading-[1.05] font-medium tracking-[-0.014em]", i === 2 && "text-danger")}>{h}</p>
                <p className="text-[26px] leading-[1.35] text-ink-2">{t}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-[26px] text-ink-2">Derfor har siden sitater, historier og bilder av ekte medlemmer, og alt med samtykke.</p>
        </Frame>
      ),
    },

    /* 8 ── The insight */
    {
      id: "innsikt",
      tone: "dark",
      title: "Innsikten",
      content: (
        <Statement accent kicker="Innsikten" width={1300} sub="Derfor starter siden med å hjelpe deg å finne ut om du passer, ikke med å be om at du melder deg inn.">
          Folk melder seg ikke inn for å finne ut om de passer.
        </Statement>
      ),
    },

    /* 9 ── The commitment ladder, and why a small yes first */
    {
      id: "stigen",
      tone: "dark",
      title: "Bli medlem er et løfte",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="«Bli medlem» er et løfte." muted="Be om et lite ja først.">
          <div className="grid h-full grid-cols-[820px_1fr] gap-16 pb-4">
            <div className="flex items-end gap-3">
              {[
                ["Se", "Hva slags klubb?", 80],
                ["Finn", "Hvilken gruppe?", 140],
                ["Prøv", "En trening, ingen binding", 200],
                ["Bli med", "Gruppa jeg har prøvd", 270],
                ["Bli medlem", "Betale og forplikte", 340],
              ].map(([step, text, h], i) => (
                <div
                  key={step as string}
                  className={cn("flex flex-1 flex-col justify-end p-5", i === 2 ? "bg-[var(--club-primary)] text-[var(--club-on-primary)]" : "bg-surface ring-1 ring-line")}
                  style={{ height: h as number }}
                >
                  <p className="font-display text-[32px] leading-none font-medium tracking-[-0.012em]">{step}</p>
                  <p className={cn("mt-2 text-[17px] leading-[1.25]", i === 2 ? "" : "text-ink-3")}>{text}</p>
                </div>
              ))}
            </div>
            <div className="grid content-start gap-6">
              {[
                ["Mindre risiko", "Et ja som kan angres er lett å si."],
                ["Konkret", "«Tirsdag 18.00 på Bekkestua torg» er noe man kan gjøre."],
                ["Færre valg", "Ett neste steg om gangen."],
              ].map(([h, t]) => (
                <div key={h} className="border-t border-line pt-4">
                  <p className="font-display text-[34px] leading-[1.05] font-medium tracking-[-0.012em] text-[var(--club-primary)]">{h}</p>
                  <p className="mt-2 text-[22px] leading-[1.3] text-ink-2">{t}</p>
                </div>
              ))}
              <p className="text-[18px] leading-[1.35] text-ink-3">«Bli medlem» står fortsatt i menyen, for dem som har bestemt seg. Prinsippene er kjente (commitment ladder, Hicks lov). Effekten hos BOC er ikke målt ennå.</p>
            </div>
          </div>
        </Frame>
      ),
    },

    /* 12 ── The journey */
    {
      id: "reisen",
      tone: "dark",
      title: "Reisen på nettsiden",
      content: (
        <Frame eyebrow="Potensielle medlemmer · Brukerflyt" title="Reisen." muted="Tre steg, ingen blindgater.">
          <ol className="grid grid-cols-3 gap-6">
            {[
              ["Bli med", "Den myke knappen i menyen. Den krever ikke medlemskap og ber ikke om noe, bare om å komme videre."],
              ["Finn din aktivitet", "Tre spørsmål: alder, gren og tempo. «Usikker» er et eget svar. Så en gruppeside som først sier det du trenger før første trening."],
              ["Prøv en trening", "Du ser noe konkret («tirsdag 18.00 på Bekkestua torg») og risikerer ingenting. Alle kan komme uten å være medlem. Medlemskap kommer etter, når du vil mer."],
            ].map(([h, t], i) => (
              <li key={h} className={cn("flex flex-col gap-4 rounded-lg p-6 ring-1", i === 2 ? "bg-[var(--club-primary)] text-[var(--club-on-primary)] ring-transparent" : "bg-surface ring-line")}>
                <span className="font-display text-[56px] leading-none font-medium tracking-[-0.019em] opacity-60">{i + 1}</span>
                <p className="font-display text-[44px] leading-[1.05] font-medium tracking-[-0.012em]">{h}</p>
                <p className={cn("text-[26px] leading-[1.35]", i === 2 ? "" : "text-ink-2")}>{t}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-[26px] text-ink-2">Og siden sier aldri at en gruppe er full. Hver gruppe skal lese som en man kan prøve.</p>
        </Frame>
      ),
    },

    /* 14 ── Before the first training */
    {
      id: "foer-forste-trening",
      tone: "dark",
      title: "Før første trening",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_820px] items-center gap-16 px-[120px]">
            <div>
              <Kicker>Steg 3 · Gruppesiden</Kicker>
              <h2 className="mt-6 font-display text-[52px] leading-[1.08] font-medium tracking-[-0.019em]">Svaret på «hva skjer hvis jeg bare dukker opp?»</h2>
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
                    ["Hvor lenge", "April–oktober. Om vinteren: Zwift"],
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
                  <p className="font-display text-[30px] leading-[1.05] font-medium tracking-[-0.012em]">Prøv en trening med BOC 3</p>
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

    /* 16 ── How we measure */
    {
      id: "maling",
      tone: "dark",
      title: "Hvordan vi vet om det virker",
      content: (
        <Frame eyebrow={`${EYEBROW} · Førstevalget`} title="Hvordan vi vet om det virker." muted="Vi har ingen tall ennå.">
          <div className="grid grid-cols-3 gap-8">
            {[
              ["1", "Hva folk trykker på", "«Prøv en trening» mot «Bli medlem». Bare med samtykke, fordi siden ikke har statistikk uten at besøkende sier ja."],
              ["2", "Hvem som kommer til Spond", "Nye i gruppenes Spond per måned, før og etter lansering. Tallene finnes allerede hos laglederne."],
              ["3", "Hvem som møter opp, og blir", "Antall på første trening, og hvor mange som er med igjen om en måned. Det er det klubben egentlig vil ha."],
            ].map(([n, h, t]) => (
              <Card key={h} className="p-9">
                <Num n={Number(n)} />
                <p className="mt-6 font-display text-[38px] leading-[1.08] font-medium tracking-[-0.012em]">{h}</p>
                <p className="mt-4 text-[24px] leading-[1.4] text-ink-2">{t}</p>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-[24px] text-ink-2">Forslag: mål én sesong, og la tallene avgjøre om førstevalget skal være enda mykere, eller litt tøffere.</p>
        </Frame>
      ),
    },

    /* Problems: the overview, 2 of 6 gone through */
    {
      id: "problemer-2",
      tone: "dark",
      steps: 2,
      title: "Seks problemer vi løser",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="vi prøver å løse.">
          <ProblemBuild
            done={2}
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer." },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb." }
            ]}
          />
        </Frame>
      ),
    },

    /* 4 ── The other side */
    {
      id: "andre-siden",
      tone: "dark",
      title: "Og tre ting står mellom klubben og en nettside som holder",
      content: (
        <Frame eyebrow={`${EYEBROW} · Problem 3, 4 og 5: innhold, personvern og kontinuitet`} title="Og tre ting står mellom klubben" muted="og en nettside som holder.">
          <div className="grid grid-cols-3 gap-8">
            {[
              ["Frivillige har fem minutter.", "Siden må kunne oppdateres fra mobilen, mellom to ting, uten opplæring."],
              ["Bildesamtykke er ikke en detalj.", "Hvem som vises, hvem som har sagt ja, og hva som skjer når noen ombestemmer seg. Det gjelder voksne like mye som barn."],
              ["Alt hviler på én person.", "Når den ene slutter, må klubben fortsatt komme inn, og vite hvem som gjorde hva."],
            ].map(([q, a]) => (
              <div key={q} className="rounded-lg bg-surface p-10 ring-1 ring-line">
                <p className="font-display text-[44px] leading-[1.08] font-medium tracking-[-0.015em]">{q}</p>
                <p className="mt-6 text-[26px] leading-[1.35] text-ink-2">{a}</p>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },

    /* 17 ── Section: behind the scenes */
    {
      id: "bak-kulissene",
      tone: "dark",
      title: "Bak kulissene",
      content: (
        <Statement accent kicker="Bak kulissene" sub="En nettside er bare så god som det som står på den, og det er frivillige som skriver det.">
          Frivillige er ikke webredaktører.
        </Statement>
      ),
    },

    /* 7 ── Personas: behind the scenes */
    {
      id: "personas-bak-kulissene",
      tone: "dark",
      title: "To som holder siden oppe",
      content: (
        <Frame eyebrow={`${EYEBROW} · Personas`} title="To som holder den oppe." muted="Og som ikke er webredaktører.">
          <div className="grid grid-cols-2 gap-8">
            {[
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
            ].map((p) => (
              <div key={p.who} className="rounded-lg bg-surface p-7 ring-1 ring-line">
                <div className="flex items-center gap-5">
                  <Image src={p.photo} alt="" sizes="96px" loading="eager" className="size-[88px] shrink-0 rounded-full object-cover object-top ring-2 ring-[var(--club-primary)]" />
                  <p className="font-display text-[38px] leading-[1.05] font-medium tracking-[-0.012em]">{p.who}</p>
                </div>
                <p className="mt-4 text-[24px] leading-[1.3] text-ink-2 italic">{p.words}</p>
                <div className="mt-4">
                  <NeedFear needs={p.needs} fear={p.fear} size={22} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 text-[22px] text-ink-3">Personaene bygger på det vi vet om klubben, ikke på intervjuer. Neste steg er å teste med fem ekte mennesker.</p>
        </Frame>
      ),
    },

    /* 20 ── A new post */
    {
      id: "nytt-innlegg",
      tone: "dark",
      title: "Nytt innlegg på under ett minutt",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_700px] items-center gap-16 px-[120px]">
            <div>
              <Kicker>Administrasjon · Nytt innlegg</Kicker>
              <h2 className="mt-6 font-display text-[68px] leading-[1.04] font-medium tracking-[-0.019em]">Fra tur til nettside på under ett minutt.</h2>
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
                <p className="font-display text-[34px] font-medium tracking-[-0.012em]">Søndagstur til Lommedalen</p>
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
        <Frame eyebrow={`${EYEBROW} · Administrasjon · Eksempler`} title="Systemet sier ifra." muted="Så ingen må huske alt.">
          {/* The cards of «Trenger oppmerksomhet» on the admin overview (app/admin/page.tsx), with their own words, colours and actions. */}
          <ul className="grid max-w-[1350px] gap-4">
            {[
              [<ImageIcon key="a" />, "danger", "2 bilder venter på kontroll", "2 har ventet i over 3 dager. Bildene er allerede på nettsiden.", "Kontroller"],
              [<FileClock key="b" />, "warning", "Innlegg venter på godkjenning", "«Sesongstart på Eineåsen» fra Tone Krogh til Terreng 10+, for 2 timer siden.", "Se innlegget"],
              [<Camera key="c" />, "neutral", "Mangler fotosamtykke", "Mathea Fjeld og 7 til har ikke registrert samtykke til bilder.", "Se personer"],
              [<UserRoundX key="d" />, "neutral", "Grupper uten kontaktperson", "Downhill – Enduro, Terreng Tur og 2 til viser ingen trener eller lagleder på nettsiden.", "Se struktur"],
            ].map(([icon, tone, h, t, action], i) => (
              <li key={i} className="flex items-center gap-6 rounded-lg bg-surface px-8 py-6 ring-1 ring-line">
                <span
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-lg [&_svg]:size-7",
                    tone === "danger" && "bg-danger-surface text-danger",
                    tone === "warning" && "bg-warning-surface text-warning",
                    tone === "neutral" && "bg-sunken text-ink-2",
                  )}
                >
                  {icon as ReactNode}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.012em]">{h as string}</p>
                  <p className="mt-1.5 text-[22px] leading-[1.3] text-ink-2">{t as string}</p>
                </div>
                <span className="shrink-0 rounded-md bg-surface px-6 py-3 text-[22px] font-medium ring-1 ring-line-strong">{action as string}</span>
              </li>
            ))}
          </ul>
        </Frame>
      ),
    },

    /* Problems: the overview, 3 of 6 gone through */
    {
      id: "problemer-3",
      tone: "dark",
      steps: 2,
      title: "Seks problemer vi løser",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="vi prøver å løse.">
          <ProblemBuild
            done={3}
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer." },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb." }
            ]}
          />
        </Frame>
      ),
    },

    /* 22 ── Section: consent */
    {
      id: "samtykke",
      tone: "dark",
      title: "Samtykke",
      content: (
        <Statement accent kicker="Samtykke" sub="Et bilde av et menneske er en personopplysning, voksen eller barn. Siden er laget så den riktige veien også er den enkleste.">
          Bildesamtykke gjelder både voksne og barn.
        </Statement>
      ),
    },

    /* 23 ── The consent flow */
    {
      id: "samtykke-flyt",
      tone: "dark",
      title: "Slik går et bilde fra mobil til nettside",
      content: (
        <Frame eyebrow="Publisering av bilder og artikler" title="Hvem er med på bildet?" muted="Spørsmålet stilles hver gang.">
          <div className="grid grid-cols-[2.2fr_150px_1.5fr] items-center">
            {/* The two steps stand side by side at the same height. */}
            <div className="flex items-stretch gap-3">
              <Card className="min-w-0 flex-1 p-7">
                <p className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.012em]">Last opp</p>
                <p className="mt-3 text-[22px] leading-[1.35] text-ink-2">Fotograf må oppgis, og kan være «BOC».</p>
              </Card>
              <ArrowRight aria-hidden className="size-10 shrink-0 self-center text-ink-3" />
              <Card className="min-w-0 flex-1 p-7">
                <p className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.012em]">Merk personer</p>
                <p className="mt-3 text-[22px] leading-[1.35] text-ink-2">Velg alle i gruppa med ett trykk, eller «ingen kan kjennes igjen».</p>
              </Card>
            </div>
            {/* One line out of «Merk personer» that forks, mirrored, to the middle of each outcome. The two outcomes are the same height, so their middles lie at 25 % and 75 %. */}
            <div className="relative h-full text-ink-3" aria-hidden>
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                <path vectorEffect="non-scaling-stroke" d="M0 50 C 42 50, 42 25, 84 25 L 92 25" />
                <path vectorEffect="non-scaling-stroke" d="M0 50 C 42 50, 42 75, 84 75 L 92 75" />
              </svg>
              <ArrowRight className="absolute top-[25%] right-0 size-10 -translate-y-1/2" />
              <ArrowRight className="absolute top-[75%] right-0 size-10 -translate-y-1/2" />
            </div>
            <div className="grid grid-rows-2">
              <div className="m-1.5 flex items-center gap-5 rounded-lg bg-success-surface p-4 ring-1 ring-success/40">
                <ShieldCheck aria-hidden className="size-9 shrink-0 text-success" />
                <p className="text-[24px] leading-[1.3]">
                  <b className="font-semibold">Alle har sagt ja:</b> publiseres med en gang.
                </p>
              </div>
              <div className="m-1.5 flex flex-col justify-center rounded-lg bg-warning-surface p-4 ring-1 ring-warning/40">
                <p className="text-[24px] leading-[1.3]">
                  <b className="font-semibold">Noen mangler samtykke:</b> publisering sperres, og tre veier åpnes.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Tag>Ta personen ut</Tag>
                  <Tag>
                    <EyeOff aria-hidden className="mr-2 size-5" />
                    Sladd personen
                  </Tag>
                  <Tag>
                    <Mail aria-hidden className="mr-2 size-5" />
                    Be om samtykke
                  </Tag>
                </div>
              </div>
            </div>
          </div>
          <p className="mt-3 max-w-[1200px] text-[24px] leading-[1.35] text-ink-2">Klubbadministrator kontrollerer svarene etterpå og kan rette dem. Kontrollen stopper aldri en publisering, men blir den liggende, kommer det en rød varsel.</p>
        </Frame>
      ),
    },

    /* 19b ── Covering up faces */
    {
      id: "sladding",
      tone: "dark",
      title: "Ingen samtykke? Ikke noe problem",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[520px_1fr] items-center gap-14 px-[120px]">
            <div>
              <Kicker>Samtykke · Sladding</Kicker>
              <h2 className="mt-6 font-display text-[64px] leading-[1.05] font-medium tracking-[-0.019em]">Ingen samtykke? Ikke noe problem.</h2>
              <ul className="mt-8 grid gap-4 text-[24px] leading-[1.3] text-ink-2">
                <li>Dra en boks over hele personen som ikke har sagt ja, ikke bare ansiktet.</li>
                <li>
                  <b className="font-semibold text-ink">Bildet endres på telefonen</b> før det sendes. Originalen forlater aldri enheten.
                </li>
                <li>Mosaikken er så grov at ingen kjennes igjen, og den kan ikke «fjernes» etterpå.</li>
                <li>Klubbadministrator ser «2 personer sladdet» ved kontroll.</li>
                <li>Gjelder også medlemmer som er satt til «Ikke publiser»: de kan merkes i bildet, men må sladdes.</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 items-start gap-6">
              <figure>
                <div className="relative overflow-hidden rounded-lg ring-1 ring-line">
                  <Image src={boc3Full} alt="Gruppebilde med tre hele personer markert" sizes="460px" loading="eager" className="block h-auto w-full" />
                  {SENSOR_DEMO.map((r, i) => (
                    <span key={i} className="absolute border-2 border-white bg-black/45" style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }} />
                  ))}
                </div>
                <figcaption className="mt-3 text-[20px] font-semibold text-ink-2">1 · Tegn en boks</figcaption>
              </figure>
              <figure>
                <CensorDemo src={boc3Full.src} regions={SENSOR_DEMO} alt="Samme bilde med de tre personene dekket av grov mosaikk" className="block h-auto w-full rounded-lg ring-1 ring-line" />
                <figcaption className="mt-3 text-[20px] font-semibold text-[var(--club-primary)]">2 · Slik lastes bildet opp</figcaption>
              </figure>
              {/* What the administrator sees when publishing and someone in the picture has not said yes (drawn, with an invented name). */}
              <figure className="col-span-2 mt-4">
                <div className="grid gap-4 rounded-lg bg-danger-surface p-6 ring-1 ring-danger/30">
                  <p className="flex gap-3 text-[22px] leading-[1.35]">
                    <ShieldAlert aria-hidden className="mt-1 size-6 shrink-0 text-danger" />
                    <span>
                      <b className="font-semibold">Samtykke mangler:</b> Kari Nordmann har ikke gitt samtykke til bilder og kan ikke vises på nettsiden. Sladd hele personen, ta personen ut av bildet eller be om samtykke på e-post, før du publiserer.
                    </span>
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[22px] font-medium">Kari Nordmann</span>
                    <span className="inline-flex items-center gap-2 rounded-[var(--radius-button)] bg-white px-5 py-2.5 text-[20px] font-medium text-[#0b1315]">
                      <EyeOff aria-hidden className="size-5" />
                      Sladd personen
                    </span>
                  </div>
                  <p className="text-[20px] text-ink-2">› Andre valg</p>
                </div>
                <figcaption className="mt-3 text-[20px] font-semibold text-ink-2">3 · Slik ser det ut når du publiserer</figcaption>
              </figure>
            </div>
          </div>
        </>
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
              <h2 className="mt-6 font-display text-[72px] leading-[1.04] font-medium tracking-[-0.019em]">Bildene venter på et ja.</h2>
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
      tone: "dark",
      title: "Navn og ansikter bare med samtykke",
      content: (
        <Frame eyebrow={`${EYEBROW} · Samtykke`} title="Navn og ansikter" muted="bare med samtykke.">
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
              <p className="font-display text-[30px] font-medium tracking-[-0.012em]">7 utøvere i BOC 3</p>
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

    /* Problems: the overview, 4 of 6 gone through */
    {
      id: "problemer-4",
      tone: "dark",
      steps: 2,
      title: "Seks problemer vi løser",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="vi prøver å løse.">
          <ProblemBuild
            done={4}
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer." },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb." }
            ]}
          />
        </Frame>
      ),
    },

    /* 18 ── Roles */
    {
      id: "roller",
      tone: "dark",
      title: "Hvem kan hva",
      content: (
        <Frame eyebrow={`${EYEBROW} · Administrasjon`} title="Hvem kan hva." muted="Tilgang følger ansvaret.">
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
                  <span className="font-display text-[32px] leading-none font-medium tracking-[-0.012em]">{r}</span>
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

    /* 15 ── Login on an iPhone */
    {
      id: "innlogging",
      tone: "dark",
      title: "Innlogging uten passord",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[1fr_400px] items-center gap-24 px-[120px]">
            <div>
              <Kicker>Administrasjon · Innlogging</Kicker>
              <h2 className="mt-6 font-display text-[72px] leading-[1.04] font-medium tracking-[-0.019em]">Ingen passord å glemme.</h2>
              <p className="mt-8 text-[30px] leading-[1.35] text-ink-2">Du skriver e-postadressen din og får en kode på seks siffer. På iPhone foreslår tastaturet koden fra e-posten, midt i feltet over tastene. Ett trykk, og du er inne.</p>
              <p className="mt-6 text-[24px] text-ink-3">Nye administratorer inviteres av klubbadministrator og får en e-post med knapp rett til innloggingen.</p>
            </div>
            <IPhone />
          </div>
        </>
      ),
    },

    /* Problems: the overview, 5 of 6 gone through */
    {
      id: "problemer-5",
      tone: "dark",
      steps: 2,
      title: "Seks problemer vi løser",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="vi prøver å løse.">
          <ProblemBuild
            done={5}
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer." },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb." }
            ]}
          />
        </Frame>
      ),
    },

    /* 5 ── The information hierarchy */
    {
      id: "hierarki",
      tone: "dark",
      title: "Informasjonshierarkiet",
      content: (
        <Frame eyebrow={EYEBROW} title="Ett hierarki styrer alt.">
          <div className="grid grid-cols-3 gap-6">
            {[
              ["Gren", "Menyen og grensiden: velg mellom gruppene."],
              ["Gruppe", "Gruppesiden: alt man trenger før første trening."],
              ["Arver nedover", "Tomme felt og regler hentes fra nivået over. Ingen skriver det samme to ganger."],
            ].map(([h, t], i) => (
              <div key={h} className={cn("rounded-lg p-6 ring-1", i === 2 ? "bg-[var(--club-primary)] text-[var(--club-on-primary)] ring-transparent" : "bg-surface ring-line")}>
                <p className="font-display text-[30px] leading-[1.05] font-medium tracking-[-0.012em]">{h}</p>
                <p className={cn("mt-2 text-[21px] leading-[1.3]", i === 2 ? "" : "text-ink-2")}>{t}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {branches.map((b) => (
              <div key={b.name} className="rounded-lg bg-surface p-5 ring-1 ring-line">
                <p className="font-display text-[26px] leading-none font-medium tracking-[-0.012em]">{b.name}</p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {b.groups.slice(0, 5).map((g) => (
                    <li key={g} className="rounded-sm bg-sunken px-2.5 py-1 text-[16px] text-ink-2">
                      {g}
                    </li>
                  ))}
                  {b.groups.length > 5 && <li className="px-1 py-1 text-[16px] text-ink-3">+{b.groups.length - 5}</li>}
                </ul>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },

    /* Problems: the overview, 6 of 6 gone through */
    {
      id: "problemer-6",
      tone: "dark",
      title: "Seks problemer vi løser",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="vi prøver å løse.">
          <ProblemBuild
            done={6}
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer." },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb." }
            ]}
          />
        </Frame>
      ),
    },

    /* 29 ── Principles */
    {
      id: "prinsipper",
      tone: "dark",
      title: "Fire prinsipper",
      content: (
        <Frame eyebrow={EYEBROW} title="Fire prinsipper" muted="som alt annet følger av.">
          <div className="grid grid-cols-2 gap-8">
            {[
              ["Ingen blindgater", "Alt kan prøves. Siden sier aldri at en gruppe er full."],
              ["Folk, ikke skjemaer", "En gruppeleder med navn og bilde, og en vei til dem i Spond."],
              ["Én sannhet", "Det som endres hver dag bor i Spond. Det som gjelder en sesong bor på siden."],
              ["Personvern som standard", "Den enkleste veien for en frivillig er også den som er riktig."],
            ].map(([h, t], i) => (
              <Card key={h} className="flex gap-7 p-9">
                <span className="font-display text-[72px] leading-none font-medium tracking-[-0.025em] text-[var(--club-primary)]">{i + 1}</span>
                <div>
                  <p className="font-display text-[42px] leading-[1.05] font-medium tracking-[-0.015em]">{h}</p>
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
        <Frame eyebrow={EYEBROW} title="Status." muted="Det som virker, og det som gjenstår.">
          <div className="grid grid-cols-2 gap-10">
            <div>
              <Tag tone="success">Virker nå</Tag>
              <ul className="mt-6 grid gap-3 text-[26px] leading-[1.3]">
                {["Finner, gruppesider og «Før første trening»", "Innlogging med e-postkode og invitasjoner", "Roller, innlegg og kontroll av bilder", "Samtykke: sperre, sladding og e-postforespørsel", "Import fra Spond og sladding av bilder"].map((t) => (
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

    /* 27 ── What I ask of the board */
    {
      id: "styret",
      tone: "dark",
      title: "Det jeg trenger fra styret",
      content: (
        <Frame eyebrow="Neste steg · Beslutninger" title="Det jeg trenger fra styret.">
          <ol className="grid grid-flow-col grid-cols-2 grid-rows-3 gap-5">
            {[
              ["Et ja til at dette er noe vi ønsker å gå for", "Veien inn («Prøv en trening» først) er mitt faglige råd. Styret svarer ja eller nei."],
              ["Sitater og bilder fra medlemmer", "Vi bør innhente sitater og ta bilder på treningene. Jeg kan bistå med bilder."],
              ["Tilgang til baerumock.no", "Så nettsiden kan få klubbens eget domene."],
              ["Minst to klubbadministratorer", "Så siden ikke hviler på én person."],
              ["Noen som eier bilder og personvern", "Kontroll av bilder, og svar på henvendelser."],
              ["En pilot med lagledere", "Se hva som stopper dem, før alle får tilgang."],
            ].map(([h, t], i) => (
              <li key={h} className="flex items-start gap-5 rounded-lg bg-surface px-7 py-5 ring-1 ring-line">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[var(--club-primary)] font-display text-[26px] font-semibold text-[var(--club-on-primary)]">{i + 1}</span>
                <div>
                  <p className="font-display text-[35px] leading-[1.1] font-medium tracking-[-0.012em]">{h}</p>
                  <p className="mt-2 text-[24px] leading-[1.25] text-ink-2">{t}</p>
                </div>
              </li>
            ))}
          </ol>
        </Frame>
      ),
    },

    /* ── The board talk, in the order it is given: what, when, why, how, what I ask ── */

    /* What this is, in three boxes */
    {
      id: "kort-fortalt",
      tone: "dark",
      title: "Dette har vi laget",
      content: (
        <Frame eyebrow={EYEBROW} title="Dette har vi laget." muted="Tre deler.">
          <div className="grid grid-cols-3 gap-8">
            {[
              { icon: Globe, name: "Nettsiden", who: "For dem som vil prøve BOC", tone: "primary" },
              { icon: LayoutDashboard, name: "Administrasjonen", who: "For dem som driver klubben", tone: "primary" },
              { icon: Smartphone, name: "Spond", who: "Beholder medlemmer og påmelding", tone: "quiet" },
            ].map(({ icon: Icon, name, who, tone }) => (
              <div key={name} className={cn("rounded-lg p-9 ring-1", tone === "primary" ? "bg-surface ring-line" : "bg-transparent ring-line-strong")}>
                <Icon aria-hidden className={cn("size-16", tone === "primary" ? "text-[var(--club-primary)]" : "text-ink-3")} strokeWidth={1.5} />
                {/* «Administrasjonen» is the long word: at this size it fills the card's width with a little to spare. */}
                <p className="mt-8 font-display text-[44px] leading-[1.05] font-medium tracking-[-0.016em] whitespace-nowrap">{name}</p>
                <p className="mt-4 text-[30px] leading-[1.25] text-ink-2">{who}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 text-[28px] text-ink-3">Spond er ikke erstattet. Den nye delen er nettsiden og administrasjonen.</p>
        </Frame>
      ),
    },

    /* The steps, with no dates: where this is in the process */
    {
      id: "tidslinje",
      tone: "dark",
      title: "Hvor vi er nå",
      content: (
        <Frame eyebrow={EYEBROW} title="Hvor vi er" muted="nå.">
          <div className="relative mt-10">
            <div aria-hidden className="absolute top-[18px] right-[40px] left-[40px] h-[3px] bg-line-strong" />
            <ol className="relative grid grid-cols-[1.8fr_1fr_1fr_1fr_1fr_1fr] gap-5">
              {[
                "Styret har besluttet at Spond-nettsiden er for dyr",
                "Nettside bygget",
                "Demo for styret",
                "Beslutning om veien videre",
                "Eventuell revisjon",
                "Implementering av ny nettside",
              ].map((what, i) => {
                // Two steps behind us, this one now, two ahead.
                const state = i < 2 ? "done" : i === 2 ? "now" : "next";
                return (
                  <li key={what} className="flex flex-col items-start">
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full ring-4 ring-[var(--background)]",
                        state === "done" && "bg-success",
                        state === "now" && "bg-[var(--club-primary)] outline outline-[3px] outline-offset-[5px] outline-[var(--club-primary)]",
                        state === "next" && "bg-transparent outline outline-[3px] -outline-offset-[3px] outline-[var(--club-primary)]",
                      )}
                    >
                      {state === "done" && <Check aria-hidden className="size-6 text-[#0b1315]" strokeWidth={3} />}
                      {state === "now" && <span aria-hidden className="size-3 rounded-full bg-[var(--club-on-primary)]" />}
                    </span>
                    <p className={cn("mt-8 text-[26px] font-semibold tracking-[0.03em] uppercase", state === "now" ? "text-[var(--club-primary)]" : state === "done" ? "text-success" : "text-ink-3")}>
                      {state === "done" ? "Gjort" : state === "now" ? "Her er vi" : "Neste"}
                    </p>
                    <p className={cn("mt-2 font-display text-[34px] leading-[1.12] font-medium tracking-[-0.014em]", state === "next" && "text-ink-2")}>{what}</p>
                  </li>
                );
              })}
            </ol>
          </div>
          <p className="mt-16 max-w-[1100px] text-[28px] leading-[1.3] text-ink-3">I dag viser vi demoen. Veien videre er styrets valg.</p>
        </Frame>
      ),
    },

    /* Problem 7: the cost */
    {
      id: "spond-kostnad",
      tone: "dark",
      title: "Spond-nettsiden koster 6 000 kr i året",
      content: (
        <>
          <Slants />
          <div className="relative flex h-full flex-col justify-center px-[120px]">
            <Kicker>Problem nummer sju</Kicker>
            <p className="mt-6 font-display text-[250px] leading-[0.95] font-medium tracking-[-0.03em] text-[var(--club-primary)]">6 000 kr</p>
            <p className="mt-4 font-display text-[72px] leading-[1.05] font-medium tracking-[-0.02em]">i året til Spond-nettsiden.</p>
            <p className="mt-10 max-w-[1100px] text-[32px] leading-[1.3] text-ink-2">Medlemsregister og påmelding blir i Spond. Det er bare nettsiden som kan byttes, og valget er styrets.</p>
          </div>
        </>
      ),
    },

    /* The systems behind the site */
    {
      id: "systemer",
      tone: "dark",
      title: "Hva ligger bak siden",
      content: (
        <Frame eyebrow="Under panseret · potensielle kostnader" title="Hva ligger bak" muted="siden?">
          <div className="grid grid-cols-5 gap-5">
            {[
              { icon: Sparkles, name: "Claude", what: "Hjelperen", text: "AI som hjelper oss å skrive og endre koden.", now: "Brukes i flere av Jakobs prosjekter.", cost: "Dekkes av Jakob", covered: true },
              { icon: GitBranch, name: "GitHub", what: "Koden", text: "Kildekoden og historikken over hver endring.", now: "Koden ligger sammen med Jakobs andre prosjekter.", cost: "Dekkes av Jakob", covered: true },
              { icon: Triangle, name: "Vercel", what: "Nettsiden", text: "Kjører siden på nett, og bygger den på nytt når koden endres.", now: "Gratis nå. Vilkårene sier personlig, ikke-kommersiell bruk, så Vercel kan kreve Pro.", cost: "Trolig gratis", pro: "Pro: 200 kr i måneden", covered: false },
              { icon: Database, name: "Supabase", what: "Dataene", text: "Det admin endrer, bildene, og innloggingen.", now: "Gratis nå. Grensene er 1 GB filer (ca. 5 000 bilder à 200 kB) og 5 GB trafikk i måneden.", cost: "Trolig gratis", pro: "Pro: 250 kr i måneden", covered: false },
              { icon: Mail, name: "Resend", what: "E-posten", text: "Sender invitasjoner, innloggingskoder og samtykke\u00ADforespørsler.", now: "Gratis opp til 3 000 e-poster i måneden og 100 om dagen. Nok for rundt 20 admins.", cost: "Trolig gratis", pro: "Pro: 200 kr i måneden", covered: false },
            ].map(({ icon: Icon, name, what, text, now, cost, pro, covered }) => (
              <div key={name} className="flex flex-col rounded-lg bg-surface p-6 ring-1 ring-line">
                <Icon aria-hidden className="size-10 text-[var(--club-primary)]" strokeWidth={1.5} />
                <p className="mt-4 text-[20px] font-semibold tracking-[0.1em] text-ink-3 uppercase">{what}</p>
                <p className="mt-1 font-display text-[44px] leading-[1.05] font-medium tracking-[-0.016em]">{name}</p>
                <p className="mt-2 mb-4 text-[21px] leading-[1.3] text-ink-2">{text}</p>
                <div className="mt-auto border-t border-line pt-3">
                  <p className="text-[19px] leading-[1.3] text-ink-3">{now}</p>
                  <p className={cn("mt-2 text-[24px] leading-[1.2] font-semibold", covered ? "text-ink" : "text-[var(--club-primary)]")}>{cost}</p>
                  {pro && <p className="mt-2 w-fit rounded-md bg-[var(--club-on-primary)] px-2.5 py-1 text-[18px] leading-[1.3] font-semibold whitespace-nowrap text-white">{pro}</p>}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 max-w-[1500px] text-[22px] leading-[1.3] text-ink-2">
            Trolig gratis i dag, men gratis har grenser og vilkår. Vokser klubben ut av dem, blir det rundt 600 kr i måneden, 7 500 kr i året, for Vercel, Supabase og Resend. Betales alle fem, rundt 800 kr i måneden. Kurs 9,60 kr per dollar.
          </p>
        </Frame>
      ),
    },

    /* Links out */
    {
      id: "lenker-ut",
      tone: "dark",
      title: "Lenker ut",
      content: (
        <Frame eyebrow={EYEBROW} title="Lenker ut." muted="Vi sender ingenting dit.">
          <div className="grid grid-cols-4 gap-6">
            {[
              ["Spond", "Meld deg på økter, og bli med i gruppa."],
              ["Strava", "Følg klubben og medlemmer som vil vise sine turer."],
              ["Idrettsforbundet", "Slik søker du om politiattest, for dem som er frivillige med barn."],
              ["Norsk Tipping", "Grasrotandelen: gi klubben en del av spillet ditt."],
            ].map(([name, text]) => (
              <div key={name} className="flex flex-col rounded-lg bg-surface p-8 ring-1 ring-line">
                <ExternalLink aria-hidden className="size-10 text-[var(--club-primary)]" strokeWidth={1.75} />
                <p className={cn("mt-6 font-display leading-[1.05] font-medium tracking-[-0.016em]", name.length > 12 ? "text-[34px]" : "text-[44px]")}>{name}</p>
                <p className="mt-4 text-[26px] leading-[1.3] text-ink-2">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-10 max-w-[1100px] text-[30px] leading-[1.3] text-ink-2">Du er først hos dem når du selv klikker. Nettsiden gir dem ingen opplysninger.</p>
        </Frame>
      ),
    },

    /* Feedback */
    {
      id: "tilbakemelding",
      tone: "dark",
      title: "All tilbakemelding går hit",
      content: (
        <Frame eyebrow="Feedback og endringer" title="All tilbakemelding" muted="går hit.">
          <p className="font-display text-[84px] leading-[1.05] font-medium tracking-[-0.02em] text-[var(--club-primary)]">bocnettside@gmail.com</p>
          {/* A flow: the three steps with an arrow between each. */}
          <ol className="mt-20 flex items-start gap-5">
            {[
              ["Du skriver", "Hvilken side, hva som er feil, og hva som bør stå."],
              ["Claude leser", "og lager et forslag til endring."],
              ["Vi godkjenner", "med ett tastetrykk, så er siden oppdatert."],
            ].map(([h, t], i) => (
              <Fragment key={h}>
                {i > 0 && <ArrowRight aria-hidden className="mt-3 size-10 shrink-0 text-ink-3" />}
                <li className="flex min-w-0 flex-1 gap-5">
                  <Num n={i + 1} />
                  <div>
                    <p className="font-display text-[38px] leading-[1.1] font-medium tracking-[-0.014em]">{h}</p>
                    <p className="mt-2 text-[26px] leading-[1.3] text-ink-2">{t}</p>
                  </div>
                </li>
              </Fragment>
            ))}
          </ol>
          <p className="mt-12 max-w-[1250px] text-[28px] leading-[1.3] text-ink-2">
            Etter første revisjon får styret en oppdatering. Alle kan bidra med utfordringer, riktig informasjon og forbedringer.
          </p>
          <p className="mt-5 text-[24px] text-ink-3">Eksempel: «BOC 2, treningstider: tirsdag er 18.30, ikke 18.00.»</p>
        </Frame>
      ),
    },

    /* Short talk: the six problems in one slide, each with its answer */
    {
      id: "problemer-kort",
      tone: "dark",
      steps: 8,
      printStep: 7,
      title: "Seks problemer og hva som løser dem",
      content: (
        <Frame eyebrow={EYEBROW} title="Seks problemer" muted="og hva som løser dem.">
          <ProblemSolutions
            problems={[
              { label: "To systemer", problem: "Medlemmer og økter bor i Spond. Nettsiden er et annet system.", solution: "Spond beholder register og påmelding. Månedlig manuell import fra Spond, for bildesamtykker." },
              { label: "Nye medlemmer", problem: "De som vil prøve, vet ikke om de passer.", solution: "«Finn gruppen din» på tre spørsmål, og gruppesider som svarer på «hva om jeg bare dukker opp?»" },
              { label: "Innhold", problem: "Vanskelig å publisere noe bra i farta.", solution: "Publisering på 2 min med innebygget personvern." },
              { label: "Personvern", problem: "Fullstendig kontroll på personvern er vanskelig.", solution: "Samtykke fra Spond, anonymiseringsverktøy for forfatter, og et personverns-dashboard for admins." },
              { label: "Kontinuitet", problem: "Alt hviler på noen få personer.", solution: "Enkel rollefordeling, enkel innlogging, og full kontroll over aktivitetslogg." },
              { label: "Én klubb", problem: "18 grupper i seks grener skal fremstå som én klubb.", solution: "Ett hierarki og én mal som alle sider bygges fra, i klubbens egen stil." },
            ]}
          />
        </Frame>
      ),
    },

    /* Short talk: what to show in the demo */
    {
      id: "demo",
      tone: "dark",
      title: "Demo",
      content: (
        <>
          <Slants />
          <div className="relative flex h-full flex-col justify-center px-[120px]">
            <Kicker>Demo</Kicker>
            <h2 className="mt-6 font-display text-[110px] leading-[1.02] font-medium tracking-[-0.022em] text-[var(--club-primary)]">Nå viser vi det.</h2>
            <ol className="mt-12 grid max-w-[1100px] gap-5 text-[34px] leading-[1.25]">
              {[
                ["Som ny", "«Finn gruppen din» på telefonen, til første trening."],
                ["Som lagleder", "Et innlegg med bilder, og sladding av en som ikke har samtykke."],
                ["Som klubbadministrator", "«Trenger oppmerksomhet»: det systemet ber meg ta stilling til."],
              ].map(([who, what], i) => (
                <li key={who} className="flex items-baseline gap-6">
                  <span className="font-display text-[44px] text-[var(--club-primary)]">{i + 1}</span>
                  <span>
                    <b className="font-semibold">{who}.</b> <span className="text-ink-2">{what}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-12 max-w-[1100px] text-[26px] leading-[1.35] text-ink-3">Alt arbeidet bak, med personas, problemer og valg, står i dokumentet vi sender i etterkant.</p>
          </div>
        </>
      ),
    },

    /* 32 ── Close */
    {
      id: "avslutning",
      tone: "dark",
      title: "Prøv en trening",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <h2 className="max-w-[1250px] font-display text-[140px] leading-[0.95] font-medium tracking-[-0.025em] text-[var(--club-primary)]">Prøv en trening.</h2>
            <p className="mt-10 max-w-[1100px] text-[34px] leading-[1.3] text-ink-2">Det er hele ideen. Resten av siden er der for at det skal føles enkelt å møte opp første gang.</p>
            <p className="mt-12 text-[28px] font-semibold tracking-[0.04em]">boc.jakobjolstad.com</p>
          </div>
        </>
      ),
    },
  ];

  /* The talk is ten minutes and then the demo: ten slides. The rest of the work is in the document (/user-experience/dokument).
     ?alle shows the whole deck, with the slides for each problem in turn. */
  const SHORT = ["tittel", "kort-fortalt", "tidslinje", "problemer-kort", "personas-besokende", "mennesker-forst", "spond", "reisen", "samtykke-flyt", "sladding", "systemer", "demo", "styret", "tilbakemelding", "avslutning"];
  const SHORT_ONLY = ["problemer-kort", "demo"];
  const byId = new Map(slides.map((x) => [x.id, x]));
  const shown = alle !== undefined ? slides.filter((x) => !SHORT_ONLY.includes(x.id)) : SHORT.map((id) => byId.get(id)!);
  const title = "Brukeropplevelse og design for BOC";
  if (pdf !== undefined) return <PrintDeck slides={shown} title={title} />;
  return <Deck slides={shown} title={title} pdfHref="/pdf/boc-brukeropplevelse-presentasjon.pdf" />;
}
