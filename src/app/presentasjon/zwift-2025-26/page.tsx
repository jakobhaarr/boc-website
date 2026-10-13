import type { Metadata } from "next";
import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import bocWhite from "@/components/assets/BOC-white.png";
import menu from "@/components/assets/zwift/companion-1-meny.png";
import search from "@/components/assets/zwift/companion-2-sok.png";
import meetups from "@/components/assets/zwift/companion-3-meetups.png";
import accept from "@/components/assets/zwift/companion-4-godta.png";
import spondLogo from "@/components/assets/spond.svg";
import spondEvent from "@/components/assets/spond-zwift-event.png";
import zwiftHero from "@/components/assets/zwift-hero-new.png";
import companionIcon from "@/components/assets/zwift-companion-icon.png";
import zwiftSetup from "@/components/assets/zwift-setup-boc.png";
import screenHome from "@/components/assets/zwift-screen-001.jpg";
import screenMeetup from "@/components/assets/zwift-screen-002.jpg";
import screenMenu from "@/components/assets/zwift-screen-003.jpg";
import screenTraining from "@/components/assets/zwift-screen-004.jpg";
import { Deck, type DeckSlide } from "@/components/deck/deck";
import { Bullets, Frame, Shot, Slants, Slashes, Step } from "@/components/deck/parts";
import { ZwiftPick } from "@/components/deck/zwift-pick";
import { cn } from "@/lib/cn";
import { ZWIFT_2025_26_SESSIONS as ZWIFT_SESSIONS, zwiftSeasonStats } from "@/lib/data/zwift-2025-26";

export const metadata: Metadata = { title: "Zwift med BOC – sesongen 2025/26" };

/**
 * Always dark (every slide is a dark one), whatever the visitor's theme.
 *
 * The Zwift group's presentation: how the winter sessions work, how to sign
 * up (the six steps of the wizard on the Zwift page, in the same order and
 * with the same screenshots), and the season 2025/26 in numbers. It follows last
 * season's slides («Zwift-trening med BOC») in order and content, redrawn in
 * the site's own style — the header's black, the club yellow, the fact
 * strip's slants — on a 16:9 stage (components/deck/deck.tsx).
 *
 * The numbers are computed from lib/data/zwift-2025-26.ts, where their
 * sources and method are written down. The Companion screenshots of steps 3
 * and 4 are last season's, cut from its slides; the Zwift screens of steps 5
 * and 6 (zwift-screen-001 to 004) are this season's.
 */

