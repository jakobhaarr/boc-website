"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { HoverArrow } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { Photo } from "./photo";
import type { NavSport } from "./site-header";

/**
 * Desktop sports menu: a rail of sports, and only the sport you point at
 * (or focus) is shown beside it. Switching is animated the way Stripe's
 * navigation morphs between menus —
 *   · a highlight slides along the rail to the new sport,
 *   · the content area eases to the new content's height,
 *   · old and new content cross-fade while travelling a few pixels in the
 *     direction the pointer moved (down the rail → content rises from below).
 * All panes stay mounted so heights can be measured before they are shown.
 *
 * Smoothness: only opacity and translate animate per pane (compositor-only),
 * leaving lags a little behind entering so the two never fight, and the
 * thumbnails skip the film grade — its blend modes would be recomposited on
 * every frame.
 */
export function SportsMenu({
  sports,
  open,
  initialIndex,
  label = "Idretter",
}: {
  sports: NavSport[];
  open: boolean;
  initialIndex: number;
  label?: string;
}) {
  const [active, setActive] = useState(initialIndex);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setActive(initialIndex);
  }

  const rail = useRef<(HTMLAnchorElement | null)[]>([]);
  const panes = useRef<(HTMLDivElement | null)[]>([]);
  const [heights, setHeights] = useState<number[]>([]);
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const measure = () => setHeights(panes.current.map((p) => p?.offsetHeight ?? 0));
    measure();
    const ro = new ResizeObserver(measure);
    panes.current.forEach((p) => p && ro.observe(p));
    return () => ro.disconnect();
  }, [sports]);

  useLayoutEffect(() => {
    const el = rail.current[active];
    if (el) setMarker({ top: el.offsetTop, height: el.offsetHeight });
  }, [active, sports]);

  return (
    <div className="grid grid-cols-[18.5rem_minmax(0,1fr)]">
      <div className="border-r border-line bg-sunken/70 p-3">
        <p className="px-2.5 pt-1.5 pb-2 t-meta text-ink-3">{label}</p>
        <ul className="relative">
          {marker && (
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 bg-surface shadow-card ring-1 ring-line transition-[transform,height] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform"
              style={{ height: marker.height, transform: `translateY(${marker.top}px)` }}
            />
          )}
          {sports.map((s, i) => {
            const on = i === active;
            return (
              <li key={s.id}>
                <Link
                  ref={(el) => {
                    rail.current[i] = el;
                  }}
                  href={s.href}
                  onPointerEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="relative z-10 flex items-center gap-3 p-2.5"
                >
                  {s.photo && <Photo photo={s.photo} ratio={1} sizes="48px" grade={false} className="size-11 shrink-0" />}
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-[15px] font-semibold tracking-[-0.012em] transition-colors duration-200", on ? "text-ink" : "text-ink-2")}>
                      {s.name}
                    </span>
                    {s.ages && <span className="block truncate t-small text-ink-3">{s.ages}</span>}
                  </span>
                  <HoverArrow className={cn("text-ink-3 transition-opacity duration-200", on ? "opacity-100" : "opacity-0")} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div
        className="relative overflow-hidden transition-[height] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] [contain:layout_paint]"
        style={{ height: heights[active] || undefined }}
      >
        {sports.map((s, i) => {
          const on = i === active;
          return (
            <div
              key={s.id}
              ref={(el) => {
                panes.current[i] = el;
              }}
              inert={!on}
              aria-hidden={!on}
              className={cn(
                "absolute inset-x-0 top-0 p-6 transition-[opacity,translate] will-change-[opacity,translate]",
                on
                  ? "translate-y-0 opacity-100 delay-[60ms] duration-[340ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
                  : cn("pointer-events-none opacity-0 duration-150 ease-in", i < active ? "-translate-y-2" : "translate-y-2"),
              )}
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <p className="font-display text-[1.5rem] leading-[1.1] font-medium tracking-[-0.022em] text-ink">{s.name}</p>
                  {s.summary && <p className="mt-1.5 max-w-[48ch] t-small text-ink-2">{s.summary}</p>}
                </div>
                <Link href={s.href} className="mt-1 inline-flex shrink-0 items-center t-small font-medium text-club hover:text-club-hover">
                  Alt om {s.name.toLowerCase()}
                  <HoverArrow />
                </Link>
              </div>
              <div
                className={cn(
                  "mt-5 grid gap-x-6 gap-y-6 border-t border-line pt-5",
                  s.sections.length === 1 ? "grid-cols-1" : s.sections.length === 2 ? "grid-cols-2" : "grid-cols-3",
                )}
              >
                {s.sections.map((sec) => (
                  <div key={sec.id} className="min-w-0">
                    {sec.name && sec.href ? (
                      <Link
                        href={sec.href}
                        className="mb-1.5 flex min-h-6 items-center t-meta font-semibold text-club transition-colors hover:text-club-hover"
                      >
                        {sec.name}
                        <HoverArrow />
                      </Link>
                    ) : (
                      <p className="mb-1.5 flex min-h-6 items-center t-meta font-semibold text-club">{sec.name ?? "Grupper"}</p>
                    )}
                    <ul className="-mx-2">
                      {sec.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5 t-small text-ink-2 transition-colors hover:bg-sunken hover:text-ink"
                          >
                            <span className="truncate">{item.name}</span>
                            {item.audience && <Status tone="club">{item.audience}</Status>}
                            {item.requirement && <Status tone="danger">{item.requirement}</Status>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
