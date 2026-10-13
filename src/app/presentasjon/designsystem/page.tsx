import type { Metadata } from "next";
import Image from "next/image";
import type { ReactNode } from "react";
import bocWhite from "@/components/assets/BOC-white.png";
import boc3 from "@/components/assets/boc3.jpg";
import { CensorDemo } from "@/components/deck/censor-demo";
import { Deck, type DeckSlide } from "@/components/deck/deck";
import { Bullets, Frame, Slants, Slashes } from "@/components/deck/parts";
import { Button, HoverArrow } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { themeSeed } from "@/lib/data/seed/org";
import { contrastRatio, themeStyle } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Designsystemet",
  description: "Hvordan BOCs nettside er bygget opp: prinsipper, farger, skrift, grid, skråvinkelen, komponenter, bevegelse og personvern.",
  robots: { index: false, follow: false },
};

/**
 * The design system as a deck: what the site is built from, in the order the
 * reference page (/design-system) shows it, redrawn on the deck's 16:9 stage.
 * The colours are read from the club's own theme (lib/data/seed/org.ts), and the
 * contrast figure is computed; sizes, radii, shadows, grid and timing are the
 * values in src/app/globals.css, written out here as they stand there, so a
 * change there needs the same change here. The page pins the BOC theme on its
 * own wrapper, so it looks the same whichever club the demo is showing.
 */

const boc = themeSeed().find((t) => t.id === "boc")!;
const nb = (n: number) => n.toLocaleString("nb-NO", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/* The mosaic's boxes on the group photo, as fractions of the picture (the same three as in the user-experience deck). */
const MASKED = [
  { x: 0.345, y: 0.36, w: 0.12, h: 0.55 },
  { x: 0.435, y: 0.36, w: 0.075, h: 0.5 },
  { x: 0.675, y: 0.337, w: 0.105, h: 0.55 },
];

const EYEBROW = "BOC · Designsystem";

function Card({ title, children, className }: { title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-surface p-7 ring-1 ring-line", className)}>
      <p className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.012em]">{title}</p>
      {children && <div className="mt-3 text-[22px] leading-[1.35] text-ink-2">{children}</div>}
    </div>
  );
}

