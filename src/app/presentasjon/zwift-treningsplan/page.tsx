import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Fragment } from "react";
import bocWhite from "@/components/assets/BOC-white.png";
import screenMenu from "@/components/assets/zwift-screen-003.jpg";
import screenTraining from "@/components/assets/zwift-screen-004.jpg";
import { CopyLine } from "@/components/deck/copy-line";
import { HashScroll } from "@/components/deck/hash-scroll";
import { Deck, PrintDeck, type DeckSlide } from "@/components/deck/deck";
import { BlockList, FtpInput, FtpProfile } from "@/components/deck/ftp";
import { Frame, Shot, Slants, Slashes } from "@/components/deck/parts";
import { WorkoutOverview, WorkoutOverviewPhone, ZoneBar, ZONE_COLORS } from "@/components/deck/workout-chart";
import { cn } from "@/lib/cn";
import { workoutSeconds, workoutSlug, ZWIFT_WORKOUTS, zwiftPath, type ZwiftWorkout } from "@/lib/data/zwift-workouts";

export const metadata: Metadata = { title: "Zwift-treningsplan med BOC", robots: { index: false, follow: false } };

/**
 * Always dark, like the season deck (/presentasjon/zwift-2025-26), and built
 * from the same pieces (components/deck): the workouts the Zwift group usually
 * picks from, where each one is in Zwift's Training window, and a chart of what
 * it asks of you.
 *
 * Everything about a workout comes from lib/data/zwift-workouts.ts, where its
 * source (whatsonzwift.com) and what is typed in and what is computed are
 * written down. The profile charts are drawn from the page's own interval
 * lists, the duration is their sum, and stress points and zone minutes are the
 * page's figures as they stand. The screenshots are this season's (the same two
 * as step 6 of the sign-up in the season deck).
 */

const EYEBROW = "BOC · Gruppe Zwift · Treningsplan";

