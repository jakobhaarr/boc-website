"use client";

import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { Button, HoverArrow } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { LEVELS, levelIndex } from "@/lib/levels";
import type { LevelId } from "@/lib/types";
import type { ExplorerGroup } from "./activity-explorer";
import { BranchIcon } from "./branch-icons";

export interface FinderChoice {
  id: string;
  name: string;
  groups: ExplorerGroup[];
}

type Step = "age" | "choice" | "level" | "result";
const ANY = "alle";
/** Full result rows that fit the card's fixed height without scrolling. */
const RESULT_ROWS = 4;

/**
 * Age is picked from bands, not typed as a number.
 *
 * A number field answers one person's question and hides the club's shape:
 * type 43 and you learn nothing about who else rides. Bands show the whole
 * ladder at once, so it is visible that the road groups take everyone from
 * 17 upwards — the same four groups come back whichever adult band you
 * pick — and that the club thins out at the ends.
 *
 * The edges are the ones the clubs actually use (6, 10, 13, 17, 19). Adults
 * are split three ways although no group's range stops there, precisely so
 * the span of the open-ended groups is legible. A band with nothing in it is
 * shown disabled rather than hidden, because "no group for a seven-year-old"
 * is an answer too.
 */
const AGE_BANDS = [
  { id: "6-9", label: "6–9 år", from: 6, to: 9, column: "barn" },
  { id: "10-12", label: "10–12 år", from: 10, to: 12, column: "barn" },
  { id: "13-16", label: "13–16 år", from: 13, to: 16, column: "barn" },
  { id: "17-18", label: "17–18 år", from: 17, to: 18, column: "barn" },
  { id: "19-39", label: "19–39 år", from: 19, to: 39, column: "voksne" },
  { id: "40-59", label: "40–59 år", from: 40, to: 59, column: "voksne" },
  { id: "60+", label: "60 år+", from: 60, to: 99, column: "voksne" },
] as const;

/* The ladder is shown as two columns, adults first: most people answer for
   themselves, and a parent looks for the column with their child in it.
   17–18 sits with the children because that is who the hint asks about —
   «melder du på et barn» — and under 18 is a child in Norwegian law. */
const AGE_COLUMNS = [
  { id: "voksne", label: "Voksne" },
  { id: "barn", label: "Barn" },
] as const;

type BandId = (typeof AGE_BANDS)[number]["id"];

/**
 * The hero's group finder: age, what to ride (one or more), level.
 *
 * Navigation: the arrows at the foot move one question back or forward, and
 * answered questions in the progress bar can be reopened directly. Nothing
 * advances on its own, so a choice can be changed before it is confirmed.
 *
 * A question is only asked when the answer changes the result: branches with
 * nothing for your age are shown but disabled, and the level step is skipped
 * when every remaining group welcomes the same levels.
 *
 * Ranking, best first, over groups in the chosen branches whose age span
 * overlaps the chosen band (AGE_BANDS above):
 *   1. level distance — 0 when the group lists the chosen level, otherwise
 *      the number of steps to its nearest listed level (lib/levels.ts);
 *      groups without levels, or "Usikker", count as 0
 *   2. the club's pick among equals (`recommendFirst`, e.g. Zwift)
 *   3. narrower age span first, so Junior (17–18) beats BOC 3 (fra 17) in
 *      the 17–18 band
 *
 * Recommendations (distance 0) are dealt one branch at a time: with Landevei
 * and Innendørs chosen you get the best landevei group and Zwift before any
 * second group from either — people can ride with a group in each. Distance
 * 1 fills what is left as "Også aktuelt".
 *
 * From lg the card has a fixed height, so the hero never changes size with
 * the questions, and nothing inside it scrolls: the result is budgeted to
 * four full rows, or fewer full rows plus compact ones (RESULT_ROWS below);
 * with five branches chosen, five denser rows so no branch is left out.
 */
