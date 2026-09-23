"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useId, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { StoryView } from "@/lib/views";
import { Photo } from "./photo";

/**
 * Stories as an accordion, after Stripe's customer stories: one story open
 * with its photo, the rest as single headline rows that open in place.
 * Opening animates the row's height (grid rows 0fr → 1fr), so the list
 * never jumps.
 */
export function StoryAccordion({ stories, className }: { stories: StoryView[]; className?: string }) {
  const [openId, setOpenId] = useState<string | undefined>(stories[0]?.id);
  const base = useId();

  return (
    <ul className={cn("border-t border-line", className)}>
      {stories.map((s) => {
        const open = s.id === openId;
        const panelId = `${base}-${s.id}`;
        return (
          <li key={s.id} className="border-b border-line">
            <div className="flex items-center gap-4 py-4 lg:py-5">
              <div className="min-w-0 flex-1">
                <Link href={s.kickerHref} className="t-meta font-semibold text-club hover:text-club-hover">
                  {s.kicker}
                </Link>
                <h3 className="mt-1">
                  <button
                    type="button"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? undefined : s.id)}
                    className={cn(
                      "text-left font-display text-[1.25rem] leading-[1.18] font-medium tracking-[-0.02em] text-balance transition-colors lg:text-[1.5rem]",
                      open ? "text-ink" : "text-ink-2 hover:text-ink",
                    )}
                  >
                    {s.title}
                  </button>
                </h3>
              </div>
              <button
                type="button"
                tabIndex={-1}
                aria-hidden
                onClick={() => setOpenId(open ? undefined : s.id)}
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-md transition-[background-color,color,transform] duration-200",
                  open ? "rotate-45 bg-club-surface text-on-club" : "bg-club-tint text-club hover:bg-club-surface hover:text-on-club",
                )}
              >
                <Plus className="size-4" />
              </button>
            </div>

            <div id={panelId} className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="min-h-0 overflow-hidden" inert={!open}>
                <div className={cn("pb-6 transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}>
                  {s.photo && (
                    <Link href={s.href} tabIndex={-1} aria-hidden className="block">
                      <Photo photo={s.photo} ratio={16 / 9} mdRatio={21 / 9} sizes="(min-width: 1024px) 860px, 100vw" className="hover-zoom rounded-lg" />
                    </Link>
                  )}
                  <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="min-w-0">
                      {s.lead && <p className="max-w-[58ch] t-small text-ink-2">{s.lead}</p>}
                      <p className="mt-1.5 t-meta text-ink-3">
                        {s.date}
                        {s.author && ` · ${s.author}`}
                      </p>
                    </div>
                    <ButtonLink href={s.href} variant="secondary" size="sm" arrow className="self-start sm:self-auto">
                      Les saken
                    </ButtonLink>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
