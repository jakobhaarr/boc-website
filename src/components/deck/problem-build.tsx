"use client";

import { Check } from "lucide-react";
import { useDeckStep } from "@/components/deck/deck";
import { cn } from "@/lib/cn";

/**
 * The problems, presented one at a time. The slide is built in steps:
 *
 *   0                 all problems, nothing dimmed
 *   1 + 3i            problem i alone, the others dimmed
 *   2 + 3i            its solution appears
 *   3 + 3i            back to the overview, problems 0..i marked done
 *
 * so the audience sees which problem is being talked about, then the answer,
 * then where they are in the whole list.
 */
export function ProblemBuild({ problems }: { problems: { label: string; problem: string; solution: string }[] }) {
  const step = useDeckStep();
  const phase = step === 0 ? "intro" : (["focus", "solution", "overview"] as const)[(step - 1) % 3];
  const current = step === 0 ? -1 : Math.floor((step - 1) / 3);
  const focusing = phase === "focus" || phase === "solution";

  return (
    <div>
      <div className="grid grid-cols-[250px_minmax(0,1fr)_minmax(0,1fr)] gap-x-10 border-b border-line-strong pb-2 text-[20px] font-semibold tracking-[0.12em] text-ink-3 uppercase">
        <span aria-hidden />
        <span>Problemet</span>
        <span>Slik løser vi det</span>
      </div>
      <ol className="divide-y divide-line">
        {problems.map((p, i) => {
          const done = phase !== "intro" && (i < current || (i === current && phase === "overview"));
          const dimmed = focusing && i !== current;
          const showSolution = phase === "solution" && i === current;
          return (
            <li
              key={p.label}
              aria-current={focusing && i === current ? "step" : undefined}
              className={cn(
                "grid grid-cols-[250px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-10 py-[6px] transition-opacity duration-500",
                dimmed && "opacity-[0.16]",
              )}
            >
              <span className="flex items-center gap-4">
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full font-display text-[22px] font-semibold transition-colors duration-500",
                    done ? "bg-success text-[#0b1315]" : "bg-[var(--club-primary)] text-[var(--club-on-primary)]",
                  )}
                >
                  {done ? <Check aria-label="Løst" className="size-6" strokeWidth={3} /> : i + 1}
                </span>
                <span className="text-[22px] leading-[1.15] font-semibold tracking-[0.06em] text-[var(--club-link)] uppercase">{p.label}</span>
              </span>
              <span className="font-display text-[32px] leading-[1.1] font-medium tracking-[-0.015em]">{p.problem}</span>
              <span className={cn("text-[24px] leading-[1.28] text-ink-2 transition-opacity duration-500", showSolution ? "opacity-100" : "opacity-0")}>{p.solution}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
