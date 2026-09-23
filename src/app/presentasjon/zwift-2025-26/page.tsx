import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import bocMain from "@/components/assets/BOC-main.png";
import bocWhite from "@/components/assets/BOC-white.png";
import menu from "@/components/assets/zwift/companion-1-meny.png";
import search from "@/components/assets/zwift/companion-2-sok.png";
import meetups from "@/components/assets/zwift/companion-3-meetups.png";
import accept from "@/components/assets/zwift/companion-4-godta.png";
import { Deck, type DeckSlide } from "@/components/deck/deck";
import { cn } from "@/lib/cn";
import { ZWIFT_2025_26_SESSIONS as ZWIFT_SESSIONS, zwiftSeasonStats } from "@/lib/data/zwift-2025-26";

export const metadata: Metadata = { title: "Zwift med BOC – sesongen 2025/26" };

/**
 * The Zwift group's presentation: how the winter sessions work, how to sign
 * up in Zwift Companion, and the season 2025/26 in numbers. It follows last
 * season's slides («Zwift-trening med BOC») in order and content, redrawn in
 * the site's own style — the header's black, the club yellow, the fact
 * strip's slants — on a 16:9 stage (components/deck/deck.tsx).
 *
 * The numbers are computed from lib/data/zwift-2025-26.ts, where their
 * sources and method are written down. The Companion screenshots are last
 * season's, cut from its slides.
 */

const nb = (n: number, digits = 1) => n.toLocaleString("nb-NO", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const MONTH = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
const MONTH_LONG = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const day = (iso: string) => `${Number(iso.slice(8))}. ${MONTH_LONG[Number(iso.slice(5, 7)) - 1]}`;

/* Three slanted bars, as in the header's wordmark: the deck's signature. */
function Slashes({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute top-0 right-24 flex h-40 gap-5", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="block h-full w-7 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
      ))}
    </div>
  );
}

/* The fact strip's slant as a faint texture across the slide. */
function Slants() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: "repeating-linear-gradient(111.25deg, transparent 0 399px, var(--guide-strong) 399px 400px)" }}
    />
  );
}

function Frame({ eyebrow, title, muted, logo, children }: { eyebrow?: string; title: string; muted?: string; logo: StaticImageData; children?: ReactNode }) {
  return (
    <>
      <Slants />
      <div className="relative flex h-full flex-col px-[120px] pt-[110px] pb-[96px]">
        <p className="text-[22px] font-semibold tracking-[0.12em] text-[var(--club-link)] uppercase">{eyebrow ?? "BOC · Gruppe Zwift"}</p>
        <h2 className="mt-5 max-w-[1200px] font-display text-[76px] leading-[1.02] font-medium tracking-[-0.03em]">
          {title} {muted && <span className="text-ink-3">{muted}</span>}
        </h2>
        <div className="mt-14 min-h-0 flex-1">{children}</div>
      </div>
      <Image src={logo} alt="" className="absolute top-[104px] right-[120px] h-9 w-auto" />
    </>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="flex items-baseline gap-5 text-[34px] leading-[1.25] font-medium tracking-[-0.01em]">
      <span className="flex size-14 shrink-0 translate-y-[-4px] items-center justify-center self-center rounded-full bg-[var(--club-primary)] font-display text-[28px] font-semibold text-[var(--club-on-primary)]">
        {n}
      </span>
      <span>{children}</span>
    </p>
  );
}