const nb = (n: number, digits = 1) => n.toLocaleString("nb-NO", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const MONTH = ["jan", "feb", "mar", "apr", "mai", "jun", "jul", "aug", "sep", "okt", "nov", "des"];
const MONTH_LONG = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];
const day = (iso: string) => `${Number(iso.slice(8))}. ${MONTH_LONG[Number(iso.slice(5, 7)) - 1]}`;

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
            <h2 className="mt-5 max-w-[1150px] font-display text-[112px] leading-[0.98] font-medium tracking-[-0.022em]">Felles intervalløkter hele vinteren.</h2>
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
              ["«Keep\u00A0Everyone\u00A0Together»", "Alle holder følge i gruppa, uansett watt"],
              ["Fryd Vinterligaen", "Åtte ritt gjennom vinteren på Zwift, arrangert av 5071CK. Du melder deg på selv hos arrangøren.", "Ekstra tilbud"],
            ].map(([head, text, tag]) => (
              <div
                key={head}
                className={cn(
                  "relative overflow-hidden rounded-lg p-8",
                  // The three sessions' facts sit on the club's teal, taken dark; the extra offer stays on the plain dark card, with the teal flag.
                  tag ? "bg-surface ring-1 ring-line" : "bg-[color-mix(in_srgb,var(--club-secondary)_62%,var(--surface))]",
                )}
              >
                {/* A flag in the corner for what comes on top of the sessions: the club's teal, cut on the same slant as the rest of the deck. */}
                {tag && (
                  <span
                    className="absolute top-0 right-0 bg-[var(--club-secondary)] py-2.5 pr-7 pl-9 text-[20px] font-semibold tracking-[0.08em] whitespace-nowrap text-[var(--club-on-secondary)] uppercase"
                    style={{ clipPath: "polygon(16px 0, 100% 0, 100% 100%, 0 100%)" }}
                  >
                    {tag}
                  </span>
                )}
                <p className="font-display text-[40px] leading-[1.1] font-medium tracking-[-0.012em]">{head}</p>
                <p className="mt-3 text-[26px] leading-[1.35] text-ink-2">{text}</p>
              </div>
            ))}
          </div>
        </Frame>
      ),
    },
    {
      id: "spond",
      tone: "dark",
      title: "Slik melder du deg på: meld deg på i Spond",
      content: (
        <Frame title="Slik melder du deg på." logo={bocWhite}>
          <div className="grid grid-cols-2 items-start gap-16">
            <div>
              <Step n={1}>Meld deg på økta i Spond.</Step>
              <p className="mt-3 pl-[76px] text-[26px] text-ink-2">
                Gruppeleder inviterer kun de som har meldt seg på i Spond. Gjør dette hver gang, ikke bare første gang.
              </p>
              <p className="mt-4 pl-[76px] text-[26px] text-ink-2">Bli med i Spond-gruppa med koden under, åpne økta og trykk «Attending».</p>
              {/* Spond's own red (as on the site's Spond button) holds the logo; the group's invite code, which is how newcomers find it (OrgNode.joinGroup, spond.com/invite/LFODS), stands beside it. */}
              <div className="mt-8 flex items-center gap-5 pl-[76px]">
                <span className="flex items-center rounded-lg bg-[#f72b51] px-6 py-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={spondLogo.src} alt="Spond" className="h-[40px] w-auto" />
                </span>
                <span className="flex items-center gap-4 rounded-lg bg-surface px-5 py-2.5 ring-1 ring-line">
                  <span className="text-[20px] font-semibold tracking-[0.1em] text-ink-3 uppercase">Kode</span>
                  <span className="font-display text-[44px] leading-none font-semibold tracking-[0.12em] text-[var(--club-primary)]">LFODS</span>
                </span>
              </div>
            </div>
            <Shot src={spondEvent} alt="Spond: økta «Mandagsøkt Zwift» med Attending/Decline, og 66 uten svar" className="w-[380px]" />
          </div>
        </Frame>
      ),
    },
    {
      id: "utstyr",
      tone: "dark",
      title: "Slik melder du deg på: gjør klar utstyret",
      content: (
        <Frame title="Slik melder du deg på." logo={bocWhite}>
          <div className="grid grid-cols-2 items-center gap-16">
            <div>
              <Step n={2}>Gjør klar utstyret.</Step>
              <p className="mt-3 pl-[76px] text-[26px] leading-[1.35] text-ink-2">Alle nivåer kjører sammen, så du trenger ikke være i form.</p>
              {/* The same slanted marks as Bullets (components/deck/parts.tsx), at the size of this slide's list. */}
              <ul className="mt-8 space-y-4 pl-[76px] text-[28px] leading-[1.3]">
                {[
                  <span key="a" className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    En Zwift-konto med abonnement
                    <span className="rounded-full bg-club-tint px-4 py-1.5 text-[22px] font-semibold whitespace-nowrap text-club">ca. 250 kr/mnd</span>
                  </span>,
                  "En smartrulle eller en wattmåler på sykkelen",
                  "Zwift Companion-appen på telefonen",
                ].map((item, i) => (
                  <li key={i} className="flex gap-4">
                    <span aria-hidden className="mt-[14px] block size-2.5 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* The Companion app's icon sits on the corner of the picture: the app on the phone is one of the three things to have. */}
            <div className="relative ml-auto w-[560px]">
              <Shot src={zwiftSetup} alt="Rytter i BOC-drakt monterer sykkelen på en smartrulle, klar til å kjøre Zwift hjemme" className="w-full" />
              <Image src={companionIcon} alt="Zwift Companion-appen" className="absolute -bottom-9 -left-9 size-[150px] rounded-[34px] shadow-[0_18px_36px_-12px_rgb(0_0_0/0.65)] ring-4 ring-[var(--header-bg,#0d1a2b)]" />
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "folg",
      tone: "dark",
      title: "Slik melder du deg på: følg gruppelederen",
      content: (
        <Frame title="Slik melder du deg på." logo={bocWhite}>
          <Step n={3}>Følg gruppelederen Jakob Jølstad i Zwift Companion.</Step>
          <p className="mt-3 pl-[76px] text-[26px] text-ink-2">
            Meetup-invitasjoner kan bare sendes til dem som følger arrangøren. More → Find Zwifters → søk&nbsp;etter&nbsp;«Jakob&nbsp;Jølstad» → følg.
          </p>
          <div className="mt-10 flex items-start gap-10 pl-[76px]">
            <Shot src={menu} alt="Zwift Companion: More, deretter Find Zwifters" className="w-[330px]" />
            <Shot src={search} alt="Zwift Companion: søk etter Jakob Jølstad og trykk på følg-knappen" className="w-[520px]" />
          </div>
        </Frame>
      ),
    },
    {
      id: "godta",
      tone: "dark",
      title: "Slik melder du deg på: godta invitasjonen",
      content: (
        <Frame title="Slik melder du deg på." logo={bocWhite}>
          <Step n={4}>Godta invitasjonen til Meetupen.</Step>
          <div className="mt-8 grid grid-cols-2 gap-16 pl-[76px]">
            <div>
              <p className="text-[26px] text-ink-2">Events → Meetups → «Your Meetups».</p>
              <Shot src={meetups} alt="Zwift Companion: Events, Meetups, og invitasjonen under Your Meetups" className="mt-6 w-[300px]" />
            </div>
            <div>
              <p className="text-[26px] text-ink-2">Åpne økta og trykk på haken.</p>
              <Shot src={accept} alt="Zwift Companion: Meetup med grønn hake for å godta" className="mt-6 w-[500px]" />
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "okten",
      tone: "dark",
      title: "Bli med når økten starter",
      content: (
        <Frame title="Bli med når økten starter." logo={bocWhite}>
          <div className="grid grid-cols-[minmax(0,1fr)_760px] items-start gap-14">
            <div>
              <Step n={5}>Start Zwift i god tid.</Step>
              <div className="mt-8 pl-[76px]">
                <Bullets items={["Logg på Zwift.", "Meetupen ligger under «For\u00A0you» på startsiden.", "Gå inn på den og vent på start.", "Fortsett å tråkke: «Keep\u00A0Everyone\u00A0Together» holder alle sammen."]} />
              </div>
            </div>
            <Shot src={screenHome} alt="Zwift: startsiden, med «Jakob Jølstad's Meetup» markert i gult under «For you»" className="w-full" />
          </div>
        </Frame>
      ),
    },
    {
      id: "velg-okten",
      tone: "dark",
      title: "Velg dagens intervalløkt",
      steps: 3,
      // Printed at its last step: the Training window with the workout chosen.
      printStep: 2,
      content: (
        <Frame title="Velg dagens intervalløkt." muted="Alle kjører samme workout." logo={bocWhite}>
          <ZwiftPick
            items={["Trykk Menu i Meetupen.", "Velg Workouts.", "Velg økta fra meldingen og trykk Workout."]}
            shots={[
              { src: screenMeetup, alt: "Zwift: i Meetupen, med meldingen om hvilken økt som skal kjøres, og en pil mot Menu nederst til venstre" },
              { src: screenMenu, alt: "Zwift: menyen, med Workouts øverst i kolonnen til høyre" },
              { src: screenTraining, alt: "Zwift: Training-vinduet med økta «Chase the Chaise» valgt, og Workout-knappen nederst" },
            ]}
          />
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
                <dd className="font-display text-[120px] leading-none font-medium tracking-[-0.025em] text-[var(--club-primary)]">{value}</dd>
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
      tone: "dark",
      title: "Oppmøtet gjennom vinteren",
      content: (
        <Frame title="Oppmøtet holdt seg hele vinteren." muted="Snitt per økt, måned for måned." logo={bocWhite}>
          <div className="flex h-[400px] items-end gap-8 border-b border-line-strong">
            {s.months.map((m) => (
              <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end">
                <span className="mb-3 font-display text-[40px] font-medium tracking-[-0.012em]">{nb(m.average)}</span>
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
      tone: "dark",
      title: "Bli med i vinter",
      content: (
        <>
          <Slants />
          <div className="relative grid h-full grid-cols-2 items-center gap-16 px-[120px]">
            <div>
              <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Bli med i vinter</p>
              <h2 className="mt-5 font-display text-[60px] leading-[1.1] font-medium tracking-[-0.019em]">To ting, så er du med på Meetupen.</h2>
              <div className="mt-10 space-y-6">
                <Step n={1}>Meld deg på hver økt i Spond.</Step>
                <Step n={2}>Følg Jakob Jølstad i Zwift Companion.</Step>
              </div>
              <p className="mt-10 max-w-[700px] text-[24px] leading-[1.4] text-ink-2">
                Alle nivåer kjører sammen. Du trenger Zwift og en smartrulle eller wattmåler. Påmeldingen til Fryd Vinterligaen åpner 1. oktober kl. 12.
              </p>
            </div>
            <div className="relative ml-auto aspect-[4/3] w-[620px] overflow-hidden rounded-lg shadow-[0_24px_48px_-24px_rgb(0_0_0/0.6)]">
              <Image
                src={zwiftHero}
                alt="Rytter i BOC-drakt på sykkelrulle i et mørkt rom, med en TV som viser Zwift på veggen"
                fill
                className="object-cover object-[30%_50%]"
                style={{ objectPosition: "38% 50%" }}
              />
            </div>
          </div>
          <Image src={bocWhite} alt="" className="absolute top-[104px] right-[120px] h-9 w-auto" />
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
