"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { HoverArrow } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

export interface SqueezeItem {
  id: string;
  name: string;
  href: string;
  meta?: string;
  description?: string;
  photo?: PhotoRecord;
  groups: { id: string; name: string; href: string }[];
}

/**
 * Photo panels that squeeze, after Stripe's squeezy carousel: pointing at a
 * panel widens it and narrows the others, and the details below follow.
 *
 * Widths are whole guide cells so every panel edge lands on a guide line:
 * with three panels the active one takes 6 columns and the others 3, with
 * two it is 9 and 3. A track of s columns is s·col + (s−1)·gap, where
 * col = (100% − 11·gap) / 12; the column template animates between them.
 * Below desktop the panels simply stack.
 */
const spans = (n: number, active: number) => {
  if (n === 2) return [0, 1].map((i) => (i === active ? 9 : 3));
  if (n === 3) return [0, 1, 2].map((i) => (i === active ? 6 : 3));
  return Array.from({ length: n }, () => 12 / n);
};

const track = (s: number) => `calc(${s} * (100% - 11 * var(--grid-gap)) / 12 + ${s - 1} * var(--grid-gap))`;

export function SqueezeGallery({ items }: { items: SqueezeItem[] }) {
  // Open on the first panel that has groups to show, e.g. Jenter rather than Fotballskolen.
  const [active, setActive] = useState(() => Math.max(0, items.findIndex((it) => it.groups.length > 0)));
  const current = items[active];
  const columns = spans(items.length, active).map(track).join(" ");

  return (
    <div>
      <ul
        className="grid gap-[var(--grid-gap)] max-lg:!grid-cols-1 lg:h-[30rem] lg:[transition:grid-template-columns_620ms_var(--ease-out)]"
        style={{ gridTemplateColumns: columns } as CSSProperties}
      >
        {items.map((it, i) => {
          const on = i === active;
          return (
            <li key={it.id} className="min-w-0">
              <Link
                href={it.href}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                onFocus={() => setActive(i)}
                className="group relative block h-full overflow-hidden rounded-lg bg-inverse max-lg:aspect-[16/10]"
              >
                {it.photo && (
                  <Photo
                    photo={it.photo}
                    ratio={16 / 10}
                    sizes="(min-width: 1024px) 640px, 100vw"
                    className="absolute inset-0 !aspect-auto h-full w-full"
                    imgClassName={cn("transition-transform duration-[900ms] ease-out", on ? "scale-100" : "lg:scale-[1.06]")}
                  />
                )}
                <div
                  aria-hidden
                  className={cn(
                    "absolute inset-0 transition-[background-color] duration-500",
                    on ? "bg-[linear-gradient(180deg,transparent_45%,rgb(9_14_22/0.75))]" : "bg-[rgb(9_14_22/0.35)] max-lg:bg-[linear-gradient(180deg,transparent_45%,rgb(9_14_22/0.75))]",
                  )}
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white lg:p-6">
                  <span className="min-w-0">
                    {it.meta && <span className="block truncate t-meta text-white/70">{it.meta}</span>}
                    <span className="mt-1 block truncate font-display text-[1.5rem] leading-[1.1] font-medium tracking-[-0.022em] lg:text-[1.75rem]">{it.name}</span>
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-md bg-white text-[#0d1a2b] transition-[opacity,transform] duration-300",
                      on ? "opacity-100" : "lg:translate-y-1 lg:opacity-0",
                    )}
                  >
                    <HoverArrow className="!ml-0" />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {current && (
        <div className="mt-8 grid-page gap-y-6 max-lg:hidden">
          <div key={current.id} className="anim-rise col-span-4 md:col-span-8 lg:col-span-6">
            <p className="t-h3">{current.name}</p>
            {current.description && <p className="mt-2 max-w-[54ch] t-body text-ink-2">{current.description}</p>}
          </div>
          <ul key={`${current.id}-groups`} className="anim-rise col-span-4 flex flex-wrap content-start gap-2 md:col-span-8 lg:col-span-6">
            {current.groups.map((g) => (
              <li key={g.id}>
                <Link
                  href={g.href}
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-surface px-3 text-[13px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--border)] transition-shadow hover:shadow-[inset_0_0_0_1px_var(--border-strong),0_4px_10px_-6px_rgb(13_26_43/0.2)]"
                >
                  {g.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
