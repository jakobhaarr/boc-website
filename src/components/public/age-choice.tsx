"use client";

import { cn } from "@/lib/cn";

/**
 * Who a group is *for*, not every age it lets in. BOC 1–4 take riders from
 * 17, but they are adult groups a late teenager may join, and counting them as
 * youth would fill «Barn og ungdom» with groups no parent is looking for.
 *
 * - Barn og ungdom: the range ends by 20 (Ungdom 13–16, Junior 17–20), or it
 *   starts in childhood (BMX Gruppe 3, «fra 11 år»).
 * - Voksne: the range runs on past 20 (BOC 1–4, Zwift, Banegruppa).
 * A group can be both: BMX Gruppe 3 starts at 11 and has no upper age.
 *
 * Used by «Finn din aktivitet» and by Treningstider og terminliste.
 */
export const AGES = [
  { id: "alle", label: "Alle aldre", fits: (_range: [number, number]) => true },
  { id: "barn-og-ungdom", label: "Barn og ungdom", fits: (range: [number, number]) => range[1] <= 20 || range[0] < 13 },
  { id: "voksne", label: "Voksne", fits: (range: [number, number]) => range[1] > 20 },
] as const;

export type AgeId = (typeof AGES)[number]["id"];

export const ageById = (id: AgeId) => AGES.find((a) => a.id === id) ?? AGES[0];

/** The three ages as a segmented switch. */
export function AgeChoice({ value, onChange, className }: { value: AgeId; onChange: (id: AgeId) => void; className?: string }) {
  return (
    <div role="radiogroup" aria-label="Alder" className={cn("flex w-full shrink-0 rounded-[5.5px] bg-sunken p-1 shadow-[inset_0_0_0_1px_var(--border)] sm:w-auto", className)}>
      {AGES.map((a) => (
        <button
          key={a.id}
          type="button"
          role="radio"
          aria-checked={a.id === value}
          onClick={() => onChange(a.id)}
          className={cn(
            "h-8 flex-1 rounded-[3.5px] px-3 text-[13px] font-medium whitespace-nowrap transition-[background-color,box-shadow,color] duration-150 sm:flex-none",
            a.id === value ? "bg-surface text-ink shadow-[0_1px_2px_rgb(13_26_43/0.12),0_0_0_1px_var(--border)]" : "text-ink-3 hover:text-ink",
          )}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
