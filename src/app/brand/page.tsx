import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import type { CSSProperties, ReactNode } from "react";
import bocMain from "@/components/assets/BOC-main.png";
import bocWhite from "@/components/assets/BOC-white.png";
import bocYellow from "@/components/assets/BOC-yellow.png";
import billboard from "@/components/assets/boc-billboard.jpg";
import bottle from "@/components/assets/bottle.jpg";
import musette from "@/components/assets/musette.jpg";
import tent from "@/components/assets/race-tent.jpg";
import boc3 from "@/components/assets/boc3.jpg";
import boc4 from "@/components/assets/boc4.jpg";
import jerseyBlack from "@/components/assets/boc-jersey-black-cutout.png";
import jerseyYellow from "@/components/assets/boc-jersey-yellow-cutout.png";
import hero from "@/components/assets/boc1-styrkeproven-wide.jpg";
import styrkeprove from "@/components/assets/boc1-styrkeproven.jpg";
import mallorca3 from "@/components/assets/image-mallorca_003.png";
import terreng from "@/components/assets/terreng.jpeg";
import { cn } from "@/lib/cn";
import { loadSite } from "@/lib/data/queries";
import { themeSeed } from "@/lib/data/seed/org";
import { contrastRatio, themeStyle } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Merkevare",
  description: "BOCs visuelle identitet: logo, skrift, farger, bilder, mønster og eksempler på bruk.",
};

/**
 * BOC's brand guidelines as a page: one section per topic, title and a short
 * rule on the left, the example on the right. Colours are read from the
 * club's own theme (lib/data/seed/org.ts) rather than written out here, so
 * the palette on this page cannot drift from the one the site uses. The page
 * pins the BOC theme on its own wrapper, so it looks the same whichever club
 * the demo is showing.
 *
 * Own material: the wordmark, the colours, the jerseys and the photographs.
 * The clearspace rule, the type scale and the pattern describe how the
 * website already uses them. The business card and the social media
 * examples are drawn here from those same parts as
 * suggestions; nothing on them exists in print.
 */

const boc = themeSeed().find((t) => t.id === "boc")!;

const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};

const nbRatio = (a: string, b: string) => String(contrastRatio(a, b)).replace(".", ",");

const PALETTE = [
  { name: "BOC-gul", role: "Flater, drakt og uthevinger", hex: boc.primary, ink: boc.onPrimary },
  { name: "BOC-petrol", role: "Tekst, lenker og knapper", hex: boc.link, ink: "#ffffff" },
  { name: "Natt", role: "Meny, footer og mørke flater", hex: boc.header!.background, ink: "#ffffff" },
  { name: "Mørk grunn", role: "Bakgrunn i mørk modus", hex: boc.dark!.background, ink: "#ffffff" },
  { name: "Lysgul", role: "Lyse, rolige flater", hex: boc.tint, ink: boc.link },
] as const;

const SECTIONS = [
  ["logo", "Logo"],
  ["logomerke", "Logomerke"],
  ["frisone", "Frisone"],
  ["skrift", "Skrift"],
  ["hierarki", "Hierarki"],
  ["farger", "Farger"],
  ["bilder", "Bilder"],
  ["monster", "Mønster"],
  ["sosiale-medier", "Sosiale medier"],
  ["bannere", "Bannere"],
  ["visittkort", "Visittkort"],
  ["billboard", "Billboard"],
  ["merch", "Drakter og merch"],
] as const;

/* ── Building blocks ─────────────────────────────────────────────────────── */

