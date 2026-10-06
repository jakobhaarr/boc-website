"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

/**
 * A row of photographs to page through: swipe or scroll on a phone, two
 * buttons or the arrow keys on a computer. Every picture has the same height;
 * landscape ones are wide and portrait ones narrow, so none is cropped
 * hard. The row ends at the page edge, so the next picture peeks out and says
 * there is more.
 */
export function PhotoCarousel({ photos, label }: { photos: PhotoRecord[]; label: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div role="region" aria-roledescription="karusell" aria-label={label}>
      <ul
        ref={track}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") page(1);
          if (e.key === "ArrowLeft") page(-1);
        }}
        className="scroll-x -mx-[var(--page-gutter)] flex snap-x snap-mandatory gap-[var(--grid-gap)] overflow-x-auto px-[var(--page-gutter)] pb-2 focus-visible:outline-none"
      >
        {photos.map((p, i) => {
          const portrait = p.height > p.width;
          return (
            <li key={p.id} aria-label={`${i + 1} av ${photos.length}`} className={cn("shrink-0 snap-start scroll-ml-[var(--page-gutter)]", portrait ? "w-[min(62vw,17rem)]" : "w-[min(86vw,38rem)]")}>
              <Photo photo={p} ratio={portrait ? 2 / 3 : 3 / 2} sizes={portrait ? "272px" : "(min-width: 640px) 608px, 86vw"} className="rounded-lg" />
            </li>
          );
        })}
      </ul>
      <div className="mt-5 flex gap-2">
        {([-1, 1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => page(dir)}
            disabled={dir === -1 ? edge.start : edge.end}
            aria-label={dir === -1 ? "Forrige bilder" : "Neste bilder"}
            className="flex size-11 items-center justify-center rounded-md border border-line-strong bg-surface text-ink transition-colors hover:bg-sunken disabled:pointer-events-none disabled:opacity-40"
          >
            {dir === -1 ? <ChevronLeft aria-hidden className="size-5" /> : <ChevronRight aria-hidden className="size-5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
