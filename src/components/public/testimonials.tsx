"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { HoverArrow } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { TestimonialView } from "@/lib/content";
import { Photo } from "./photo";

/** «Sanders historie», «Magnus' historie». */
const storyOf = (name: string) => `${name}${/[sxz]$/i.test(name) ? "'" : "s"} historie`;

/**
 * Member quotes, after Stripe's customer stories: a tall photograph with the
 * member's name, age and group set on it, a short quote under it, and a link
 * to the longer story. People trust people they can see, so the picture
 * carries the card. The row is paged with two buttons and sized like
 * GroupCarousel — three and a half cards on desktop, so the cut-off card
 * says the row goes on.
 *
 * Without a portrait the member has agreed to show, the card keeps the
 * club's colour where the picture would be. A placeholder carries an
 * «Eksempel» tag on the picture, so it is never read as a real member.
 */
export function Testimonials({ items }: { items: TestimonialView[] }) {
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

  const nav =
    "flex size-10 items-center justify-center rounded-md bg-surface text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] transition-[box-shadow,color,opacity] duration-150 hover:shadow-[inset_0_0_0_1px_var(--text-muted)] disabled:opacity-35";

  return (
    <div>
      {items.length > 1 && (
        <div className="mb-5 flex justify-end gap-2 max-md:hidden" role="group" aria-label="Bla i sitatene">
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
        aria-label="Sitater fra medlemmer"
        className="scroll-x -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-[var(--grid-gap)] px-[var(--page-gutter)] md:mx-0 md:scroll-px-0 md:px-0"
      >
        {items.map((t) => (
          <li
            key={t.id}
            className={cn(
              "w-[78%] shrink-0 snap-start",
              items.length > 2 ? "sm:w-[calc((100%-2*var(--grid-gap))/2.4)]" : "sm:w-[calc((100%-var(--grid-gap))/2)]",
              items.length > 4 ? "lg:w-[calc((100%-3*var(--grid-gap))/3.5)]" : "lg:w-[calc((100%-3*var(--grid-gap))/4)]",
            )}
          >
            <figure className="group">
              <div className="relative overflow-hidden rounded-lg bg-inverse">
                {t.photo ? (
                  <Photo photo={t.photo} ratio={4 / 5} sizes="(min-width: 1024px) 340px, (min-width: 640px) 42vw, 78vw" className="hover-zoom" />
                ) : (
                  <div aria-hidden className="aspect-[4/5] bg-[radial-gradient(120%_90%_at_20%_0%,var(--club-primary),var(--club-secondary))]" />
                )}
                {t.example && (
                  <Status tone="warning" className="absolute top-3 left-3">
                    Eksempel
                  </Status>
                )}
                {/* The same frosted foot as GroupCarousel's cards, so white
                    text stays legible on any photograph. */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,rgb(9_14_22/0.08),rgb(9_14_22/0.6))] backdrop-blur-md [mask-image:linear-gradient(180deg,transparent,#000_40%)]"
                />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="font-display text-[1.625rem] leading-[1.05] font-medium tracking-[-0.025em]">
                    {t.firstName}
                    {t.age !== undefined && <span className="text-white/75">, {t.age}</span>}
                  </p>
                  {t.groups.length > 0 && <p className="mt-1.5 t-small text-white/80">{t.groups.join(" · ")}</p>}
                </figcaption>
              </div>
              <blockquote className="mt-4 px-1 t-body text-ink">«{t.quote}»</blockquote>
              {t.href && (
                <Link href={t.href} className="mt-3 inline-flex items-center px-1 t-small font-medium text-club hover:text-club-hover">
                  Les {storyOf(t.firstName)}
                  <HoverArrow />
                </Link>
              )}
            </figure>
          </li>
        ))}
      </ul>
    </div>
  );
}
