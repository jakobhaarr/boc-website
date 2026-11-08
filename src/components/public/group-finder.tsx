"use client";

import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode, type Ref } from "react";
import { Button, HoverArrow } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { LEVELS, levelIndex } from "@/lib/levels";
import type { LevelId, OrgNode } from "@/lib/types";
import type { ExplorerGroup } from "./activity-explorer";
import { BranchIcon } from "./branch-icons";
import { AgePicker } from "./age-picker";
import { Photo } from "./photo";

export interface FinderChoice {
  id: string;
  name: string;
  groups: ExplorerGroup[];
  /** The branch's own words for the level question, used when it is the only one chosen. */
  levelOptions?: OrgNode["levelOptions"];
}

type Step = "age" | "choice" | "level" | "result";

/**
 * Landevei places a rider by speed or by power instead of the three-step
 * scale, in one of two modes (OrgNode.riderFit holds each group's ranges):
 *
 *   enkel    — «fart på rolig langtur alene», in the bands below. A group
 *              matches when its soloSpeed range overlaps the band (strictly,
 *              so a band ending at 25 does not match a group starting at 25).
 *   avansert — weight (kg) and FTP (W). W/kg = FTP ÷ weight, rounded to one
 *              decimal for display only. A group matches (distance 0) when W/kg
 *              lies inside its wattsPerKg range, inclusive; within 0.3 W/kg of
 *              it counts as «also relevant» (distance 1), otherwise 2.
 *
 * Both are the club's rules of thumb, not measurements — see the comments on
 * OrgNode.riderFit. Inputs are the rider's own and are never stored.
 */
/* People place themselves badly by speed (newcomers guess), so the choice is worded as who the rider is and what they want: `who`
   is the answer the rider picks, `label` the speed it stands for. The speed stays as a smaller line and as the progress label, since
   the groups' ranges are in km/h and the matching below compares against them. */
const SOLO_BANDS = [
  { id: "u22", who: "Ny i gruppe", label: "Under 22 km/t", from: 0, to: 22 },
  { id: "22-25", who: "Mest tur", label: "22–25 km/t", from: 22, to: 25 },
  { id: "25-30", who: "Erfaren", label: "25–30 km/t", from: 25, to: 30 },
  { id: "o30", who: "Så fort som mulig", label: "Over 30 km/t", from: 30, to: 999 },
] as const;
type FitMode = "enkel" | "avansert";
const NEAR_WKG = 0.3;
const ANY = "alle";
/** «Usikker» in the speed question: no band, every group matches, the calmest first. */
const UNSURE = "usikker";
/** Full result rows that fit the card's fixed height without scrolling. */
const RESULT_ROWS = 3;

/**
 * Age is picked by scrolling a list that starts at 20 (components/public/age-picker.tsx), not typed into a field and not chosen
 * from bands.
 *
 * A group is offered when the exact age lies inside its age range, so a 16-year-old and a 17-year-old get different groups where
 * the club draws its line (Ungdom to and including 16, Junior and the adult road groups from 17). The line under the picker says
 * how many groups the age has, so the shape of the club is still visible: «Ingen grupper for 7 år» is an answer too, and the
 * road groups take every age from 17 up. The picker always starts at 20, also after «Start på nytt»: the starting age is a
 * convenience for the common case, not an answer, and anyone can scroll to theirs.
 */
const MIN_AGE = 6;
const MAX_AGE = 80;
const START_AGE = 20;

/**
 * The hero's group finder: age, what to ride (one or more), level.
 *
 * Navigation: the buttons at the foot move one question back or forward, and
 * answered questions in the progress bar can be reopened directly. A click or
 * tap on a single choice (level) moves on after a short pause, so the
 * answer is seen first; keyboard picks (arrow keys) never advance by
 * themselves, and the multiple-choice question always waits for «Neste».
 *
 * A question is only asked when the answer changes the result: branches with
 * nothing for your age are shown but disabled, and the level step is skipped
 * when every remaining group welcomes the same levels.
 *
 * Ranking, best first, over groups in the chosen branches whose age range
 * holds the chosen age:
 *   1. level distance — 0 when the group lists the chosen level, otherwise
 *      the number of steps to its nearest listed level (lib/levels.ts);
 *      groups without levels, or "Usikker", count as 0
 *   2. for a chosen speed band, the group whose solo-speed range covers most
 *      of it (see `soloFit`)
 *   3. the club's pick among equals (`recommendFirst`, e.g. Zwift)
 *   4. narrower age span first, so Junior (17–18) beats BOC 3 (fra 17) in
 *      at age 17 or 18
 *
 * Recommendations (distance 0) are dealt one branch at a time: with Landevei
 * and Innendørs chosen you get the best landevei group and Zwift before any
 * second group from either — people can ride with a group in each. Distance
 * 1 fills what is left as "Også aktuelt".
 *
 * The best match leads the result as an answer to «what do I do now?»
 * (LeadResult); the rest follow as rows, budgeted by RESULT_ROWS. From lg
 * the card has a minimum height and grows for the result rather than
 * clipping it.
 */