function Section({ id, title, text, children }: { id: string; title: string; text: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 border-t border-guide py-10 lg:py-14">
      <div className="page grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.4fr)] lg:gap-10">
        <div className="flex flex-col justify-between gap-4">
          <h2 id={`${id}-t`} className="t-h1">
            {title}
          </h2>
          <p className="t-small max-w-[34ch] text-ink-2">{text}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

/** The framed example area. Phones get natural height, desktop a 16:10 stage. */
function Stage({ className, children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl lg:aspect-[16/10]", className)} style={style}>
      {children}
    </div>
  );
}

function Mark({ src, className }: { src: StaticImageData; className?: string }) {
  return <Image src={src} alt="BOC" className={cn(!className?.includes("h-") && "h-auto", className)} />;
}

/** The jersey's own slant (matching the site's fact strip), as growing yellow bars. */
function Slants({ count = 8, className }: { count?: number; /** Where it sits; the bars fill this box. */ className: string }) {
  const flex = Array.from({ length: count }, (_, i) => 1.3 ** i);
  return (
    <div aria-hidden className={cn("absolute flex gap-[2.6%]", className)}>
      {flex.map((f, i) => (
        <span key={i} className="block h-full bg-club-surface" style={{ flex: f, transform: "skewX(-21.25deg)" }} />
      ))}
    </div>
  );
}

function Photo({ src, alt, className, sizes = "(min-width: 1024px) 30vw, 90vw", position, zoom }: { src: StaticImageData; alt: string; className?: string; sizes?: string; /** CSS object-position, to keep the subject in the crop. */ position?: string; /** Scale about the same point, to come in closer than cover does. */ zoom?: number }) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg bg-muted", className)}>
      <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" style={position ? { objectPosition: position, ...(zoom && { transform: `scale(${zoom})`, transformOrigin: position }) } : undefined} />
    </div>
  );
}

