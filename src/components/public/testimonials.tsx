"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Status } from "@/components/ui/primitives";
import type { TestimonialView } from "@/lib/content";
import { Photo } from "./photo";
import { Portrait } from "./people";

/**
 * Member quotes, one large card each: the quote and who said it on the left,
 * the member's photograph filling the right. People trust people they can
 * see, so the picture gets as much room as the words. On phones the photo
 * sits on top. The cards run in a row paged with two buttons, as
 * GroupCarousel does; the next card peeks in at the edge so the row reads as
 * going on.
 *
 * A member without a portrait they have agreed to show keeps the text card
 * with their initials. A placeholder quote carries an «Eksempel» tag, so it
 * is never read as a real member's words.
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
      <ul
        ref={track}
        aria-label="Sitater fra medlemmer"
        className="scroll-x -mx-[var(--page-gutter)] flex snap-x snap-mandatory scroll-px-[var(--page-gutter)] gap-4 px-[var(--page-gutter)] lg:gap-[var(--grid-gap)]"
      >
        {items.map((t) => (
          <li key={t.id} className="w-[min(22rem,84vw)] shrink-0 snap-start md:w-[min(52rem,86%)]">
            <figure className="grid h-full overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              {t.photo && (
                <Photo
                  photo={t.photo}
                  ratio={1}
                  mdRatio={4 / 5}
                  sizes="(min-width: 768px) 420px, 84vw"
                  className="md:order-2 md:h-full"
                />
              )}
              <div className="flex flex-col p-6 md:p-8 lg:p-10">
                {t.example && (
                  <Status tone="warning" className="mb-5 self-start">
                    Eksempel
                  </Status>
                )}
                <blockquote className="flex-1 font-display text-[1.375rem] leading-[1.3] font-medium tracking-[-0.018em] text-ink md:text-[1.75rem] lg:text-[2rem]">
                  <span aria-hidden className="text-club">«</span>
                  {t.quote}
                  <span aria-hidden className="text-club">»</span>
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3 border-t border-line pt-5">
                  {!t.photo && <Portrait name={t.firstName} size={48} />}
                  <span className="min-w-0">
                    <span className="block text-[1.0625rem] font-semibold text-ink">
                      {t.firstName}
                      {t.age !== undefined && <span className="font-normal text-ink-3">, {t.age} år</span>}
                    </span>
                    {t.groups.length > 0 && <span className="block t-small text-ink-2">{t.groups.join(" · ")}</span>}
                  </span>
                </figcaption>
              </div>
            </figure>
          </li>
        ))}
      </ul>
      {items.length > 1 && (
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={nav} onClick={() => page(-1)} disabled={edge.start} aria-label="Forrige sitat">
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button type="button" className={nav} onClick={() => page(1)} disabled={edge.end} aria-label="Neste sitat">
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      )}
    </div>
  );
}