export function GroupFinder({
  title,
  choices,
  choiceNoun,
  allHref,
  note,
  className,
}: {
  title: string;
  choices: FinderChoice[];
  /** What the second question picks: "disiplin" in a one-sport club, "idrett" otherwise. */
  choiceNoun: string;
  allHref: string;
  /** One line with the results, e.g. how to try a session before joining. */
  note?: string;
  className?: string;
}) {
  const [step, setStep] = useState<Step>("age");
  const [bandId, setBandId] = useState<BandId | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [level, setLevel] = useState<LevelId | typeof ANY | null>(null);
  const questionRef = useRef<HTMLHeadingElement>(null);
  const touched = useRef(false);

  useEffect(() => {
    // Move focus with the question, but not on first render — the hero must not steal focus.
    if (touched.current) questionRef.current?.focus({ preventScroll: true });
  }, [step]);

  /* ── Derived answers ─────────────────────────────────────────────────── */
  const band = AGE_BANDS.find((b) => b.id === bandId) ?? null;
  // A group belongs to a band when the two ranges overlap; every row carries
  // the group's own age label, so a partial overlap reads honestly.
  const fitsAge = (g: ExplorerGroup) => !!band && g.ageRange[0] <= band.to && g.ageRange[1] >= band.from;
  const countFor = (b: (typeof AGE_BANDS)[number]) =>
    choices.reduce((n, c) => n + c.groups.filter((g) => g.ageRange[0] <= b.to && g.ageRange[1] >= b.from).length, 0);
  const options = choices.map((c) => ({ ...c, count: c.groups.filter(fitsAge).length }));
  const available = options.filter((c) => c.count > 0);
  const ageGroups = available.flatMap((c) => c.groups.filter(fitsAge));

  const choiceMatters = available.length > 1;
  // A pick that no longer fits the age drops out; with one branch left it is chosen for you.
  const chosen = choiceMatters ? picked.filter((id) => available.some((c) => c.id === id)) : available.map((c) => c.id);
  const candidates = available.filter((c) => chosen.includes(c.id)).flatMap((c) => c.groups.filter(fitsAge));
  const levelsOffered = LEVELS.filter((l) => candidates.some((g) => g.levels?.includes(l.id)));
  const levelMatters = levelsOffered.length > 1 && candidates.some((g) => (g.levels?.length ?? 0) < LEVELS.length);
  const levelChosen = level === ANY || levelsOffered.some((l) => l.id === level);

  const sequence: Step[] = ["age", ...(choiceMatters ? ["choice" as const] : []), ...(levelMatters ? ["level" as const] : []), "result"];
  const index = Math.max(0, sequence.indexOf(step));
  const nextStep = sequence[index + 1];
  const ready = { age: ageGroups.length > 0, choice: chosen.length > 0, level: levelChosen, result: false }[step];

  const go = (next: Step) => {
    touched.current = true;
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
    go("age");
  };
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  /* ── Ranking — see the comment on the component ─────────────────────── */
  const distance = (g: ExplorerGroup) => {
    if (level === ANY || level === null || !g.levels?.length) return 0;
    const target = levelIndex(level);
    return Math.min(...g.levels.map((l) => Math.abs(levelIndex(l) - target)));
  };
  const ranked = candidates
    .map((g) => ({ g, d: distance(g), span: g.ageRange[1] - g.ageRange[0] }))
    .sort(
      (a, b) =>
        a.d - b.d ||
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
  const also = ranked.filter((r) => r.d === 1).slice(0, best.length === 0 ? RESULT_ROWS : Math.max(0, Math.min(2, RESULT_ROWS - best.length)));
  const branchOf = (g: ExplorerGroup) => (chosen.length > 1 ? choices.find((c) => c.id === branchIdOf(g))?.name : undefined);

  /* ── Progress ───────────────────────────────────────────────────────── */
  const Noun = choiceNoun.charAt(0).toUpperCase() + choiceNoun.slice(1);
  const answers: Record<Step, string | undefined> = {
    age: band?.label,
    choice: chosen.length === 0 ? undefined : chosen.length === 1 ? choices.find((c) => c.id === chosen[0])?.name : `${chosen.length} ${choiceNoun}er`,
    level: level === ANY ? "Usikker" : LEVELS.find((l) => l.id === level)?.label,
    result: undefined,
  };
  const labels: Record<Step, string> = { age: "Alder", choice: Noun, level: "Nivå", result: "" };
  // Before the age is known, show all three questions so the length of the task is clear.
  const shownSteps = step === "age" ? (["age", "choice", "level"] as Step[]) : sequence.filter((s) => s !== "result");

  return (
    <div className={cn("flex flex-col rounded-lg bg-surface shadow-float ring-1 ring-black/5 lg:h-[34rem]", className)}>
      <div className="px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-[1.375rem] leading-[1.15] font-medium tracking-[-0.022em] text-ink sm:text-[1.5rem]">{title}</h2>
          {step !== "age" && (
            <button
              type="button"
              onClick={restart}
              aria-label="Start på nytt"
              title="Start på nytt"
              className="flex size-8 shrink-0 items-center justify-center text-ink-3 transition-colors hover:text-ink"
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

      <div
        key={step}
        className={cn(
          "anim-fade mx-5 mt-4 min-h-0 flex-1 overflow-hidden border-t border-line pt-5 pb-4 sm:mx-6",
        )}
      >
        {step === "age" && (
          <>
            <Question ref={questionRef} hint="Melder du på et barn, velger du barnets alder.">
              Hvor gammel er du?
            </Question>
            <div role="radiogroup" aria-label="Alder" className="mt-4 grid grid-cols-2 gap-x-2">
              {AGE_COLUMNS.map((column) => (
                <div key={column.id} role="group" aria-labelledby={`alder-${column.id}`} className="flex flex-col gap-1.5">
                  <p id={`alder-${column.id}`} className="t-meta font-semibold text-ink-3">
                    {column.label}
                  </p>
                  {AGE_BANDS.filter((b) => b.column === column.id).map((b) => {
                    const count = countFor(b);
                    return (
                      <Option
                        key={b.id}
                        role="radio"
                        checked={bandId === b.id}
                        disabled={!count}
                        onClick={() => setBandId(b.id)}
                        // A little tighter than the other steps: four bands and a column heading have to fit the card's fixed height.
                        className="flex flex-col items-start gap-0.5 !py-1.5"
                      >
                        <span className="text-[15px] leading-5 font-semibold tracking-[-0.01em]">{b.label}</span>
                        <span className="t-meta font-normal">{count ? `${count} ${count === 1 ? "gruppe" : "grupper"}` : "Ingen grupper"}</span>
                      </Option>
                    );
                  })}
                </div>
              ))}
            </div>
          </>
        )}

        {step === "choice" && (
          <>
            <Question ref={questionRef} hint="Velg én eller flere.">
              Hva har du lyst til å sykle?
            </Question>
            <div role="group" aria-label={Noun} className="mt-4 grid grid-cols-2 gap-2">
              {options.map((c) => (
                <Option key={c.id} role="checkbox" checked={chosen.includes(c.id)} disabled={!c.count} onClick={() => toggle(c.id)} className="flex items-center gap-2.5">
                  <BranchIcon name={c.name} className={cn("size-6", c.count ? "text-club" : "text-ink-3")} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] leading-5 font-semibold tracking-[-0.01em]">{c.name}</span>
                    <span className="block truncate t-meta font-normal">{c.count ? `${c.count} ${c.count === 1 ? "gruppe" : "grupper"}` : `Ingen for ${band?.label ?? ""}`}</span>
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

        {step === "level" && (
          <>
            <Question ref={questionRef}>Hvor vant er du på sykkel?</Question>
            <div role="radiogroup" aria-label="Nivå" className="mt-3 grid gap-1.5">
              {[...levelsOffered, { id: ANY, label: "Usikker", hint: "" }].map((l) => (
                <Option key={l.id} role="radio" checked={level === l.id} onClick={() => setLevel(l.id as LevelId | typeof ANY)}>
                  <span className="block pr-5 text-[15px] leading-5 font-semibold tracking-[-0.01em]">
                    {l.label}
                    {l.id === ANY && <span className="font-normal text-ink-3"> – vis alle nivåer</span>}
                  </span>
                  {l.hint && <span className="block t-meta font-normal">{l.hint}</span>}
                </Option>
              ))}
            </div>
          </>
        )}

        {step === "result" && (
          <>
            <Question ref={questionRef} hint={chosen.length > 1 ? "Du kan være med i flere grupper samtidig." : note}>
              {best.length
                ? `${best.length === 1 ? "Denne gruppen" : `Disse ${best.length} gruppene`} passer for deg`
                : "Ingen treff på nivået ditt, men disse er nærmest"}
            </Question>
            <ul className="mt-2">
              {(best.length ? best : also).map(({ g }, i) => (
                <ResultRow key={g.id} group={g} branch={branchOf(g)} lead={i === 0 && best.length > 0} dense={dense} />
              ))}
            </ul>
            {best.length > 0 && also.length > 0 && (
              <>
                <p className="mt-3 t-meta text-ink-3">Også aktuelt</p>
                <ul className="mt-1">
                  {also.map(({ g }) => (
                    <ResultRow key={g.id} group={g} branch={branchOf(g)} compact />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </div>

      {/* Back and forward */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 sm:px-6">
        <Button variant="secondary" onClick={back} disabled={index === 0}>
          <ArrowLeft aria-hidden />
          Tilbake
        </Button>
        {step === "result" ? (
          <Link href={allHref} className="inline-flex items-center t-small font-medium text-club hover:text-club-hover">
            Se alle gruppene
            <HoverArrow />
          </Link>
        ) : (
          <Button onClick={forward} disabled={!ready}>
            {nextStep === "result" && step !== "age" ? "Vis grupper" : "Neste"}
            <ArrowRight aria-hidden />
          </Button>
        )}
      </div>
    </div>
  );
}

function Question({ children, hint, ref }: { children: ReactNode; hint?: string; ref: Ref<HTMLHeadingElement> }) {
  return (
    <div>
      <h3 ref={ref} tabIndex={-1} className="text-[17px] leading-snug font-semibold tracking-[-0.014em] text-ink outline-none">
        {children}
      </h3>
      {hint && <p className="mt-1 t-small text-ink-3">{hint}</p>}
    </div>
  );
}

/**
 * A choice in the finder, in three states that must never be confused:
 *   available — the club's tint (BOC: yellow) inside a yellow hairline
 *   chosen    — the full brand colour, a teal outline and a check
 *   disabled  — no fill, a dashed outline, faded content, no pointer
 */
function Option({
  role,
  checked,
  disabled,
  onClick,
  className,
  children,
}: {
  role: "checkbox" | "radio";
  checked: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "relative rounded-[var(--radius-button)] border px-3 py-2 text-left transition-[background-color,border-color,box-shadow,color] duration-150",
        disabled
          ? "cursor-not-allowed border-dashed border-line-strong bg-sunken/40 text-ink-3 opacity-55 grayscale"
          : checked
            ? "border-club-2 bg-club-surface text-on-club shadow-[inset_0_0_0_1px_var(--club-secondary)]"
            : "border-[color-mix(in_srgb,var(--club-primary)_70%,var(--border-strong))] bg-[color-mix(in_srgb,var(--club-primary)_28%,var(--club-tint))] text-ink hover:border-club-2 hover:bg-[color-mix(in_srgb,var(--club-primary)_55%,var(--club-tint))]",
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

/**
 * A recommended group. Hover tints the row inside its own bounds — no
 * negative margins and square corners, so nothing grows past the column.
 * Status is the dot before the name; everything else stays on two lines.
 */
function ResultRow({
  group: g,
  branch,
  lead,
  compact,
  dense,
}: {
  group: ExplorerGroup;
  branch?: string;
  lead?: boolean;
  compact?: boolean;
  dense?: boolean;
}) {
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        href={g.href}
        className={cn("group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-2 transition-colors duration-150 hover:bg-sunken", compact ? "py-1.5" : dense ? "py-1" : "py-2")}
      >
        <span className="min-w-0">
          <span className={cn("flex min-w-0 items-center gap-1.5 whitespace-nowrap", dense && "leading-[1.3]")}>
            <span className={cn("shrink-0 font-semibold tracking-[-0.01em] text-ink", compact ? "text-[14px]" : "text-[15px]")}>{g.name}</span>
            <span className="min-w-0 truncate t-small text-ink-3">{[branch, g.ageLabel].filter(Boolean).join(" · ")}</span>
            {lead && <span className="shrink-0 bg-club-surface px-1.5 py-px text-[11px] leading-4 font-semibold text-on-club">Anbefalt</span>}
          </span>
          {!compact && <span className={cn("block truncate pl-3 t-small text-ink-2", dense ? "!leading-[1.3]" : "mt-0.5")}>{g.schedule}</span>}
        </span>
        <HoverArrow className="text-ink-3 group-hover:text-ink" />
      </Link>
    </li>
  );
}