export default function DesignSystemDeck() {
  const slides: DeckSlide[] = [
    {
      id: "tittel",
      tone: "dark",
      title: "Designsystemet",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <Image src={bocWhite} alt="BOC" className="mb-14 h-14 w-auto self-start" />
            <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Designsystemet</p>
            <h2 className="mt-5 max-w-[1150px] font-display text-[112px] leading-[0.98] font-medium tracking-[-0.022em]">Klubben eier fargene. Plattformen eier resten.</h2>
            <p className="mt-8 text-[34px] text-ink-2">Prinsipper, farger, skrift, grid, skråvinkelen, komponenter, bevegelse og personvern.</p>
          </div>
        </>
      ),
    },
    {
      id: "prinsipper",
      tone: "dark",
      title: "Prinsipper",
      content: (
        <Frame eyebrow={EYEBROW} title="Syv prinsipper." muted="Stripe-inspirert system under, redaksjonelt sportsuttrykk over." logo={bocWhite} size={60}>
          <ol className="grid grid-cols-2 gap-x-14 gap-y-5">
            {[
              ["Gridet er synlig", "Tynne guidelinjer gir struktur også i luften mellom innholdet."],
              ["Lag, ikke bokser", "Flater skilles med toner, hårlinjer og forsiktige skygger."],
              ["Fotografi først", "Ett stort, godt bilde fremfor mange små."],
              ["Informasjon er innholdet", "Tider, steder og navn. Ingen pyntetekst, ingen oppdiktede tall."],
              ["Identitet med disiplin", "Skråformen markerer klubb og fremdrift, og brukes bare der den betyr noe."],
              ["Bevegelse med mening", "Kort og rask: 140 til 360 ms. Redusert bevegelse respekteres."],
              ["Personvern er en del av designet", "Maskering i bilder er et synlig systemelement."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-5 border-t border-line pt-4">
                <span className="font-display text-[34px] leading-none font-medium text-[var(--club-primary)] tnum">{i + 1}</span>
                <span>
                  <span className="block text-[26px] leading-[1.2] font-semibold">{t}</span>
                  <span className="mt-1 block text-[21px] leading-[1.3] text-ink-2">{d}</span>
                </span>
              </li>
            ))}
          </ol>
        </Frame>
      ),
    },
    {
      id: "farger",
      tone: "dark",
      title: "Farger",
      content: (
        <Frame eyebrow={EYEBROW} title="Klubbens farger." muted="Resten er felles." logo={bocWhite}>
          <div className="grid grid-cols-[minmax(0,1fr)_480px] items-start gap-14">
            <div className="grid grid-cols-5 gap-4">
              {[
                ["Flate", "--club-primary", boc.primary, "Knapper og flater"],
                ["Blågrønn", "--club-link, -secondary, -accent", boc.link, "Tekst, lenker og mørke flater"],
                ["Meny", "--header-bg", boc.header!.background, "Header og footer"],
                ["Mørk grunn", "--dark-bg", boc.dark!.background, "Bakgrunn i mørk modus"],
                ["Tone", "--club-tint", boc.tint, "Lyse flater"],
              ].map(([name, token, hex, use]) => (
                <div key={name}>
                  <div className="h-[220px] rounded-lg ring-1 ring-white/30" style={{ background: hex }} />
                  <p className="mt-3 text-[24px] font-semibold">{name}</p>
                  <p className="text-[16px] leading-[1.25] text-ink-3">{token}</p>
                  <p className="text-[17px] text-ink-3 tnum">{hex.toUpperCase()}</p>
                  <p className="mt-1 text-[19px] leading-[1.3] text-ink-2">{use}</p>
                </div>
              ))}
            </div>
            <div className="space-y-5 text-[24px] leading-[1.35] text-ink-2">
              <p>
                <span className="font-semibold text-ink">Klubben velger noen få.</span> Flate, lenke, mørk, aksent og tone skrives inn som CSS-variabler fra klubbens tema, og alt annet leser dem.
              </p>
              <p>
                <span className="font-semibold text-ink">Gult kan ikke bære tekst.</span> BOCs gule er en flate; teksten og lenkene tar den blågrønne, som har kontrast {nb(contrastRatio(boc.link, boc.primary))}:1 mot gult.
              </p>
              <p>Nøytraler, status og kategorifarger er felles for alle klubber.</p>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "skrift",
      tone: "dark",
      title: "Skrift",
      content: (
        <Frame eyebrow={EYEBROW} title="Skrift." muted="SF Pro på Apple-enheter, Inter ellers." logo={bocWhite} size={64}>
          <div className="divide-y divide-line">
            {(
              [
                ["Display", 60, 37, 500, "−2 %", "Idrett for alle."],
                ["H1", 48, 30, 500, "−2 %", "Alt som skjer i klubben"],
                ["H2", 36, 24, 500, "−1,4 %", "Fra lag og grupper"],
                ["H3", 20, 16, 600, "0 %", "Trenere og lagledere"],
                ["Ingress", 19, 18, 400, "−0,8 %", "J16-2 trener tirsdag og torsdag."],
                ["Brødtekst", 16, 17, 400, "0 %", "Oppmøte ved klubbhuset kl. 11.15."],
                ["Liten", 14, 15, 400, "0 %", "Bane 2 er stengt for vedlikehold."],
              ] as const
            ).map(([name, size, mobile, weight, track, sample]) => (
              <div key={name} className="grid grid-cols-[150px_330px_minmax(0,1fr)] items-baseline gap-6 py-[12px]">
                <span className="text-[22px] font-semibold text-ink-2">{name}</span>
                <span className="text-[19px] text-ink-3 tnum">
                  {size} px, mobil {mobile} · {track}
                </span>
                <span className="truncate font-display leading-[1.1]" style={{ fontSize: size, fontWeight: weight, letterSpacing: track.startsWith("−") ? `-${Number.parseFloat(track.slice(1).replace(",", ".")) / 100}em` : undefined }}>
                  {sample}
                </span>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },
    {
      id: "grid",
      tone: "dark",
      title: "Grid",
      content: (
        <Frame eyebrow={EYEBROW} title="Grid." muted="Gridet er synlig." logo={bocWhite} size={64}>
          <div className="relative">
            <div className="grid grid-cols-12 gap-x-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex h-[150px] items-start justify-center rounded-sm bg-[color-mix(in_srgb,var(--club-primary)_14%,transparent)] pt-3 text-[18px] text-ink-3 tnum">
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-4 gap-5">
              {[
                ["Desktop", "12 kolonner", "gap 32 · marg 40"],
                ["Nettbrett", "8 kolonner", "gap 24 · marg 32"],
                ["Mobil", "4 kolonner", "gap 16 · marg 20"],
                ["Innholdsbredde", "1280 px", "maks, midtstilt"],
              ].map(([a, b, c]) => (
                <div key={a} className="rounded-lg bg-surface p-5 ring-1 ring-line">
                  <p className="text-[20px] font-semibold text-ink-3">{a}</p>
                  <p className="mt-1 font-display text-[34px] leading-[1.1] font-medium">{b}</p>
                  <p className="mt-1 text-[20px] text-ink-2">{c}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[24px] text-ink-2">Guidelinjene ligger midt i gapene, så innhold aldri berører en linje, og de lener seg som resten av siden.</p>
          </div>
        </Frame>
      ),
    },
    {
      id: "vinkel",
      tone: "dark",
      title: "Skråvinkelen",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-[minmax(0,1fr)_620px] items-center gap-16 px-[120px]">
            <div>
              <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Én vinkel</p>
              <h2 className="mt-5 font-display text-[150px] leading-[1] font-medium tracking-[-0.03em] tnum">21,25°</h2>
              <p className="mt-6 max-w-[760px] text-[32px] leading-[1.3] text-ink-2">Den samme skråningen går igjennom hele identiteten, så den blir en signatur og ikke pynt.</p>
              <div className="mt-8">
                <Bullets items={["Den mørke delen av heroen", "Faktalisten og sidens guidelinjer", "Ordmerkets striper på drakten", "Listepunkter i presentasjonene"]} />
              </div>
            </div>
            <div className="relative h-[560px] overflow-hidden rounded-xl bg-surface ring-1 ring-line">
              <div aria-hidden className="absolute inset-y-0 left-[-6rem] w-[420px] bg-[var(--header-bg,#0d1a2b)]" style={{ transform: "skewX(-21.25deg)" }} />
              <div aria-hidden className="absolute top-0 right-16 flex h-40 gap-5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="block h-full w-7 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
                ))}
              </div>
              <div aria-hidden className="absolute right-0 bottom-0 left-0 h-3 bg-[var(--club-primary)]" />
            </div>
          </div>
        </>
      ),
    },
    {
      id: "flater",
      tone: "dark",
      title: "Flater og lag",
      content: (
        <Frame eyebrow={EYEBROW} title="Flater og lag." muted="Aldri glass eller gradienter." logo={bocWhite} size={64}>
          <div className="grid grid-cols-2 gap-14">
            <div>
              <p className="mb-5 text-[22px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Radius</p>
              <div className="flex items-end gap-5">
                {[
                  ["2", "tagger"],
                  ["3", "status"],
                  ["5", "kontroller"],
                  ["8", "flater"],
                  ["12", "hero og bilder"],
                ].map(([r, use]) => (
                  <div key={r} className="min-w-0 flex-1">
                    <div className="h-[110px] bg-[color-mix(in_srgb,var(--club-primary)_22%,var(--surface))] ring-1 ring-white/10" style={{ borderRadius: `${r}px` }} />
                    <p className="mt-3 text-[26px] font-semibold tnum">{r} px</p>
                    <p className="text-[18px] text-ink-3">{use}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[22px] leading-[1.35] text-ink-2">Knappene har 6 px på alle hjørner, i alle bredder.</p>
            </div>
            <div>
              <p className="mb-5 text-[22px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Skygge, fem nivåer</p>
              {/* Shadows do not show on the deck's dark ground, so they stand on a light panel, as on the site's light pages. */}
              <div className="rounded-xl bg-[#e9edf2] px-6 py-8">
                <div className="grid grid-cols-5 gap-4">
                  {[
                    ["Kort", "shadow-card"],
                    ["Løftet", "shadow-raised"],
                    ["Svevende", "shadow-float"],
                    ["Popover", "shadow-popover"],
                    ["Dialog", "shadow-dialog"],
                  ].map(([label, cls]) => (
                    <div key={label} className={cn("grid h-[120px] place-items-center rounded-lg bg-white text-[17px] font-semibold text-[#0d1a2b]", cls)}>
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-6 text-[22px] leading-[1.35] text-ink-2">Dybde bygges med tonale bånd, hårlinjer og forsiktige skygger. Jo høyere noe ligger, jo dypere skygge.</p>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "komponenter",
      tone: "dark",
      title: "Komponenter",
      content: (
        <Frame eyebrow={EYEBROW} title="Komponenter." muted="Små deler, samme regler." logo={bocWhite} size={64}>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-14">
            <div>
              <p className="mb-5 text-[22px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Knapper</p>
              {/* The real buttons, enlarged to read on the 1600 px stage (zoom keeps their proportions). */}
              <div className="flex flex-wrap items-center gap-3 [&_button]:!pointer-events-none" style={{ zoom: 1.6 }}>
                <Button variant="primary">Primær</Button>
                <Button variant="secondary">Sekundær</Button>
                <Button variant="ghost">Dempet</Button>
                <Button variant="inverse">Invertert</Button>
                <Button variant="danger">Fare</Button>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3 [&_button]:!pointer-events-none" style={{ zoom: 1.6 }}>
                <Button size="sm">Liten, 32 px</Button>
                <Button size="md">Middels, 40</Button>
                <Button size="lg">Stor, 48</Button>
              </div>
              <p className="mt-6 flex items-center text-[22px] text-ink-2">
                Lenker får en pil som vokser <span className="ml-3 inline-flex scale-[1.8] text-[var(--club-primary)]"><HoverArrow /></span>
              </p>
            </div>
            <div>
              <p className="mb-5 text-[22px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Det som finnes</p>
              <Bullets items={["Knapper og lenker", "Skjema og filtre", "Status og merker", "Navigasjon og brødsmuler", "Aktivitetsrader og historier", "Personer og kontaktkort", "Bilder med fokus og maskering"]} />
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "bevegelse",
      tone: "dark",
      title: "Bevegelse",
      content: (
        <Frame eyebrow={EYEBROW} title="Bevegelse." muted="Kort og rask, med mening." logo={bocWhite} size={64}>
          <div className="grid grid-cols-[minmax(0,1fr)_520px] items-start gap-14">
            <div className="space-y-6">
              {[
                ["140 ms", "Rask", "Hover og trykk", 140],
                ["200 ms", "Vanlig", "Menyer og farger", 200],
                ["360 ms", "Rolig", "Større flater", 360],
              ].map(([t, name, use, ms]) => (
                <div key={name}>
                  <div className="flex items-baseline gap-5">
                    <span className="font-display text-[44px] leading-none font-medium tnum">{t}</span>
                    <span className="text-[24px] font-semibold text-ink-2">{name}</span>
                    <span className="text-[22px] text-ink-3">{use}</span>
                  </div>
                  <div className="mt-3 h-3 rounded-full bg-surface">
                    <div className="h-full rounded-full bg-[var(--club-primary)]" style={{ width: `${(Number(ms) / 360) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-5 text-[24px] leading-[1.35] text-ink-2">
              <p>
                <span className="font-semibold text-ink">Ut-kurve:</span> <span className="tnum">cubic-bezier(0.22, 0.8, 0.24, 1)</span>, raskt inn og mykt til hvile.
              </p>
              <p>
                <span className="font-semibold text-ink">Inn og ut:</span> <span className="tnum">cubic-bezier(0.65, 0, 0.35, 1)</span>.
              </p>
              <p>Den som har bedt om redusert bevegelse, får stillstand: filmer står stille med kontroller, og effektene hoppes over.</p>
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "personvern",
      tone: "dark",
      title: "Personvern",
      content: (
        <Frame eyebrow={EYEBROW} title="Personvern er design." muted="Maskering er et systemelement." logo={bocWhite} size={64}>
          <div className="grid grid-cols-[minmax(0,1fr)_600px] items-start gap-14">
            <div className="space-y-5 text-[26px] leading-[1.35] text-ink-2">
              <p>Den som ikke skal kjennes igjen, dekkes med en grov, ensartet mosaikk. Den ser likt ut overalt, så den leses som et system og ikke som en feil.</p>
              <p>Boksene ligger i bildets egne koordinater og følger med ved enhver beskjæring.</p>
              <p>Samtykke og anonymisering gjelder bilder, tekst og lister, også i gamle saker.</p>
            </div>
            <CensorDemo src={boc3.src} regions={MASKED} alt="Gruppebilde der tre personer er dekket av grov mosaikk" className="block h-auto w-full rounded-lg ring-1 ring-line" />
          </div>
        </Frame>
      ),
    },
    {
      id: "videre",
      tone: "dark",
      title: "Hvor finner du det",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-2 items-center gap-16 px-[120px]">
            <div>
              <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Videre</p>
              <h2 className="mt-5 font-display text-[64px] leading-[1.1] font-medium tracking-[-0.019em]">Ett sted å endre, én side å se på.</h2>
              <p className="mt-8 max-w-[700px] text-[26px] leading-[1.4] text-ink-2">Verdiene ligger som variabler, og komponentene leser dem. Endrer du en verdi, endres den overalt.</p>
            </div>
            <div className="space-y-4">
              <Card title="Verdiene">Fargene, skriften, radius, skygger, grid og tidsbruk ligger i globals.css, og klubbens farger i temaet.</Card>
              <Card title="Komponentene">Knapper, felt, status og de offentlige delene ligger i components/ui og components/public.</Card>
              <Card title="Referansen">Alt vist i bruk på /design-system. Merkevaren, med logo og eksempler, ligger på /brand.</Card>
            </div>
          </div>
          <Image src={bocWhite} alt="" className="absolute top-[104px] right-[120px] h-9 w-auto" />
        </>
      ),
    },
  ];

  return (
    <div style={themeStyle(boc)}>
      <Deck slides={slides} title="Designsystemet" />
    </div>
  );
}
