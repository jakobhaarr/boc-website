"use client";

import { Check } from "lucide-react";
import { useDeckStep } from "@/components/deck/deck";
import { cn } from "@/lib/cn";

/**
 * The overview of the problems the site and admin set out to solve, shown
 * again between the sections that deal with each one. `done` is how many have
 * been gone through. Step 0 is the overview: the problems gone through are
 * ticked off and in green, the ones still to come are dimmed (nothing is
 * dimmed at the start). Step 1 darkens everything except the next problem,
 * which the following slides are about. With `done` equal to the number of problems
 * there is no next one, so the slide has one step.
 */
export function ProblemBuild({ problems, done }: { problems: { label: string; problem: string }[]; done: number }) {
  const step = useDeckStep();
  const focus = step === 1 ? done : -1;

  return (
    <ol className="divide-y divide-line">
      {problems.map((p, i) => {
        const ticked = i < done;
        // Focusing: all but the one in focus. Overview: what is still to come, once something is done.
        const dimmed = focus >= 0 ? i !== focus : done > 0 && !ticked;
        return (
          <li
            key={p.label}
            aria-current={i === focus ? "step" : undefined}
            className={cn("grid grid-cols-[300px_minmax(0,1fr)] items-center gap-x-10 py-[14px] transition-opacity duration-500", dimmed && "opacity-[0.16]")}
          >
            <span className="flex items-center gap-4">
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-full font-display text-[24px] font-semibold transition-colors duration-500",
                  ticked ? "bg-success text-[#0b1315]" : "bg-[var(--club-primary)] text-[var(--club-on-primary)]",
                )}
              >
                {ticked ? <Check aria-label="Gjennomgått" className="size-6" strokeWidth={3} /> : i + 1}
              </span>
              <span className={cn("text-[22px] leading-[1.15] font-semibold tracking-[0.06em] uppercase transition-colors duration-500", ticked ? "text-success" : "text-[var(--club-link)]")}>{p.label}</span>
            </span>
            <span className={cn("font-display text-[40px] leading-[1.1] font-medium tracking-[-0.015em] transition-colors duration-500", ticked && "text-success")}>{p.problem}</span>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The same problems in one slide, for the short talk: each problem is taken in
 * turn with its answer beside it, the ones already gone through ticked off in
 * green. Steps: 0 all problems, 1 to n one problem and its answer, n + 1 all
 * problems answered (also what the PDF shows).
 */
export function ProblemSolutions({ problems }: { problems: { label: string; problem: string; solution: string }[] }) {
  const step = useDeckStep();
  const n = problems.length;
  const focus = step >= 1 && step <= n ? step - 1 : -1;
  const finished = step > n;

  return (
    <div>
      <div className="grid grid-cols-[250px_minmax(0,1fr)_minmax(0,1fr)] gap-x-10 border-b border-line-strong pb-2 text-[20px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
        <span aria-hidden />
        <span>Problemet</span>
        <span>Slik løser vi det</span>
      </div>
      <ol className="divide-y divide-line">
        {problems.map((p, i) => {
          const ticked = finished || (focus >= 0 && i < focus);
          const dimmed = focus >= 0 && i !== focus;
          const showSolution = finished || i === focus;
          return (
            <li
              key={p.label}
              aria-current={i === focus ? "step" : undefined}
              className={cn("grid grid-cols-[250px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-10 py-[6px] transition-opacity duration-500", dimmed && "opacity-[0.16]")}
            >
              <span className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full font-display text-[22px] font-semibold transition-colors duration-500",
                    ticked ? "bg-success text-[#0b1315]" : "bg-[var(--club-primary)] text-[var(--club-on-primary)]",
                  )}
                >
                  {ticked ? <Check aria-label="Gjennomgått" className="size-6" strokeWidth={3} /> : i + 1}
                </span>
                <span className={cn("text-[22px] leading-[1.15] font-semibold tracking-[0.06em] uppercase transition-colors duration-500", ticked ? "text-success" : "text-[var(--club-link)]")}>{p.label}</span>
              </span>
              <span className={cn("font-display text-[32px] leading-[1.1] font-medium tracking-[-0.015em] transition-colors duration-500", ticked && "text-success")}>{p.problem}</span>
              <span className={cn("text-[24px] leading-[1.28] text-ink-2 transition-opacity duration-500", showSolution ? "opacity-100" : "opacity-0")}>{p.solution}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
