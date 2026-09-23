"use client";

import type { CSSProperties } from "react";
import { BranchIcon } from "@/components/public/branch-icons";
import { cn } from "@/lib/cn";

/**
 * The category colours: the branch in a one-sport club, the sport otherwise.
 * A category's place in the club's order fixes its colour, so Landevei is the
 * same blue in «Finn din aktivitet» and in «Klubbåret». Six `--cat-*` pairs in
 * globals.css, each ≥ 5:1.
 */
export const categoryStyle = (index: number) => {
  const n = (index % 6) + 1;
  return { "--c": `var(--cat-${n})`, "--c-bg": `var(--cat-${n}-bg)` } as CSSProperties;
};

export interface CategoryOption {
  id: string;
  label: string;
  /** Name matched by BranchIcon, usually the category's own. */
  icon: string;
  /** Position in the club's category order; picks the colour. */
  index: number;
  /** False once the category has been filtered away. */
  shown: boolean;
}

/**
 * Coloured labels with icons that filter a view by category. Every category
 * starts shown; a press takes one away and a second press brings it back, so
 * the view never narrows to nothing by accident of a single tap. «Vis alle»
 * appears once anything is filtered. Used by «Finn din aktivitet» and «Klubbåret».
 */
export function CategoryFilter({
  options,
  onPress,
  onReset,
  className,
}: {
  options: CategoryOption[];
  onPress: (id: string) => void;
  /** Shown as «Vis alle» when given. */
  onReset?: () => void;
  className?: string;
}) {
  return (
    <div role="group" aria-label="Vis" className={cn("scroll-x flex gap-1.5", className)}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          aria-pressed={o.shown}
          onClick={() => onPress(o.id)}
          style={categoryStyle(o.index)}
          className={cn(
            "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-[2px] px-2 text-[12.5px] font-semibold transition-[background-color,color,opacity] duration-150",
            o.shown && "bg-[var(--c-bg)] text-[var(--c)] hover:bg-[color-mix(in_srgb,var(--c)_18%,var(--c-bg))]",
            // Filtered away: no colour left, only an outline, so it cannot be mistaken for one still shown.
            !o.shown && "bg-transparent text-ink-3 shadow-[inset_0_0_0_1px_var(--border)] hover:text-ink-2",
          )}
        >
          <BranchIcon name={o.icon} className="size-3.5" />
          {o.label}
        </button>
      ))}
      {onReset && (
        <button type="button" onClick={onReset} className="ml-1 h-7 shrink-0 px-1.5 text-[12.5px] font-medium text-ink-3 hover:text-ink">
          Vis alle
        </button>
      )}
    </div>
  );
}
