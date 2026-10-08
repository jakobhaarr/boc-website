"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * The frame of a hero picture that starts where the dark part's slanted edge meets the bottom of the hero (OrgNode.heroAnchor).
 * The edge leans 21.25 degrees, so at the bottom it stands half the hero's height times tan(21.25°) to the left of where it
 * stands in the middle (37.5 % and 6.5 rem). The hero is as tall as its text needs, which CSS cannot read from here, so the
 * frame measures the grid it stands in and keeps its left margin to the real height; until then the margin follows the
 * minimum height the hero has.
 */
export function AnchoredFrame({ fallbackHeight, className, children }: { fallbackHeight: string; className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const grid = el?.parentElement;
    if (!el || !grid) return;
    const fit = () => el.style.setProperty("--anchor-ml", `calc(6.5rem - ${(0.1945 * grid.getBoundingClientRect().height).toFixed(1)}px)`);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(grid);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={{ "--anchor-ml": `calc(6.5rem - 0.1945 * ${fallbackHeight})` } as CSSProperties}>
      {children}
    </div>
  );
}
