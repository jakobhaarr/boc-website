"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { HoverArrow } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";
import type { NavItem, NavSection, NavSport } from "./site-header";

export interface BrowserGroup extends NavItem {
  photo?: PhotoRecord;
  schedule?: string;
}

export interface BrowserEntry extends Omit<NavSport, "sections"> {
  sections: (Omit<NavSection, "items"> & { items: BrowserGroup[] })[];
}

/**
 * «Finn din aktivitet» on the front page: the header's «Grupper» menu (see
 * SportsMenu) laid out on the page, with room for a photo of every group.
 *
 * Same rail and the same sections as the menu — both come from navSports()
 * — so the page and the menu never disagree about what the club offers.
 * The rail is chosen by pressing rather than pointing: on the page, content
 * that swaps as the pointer passes over it would jump the page under it.
 * Below lg the rail runs across the top and scrolls sideways.
 */
export function GroupBrowser({ entries, label }: { entries: BrowserEntry[]; label: string }) {
  const [active, setActive] = useState(0);
  const entry = entries[active] ?? entries[0];

  const rail = useRef<(HTMLButtonElement | null)[]>([]);
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const el = rail.current[active];
      if (el) setMarker({ top: el.offsetTop, height: el.offsetHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, entries]);

  if (!entry) return null;

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-raised ring-1 ring-line lg:grid lg:grid-cols-[18.5rem_minmax(0,1fr)]">
      {/* Rail */}
      <div className="border-b border-line bg-sunken/70 p-3 lg:border-r lg:border-b-0">
        <p className="px-2.5 pt-1.5 pb-2 t-meta text-ink-3 max-lg:hidden">{label}</p>
        <div role="tablist" aria-label={label} aria-orientation="vertical" className="scroll-x relative flex gap-1.5 lg:flex-col lg:gap-0">
          {marker && (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 bg-surface shadow-card ring-1 ring-line transition-[transform,height] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] max-lg:hidden"
              style={{ height: marker.height, transform: `translateY(${marker.top}px)` }}
            />
          )}
          {entries.map((s, i) => {
            const on = i === active;
            return (
              <button
                key={s.id}
                ref={(el) => {
                  rail.current[i] = el;
                }}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="finn-aktivitet-grupper"
                onClick={() => setActive(i)}
                className={cn(
                  "relative z-10 flex shrink-0 items-center gap-3 p-2.5 pr-4 text-left transition-colors lg:pr-2.5",
                  on ? "max-lg:bg-surface max-lg:shadow-card max-lg:ring-1 max-lg:ring-line" : "hover:bg-surface/60",
                )}
              >
                {s.photo && <Photo photo={s.photo} ratio={1} sizes="48px" grade={false} className="size-11 shrink-0" />}
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[15px] font-semibold tracking-[-0.012em] transition-colors duration-200", on ? "text-ink" : "text-ink-2")}>
                    {s.name}
                  </span>
                  {s.ages && <span className="block truncate t-small whitespace-nowrap text-ink-3">{s.ages}</span>}
                </span>
                <HoverArrow className={cn("text-ink-3 transition-opacity duration-200 max-lg:hidden", on ? "opacity-100" : "opacity-0")} />
              </button>
            );
          })}
        </div>
      </div>

      {/* The chosen branch or sport, every group with its photo */}
      <div id="finn-aktivitet-grupper" role="tabpanel" aria-label={entry.name} className="p-4 sm:p-6 lg:p-8">
        <div key={entry.id} className="anim-fade">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="font-display text-[1.5rem] leading-[1.1] font-medium tracking-[-0.022em] text-ink">{entry.name}</p>
              {entry.summary && <p className="mt-1.5 max-w-[56ch] t-small text-ink-2">{entry.summary}</p>}
            </div>
            <Link href={entry.href} className="inline-flex shrink-0 items-center t-small font-medium text-club hover:text-club-hover sm:mt-1">
              Alt om {entry.name.toLowerCase()}
              <HoverArrow />
            </Link>
          </div>

          {entry.sections.map((sec) => (
            <div key={sec.id} className="mt-6 border-t border-line pt-5">
              {sec.name && sec.href ? (
                <Link href={sec.href} className="mb-3 flex min-h-6 w-fit items-center t-meta font-semibold text-club transition-colors hover:text-club-hover">
                  {sec.name}
                  <HoverArrow />
                </Link>
              ) : (
                <p className="mb-3 flex min-h-6 items-center t-meta font-semibold text-club">{sec.name ?? "Grupper"}</p>
              )}
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 xl:grid-cols-4">
                {sec.items.map((g) => (
                  <li key={g.id}>
                    <Link href={g.href} className="group grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-3.5 sm:block">
                      <div className="overflow-hidden rounded-md bg-sunken">
                        {g.photo ? (
                          <Photo
                            photo={g.photo}
                            ratio={4 / 3}
                            sizes="(min-width: 1280px) 240px, (min-width: 768px) 30vw, (min-width: 640px) 45vw, 96px"
                            className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
                          />
                        ) : (
                          <div aria-hidden className="aspect-[4/3]" />
                        )}
                      </div>
                      <div className="min-w-0 sm:mt-3">
                        <p className="flex items-center text-[15px] font-semibold tracking-[-0.01em] text-ink group-hover:text-club">
                          {g.name}
                          <HoverArrow />
                        </p>
                        {(g.audience || g.requirement) && (
                          <p className="mt-1 flex flex-wrap gap-1">
                            {g.audience && <Status tone="club">{g.audience}</Status>}
                            {g.requirement && <Status tone="danger">{g.requirement}</Status>}
                          </p>
                        )}
                        {g.schedule && <p className="mt-1.5 t-small text-ink-2">{g.schedule}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
