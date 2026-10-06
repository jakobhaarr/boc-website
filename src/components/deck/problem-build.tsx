"use client";

import { Check } from "lucide-react";
import { useDeckStep } from "@/components/deck/deck";
import { cn } from "@/lib/cn";

/**
 * The overview of the problems the site and admin set out to solve, shown
 * again between the sections that deal with each one. `done` is how many have
 * been gone through. Step 0 is the overview, those problems ticked off and
 * nothing dimmed; step 1 darkens everything except the next problem, which the
 * following slides are about. With `done` equal to the number of problems
 * there is no next one, so the slide has one step.
 */
export function ProblemBuild({ problems, done }: { problems: { label: string; problem: string }[]; done: number }) {
  const step = useDeckStep();
  const focus = step === 1 ? done : -1;

  return (
    <ol className="divide-y divide-line">
      {problems.map((p, i) => {
        const ticked = i < done;
        const dimmed = focus >= 0 && i !== focus;
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
              <span className="text-[22px] leading-[1.15] font-semibold tracking-[0.06em] text-[var(--club-link)] uppercase">{p.label}</span>
            </span>
            <span className="font-display text-[40px] leading-[1.1] font-medium tracking-[-0.015em]">{p.problem}</span>
          </li>
        );
      })}
    </ol>
  );
}