export function GroupFinder({
  title,
  choices,
  choiceNoun,
  allHref,
  note,
  helpHref,
  className,
}: {
  title: string;
  choices: FinderChoice[];
  /** What the second question picks: "disiplin" in a one-sport club, "idrett" otherwise. */
  choiceNoun: string;
  allHref: string;
  /** One line with the results, e.g. how to try a session before joining. */
  note?: string;
  /** Where to ask the club for help when nothing matches, e.g. its contact section. */
  helpHref?: string;
  className?: string;
}) {
  const [step, setStep] = useState<Step>("age");
  /** Set by a pointer pick on a single choice; the effect below then moves on. */
  const [auto, setAuto] = useState(false);
  const [age, setAge] = useState(START_AGE);
  const [picked, setPicked] = useState<string[]>([]);
  const [level, setLevel] = useState<LevelId | typeof ANY | null>(null);
  const [fitMode, setFitMode] = useState<FitMode>("enkel");
  const [soloId, setSoloId] = useState<(typeof SOLO_BANDS)[number]["id"] | typeof UNSURE | null>(null);
  const [weight, setWeight] = useState("");
  const [ftp, setFtp] = useState("");
  const questionRef = useRef<HTMLHeadingElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    // Move focus with the question, but not on first render — the hero must not steal focus.
    if (touched.current) questionRef.current?.focus({ preventScroll: true });
  }, [step]);

  /* ── Derived answers ─────────────────────────────────────────────────── */
  // A group belongs to the age when its range holds it; every row carries the group's own age label.
  const fitsAge = (g: ExplorerGroup) => g.ageRange[0] <= age && g.ageRange[1] >= age;
  const ageCount = choices.reduce((n, c) => n + c.groups.filter(fitsAge).length, 0);
  const options = choices.map((c) => ({ ...c, count: c.groups.filter(fitsAge).length }));
  const available = options.filter((c) => c.count > 0);
  const ageGroups = available.flatMap((c) => c.groups.filter(fitsAge));

  const choiceMatters = available.length > 1;
  // A pick that no longer fits the age drops out; with one branch left it is chosen for you.
  const chosen = choiceMatters ? picked.filter((id) => available.some((c) => c.id === id)) : available.map((c) => c.id);
  const candidates = available.filter((c) => chosen.includes(c.id)).flatMap((c) => c.groups.filter(fitsAge));
  const levelsOffered = LEVELS.filter((l) => candidates.some((g) => g.levels?.includes(l.id)));
  const levelMatters = levelsOffered.length > 1 && candidates.some((g) => (g.levels?.length ?? 0) < LEVELS.length);
  // Speed/power placement replaces the scale when a single branch has it (Landevei).
  const useFit = chosen.length === 1 && candidates.some((g) => g.fit);
  const soloBand = SOLO_BANDS.find((b) => b.id === soloId);
  const weightKg = Number(weight.replace(",", "."));
  const ftpW = Number(ftp.replace(",", "."));
  const advancedValid = weightKg >= 30 && weightKg <= 200 && ftpW >= 50 && ftpW <= 600;
  const wattsPerKg = advancedValid ? ftpW / weightKg : undefined;
  const fitChosen = fitMode === "enkel" ? soloId !== null : advancedValid;
  const levelChosen = useFit ? fitChosen : level === ANY || levelsOffered.some((l) => l.id === level);
  /* One branch chosen with its own wording (Landevei asks about riding in a
     group, Terreng about technical trail): ask in its terms. Several: the
     plain scale. A child's age: ask about the child. */
  const wording = chosen.length === 1 ? choices.find((c) => c.id === chosen[0])?.levelOptions : undefined;
  const levelText = (l: (typeof LEVELS)[number]) => ({ ...l, ...wording?.[l.id] });
  const forChild = age <= 16;

  const sequence: Step[] = ["age", ...(choiceMatters ? ["choice" as const] : []), ...(levelMatters ? ["level" as const] : []), "result"];
  const index = Math.max(0, sequence.indexOf(step));
  const nextStep = sequence[index + 1];
  const ready = { age: ageGroups.length > 0, choice: chosen.length > 0, level: levelChosen, result: false }[step];

  /* Auto-advance after a pointer pick. `detail` is 0 for keyboard and scripted clicks (radioKeys), so arrowing through the
     choices never skips ahead. The pause lets the pick show before the next question replaces it. */
  useEffect(() => {
    if (!auto || !ready || !nextStep) return;
    const timer = setTimeout(() => {
      touched.current = true;
      setAuto(false);
      setStep(nextStep);
    }, 280);
    return () => clearTimeout(timer);
  }, [auto, ready, nextStep]);
  /* Enter or Space on the choice that is already picked (a click with detail 0 on a checked option) moves on, since the keyboard
     never advances by picking and «Neste» is not shown on a step that advances by itself. */
  const advancesOnPick = step === "level" && !(useFit && fitMode === "avansert");
  const choose = (e: MouseEvent, apply: () => void, checked = false) => {
    apply();
    if (e.detail === 0 && checked) {
      forward();
      return;
    }
    setAuto(e.detail > 0);
  };

  const go = (next: Step) => {
    touched.current = true;
    setAuto(false);
    setStep(next);
  };
  const forward = () => {
    if (ready && nextStep) go(nextStep);
  };
  const back = () => {
    if (index > 0) go(sequence[index - 1]);
  };
  const restart = () => {
    setPicked([]);
    setLevel(null);
    setSoloId(null);
    setWeight("");
    setFtp("");
    setAge(START_AGE);
    go("age");
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /* ── Ranking — see the comment on the component ─────────────────────── */
  const distance = (g: ExplorerGroup) => {
    // In speed/power mode a group with no ranges (the youth groups) is never a match.
    if (useFit && !g.fit) return 1;
    if (useFit && g.fit) {
      if (fitMode === "enkel" && soloId === UNSURE) return 0;
      if (fitMode === "enkel" && soloBand) return g.fit.soloSpeed[0] < soloBand.to && g.fit.soloSpeed[1] > soloBand.from ? 0 : 1;
      if (wattsPerKg !== undefined) {
        const [lo, hi] = g.fit.wattsPerKg;
        if (wattsPerKg >= lo && wattsPerKg <= hi) return 0;
        return Math.min(Math.abs(wattsPerKg - lo), Math.abs(wattsPerKg - hi)) <= NEAR_WKG ? 1 : 2;
      }
    }
    if (level === ANY || level === null || !g.levels?.length) return 0;
    const target = levelIndex(level);
    return Math.min(...g.levels.map((l) => Math.abs(levelIndex(l) - target)));
  };
  /* Among the road groups that overlap the chosen speed band, the one whose solo-speed range covers most of the band comes first:
     «25–30 km/t» is BOC 2 (25 and up, all of the band) before BOC 1 (28 and up, 2 of 5 km/h) and BOC 3 (up to 28, 3 of 5). A tie goes to the
     group whose lower edge is nearest the band's (22–25: BOC 3 before BOC 4; over 30: BOC 1 before BOC 2). The open top band is cut at 40 km/t. */
  const soloFit = (g: ExplorerGroup): [number, number] => {
    if (!(useFit && fitMode === "enkel" && soloBand && g.fit)) return [0, 0];
    const [lo, hi] = g.fit.soloSpeed;
    const to = Math.min(soloBand.to, 40);
    const covered = Math.max(0, Math.min(hi, to) - Math.max(lo, soloBand.from));
    return [covered / (to - soloBand.from), Math.abs(lo - soloBand.from)];
  };
  const ranked = candidates
    .map((g) => ({ g, d: distance(g), span: g.ageRange[1] - g.ageRange[0] }))
    .sort(
      (a, b) =>
        a.d - b.d ||
        (useFit && fitMode === "enkel" && soloId === UNSURE ? (a.g.fit?.soloSpeed[0] ?? 0) - (b.g.fit?.soloSpeed[0] ?? 0) : 0) ||
        soloFit(b.g)[0] - soloFit(a.g)[0] ||
        soloFit(a.g)[1] - soloFit(b.g)[1] ||
        Number(!!b.g.recommendFirst) - Number(!!a.g.recommendFirst) ||
        a.span - b.span,
    );
  const branchIdOf = (g: ExplorerGroup) => choices.find((c) => c.groups.some((x) => x.id === g.id))?.id;
  const perBranch = chosen.map((id) => ranked.filter((r) => r.d === 0 && branchIdOf(r.g) === id));
  // Every chosen branch with a match gets its best group, even when that is more than four rows (they are then set denser).
  const branchesWithMatch = perBranch.filter((list) => list.length).length;
  const maxRows = Math.max(RESULT_ROWS, branchesWithMatch);
  const dense = branchesWithMatch > RESULT_ROWS;
  const best: typeof ranked = [];
  for (let round = 0; best.length < maxRows && perBranch.some((list) => list[round]); round++) {
    for (const list of perBranch) if (list[round] && best.length < maxRows) best.push(list[round]);
  }
  // Room left in the card: none after four full rows, one compact row after three, two after one or two.
  const also = ranked.filter((r) => r.d === 1).slice(0, best.length === 0 ? RESULT_ROWS + 1 : Math.max(0, Math.min(2, RESULT_ROWS - best.length)));
  const branchOf = (g: ExplorerGroup) => (chosen.length > 1 ? choices.find((c) => c.id === branchIdOf(g))?.name : undefined);

  /* ── Progress ───────────────────────────────────────────────────────── */
  const Noun = choiceNoun.charAt(0).toUpperCase() + choiceNoun.slice(1);
  const answers: Record<Step, string | undefined> = {
    age: `${age} år`,
    choice: chosen.length === 0 ? undefined : chosen.length === 1 ? choices.find((c) => c.id === chosen[0])?.name : `${chosen.length} ${choiceNoun}er`,
    level: useFit
      ? fitMode === "enkel"
        ? soloId === UNSURE
          ? "Vet ikke"
          : soloBand?.label
        : wattsPerKg !== undefined
          ? `${wattsPerKg.toFixed(1).replace(".", ",")} W/kg`
          : undefined
      : level === ANY ? "Vet ikke" : LEVELS.filter((l) => l.id === level).map(levelText)[0]?.label,
    result: undefined,
  };
  const labels: Record<Step, string> = { age: "Alder", choice: Noun, level: "Erfaring", result: "" };

  /* Why the lead group is the answer, in the rider's own words: the age plus the one thing they said about their level.
     Only what was answered; nothing is inferred. */
  const levelAnswer = useFit
    ? fitMode === "enkel"
      ? soloBand && `holder ${soloBand.label} på rolig langtur alene`
      : wattsPerKg !== undefined
        ? `har ${wkg(wattsPerKg)} W/kg`
        : undefined
    : level && level !== ANY
      ? `svarte «${LEVELS.filter((l) => l.id === level).map(levelText)[0]?.label}»`
      : undefined;
  const why = `Fordi ${forChild ? "barnet" : "du"} er ${age} år${levelAnswer ? ` og ${levelAnswer}` : ""}.`;
  // Before the age is known, show all three questions so the length of the task is clear.
  const shownSteps = step === "age" ? (["age", "choice", "level"] as Step[]) : sequence.filter((s) => s !== "result");

  // On a phone the card runs edge to edge, as the join wizard does (it leaves the page's side padding), square, with back and next at the foot side by side.
  return (
    <div className={cn("flex flex-col rounded-lg bg-surface shadow-float ring-1 ring-black/5 max-sm:-mx-[var(--page-gutter)] max-sm:rounded-none max-sm:shadow-none max-sm:ring-0 max-sm:border-y max-sm:border-line lg:min-h-[34rem]", className)}>
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-[1.375rem] leading-[1.15] font-medium tracking-[-0.013em] text-ink sm:text-[1.5rem]">{title}</h2>
          {step !== "age" && (
            <button
              type="button"
              onClick={restart}
              aria-label="Start på nytt"
              title="Start på nytt"
              className="-mt-2.5 -mr-3 flex size-11 shrink-0 items-center justify-center text-ink-3 transition-colors hover:text-ink"
            >
              <RotateCcw aria-hidden className="size-4" />
            </button>
          )}
        </div>

        <ol className="mt-4 flex gap-1.5" aria-label="Spørsmål">
          {shownSteps.map((s) => {
            const pos = sequence.indexOf(s);
            const complete = pos !== -1 && pos < index;
            const current = s === step;
            return (
              <li key={s} className="min-w-0 flex-1">
                <button
                  type="button"
                  disabled={!complete}
                  onClick={() => go(s)}
                  aria-current={current ? "step" : undefined}
                  className="group block w-full text-left disabled:cursor-default"
                >
                  <span className={cn("block h-1 rounded-full transition-colors duration-300", complete || current ? "bg-club-2" : "bg-muted")} />
                  <span className={cn("mt-2 block truncate t-meta", current ? "text-ink" : complete ? "text-ink-2 group-hover:text-ink" : "text-ink-3")}>
                    {complete ? (answers[s] ?? labels[s]) : labels[s]}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Announced to screen readers when the answer appears; the result itself is remounted with the step, which a live region would not read. */}
      <p role="status" className="sr-only">
        {step === "result" ? (best.length ? `Anbefalt gruppe: ${best[0].g.name}` : "Ingen treff på svarene dine") : ""}
      </p>

      {/* No fixed height and no clipping: the card grows for a long result instead of cutting it off. */}
      <div key={step} className="anim-fade mx-5 mt-4 flex-1 border-t border-line pt-5 pb-4 sm:mx-6">
        {step === "age" && (
          <>
            <Question ref={questionRef} centered>
              Hvor gammel er du?
            </Question>
            <div className="mt-3 flex flex-col items-center">
              <AgePicker value={age} min={MIN_AGE} max={MAX_AGE} onChange={setAge} describedBy="alder-antall" />
              <p id="alder-antall" className="mt-2 t-small text-ink-2">
                {ageCount ? `${ageCount} ${ageCount === 1 ? "gruppe" : "grupper"} for ${age} år` : `Ingen grupper for ${age} år`}
              </p>
            </div>
          </>
        )}

        {step === "choice" && (
          <>
            <Question ref={questionRef} hint="Velg én eller flere.">
              {`Hvilken ${choiceNoun} vil du prøve?`}
            </Question>
            <div role="group" aria-label={Noun} className="mt-4 grid grid-cols-2 gap-2">
              {options.map((c) => (
                <Option key={c.id} role="checkbox" checked={chosen.includes(c.id)} disabled={!c.count} onClick={() => toggle(c.id)} className="!flex-row items-center gap-2.5">
                  <BranchIcon name={c.name} className={cn("size-6", c.count ? "text-club" : "text-ink-3")} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] leading-5 font-semibold tracking-[-0.01em]">{c.name}</span>
                    <span className="block truncate t-meta font-normal">{c.count ? `${c.count} ${c.count === 1 ? "gruppe" : "grupper"}` : `Ingen for ${age} år`}</span>
                  </span>
                </Option>
              ))}
            </div>
            {chosen.length < available.length && (
              <button
                type="button"
                onClick={() => setPicked(available.map((c) => c.id))}
                className="mt-3 inline-flex items-center t-small font-medium text-ink-2 transition-colors hover:text-ink"
              >
                Velg alle som passer
                <HoverArrow />
              </button>
            )}
          </>
        )}

        {step === "level" && useFit && (
          <>
            <Question
              ref={questionRef}
              hint={fitMode === "enkel" ? "Velg det som ligner mest. Fart = rolig langtur alene." : "Vi regner FTP per kilo og sammenligner med gruppene."}
            >
              {fitMode === "enkel" ? "Hva passer best på deg?" : "Hva er vekten og FTP-en din?"}
            </Question>
            {fitMode === "enkel" ? (
              <div role="radiogroup" aria-label="Erfaring" onKeyDown={radioKeys} className="mt-3 grid grid-cols-2 gap-2">
                {SOLO_BANDS.map((b, i) => (
                  <Option key={b.id} role="radio" checked={soloId === b.id} tabbable={soloId === b.id || (soloId === null && i === 0)} onClick={(e) => choose(e, () => setSoloId(b.id), soloId === b.id)} className="gap-2 !px-3 !py-2.5">
                    <Meter bars={i + 1} of={SOLO_BANDS.length} />
                    <span className="block pr-5 text-[16px] leading-5 font-semibold tracking-[-0.01em]">{b.who}</span>
                    <span className="block t-meta font-normal">{b.label.charAt(0).toLowerCase() + b.label.slice(1)}</span>
                  </Option>
                ))}
                <Option role="radio" checked={soloId === UNSURE} tabbable={soloId === UNSURE} onClick={(e) => choose(e, () => setSoloId(UNSURE), soloId === UNSURE)} className="col-span-2 !px-3 !py-2.5">
                  <span className="block pr-5 text-[15px] leading-5 font-semibold tracking-[-0.01em]">
                    Vet ikke<span className="font-normal text-ink-3"> – de rolige først</span>
                  </span>
                </Option>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="t-meta font-semibold text-ink-3">Vekt (kg)</span>
                  <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="80" className="mt-1.5 block w-full rounded-[var(--radius-button)] border border-line-strong bg-surface px-3 py-2.5 text-[17px] font-semibold text-ink outline-none transition-shadow placeholder:font-normal placeholder:text-ink-3/60 focus:border-club-2 focus:ring-2 focus:ring-inset focus:ring-club-2/30" />
                </label>
                <label className="block">
                  <span className="t-meta font-semibold text-ink-3">FTP (watt)</span>
                  <input inputMode="numeric" value={ftp} onChange={(e) => setFtp(e.target.value)} placeholder="250" className="mt-1.5 block w-full rounded-[var(--radius-button)] border border-line-strong bg-surface px-3 py-2.5 text-[17px] font-semibold text-ink outline-none transition-shadow placeholder:font-normal placeholder:text-ink-3/60 focus:border-club-2 focus:ring-2 focus:ring-inset focus:ring-club-2/30" />
                </label>
                <p className="col-span-2 t-meta text-ink-3">
                  {wattsPerKg !== undefined ? `Det er ${wattsPerKg.toFixed(1).replace(".", ",")} W/kg.` : "Tallene brukes bare her."} Tallene lagres ikke.
                </p>
              </div>
            )}
            {/* The power route is for the few who know their FTP, so it is a quiet link, not a second mode switch beside the answers. */}
            <button
              type="button"
              onClick={() => setFitMode(fitMode === "enkel" ? "avansert" : "enkel")}
              className="mt-3 inline-flex min-h-11 items-center t-small font-medium text-ink-2 underline decoration-line-strong underline-offset-4 transition-colors hover:text-ink sm:min-h-0"
            >
              {fitMode === "enkel" ? "Kjenner du FTP-en din? Bruk watt" : "Vet ikke FTP? Velg etter erfaring"}
            </button>
          </>
        )}

        {step === "level" && !useFit && (
          <>
            <Question ref={questionRef} hint={forChild ? "Svar ut fra hva barnet har gjort." : "Svar ut fra hva du har gjort, ikke hvor god du synes du er."}>
              {forChild ? "Hva passer best på barnet?" : "Hva passer best på deg?"}
            </Question>
            <div role="radiogroup" aria-label="Erfaring" onKeyDown={radioKeys} className="mt-3 grid gap-1.5">
              {[...levelsOffered.map(levelText), { id: ANY, label: "Vet ikke", hint: "" }].map((l, i) => (
                <Option
                  key={l.id}
                  role="radio"
                  checked={level === l.id}
                  tabbable={level === l.id || (level === null && i === 0)}
                  onClick={(e) => choose(e, () => setLevel(l.id as LevelId | typeof ANY), level === l.id)}
                  className={l.id === ANY ? undefined : "!flex-row items-center gap-3"}
                >
                  {l.id !== ANY && <Meter bars={levelIndex(l.id as LevelId) + 1} of={LEVELS.length} />}
                  <span className="min-w-0">
                    <span className="block pr-5 text-[15px] leading-5 font-semibold tracking-[-0.01em]">
                      {l.label}
                      {l.id === ANY && <span className="font-normal text-ink-3"> – vis alle nivåer</span>}
                    </span>
                    {l.hint && <span className="block t-meta font-normal">{l.hint}</span>}
                  </span>
                </Option>
              ))}
            </div>
          </>
        )}

        {step === "result" && (
          <>
            <Question ref={questionRef} hint={chosen.length > 1 ? "Du kan være med i flere grupper samtidig." : undefined}>
              {best.length ? "Her passer du inn" : "Ingen treff på erfaringen din, men disse er nærmest"}
            </Question>
            {best.length > 0 && <LeadResult group={best[0].g} branch={branchOf(best[0].g)} note={note} why={why} experienced={useFit ? fitMode === "avansert" : level === "aktiv"} wattsPerKg={useFit && fitMode === "avansert" ? wattsPerKg : undefined} weightKg={useFit && fitMode === "avansert" && advancedValid ? weightKg : undefined} />}
            {(best.length ? best.slice(1) : also).length > 0 && (
              <>
                {best.length > 1 && <p className="mt-4 t-meta text-ink-3">{chosen.length > 1 ? "Og i det andre du valgte" : "Passer også"}</p>}
                <ul className="mt-1.5 grid gap-1.5">
                  {(best.length ? best.slice(1) : also).map(({ g }) => (
                    <ResultRow key={g.id} group={g} lead={best[0]?.g} branch={branchOf(g)} dense={dense} />
                  ))}
                </ul>
              </>
            )}
            {best.length > 0 && also.length > 0 && (
              <>
                <p className="mt-3 t-meta text-ink-3">Også aktuelt</p>
                <ul className="mt-1.5 grid gap-1.5">
                  {also.map(({ g }) => (
                    <ResultRow key={g.id} group={g} lead={best[0]?.g} branch={branchOf(g)} compact />
                  ))}
                </ul>
              </>
            )}
            {/* No exact match is not the end: say where to ask, since the club can often place someone the rules cannot. */}
            {best.length === 0 && (
              <p className="mt-4 t-small text-ink-2">
                Finner du ikke noe som passer? Klubben hjelper deg gjerne.{" "}
                {helpHref && (
                  <Link href={helpHref} className="link font-medium text-ink">
                    Ta kontakt
                  </Link>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {/* Back and forward: side by side from sm; on a phone never two buttons in a row, so the forward action stands
          full width on top and «Tilbake» full width below it (column-reverse keeps back first in the tab order). */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 max-sm:flex-col-reverse max-sm:items-stretch sm:gap-4 sm:px-6">
        <Button variant="secondary" onClick={back} disabled={index === 0} className="max-sm:h-[3.25rem] max-sm:w-full max-sm:px-4 max-sm:text-[16px] max-sm:disabled:hidden">
          <ChevronLeft aria-hidden className="size-4" />
          Tilbake
        </Button>
        {step === "result" ? (
          <Link
            href={allHref}
            className="inline-flex items-center gap-1.5 whitespace-nowrap t-small font-medium text-club hover:text-club-hover max-sm:h-[3.25rem] max-sm:w-full max-sm:justify-center max-sm:rounded-[var(--radius-button)] max-sm:bg-action max-sm:px-4 max-sm:text-[16px] max-sm:text-on-action max-sm:hover:bg-action-hover max-sm:hover:text-on-action"
          >
            Se alle gruppene
            <ChevronRight aria-hidden className="size-4 sm:hidden" />
            <HoverArrow className="max-sm:hidden" />
          </Link>
        ) : (
          // A single choice moves on by itself (and by Enter on the picked one), so «Neste» is only for the steps that wait: age, disciplines and the FTP fields.
          !advancesOnPick && (
            <Button onClick={forward} disabled={!ready} className="max-sm:h-[3.25rem] max-sm:w-full max-sm:px-4 max-sm:text-[16px]">
              {nextStep === "result" && step !== "age" ? "Vis grupper" : "Neste"}
              <ChevronRight aria-hidden className="size-4" />
            </Button>
          )
        )}
      </div>
    </div>
  );
}

/**
 * Arrow keys move between the choices of a radio group and pick the one
 * they land on, as a native radio group does; Tab leaves the group. Only the
 * picked choice (or the first, before a pick) is in the tab order.
 */
function radioKeys(e: KeyboardEvent<HTMLElement>) {
  const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
  if (!step) return;
  const radios = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]:not(:disabled)')];
  const at = radios.indexOf(document.activeElement as HTMLButtonElement);
  if (at === -1) return;
  e.preventDefault();
  const next = radios[(at + step + radios.length) % radios.length];
  next.focus();
  next.click();
}

function Question({ children, hint, centered, ref }: { children: ReactNode; hint?: string; centered?: boolean; ref: Ref<HTMLHeadingElement> }) {
  return (
    <div className={centered ? "text-center" : undefined}>
      <h3 ref={ref} tabIndex={-1} className="text-[17px] leading-snug font-semibold tracking-[-0.014em] text-ink outline-none">
        {children}
      </h3>
      {hint && <p className="mt-1 t-small text-ink-3">{hint}</p>}
    </div>
  );
}

/**
 * A rising row of bars, `bars` of `of` filled: how far up the scale a choice sits, readable before any text. It takes the card's text
 * colour (filled bars in full, the rest faint), so it follows the available, chosen and dark-mode states without its own colours.
 * Decorative: the choice's own words carry the meaning for assistive technology.
 */
function Meter({ bars, of }: { bars: number; of: number }) {
  return (
    <span aria-hidden className="flex h-5 shrink-0 items-end gap-[3px]">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} style={{ height: `${40 + (60 * i) / Math.max(1, of - 1)}%` }} className={cn("w-[5px] rounded-[1px] bg-current", i < bars ? "opacity-90" : "opacity-20")} />
      ))}
    </span>
  );
}

/**
 * A choice in the finder, in three states that must never be confused:
 *   available — a plain surface with a neutral hairline; the brand colour is kept for what is chosen
 *   chosen    — the full brand colour (BOC: yellow), a teal outline and a check
 *   disabled  — no fill, a dashed outline, faded content, no pointer
 */
function Option({
  role,
  checked,
  tabbable,
  disabled,
  onClick,
  className,
  children,
}: {
  role: "checkbox" | "radio";
  checked: boolean;
  /** Radios only: whether this one is the group's stop in the tab order. */
  tabbable?: boolean;
  disabled?: boolean;
  onClick: (e: MouseEvent) => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      tabIndex={role === "radio" && !tabbable ? -1 : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "finder-card relative flex flex-col justify-start rounded-[var(--radius-button)] border px-3 py-2 text-left transition-[background-color,border-color,box-shadow,color] duration-150",
        disabled
          ? "cursor-not-allowed border-dashed border-line-strong bg-sunken/40 text-ink-3 opacity-55 grayscale"
          : checked
            ? "border-club-2 bg-club-surface text-on-club shadow-[inset_0_0_0_1px_var(--club-secondary)]"
            : "border-line-strong bg-surface text-ink hover:border-club-2 hover:bg-sunken",
        className,
      )}
    >
      {children}
      {checked && (
        <span aria-hidden className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-club-2 text-on-club-2">
          <Check className="size-3" strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

const middleOf = (range?: string) => {
  const m = range?.match(/(\d+)\D+(\d+)/);
  return m ? (Number(m[1]) + Number(m[2])) / 2 : undefined;
};

/**
 * What a runner-up group is, set against the recommended one: faster or calmer
 * on the long ride (road groups, compared by the middle of their ranges), and
 * otherwise its ages when they differ. Said in the row instead of how many
 * sessions a week, which tells nothing about why to look at it.
 */
function differsFrom(lead: ExplorerGroup, g: ExplorerGroup): string | undefined {
  const a = middleOf(lead.longRidePace);
  const b = middleOf(g.longRidePace);
  if (a !== undefined && b !== undefined && g.longRidePace) {
    if (b > a) return `Raskere, ${g.longRidePace} på langtur`;
    if (b < a) return `Roligere, ${g.longRidePace} på langtur`;
    return `Samme tempo, ${g.longRidePace} på langtur`;
  }
  return g.ageLabel && g.ageLabel !== lead.ageLabel ? g.ageLabel : undefined;
}

/** A road group's summary opens with its weekday speed, which the row now says in words; the rest of it stays. */
const withoutLeadingSpeed = (g: ExplorerGroup) => (g.longRidePace ? g.schedule.replace(/^\s*\d+–\d+ km\/t[.,]?\s*/, "") : g.schedule);

/** «3 treninger i uka». The age is not repeated in the result: it was just chosen. */
const perWeekLabel = (n?: number) => (n ? `${n} ${n === 1 ? "trening" : "treninger"} i uka` : undefined);

/**
 * The best match, set as the answer to «what do I do now?»: the group, what
 * it is like in its own words, when and where it trains, and the next step —
 * the group page's «Før første trening», not membership. `note` says that
 * trying comes first, in the club's words.
 */
function LeadResult({ group: g, branch, note, why, experienced, wattsPerKg, weightKg }: { group: ExplorerGroup; branch?: string; note?: string; why?: string; experienced: boolean; wattsPerKg?: number; weightKg?: number }) {
  // Say each fact once: BOC's summaries already give the pace and the days.
  const summary = g.summary?.toLowerCase() ?? "";
  const pace = g.longRidePace ? undefined : g.pace?.split(",")[0];
  const firstDay = g.schedule.split(/[\s,]/)[0].toLowerCase().replace(/er$/, "");
  // Road groups show their days in the pace box below; repeating them as a paragraph is the third time the card says it.
  const showSchedule = !g.longRidePace && !!g.schedule && g.schedule !== g.summary && !summary.includes(firstDay);
  return (
    <div className="finder-card @container mt-3 overflow-hidden rounded-lg border-2 border-club-2 bg-club-surface shadow-[0_6px_18px_-8px_rgb(0_0_0/0.25)]">
      {/* Wide enough, the photo takes the right half of the card, full height; narrower (a phone), it goes above the text as a low strip. */}
      <div className={g.photo ? "grid @md:grid-cols-2" : undefined}>
      <div className="min-w-0 px-3.5 py-3">
        <div>
          {/* Narrow (a phone): the photo goes above the text, as a wide, low strip inside the padding. */}
          {g.photo && <Photo photo={g.photo} ratio={2 / 1} sizes="(min-width: 640px) 440px, 90vw" className="mb-3 w-full rounded-md @md:hidden" />}
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-club-2 px-2.5 py-0.5 text-[12px] leading-5 font-semibold text-on-club-2">
              <Check aria-hidden className="size-3" strokeWidth={3} />
              Anbefalt for deg
            </span>
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2">
              <Link href={g.href} className="text-[21px] leading-6 font-semibold tracking-[-0.018em] text-on-club hover:underline">
                {g.name}
              </Link>
              <span className="t-small text-on-club/70">{[branch, perWeekLabel(g.perWeek), pace && !summary.includes(pace) ? pace : undefined].filter(Boolean).join(" · ")}</span>
            </p>
            {/* A summary that opens with a speed (BOC 2–4) would be a third, unlabelled speed next to the labelled ones below. */}
            {g.summary && !(g.longRidePace && /^\s*\d/.test(g.summary)) && <p className="mt-1 line-clamp-2 t-small text-on-club/80">{g.summary}</p>}
            {why && <p className="mt-1.5 t-meta text-on-club/70">{why}</p>}
          </div>
        </div>
        <PaceNote group={g} experienced={experienced} wattsPerKg={wattsPerKg} weightKg={weightKg} />
        {showSchedule && <p className="mt-1 t-small text-on-club/80">{g.schedule}</p>}
        {/* A phone gets the whole width and a tall target; from sm it sits at its own width. */}
        <Link
          href={g.firstTrainingHref ?? g.href}
          className="mt-4 inline-flex items-center justify-center rounded-[var(--radius-button)] bg-club-2 px-5 py-3 t-small font-semibold text-on-club-2 transition-opacity hover:opacity-90 max-sm:w-full max-sm:py-3.5 max-sm:text-[16px]"
        >
          {/* Text and arrow in one inline run, centred: when the label wraps to two lines (a narrow card) the lines stay centred and the arrow
              follows the last one, as on a phone where it fits on one line, instead of the arrow being pushed to the far edge. */}
          <span className="text-center text-balance">
            {g.firstTrainingHref ? "Slik blir du med første gang" : `Til ${g.name}`}
            <HoverArrow className="inline align-middle" />
          </span>
        </Link>
        {note && <p className="mt-2 t-meta text-on-club/70">{note}</p>}
      </div>
      {g.photo && (
        // Same padding as the text beside it, so the photo sits inside the card like the rest of the content.
        <div className="hidden py-3 pr-3.5 @md:flex">
          <div className="relative min-h-40 flex-1">
            {/* Taller than wide, so the photo's tall crop is used (Photo.tall); the frame fills the space. */}
            <Photo photo={g.photo} ratio={3 / 4} sizes="(min-width: 1024px) 260px, 50vw" className="absolute inset-0 rounded-md !aspect-auto md:!aspect-auto" />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/** The road groups where a newcomer is told that the speed sounds higher than it is (BOC 3 and BOC 4). */
const SLOWER_GROUPS = ["b-boc3", "b-boc4"];
const wkg = (n: number) => n.toFixed(1).replace(".", ",");
/** «3,6–4,4 W/kg», with open ends worded as «over …» and «under …». */
const wkgRange = ([lo, hi]: [number, number]) => (lo < 0.1 ? `under ${wkg(hi)} W/kg` : hi > 50 ? `over ${wkg(lo)} W/kg` : `på ${wkg(lo)}–${wkg(hi)} W/kg`);

/** «250–290 W» for a W/kg range at a body weight; open ends as «over …» / «opp til …». */
const wattRange = ([lo, hi]: [number, number], kg: number) =>
  lo < 0.1 ? `opp til ${Math.round((hi * kg) / 5) * 5} W` : hi > 50 ? `over ${Math.round((lo * kg) / 5) * 5} W` : `${Math.round((lo * kg) / 5) * 5}–${Math.round((hi * kg) / 5) * 5} W`;

/**
 * What the pace means for the person reading, where the group has a long-ride
 * pace (Landevei). Raw data is the club's own figures (firstTraining.longRidePace,
 * ftp); nothing here is calculated.
 *   - newcomers: the speed, and why it is lower effort than it sounds — in a
 *     group you ride in the slipstream, so a group's speed is faster than the
 *     same rider could hold alone;
 *   - experienced («aktiv»): speed plus the group's typical FTP (for an 80 kg man)
 *     when the club has given it, since that is how they think about effort.
 */
function PaceNote({ group: g, experienced, wattsPerKg, weightKg }: { group: ExplorerGroup; experienced: boolean; wattsPerKg?: number; weightKg?: number }) {
  if (!g.longRidePace) return null;
  // Two speeds, each with its own label: the weekday sessions and the Sunday long ride are not the same pace.
  const weekday = g.pace?.split(",")[0].trim();
  const facts: [string, string][] = [...(weekday ? ([["Tirsdag og torsdag", weekday]] as [string, string][]) : []), ["Langtur søndag", g.longRidePace]];
  /* The club's FTP guide is for an 80 kg man and the match is made in W/kg, so
     with a weight entered the group's FTP is shown for that weight: W/kg × kg. */
  const scaled = weightKg && g.fit ? wattRange(g.fit.wattsPerKg, weightKg) : undefined;
  if (experienced && (scaled ?? g.ftp)) facts.push([scaled ? `Gruppas FTP ved ${Math.round(weightKg!)} kg` : "Gruppas FTP", scaled ?? g.ftp!]);
  if (experienced && wattsPerKg !== undefined && g.fit) facts.push(["Du", `${wkg(wattsPerKg)} W/kg`]);
  return (
    <div className="mt-3">
      <dl className="flex flex-wrap gap-x-5 gap-y-2 rounded-[var(--radius-button)] bg-sunken px-3 py-2">
        {facts.map(([label, value]) => (
          <div key={label}>
            <dt className="t-meta text-ink-3">{label}</dt>
            <dd className="text-[15px] leading-5 font-semibold tracking-[-0.01em] text-ink">{value}</dd>
          </div>
        ))}
      </dl>
      {/* The explanation is for those who wonder, so it opens on request. Newcomers get «Høres farten litt høy ut?» only on BOC 3 and 4;
          the faster groups (BOC 1 and 2) have no such line. */}
      {(experienced || SLOWER_GROUPS.includes(g.id)) && (
        <details className="group/pace mt-1.5">
          <summary className="inline-flex min-h-11 cursor-pointer items-center t-meta text-ink-3 hover:text-ink sm:min-h-0">{experienced ? "Om tallene" : "Høres farten litt høy ut?"}</summary>
          <p className="mt-1 t-meta text-ink-3">
            {experienced
              ? `${scaled ? "Omregnet fra klubbens tall for en mann på 80 kg. " : g.ftp ? "FTP for en mann på 80 kg. " : ""}${wattsPerKg !== undefined && g.fit ? `Gruppa ligger ${wkgRange(g.fit.wattsPerKg)}.` : ""}`
              : "Det høres fort ut, men i gruppe ligger du i le bak de andre og bruker mye mindre krefter enn alene."}
          </p>
        </details>
      )}
    </div>
  );
}

/**
 * A recommended group. Hover tints the row inside its own bounds — no
 * negative margins and square corners, so nothing grows past the column.
 * Status is the dot before the name; everything else stays on two lines.
 */
function ResultRow({
  group: g,
  lead,
  branch,
  compact,
  dense,
}: {
  group: ExplorerGroup;
  /** The recommended group, which the row says it differs from. */
  lead?: ExplorerGroup;
  branch?: string;
  compact?: boolean;
  dense?: boolean;
}) {
  return (
    <li>
      <Link
        href={g.href}
        className={cn(
          "group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-[var(--radius-button)] border border-line-strong bg-surface px-3 transition-[background-color,border-color] duration-150 hover:border-club-2 hover:bg-[color-mix(in_srgb,var(--club-primary)_28%,var(--club-tint))]",
          compact ? "py-1.5" : dense ? "py-1.5" : "py-2",
        )}
      >
        <span className="min-w-0">
          <span className={cn("flex min-w-0 items-center gap-1.5 whitespace-nowrap", dense && "leading-[1.3]")}>
            <span className={cn("shrink-0 font-semibold tracking-[-0.01em] text-ink", compact ? "text-[14px]" : "text-[15px]")}>{g.name}</span>
            <span className="min-w-0 truncate t-small text-ink-3">{[branch, lead ? differsFrom(lead, g) : undefined].filter(Boolean).join(" · ")}</span>
          </span>
          {!compact && <span className={cn("block truncate t-small text-ink-2", dense ? "!leading-[1.3]" : "mt-0.5")}>{withoutLeadingSpeed(g)}</span>}
        </span>
        <HoverArrow className="text-ink-3 group-hover:text-ink" />
      </Link>
    </li>
  );
}
