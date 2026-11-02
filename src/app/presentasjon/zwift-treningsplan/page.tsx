import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import { Fragment } from "react";
import bocWhite from "@/components/assets/BOC-white.png";
import screenMenu from "@/components/assets/zwift-screen-003.jpg";
import screenTraining from "@/components/assets/zwift-screen-004.jpg";
import { CopyLine } from "@/components/deck/copy-line";
import { Deck, type DeckSlide } from "@/components/deck/deck";
import { Frame, Shot, Slants, Slashes } from "@/components/deck/parts";
import { WorkoutOverview, WorkoutProfile, ZoneBar, ZONE_COLORS } from "@/components/deck/workout-chart";
import { cn } from "@/lib/cn";
import { workoutSeconds, ZWIFT_WORKOUTS, zwiftPath, type ZwiftWorkout } from "@/lib/data/zwift-workouts";

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
function Path({ workout }: { workout: ZwiftWorkout }) {
  const stops = zwiftPath(workout);
  return (
    <ol className="flex flex-wrap items-center gap-x-2 gap-y-2" aria-label="Slik finner du økta i Zwift">
      {stops.map((stop, i) => (
        <Fragment key={stop}>
          {i > 0 && <ChevronRight aria-hidden className="size-6 text-ink-3" />}
          <li
            className={cn(
              "rounded-full px-5 py-2 text-[24px] leading-none font-medium",
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

function WorkoutSlide({ workout, n }: { workout: ZwiftWorkout; n: number }) {
  return (
    <Frame eyebrow={`${EYEBROW} · Økt ${n} av ${ZWIFT_WORKOUTS.length}`} title={workout.name} size={60} logo={bocWhite}>
      <Path workout={workout} />
      <div className="mt-4">
        <WorkoutProfile workout={workout} />
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

export default function ZwiftTrainingPlan() {
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
        id: workout.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        tone: "dark",
        title: workout.name,
        content: <WorkoutSlide workout={workout} n={i + 1} />,
      }),
    ),
  ];

  return <Deck slides={slides} title="Zwift-treningsplan med BOC" />;
}
