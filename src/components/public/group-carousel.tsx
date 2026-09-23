"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HoverArrow } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

export interface CarouselItem {
  id: string;
  name: string;
  href: string;
  eyebrow?: string;
  text?: string;
  photo?: PhotoRecord;
}

/**
 * Horizontal card row, after Stripe's startups carousel: tall photo cards
 * with the name set on the image, paged with two buttons. On desktop each
 * card is exactly one guide cell (three columns) wide and the gap between
 * cards is the grid gap, so card edges land on the grid; on tablets two
 * cells, on phones a peek of the next card.
 *
 * When there are more cards than fit, the row shows a card and a half fewer
 * than it could, as Stripe does: three and a half on desktop, two and a bit
 * on tablets. The card cut off at the edge says the row goes on — paging
 * buttons alone are easy to miss.
 */
export function GroupCarousel({ items, label, className }: { items: CarouselItem[]; label: string; className?: string }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth > el.scrollWidth - 4 });
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.firstElementChild as HTMLElement | null;
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: "smooth" });
  };

  const nav = "flex size-10 items-center justify-center rounded-md bg-surface text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] transition-[box-shadow,color,opacity] duration-150 hover:shadow-[inset_0_0_0_1px_var(--text-muted)] disabled:opacity-35";

  return (
    <div className={className}>
      {items.length > 1 && (
        <div className="mb-5 flex justify-end gap-2 max-md:hidden" role="group" aria-label={`Bla i ${label}`}>
          <button type="button" className={nav} onClick={() => page(-1)} disabled={edge.start} aria-label="Forrige">
            <ChevronLeft aria-hidden className="size-4" />
          </button>
          <button type="button" className={nav} onClick={() => page(1)} disabled={edge.end} aria-label="Neste">
            <ChevronRight aria-hidden className="size-4" />
          </button>
        </div>
      )}
      <ul
        ref={track}
        aria-label={label}
        className="scroll-x -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-[var(--grid-gap)] px-[var(--page-gutter)] md:mx-0 md:scroll-px-0 md:px-0"
      >
        {items.map((it) => (
          <li
            key={it.id}
            className={cn(
              "w-[78%] shrink-0 snap-start",
              items.length > 2 ? "sm:w-[calc((100%-2*var(--grid-gap))/2.4)]" : "sm:w-[calc((100%-var(--grid-gap))/2)]",
              items.length > 4 ? "lg:w-[calc((100%-3*var(--grid-gap))/3.5)]" : "lg:w-[calc((100%-3*var(--grid-gap))/4)]",
            )}
          >
            <Link href={it.href} className="group relative block overflow-hidden rounded-lg bg-inverse">
              {it.photo ? (
                <Photo photo={it.photo} ratio={4 / 5} sizes="(min-width: 1024px) 300px, (min-width: 640px) 50vw, 80vw" className="hover-zoom" />
              ) : (
                <div aria-hidden className="aspect-[4/5] bg-[radial-gradient(120%_90%_at_20%_0%,var(--club-primary),var(--club-secondary))]" />
              )}
              {/* Frosted glass under the text: the lower part of the picture is
                  blurred and lightly toned, and fades in from the top so the
                  panel has no hard edge. The text stays legible on any photo
                  while the picture above it is left alone. */}
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-[62%] bg-[linear-gradient(180deg,rgb(9_14_22/0.12),rgb(9_14_22/0.55))] backdrop-blur-lg [mask-image:linear-gradient(180deg,transparent,#000_32%)]"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                {it.eyebrow && <p className="t-meta text-white/70">{it.eyebrow}</p>}
                <p className="mt-1 font-display text-[1.5rem] leading-[1.1] font-medium tracking-[-0.022em]">{it.name}</p>
                {it.text && <p className="mt-2 line-clamp-2 t-small text-white/75">{it.text}</p>}
                <p className="mt-4 flex items-center border-t border-white/20 pt-3 t-small font-medium">
                  Til {it.name}
                  <HoverArrow />
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