/** «1 t 1 min», «60 min» in the way riders say it. */
const hours = (sec: number) => {
  const m = Math.floor(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)} t${m % 60 ? ` ${m % 60} min` : ""}` : `${m} min`;
};

/** The workouts as the Training window files them: a folder and what is in it, as the pages list them, the fullest folder first. */
const FOLDERS = [...new Set(ZWIFT_WORKOUTS.map((w) => w.folder))].map((folder) => ({
  folder,
  group: ZWIFT_WORKOUTS.find((w) => w.folder === folder)?.group,
  workouts: ZWIFT_WORKOUTS.filter((w) => w.folder === folder).map((w) => w.name).sort((a, b) => a.localeCompare(b, "en")),
})).sort((a, b) => b.workouts.length - a.workouts.length);

/** The way down to the workout: Menu, Workouts, the folder, the workout. The last stop is the one to press. */
function Path({ workout, phone = false }: { workout: ZwiftWorkout; phone?: boolean }) {
  const stops = zwiftPath(workout);
  return (
    <ol className={cn("flex flex-wrap items-center gap-y-2", phone ? "gap-x-1.5" : "gap-x-2")} aria-label="Slik finner du økta i Zwift">
      {stops.map((stop, i) => (
        <Fragment key={stop}>
          {i > 0 && <ChevronRight aria-hidden className={phone ? "size-4 text-ink-3" : "size-6 text-ink-3"} />}
          <li
            className={cn(
              "rounded-full leading-none font-medium",
              phone ? "px-3.5 py-2 text-[15px]" : "px-5 py-2 text-[24px]",
              i === stops.length - 1 ? "bg-[var(--club-primary)] text-[var(--club-on-primary)]" : "bg-surface text-ink-2 ring-1 ring-line",
            )}
          >
            {stop}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

/** The message to paste into the Meetup's chat: the way to the workout in Zwift's own words (Menu is «Meny» here, as the group says it). */
const welcome = (w: ZwiftWorkout) => `Velkommen til dagens økt! Gå til ${["Meny", ...zwiftPath(w).slice(1)].join(" → ")}`;

const slugOf = workoutSlug;

/**
 * The same plan as a page to scroll, for a phone held upright (under 640 px
 * wide): the deck's 16:9 stage would be a thin strip there. Same data and the
 * same pieces, laid out in one column at the page's own sizes: the FTP box
 * stays at the top while you scroll, each workout is a card with its chart at
 * the screen's width, and the blocks the chart has no room to label are in a
 * list under it. A phone held sideways is wide enough for the deck.
 */
function MobilePlan() {
  const h2 = "font-display text-[30px] leading-[1.05] font-medium tracking-[-0.019em]";
  const step = "flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--club-primary)] font-display text-[18px] font-semibold text-[var(--club-on-primary)]";

  return (
    <div className="page-dark min-h-dvh pb-[max(3rem,env(safe-area-inset-bottom))] sm:hidden">
      <HashScroll />
      <header data-slide="1" className="relative overflow-hidden px-4 pt-7 pb-9">
        <Slants />
        <Image src={bocWhite} alt="BOC" className="relative h-8 w-auto" />
        <p className="relative mt-10 text-[15px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Gruppe Zwift</p>
        <h1 className="relative mt-3 font-display text-[42px] leading-[1.02] font-medium tracking-[-0.022em]">Ti økter vi pleier å velge.</h1>
        <p className="relative mt-4 text-[18px] leading-[1.4] text-ink-2">Hva de krever av deg, og hvor du finner dem i Zwift.</p>
      </header>

      <div className="sticky top-0 z-20 border-y border-line bg-[var(--background)]/95 px-4 py-3 backdrop-blur">
        <FtpInput phone label="Din FTP" />
      </div>

      <section data-slide="2" className="scroll-mt-16 px-4 pt-10">
        <h2 className={h2}>Slik finner du en økt.</h2>
        <ol className="mt-6 space-y-8">
          <li>
            <p className="flex items-center gap-4 text-[19px] leading-[1.3] font-medium">
              <span className={step}>1</span>Trykk Menu, og så Workouts.
            </p>
            <Shot src={screenMenu} alt="Zwift: menyen, med Workouts øverst i kolonnen til høyre" className="mt-4 w-full" />
          </li>
          <li>
            <p className="flex items-center gap-4 text-[19px] leading-[1.3] font-medium">
              <span className={step}>2</span>Åpne mappen, velg økta, trykk Workout.
            </p>
            <Shot src={screenTraining} alt="Zwift: Training-vinduet med mappen «60-90 minutes to burn» åpen og økta «Chase the Chaise» valgt" className="mt-4 w-full" />
          </li>
        </ol>
      </section>

      <section data-slide="3" className="scroll-mt-16 px-4 pt-14">
        <h2 className={h2}>
          Fire mapper. <span className="text-ink-3">Ti økter.</span>
        </h2>
        <div className="mt-6 space-y-3">
          {FOLDERS.map((f) => (
            <div key={f.folder} className="rounded-lg bg-surface p-5 ring-1 ring-line">
              <p className="flex items-center gap-3 font-display text-[21px] leading-[1.15] font-medium">
                <span aria-hidden className="block h-5 w-2 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
                {f.folder}
              </p>
              {f.group && <p className="mt-1 pl-5 text-[14px] text-ink-3">Under overskriften {f.group}</p>}
              <ul className="mt-3 space-y-1 pl-5 text-[16px] leading-[1.35]">
                {f.workouts.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[14px] leading-[1.45] text-ink-3">Mappene er slik whatsonzwift.com fører dem opp. Zwift flytter av og til økter mellom mapper, så finner du den ikke der, søk etter navnet i Training-vinduet.</p>
      </section>

      <section data-slide="4" className="scroll-mt-16 px-4 pt-14">
        <h2 className={h2}>
          De ti øktene. <span className="text-ink-3">Tøffest øverst.</span>
        </h2>
        <WorkoutOverviewPhone href={(w) => `#${slugOf(w)}`} />
      </section>

      <div className="mt-14">
        {ZWIFT_WORKOUTS.map((workout, i) => (
          <article key={workout.name} id={slugOf(workout)} data-slide={i + 5} data-slug={slugOf(workout)} className="scroll-mt-16 border-t border-line px-4 py-10">
            <p className="text-[14px] font-semibold tracking-[0.12em] text-[var(--club-link)] uppercase">
              Økt {i + 1} av {ZWIFT_WORKOUTS.length}
            </p>
            <h2 className="mt-2 font-display text-[34px] leading-[1.04] font-medium tracking-[-0.019em]">{workout.name}</h2>
            <div className="mt-4">
              <Path workout={workout} phone />
            </div>
            <div className="mt-6">
              <FtpProfile workout={workout} compact />
            </div>
            <div className="mt-3">
              <BlockList workout={workout} />
            </div>
            <div className="mt-5 flex items-end gap-8">
              <p className="font-display text-[40px] leading-none font-medium tracking-[-0.02em]">{hours(workoutSeconds(workout))}</p>
              <p className="flex items-baseline gap-2">
                <span className="font-display text-[40px] leading-none font-medium tracking-[-0.02em] text-[var(--club-primary)]">{workout.stress}</span>
                <span className="text-[15px] text-ink-3">stresspoeng</span>
              </p>
            </div>
            <ZoneBar zones={workout.zones} className="mt-4" height={18} />
            <ul className="mt-3 grid grid-cols-3 gap-x-3 gap-y-2 text-[14px] leading-[1.25] text-ink-3 tabular-nums">
              {workout.zones.map((m, k) => (
                <li key={k} style={{ opacity: m ? 1 : 0.45 }} className="flex items-center gap-2">
                  <span aria-hidden className="block size-3 shrink-0 rounded-[2px]" style={{ background: ZONE_COLORS[k] }} />
                  <span>
                    Z{k + 1} <span className="text-ink-2">{m ? `${m} min` : "–"}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[18px] leading-[1.45]">{workout.summary}</p>
            <ul className="mt-3 space-y-2 text-[16px] leading-[1.4] text-ink-2">
              {workout.facts.map((f) => (
                <li key={f} className="flex gap-3">
                  <span aria-hidden className="mt-[8px] block size-2 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <CopyLine text={welcome(workout)} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function WorkoutSlide({ workout, n }: { workout: ZwiftWorkout; n: number }) {
  return (
    <Frame eyebrow={`${EYEBROW} · Økt ${n} av ${ZWIFT_WORKOUTS.length}`} title={workout.name} size={60} logo={bocWhite}>
      <div className="flex items-center justify-between gap-8">
        <Path workout={workout} />
        <FtpInput />
      </div>
      <div className="mt-4">
        <FtpProfile workout={workout} />
      </div>
      <div className="mt-4 grid grid-cols-[560px_minmax(0,1fr)] items-start gap-14">
        <div>
          <div className="flex items-end gap-10">
            <p className="flex items-baseline gap-3">
              <span className="font-display text-[56px] leading-none font-medium tracking-[-0.02em]">{hours(workoutSeconds(workout))}</span>
            </p>
            <p className="flex items-baseline gap-3">
              <span className="font-display text-[56px] leading-none font-medium tracking-[-0.02em] text-[var(--club-primary)]">{workout.stress}</span>
              <span className="text-[22px] text-ink-3">stresspoeng</span>
            </p>
          </div>
          <ZoneBar zones={workout.zones} className="mt-4" height={26} />
          <ul className="mt-3 grid grid-cols-6 gap-x-3 text-[20px] leading-[1.25] text-ink-3 tabular-nums">
            {workout.zones.map((m, i) => (
              <li key={i} style={{ opacity: m ? 1 : 0.45 }}>
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="block size-2.5 rounded-[2px]" style={{ background: ZONE_COLORS[i] }} />Z{i + 1}
                </span>
                <span className="block text-ink-2">{m ? `${m} min` : "–"}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-[26px] leading-[1.35]">{workout.summary}</p>
          <ul className="mt-3 space-y-1.5 text-[22px] leading-[1.3] text-ink-2">
            {workout.facts.map((f) => (
              <li key={f} className="flex gap-4">
                <span aria-hidden className="mt-[10px] block size-2 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <CopyLine text={welcome(workout)} className="mt-5" />
    </Frame>
  );
}

export default async function ZwiftTrainingPlan({ searchParams }: { searchParams: Promise<{ pdf?: string }> }) {
  const { pdf } = await searchParams;
  const slides: DeckSlide[] = [
    {
      id: "tittel",
      tone: "dark",
      title: "Treningsplan for Zwift",
      content: (
        <>
          <Slants />
          <Slashes className="h-72" />
          <div className="relative flex h-full flex-col justify-end px-[120px] pb-[120px]">
            <Image src={bocWhite} alt="BOC" className="mb-14 h-14 w-auto self-start" />
            <p className="text-[26px] font-semibold tracking-[0.14em] text-[var(--club-primary)] uppercase">Gruppe Zwift</p>
            <h2 className="mt-5 max-w-[1150px] font-display text-[112px] leading-[0.98] font-medium tracking-[-0.022em]">Ti økter vi pleier å velge.</h2>
            <p className="mt-8 text-[34px] text-ink-2">Hva de krever av deg, og hvor du finner dem i Zwift.</p>
          </div>
        </>
      ),
    },
    {
      id: "finn-okta",
      tone: "dark",
      title: "Slik finner du en økt i Zwift",
      content: (
        <Frame eyebrow={EYEBROW} title="Slik finner du en økt." muted="Samme vei hver gang." logo={bocWhite}>
          <div className="grid grid-cols-2 gap-14">
            <div>
              <p className="flex items-center gap-5 text-[30px] leading-[1.25] font-medium tracking-[-0.01em]">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--club-primary)] font-display text-[24px] font-semibold text-[var(--club-on-primary)]">1</span>
                Trykk Menu, og så Workouts.
              </p>
              <Shot src={screenMenu} alt="Zwift: menyen, med Workouts øverst i kolonnen til høyre" className="mt-6 w-full" />
            </div>
            <div>
              <p className="flex items-center gap-5 text-[30px] leading-[1.25] font-medium tracking-[-0.01em]">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--club-primary)] font-display text-[24px] font-semibold text-[var(--club-on-primary)]">2</span>
                Åpne mappen, velg økta, trykk Workout.
              </p>
              <Shot src={screenTraining} alt="Zwift: Training-vinduet med mappen «60-90 minutes to burn» åpen og økta «Chase the Chaise» valgt" className="mt-6 w-full" />
            </div>
          </div>
        </Frame>
      ),
    },
    {
      id: "mapper",
      tone: "dark",
      title: "Hvilken mappe ligger økta i?",
      content: (
        <Frame eyebrow={EYEBROW} title="Fire mapper." muted="Ti økter." size={68} logo={bocWhite}>
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6">
            {FOLDERS.map((f, i) => (
              <div key={f.folder} className={cn("rounded-lg bg-surface p-7 ring-1 ring-line", i === 0 && "row-span-3")}>
                <p className="flex items-center gap-4 font-display text-[34px] leading-[1.1] font-medium tracking-[-0.012em]">
                  <span aria-hidden className="block h-8 w-3 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
                  {f.folder}
                </p>
                {f.group && <p className="mt-2 pl-7 text-[22px] text-ink-3">Under overskriften {f.group}</p>}
                <ul className="mt-4 space-y-1.5 pl-7 text-[26px] leading-[1.3]">
                  {f.workouts.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-[1250px] text-[20px] leading-[1.4] text-ink-3">
            Mappene er slik whatsonzwift.com fører dem opp. Zwift flytter av og til økter mellom mapper, så finner du den ikke der, søk etter navnet i Training-vinduet.
          </p>
        </Frame>
      ),
    },
    {
      id: "oversikt",
      tone: "dark",
      title: "De ti øktene i ett blikk",
      content: (
        <Frame eyebrow={EYEBROW} title="De ti øktene." muted="Tøffest øverst." size={64} logo={bocWhite}>
          <WorkoutOverview />
        </Frame>
      ),
    },
    ...ZWIFT_WORKOUTS.map(
      (workout, i): DeckSlide => ({
        id: slugOf(workout),
        tone: "dark",
        title: workout.name,
        content: <WorkoutSlide workout={workout} n={i + 1} />,
      }),
    ),
  ];

  if (pdf !== undefined) return <PrintDeck slides={slides} title="Zwift-treningsplan med BOC" />;

  return (
    <>
      {/* The deck on screens from 640 px (a phone held sideways included), the page to scroll below that. */}
      <div className="max-sm:hidden">
        <Deck slides={slides} title="Zwift-treningsplan med BOC" pdfHref="/pdf/boc-zwift-treningsplan.pdf" />
      </div>
      <MobilePlan />
    </>
  );
}