/** Logo with the clearspace drawn round it: half the logo's height on every side. */
function Clearspace({ h }: { h: number }) {
  const pad = h / 2;
  const tag = "absolute grid size-5 place-items-center rounded-xs bg-[var(--header-bg)] text-[10px] font-semibold text-white";
  return (
    <div className="relative border border-dashed border-club-accent bg-club-tint/60" style={{ padding: `${pad}rem` }}>
      <span className={cn(tag, "top-0 left-0")}>½</span>
      <span className={cn(tag, "right-0 bottom-0")}>½</span>
      <div className="outline outline-1 outline-club-accent/40">
        <Image src={bocMain} alt="BOC" style={{ height: `${h}rem` }} className="w-auto" />
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default async function BrandPage() {
  const { db } = await loadSite();
  const email = db.club.email;
  const night = "bg-[var(--header-bg)]";

  return (
    <div style={themeStyle(boc)} className="min-h-screen bg-bg text-ink">
      <header className={cn("sticky top-0 z-20 text-white", night)}>
        <div className="page flex h-14 items-center justify-between gap-6">
          <a href="#topp" aria-label="Til toppen">
            <Mark src={bocWhite} className="h-5 w-auto" />
          </a>
          <nav aria-label="Seksjoner" className="hidden gap-5 text-[13px] xl:flex">
            {SECTIONS.map(([id, label]) => (
              <a key={id} href={`#${id}`} className="text-white/70 transition-colors hover:text-[var(--header-link)]">
                {label}
              </a>
            ))}
          </nav>
          <a href="/" className="text-[13px] text-white/70 hover:text-white">
            Til nettsiden
          </a>
        </div>
      </header>

      <main>
        <section id="topp" className={cn("relative overflow-hidden text-white", night)}>
          <Slants count={7} className="right-[-10%] bottom-0 left-[8%] h-12 lg:inset-y-0 lg:left-[58%] lg:h-auto" />
          <div className="page relative py-16 lg:py-28">
            <p className="t-overline text-[var(--header-link)]">Merkevare</p>
            <h1 className="t-display mt-4 max-w-[14ch]">Slik ser BOC ut.</h1>
            <p className="t-body-lg mt-5 max-w-[44ch] text-white/75">
              Logo, skrift, farger, bilder og mønster, og hvordan de brukes på nettsiden, i sosiale medier, på trykk og på drakten.
            </p>
          </div>
        </section>

        {/* 1 */}
        <Section id="logo" title="Primær logo" text="Ordmerket BOC er klubbens hovedlogo. Det brukes når det er plass, og alltid i en av disse fargene mot riktig bunn.">
          <div className="grid gap-3 lg:grid-rows-2">
            <Stage className="grid place-items-center bg-sunken py-14 lg:aspect-auto">
              <Mark src={bocMain} className="w-40 lg:w-56" />
            </Stage>
            <Stage className={cn("grid place-items-center py-14 lg:aspect-auto", night)}>
              <Mark src={bocYellow} className="w-40 lg:w-56" />
            </Stage>
          </div>
        </Section>

        {/* 2 */}
        <Section id="logomerke" title="Logomerke" text="BOC har ikke et eget symbol: bokstavene er merket. I smale flater som profilbilde og appikon står ordmerket i en kvadratisk flate.">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["bg-sunken", bocMain],
              [night, bocYellow],
              ["bg-club-surface", bocMain],
              [night, bocWhite],
            ].map(([bg, src], i) => (
              <div key={i} className={cn("grid aspect-square place-items-center rounded-xl lg:aspect-[16/9]", bg as string)}>
                <Mark src={src as StaticImageData} className="w-1/2 max-w-40" />
              </div>
            ))}
          </div>
        </Section>

        {/* 3 */}
        <Section id="frisone" title="Frisone" text="Frisonen er en halv logohøyde på alle sider. Ingen tekst, bilder eller kanter går inn i den, så merket alltid er lett å lese.">
          <Stage className="grid place-items-center gap-8 bg-sunken py-12">
            <div className="grid place-items-center gap-8">
              <Clearspace h={3.5} />
              <Clearspace h={1.75} />
            </div>
          </Stage>
        </Section>

        {/* 4 */}
        <Section id="skrift" title="Primær skrift" text="Nettsiden er satt i SF Pro på Apple-enheter og Inter ellers. På trykk, i maler og i filer som deles brukes Inter, siden SF Pro ikke kan deles. Ordmerket er tegnet i Avenir Next Demi Bold og skal ikke settes på nytt.">
          <Stage className="flex flex-col justify-between gap-10 bg-sunken p-6 sm:p-10">
            <p className="font-display text-[clamp(3.5rem,9vw,8rem)] leading-[0.95] font-medium tracking-[-0.03em]">
              SF Pro
              <span className="block text-ink-3">Inter</span>
            </p>
            <div className="grid gap-6">
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-[15px]">
                <span className="font-normal">Regular</span>
                <span className="font-medium">Medium</span>
                <span className="font-semibold">Semibold</span>
                <span className="font-bold">Bold</span>
              </div>
              <div className="font-display text-[13px] leading-7 tracking-[0.28em] break-words text-ink-2 sm:text-[15px]">
                <p>ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ</p>
                <p>abcdefghijklmnopqrstuvwxyzæøå</p>
                <p>0123456789?!()[]@</p>
              </div>
            </div>
          </Stage>
        </Section>

        {/* 5 */}
        <Section id="hierarki" title="Skrifthierarki" text="Størrelse og vekt styrer hva som leses først. Overskrifter er medium vekt med stram bokstavavstand. Størrelsene er desktop, og går ett trinn ned på telefon.">
          <Stage className="flex flex-col justify-center gap-3 bg-sunken p-6 sm:p-10 lg:aspect-auto lg:py-12">
            {(
              [
                ["t-display", "Display", "60 px", "−2 %"],
                ["t-h1", "H1 overskrift", "48 px", "−2 %"],
                ["t-h2", "H2 overskrift", "36 px", "−1,4 %"],
                ["t-h3", "H3 overskrift", "20 px", "0 %"],
                ["t-body-lg", "Ingress og løpende tekst", "19 px", "−0,8 %"],
                ["t-body", "Brødtekst", "16 px", "0 %"],
                ["t-small", "Småtekst og bildetekster", "14 px", "0 %"],
              ] as const
            ).map(([cls, label, size, track]) => (
              <div key={cls} className="flex items-baseline justify-between gap-6 border-b border-guide pb-3 last:border-0">
                <span className={cn(cls, "min-w-0")}>{label}</span>
                <span className="t-meta shrink-0 text-ink-3">
                  {size} | {track}
                </span>
              </div>
            ))}
          </Stage>
        </Section>

        {/* 6 */}
        <Section id="farger" title="Fargepalett" text={`Gult og petrol bærer merket. Natt og mørk grunn gir ro rundt dem. Petrol på gult har kontrast ${nbRatio(boc.link, boc.primary)}:1, og gult på natt ${nbRatio(boc.primary, boc.header!.background)}:1.`}>
          <Stage className="flex flex-col lg:flex-row">
            {PALETTE.map((c) => {
              const [r, g, b] = rgb(c.hex);
              return (
                <div
                  key={c.name}
                  className="flex min-h-28 flex-1 flex-col justify-end gap-0.5 p-4 text-[12px] leading-snug lg:min-h-0 lg:flex-[1_1_0]"
                  style={{ background: c.hex, color: c.ink }}
                >
                  <b className="text-[13px]">{c.name}</b>
                  <span className="opacity-80">{c.role}</span>
                  <span className="mt-1 opacity-80 tnum">
                    RGB {r}, {g}, {b}
                  </span>
                  <span className="opacity-80 tnum">{c.hex.toUpperCase()}</span>
                </div>
              );
            })}
          </Stage>
        </Section>

        {/* 7 */}
        <Section id="bilder" title="Bilder" text="Ekte medlemmer i bevegelse, i dagslys og ute. Gul drakt mot blå himmel eller grønt landskap er klubbens gjenkjennelige uttrykk. Ingen stillbilder fra stock.">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:grid-rows-[1fr_1fr] lg:aspect-[16/10]">
            <Photo src={mallorca3} alt="Ryttere i gule drakter sett bakfra på en vei på Mallorca" position="50% 45%" className="col-span-2 aspect-[4/5] lg:col-span-3 lg:row-span-2 lg:aspect-auto" />
            <Photo src={styrkeprove} alt="BOC-ryttere i gule drakter på en fjellvei under Styrkeprøven" position="50% 65%" className="col-span-2 aspect-[16/9] lg:col-span-3 lg:aspect-auto" />
            <Photo src={boc3} alt="Smilende BOC-medlemmer i gule drakter etter en tur" position="55% 42%" zoom={2} className="aspect-square lg:col-span-2 lg:aspect-auto" />
            <Photo src={terreng} alt="Terrengtur" position="62% 50%" className="aspect-square lg:col-span-1 lg:aspect-auto" />
          </div>
        </Section>

        {/* 8 */}
        <Section id="monster" title="Grafisk mønster" text="Skråstrekene har samme vinkel som i faktalisten på nettsiden. Bred til smal gir fart. Mønsteret brukes som kant eller bakgrunn og aldri bak tekst.">
          <Stage className={night}>
            <Slants count={9} className="inset-y-0 right-[-8%] left-[6%]" />
          </Stage>
        </Section>

        {/* 9 */}
        <Section id="sosiale-medier" title="Sosiale medier" text="Innlegg følger samme regler som nettsiden: ett budskap, en tydelig bunn og ordmerket i hjørnet. Eksemplene er forslag.">
          <Stage className="grid grid-cols-1 gap-4 bg-sunken p-5 sm:grid-cols-3 sm:p-8 lg:aspect-auto lg:py-10">
            {[
              <div key="a" className="relative grid h-full min-h-72 overflow-hidden rounded-md">
                <Image src={boc4} alt="" fill sizes="30vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--header-bg)]/85 via-transparent to-transparent" />
                <p className="relative self-end p-4 text-[22px] leading-tight font-medium tracking-[-0.02em] text-white">Det er fett å sykle.</p>
              </div>,
              <div key="b" className={cn("relative grid h-full min-h-72 overflow-hidden rounded-md", night)}>
                <Slants count={6} className="top-0 right-[-8%] bottom-[46%] left-[8%]" />
                <p className="relative self-end p-4 text-[22px] leading-tight font-medium tracking-[-0.02em] text-white">
                  Ekstra fett <span className="text-[var(--header-link)]">sammen.</span>
                </p>
              </div>,
              <div key="c" className="grid h-full min-h-72 grid-rows-[auto_1fr] overflow-hidden rounded-md bg-club-surface p-4 text-on-club">
                <Mark src={bocMain} className="w-14" />
                <p className="self-end text-[30px] leading-[1.02] font-medium tracking-[-0.03em]">
                  Alle er velkomne.
                  <span className="mt-2 block text-[14px] leading-snug font-normal tracking-normal">Nybegynner eller rutinert, det er plass til deg.</span>
                </p>
              </div>,
            ].map((card, i) => (
              <div key={i} className="flex flex-col rounded-lg bg-surface p-2 shadow-card">
                <div className="flex items-center gap-2 px-1 pb-2">
                  <span className="grid size-5 place-items-center rounded-full bg-club-surface">
                    <Mark src={bocMain} className="w-3" />
                  </span>
                  <span className="text-[11px] font-medium">boc</span>
                </div>
                <div className="flex-1">{card}</div>
                <div aria-hidden className="flex gap-2 px-1 pt-2">
                  {[0, 1, 2].map((d) => (
                    <span key={d} className="size-3 rounded-full bg-muted" />
                  ))}
                </div>
              </div>
            ))}
          </Stage>
        </Section>

        {/* 10 */}
        <Section id="bannere" title="Profil og banner" text="Banneret viser bilde og mønster, profilbildet er logomerket i gult. Samme oppsett på alle flater, bare tilpasset formatet.">
          <Stage className="bg-sunken p-4 sm:p-8">
            <div className="grid gap-4 sm:grid-cols-[1.5fr_1fr] sm:items-end">
              <div className="overflow-hidden rounded-lg bg-surface shadow-card">
                <div className={cn("relative aspect-[3/1] overflow-hidden", night)}>
                  {/* The photo fills only the part left of the dark wedge (about the picture's own proportions), so the riders on its right stay clear of it. */}
                  <div className="absolute inset-y-0 left-0 w-[80%]">
                    <Image src={hero} alt="" fill sizes="30vw" className="object-cover object-[30%_72%]" />
                  </div>
                  <div aria-hidden className={cn("absolute inset-y-0 right-[-3rem] w-[40%]", night)} style={{ transform: "skewX(-21.25deg)" }} />
                  <Mark src={bocYellow} className="absolute top-1/2 right-[6%] w-[16%] -translate-y-1/2" />
                </div>
                <div className="px-4 pb-4">
                  <span className="relative z-10 -mt-7 mb-2 grid size-14 place-items-center rounded-lg border-2 border-surface bg-club-surface">
                    <Mark src={bocMain} className="relative w-8" />
                  </span>
                  <p className="text-[15px] font-semibold">Bærum og Omegn Cykleklubb</p>
                  <p className="text-[12px] text-ink-3">Sykkelklubb, Bærum</p>
                  <div className="mt-3 flex gap-2 text-[12px] font-medium">
                    <span className="rounded-full bg-action px-4 py-1.5 text-on-action">Følg</span>
                    <span className="rounded-full border border-line-strong px-4 py-1.5">Melding</span>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg bg-surface shadow-card">
                <div className={cn("relative aspect-[5/2] overflow-hidden", night)}>
                  <Slants count={6} className="inset-y-0 right-[-8%] left-[20%]" />
                </div>
                <div className="px-4 pb-4">
                  <span className="relative z-10 -mt-6 mb-2 grid size-12 place-items-center rounded-full border-2 border-surface bg-club-surface">
                    <Mark src={bocMain} className="relative w-7" />
                  </span>
                  <p className="text-[14px] font-semibold">BOC</p>
                  <p className="text-[12px] text-ink-2">Det er fett å sykle sammen.</p>
                </div>
              </div>
            </div>
          </Stage>
        </Section>

        {/* 12 */}
        <Section id="visittkort" title="Visittkort" text="Svart forside med gult ordmerke, hvit bakside med kontaktinformasjon. Navn og rolle er plassholdere.">
          <Stage className="grid place-items-center bg-sunken p-6 sm:p-10">
            <div className="relative w-full max-w-md">
              <div className={cn("grid aspect-[7/4] w-[72%] place-items-center rounded-sm shadow-raised", night)}>
                <Mark src={bocYellow} className="w-1/2" />
              </div>
              <div className="absolute top-[42%] right-0 grid aspect-[7/4] w-[72%] grid-rows-[auto_1fr_auto] rounded-sm bg-surface p-4 shadow-raised">
                <div className="flex items-start justify-between gap-2">
                  <Mark src={bocMain} className="w-10" />
                  <p className="text-right text-[17px] leading-tight font-medium tracking-[-0.02em]">
                    Fornavn
                    <br />
                    Etternavn
                  </p>
                </div>
                <p className="self-end text-[9px] leading-snug text-ink-2">Rolle i klubben</p>
                <p className="text-[9px] leading-snug text-ink-2">{email}</p>
              </div>
              <div className="pb-[22%]" />
            </div>
          </Stage>
        </Section>

        {/* 13 */}
        <Section id="billboard" title="Billboard" text="Ett bilde, ett budskap og ordmerket. Den svarte flaten med skråkant bærer teksten, bildet står i midten og logoen sitter nederst til høyre.">
          <Photo src={billboard} alt="Billboard med BOC-ryttere, budskap, QR-kode og ordmerket" position="50% 40%" className="aspect-[4/3] rounded-xl lg:aspect-[16/10]" sizes="(min-width: 1024px) 60vw, 100vw" />
        </Section>

        {/* 14 */}
        <Section id="merch" title="Drakter og merch" text="Drakten er merkets viktigste flate: ordmerket midt på brystet, tre striper under og petrol på ermene. Den gule er konkurranse, den svarte er fritid. På resten står ordmerket alene, med stripene som aksent.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Stage className="grid place-items-center bg-muted p-6 lg:aspect-auto lg:py-10">
              <Image src={jerseyYellow} alt="Gul BOC-drakt" className="h-auto max-h-[28rem] w-auto" />
            </Stage>
            <Stage className="grid place-items-center bg-sunken p-6 lg:aspect-auto lg:py-10">
              <Image src={jerseyBlack} alt="Svart BOC-drakt" className="h-auto max-h-[28rem] w-auto" />
            </Stage>
            <Photo src={bottle} alt="Svart drikkeflaske med gult BOC-ordmerke" className="aspect-[3/2] rounded-xl" sizes="(min-width: 1024px) 30vw, 100vw" />
            <Photo src={musette} alt="Svart bag med gult BOC-ordmerke og tre gule striper" className="aspect-[3/2] rounded-xl" sizes="(min-width: 1024px) 30vw, 100vw" />
            <Photo src={tent} alt="Svart teltoverbygg med gult BOC-ordmerke ved en fjordvei" className="aspect-[2/1] rounded-xl sm:col-span-2" sizes="(min-width: 1024px) 60vw, 100vw" />
          </div>
        </Section>
      </main>

      <footer className={cn("text-white/70", night)}>
        <div className="page flex flex-wrap items-center justify-between gap-4 py-8 text-[13px]">
          <Mark src={bocWhite} className="h-5 w-auto" />
          <p className="max-w-[60ch]">
            Ordmerke, farger, drakter og bilder er klubbens egne. Frisone, skriftskala og mønster beskriver slik nettsiden bruker dem. Billboard, flaske, bag og telt er mockups laget av klubben, mens visittkort og sosiale medier er tegnede forslag.
          </p>
        </div>
      </footer>
    </div>
  );
}