function Shot({ src, alt, className }: { src: StaticImageData; alt: string; className?: string }) {
  return <Image src={src} alt={alt} className={cn("h-auto rounded-lg shadow-[0_24px_48px_-24px_rgb(13_26_43/0.45)] ring-1 ring-black/10", className)} />;
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-5 text-[34px] leading-[1.3] tracking-[-0.01em]">
          <span aria-hidden className="mt-[18px] block size-3 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function ZwiftPresentation() {
  const s = zwiftSeasonStats();
  const max = 22;

  const slides: DeckSlide[] = [
    {
      id: "tittel",
      tone: "dark",
      title: "Gruppe Zwift",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <Image src={bocWhite} alt="BOC" className="mb-14 h-14 w-auto self-start" />
            <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Gruppe Zwift</p>
            <h2 className="mt-5 max-w-[1150px] font-display text-[112px] leading-[0.98] font-medium tracking-[-0.035em]">Felles intervalløkter hele vinteren.</h2>
            <p className="mt-8 text-[34px] text-ink-2">Slik fungerer det, slik blir du med, og sesongen 2025/26 i tall.</p>
          </div>
        </>
      ),
    },
    {
      id: "opplegget",
      tone: "dark",
      title: "Opplegget",
      content: (
        <Frame title="Opplegget." muted="Samme økt, samme tid, samme gruppe." logo={bocWhite}>
          <div className="grid grid-cols-2 gap-6">
            {[
              ["Mandag og onsdag", "kl. 19.00–20.00, gjennom vinteren"],
              ["Forhåndsbestemte intervaller", "Alle kjører samme workout, oppgitt i beskrivelsen av dagens økt"],
              ["«Keep Everyone Together»", "Alle holder følge i gruppa, uansett watt"],
              ["Invitasjon i Zwift Companion", "Øktene ligger også i Spond"],
            ].map(([head, text]) => (
              <div key={head} className="rounded-lg bg-surface p-8 ring-1 ring-line">
                <p className="font-display text-[40px] leading-[1.1] font-medium tracking-[-0.02em]">{head}</p>
                <p className="mt-3 text-[26px] leading-[1.35] text-ink-2">{text}</p>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },
    {
      id: "folg",
      tone: "light",
      title: "Slik melder du deg på: følg gruppelederen",
      content: (
        <Frame title="Slik melder du deg på." logo={bocMain}>
          <Step n={1}>Følg gruppelederen Jakob Jølstad i Zwift Companion.</Step>
          <p className="mt-3 pl-[76px] text-[26px] text-ink-2">More → Find Zwifters → søk etter «Jakob Jølstad» → følg.</p>
          <div className="mt-10 flex items-start gap-10 pl-[76px]">
            <Shot src={menu} alt="Zwift Companion: More, deretter Find Zwifters" className="w-[330px]" />
            <Shot src={search} alt="Zwift Companion: søk etter Jakob Jølstad og trykk på følg-knappen" className="w-[520px]" />
          </div>
        </Frame>
      ),
    },
    {
      id: "godta",
      tone: "light",
      title: "Slik melder du deg på: godta invitasjonen",
      content: (
        <Frame title="Slik melder du deg på." logo={bocMain}>
          <div className="grid grid-cols-2 gap-16">
            <div>
              <Step n={2}>Du blir invitert til Meetup.</Step>
              <p className="mt-3 pl-[76px] text-[26px] text-ink-2">Events → Meetups → «Your Meetups».</p>
              <Shot src={meetups} alt="Zwift Companion: Events, Meetups, og invitasjonen under Your Meetups" className="mt-8 ml-[76px] w-[300px]" />
            </div>
            <div>
              <Step n={3}>Du godtar i Zwift Companion.</Step>
              <p className="mt-3 pl-[76px] text-[26px] text-ink-2">Trykk på haken i Meetupen.</p>
              <Shot src={accept} alt="Zwift Companion: Meetup med grønn hake for å godta" className="mt-8 ml-[76px] w-[500px]" />
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "okten",
      tone: "dark",
      title: "Når økten starter",
      content: (
        <Frame title="Når økten starter." logo={bocWhite}>
          <div className="grid grid-cols-2 gap-20">
            <div>
              <p className="mb-8 text-[24px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Bli med</p>
              <Bullets items={["Logg på Zwift.", "Meetupen ligger som foreslått aktivitet.", "Gå inn på den og vent på start."]} />
            </div>
            <div>
              <p className="mb-8 text-[24px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Intervalløkta</p>
              <Bullets
                items={[
                  "Stå klar med sykkelen i Meetupen.",
                  <>
                    Klikk <b className="font-semibold">Meny → Workouts</b>.
                  </>,
                  "Velg økta som står i beskrivelsen av dagens økt.",
                ]}
              />
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "tall",
      tone: "dark",
      title: "Sesongen 2025/26 i tall",
      content: (
        <Frame eyebrow="BOC · Gruppe Zwift · Sesongen 2025/26" title="Sesongen i tall." logo={bocWhite}>
          <dl className="grid grid-cols-4 border-t border-line">
            {[
              [String(s.sessions), "økter"],
              [String(s.total), "oppmøter"],
              [nb(s.average), `ryttere i snitt per økt (median ${s.median})`],
              [`${s.ridersAtLeast}+`, "ulike ryttere"],
            ].map(([value, label]) => (
              <div key={label} className="relative flex flex-col-reverse justify-end gap-3 py-10 pr-8 pl-8 first:pl-0">
                <span aria-hidden className="absolute inset-y-0 left-0 w-px bg-line" style={{ transform: "skewX(-21.25deg)" }} />
                <dt className="text-[26px] leading-[1.3] text-ink-3">{label}</dt>
                <dd className="font-display text-[120px] leading-none font-medium tracking-[-0.04em] text-[var(--club-primary)]">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-10 max-w-[1100px] text-[26px] leading-[1.4] text-ink-2">
            Fra sesongåpningen {day(s.first)} til {day(s.last)}. Mandagene samlet flest, med {nb(s.monday)} i snitt mot {nb(s.wednesday)} på onsdagene.
          </p>
        </Frame>
      ),
    },
    {
      id: "per-okt",
      tone: "dark",
      title: "Ryttere per økt",
      content: (
        <Frame title="Ryttere per økt." muted={`Flest ${day(s.peak.date)}.`} logo={bocWhite}>
          <div className="relative mt-10 ml-12 h-[380px]">
            {[5, 10, 15, 20].map((g) => (
              <div key={g} className="absolute inset-x-0 border-t border-line" style={{ bottom: `${(g / max) * 100}%` }}>
                <span className="absolute -top-4 -left-12 w-9 text-right text-[20px] text-ink-3 tabular-nums">{g}</span>
              </div>
            ))}
            <div className="absolute inset-0 flex items-end gap-[6px] border-b border-line-strong">
              {ZWIFT_SESSIONS.map((x) => (
                  <div key={x.date} className="relative flex h-full flex-1 items-end">
                    <div className="w-full rounded-t-[2px] bg-[var(--club-primary)]" style={{ height: `${(x.riders / max) * 100}%` }} title={`${day(x.date)}: ${x.riders}`} />
                    {x.date === s.peak.date && (
                      <span className="absolute left-1/2 -translate-x-1/2 font-display text-[28px] font-medium" style={{ bottom: `calc(${(x.riders / max) * 100}% + 8px)` }}>
                        {x.riders}
                      </span>
                    )}
                    {x.date === firstOfMonth(x.date) && (
                      <span className="absolute -bottom-10 left-0 text-[20px] text-ink-3">{MONTH[Number(x.date.slice(5, 7)) - 1]}</span>
                    )}
                  </div>
                ))}
            </div>
          </div>
          <table className="sr-only">
            <caption>Ryttere per økt, sesongen 2025/26</caption>
            <tbody>
              {ZWIFT_SESSIONS.map((x) => (
                <tr key={x.date}>
                  <th scope="row">{day(x.date)}</th>
                  <td>{x.riders}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-14 text-[20px] text-ink-3">Kilde: deltakere i Meetup-øktene i Zwift Companion. Bare antall, ingen navn.</p>
        </Frame>
      ),
    },
    {
      id: "vinteren",
      tone: "light",
      title: "Oppmøtet gjennom vinteren",
      content: (
        <Frame title="Oppmøtet holdt seg hele vinteren." muted="Snitt per økt, måned for måned." logo={bocMain}>
          <div className="flex h-[400px] items-end gap-8 border-b border-line-strong">
            {s.months.map((m) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-3 font-display text-[40px] font-medium tracking-[-0.02em]">{nb(m.average)}</span>
                <div className="w-full rounded-t-[2px] bg-[var(--club-link)]" style={{ height: `${(m.average / 14) * 100}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-8">
            {s.months.map((m) => (
              <span key={m.month} className="flex-1 text-center text-[24px] text-ink-2 capitalize">
                {MONTH_LONG[Number(m.month.slice(5)) - 1]}
              </span>
            ))}
          </div>
        </Frame>
      ),
    },
    {
      id: "bli-med",
      tone: "brand",
      title: "Bli med i vinter",
      content: (
        <>
          <div className="relative flex h-full flex-col justify-center px-[120px]">
            <p className="text-[26px] font-semibold tracking-[0.14em] uppercase opacity-70">Bli med i vinter</p>
            <h2 className="mt-5 max-w-[1250px] font-display text-[96px] leading-[1] font-medium tracking-[-0.035em]">
              Følg Jakob Jølstad i Zwift Companion, så får du invitasjonen.
            </h2>
            <p className="mt-10 max-w-[1100px] text-[32px] leading-[1.35] opacity-80">
              Alle nivåer kjører sammen. Du trenger Zwift og en smartrulle eller wattmåler. Påmeldingen til Fryd Vinterligaen åpner 1. oktober kl. 12.
            </p>
          </div>
          <Image src={bocMain} alt="" className="absolute top-[104px] right-[120px] h-9 w-auto" />
        </>
      ),
    },
  ];

  return <Deck slides={slides} title="Zwift med BOC – sesongen 2025/26" />;
}

/** The first session of a date's month, where the month's label goes. */
function firstOfMonth(iso: string) {
  return ZWIFT_SESSIONS.find((x) => x.date.slice(0, 7) === iso.slice(0, 7))!.date;
}
