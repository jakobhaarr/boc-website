"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { HoverArrow } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { TestimonialView } from "@/lib/content";
import { Lagoon } from "./lagoon";
import { Photo } from "./photo";

/** «Sanders historie», «Magnus' historie». */
const storyOf = (name: string) => `${name}${/[sxz]$/i.test(name) ? "'" : "s"} historie`;

/**
 * The size of the quote follows its length: a short one is set large, as a
 * headline, a long one smaller so it never turns into a wall. A quote is at
 * most 280 characters (admin cuts it there).
 */
const quoteSize = (text: string) =>
  text.length <= 90
    ? "text-[1.75rem] leading-[1.15] sm:text-[2.5rem]"
    : text.length <= 150
      ? "text-[1.5rem] leading-[1.18] sm:text-[2rem]"
      : text.length <= 210
        ? "text-[1.3rem] leading-[1.25] sm:text-[1.7rem]"
        : "text-[1.15rem] leading-[1.3] sm:text-[1.45rem]";

/**
 * A group's member quotes as one wide card at a time, after Apple's «Specialist» card: the quote
 * is the headline, who said it a quiet line under it, and the person's picture fills the right
 * side to the edge. The picture's left edge leans at the angle of the hero's and the wordmark's
 * stripes (-21.25 degrees), so the card belongs to the page. Without a picture the member has
 * agreed to show, the Lagoon gradient stands there, so the card is whole without one. An example
 * quote is tagged, so it is never read as a real member.
 *
 * Moved with two buttons or the dots, never on its own. All the quotes are laid on top of each
 * other, so the card keeps the height of the longest and nothing jumps when it changes.
 */
export function QuoteStage({ items, heading }: { items: TestimonialView[]; heading?: ReactNode }) {
  const [index, setIndex] = useState(0);
  const go = (i: number) => setIndex((i + items.length) % items.length);

  return (
    <div>
      {heading && <div className="mb-8 lg:mb-10">{heading}</div>}
      <div className="relative overflow-hidden rounded-xl bg-surface ring-1 ring-line">
        <ul aria-label="Sitater fra medlemmer" className="grid">
          {items.map((t, i) => {
            const active = i === index;
            return (
              <li
                key={t.id}
                aria-hidden={!active}
                inert={!active}
                className={cn("col-start-1 row-start-1 grid transition-opacity duration-300 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]", active ? "opacity-100" : "pointer-events-none opacity-0")}
              >
                {/* Below lg the picture is a strip on top and the text follows it. */}
                <div className="relative order-first aspect-[16/9] overflow-hidden lg:order-last lg:aspect-auto lg:min-h-[24rem]">
                  <div className="absolute inset-0">
                    {t.photo ? (
                      <Photo photo={t.photo} ratio={16 / 9} sizes="(min-width: 1024px) 560px, 100vw" className="absolute inset-0 h-full w-full" />
                    ) : (
                      <Lagoon deep className="absolute inset-0" />
                    )}
                  </div>
                  {/* The surface leans into the picture; skewed about its middle, so the angle holds at any height. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-[-8rem] hidden w-[calc(8rem+4.5rem)] bg-surface lg:block"
                    style={{ transform: "skewX(-21.25deg)" }}
                  />
                </div>

                <figure className={cn("flex flex-col justify-center gap-6 p-6 sm:p-10 lg:py-14 lg:pr-4 lg:pl-14", items.length > 1 && "lg:pb-24")}>
                  <blockquote className={cn("font-display font-medium tracking-[-0.018em] text-balance text-ink", quoteSize(t.quote))}>«{t.quote}»</blockquote>
                  <figcaption className="grid gap-1">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 t-body-lg font-semibold text-ink">
                      <span>
                        {t.firstName}
                        {t.age !== undefined && <span className="font-normal text-ink-2">, {t.age}</span>}
                      </span>
                      {t.example && <Status tone="warning">Eksempel</Status>}
                    </p>
                    {t.groups.map((g) => (
                      <p key={g} className="t-small text-ink-3">
                        {g}
                      </p>
                    ))}
                    {t.href && (
                      <Link href={t.href} className="group mt-2 inline-flex items-center t-small font-medium text-club hover:text-club-hover">
                        Les {storyOf(t.firstName)}
                        <HoverArrow />
                      </Link>
                    )}
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>

        {items.length > 1 && (
          <div className="flex items-center gap-4 border-t border-line px-6 py-4 sm:px-10 lg:absolute lg:bottom-0 lg:left-0 lg:w-[58%] lg:border-t-0 lg:pb-8 lg:pl-14">
            <div className="flex gap-2" role="group" aria-label="Bla i sitatene">
              <button type="button" onClick={() => go(index - 1)} aria-label="Forrige sitat" className={nav}>
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Neste sitat" className={nav}>
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>
            <ol className="flex items-center gap-1" aria-label="Velg sitat">
              {items.map((t, i) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Sitat ${i + 1} av ${items.length}`}
                    aria-current={i === index ? "true" : undefined}
                    className="group flex size-6 items-center justify-center"
                  >
                    <span className={cn("block rounded-full transition-all duration-200", i === index ? "h-2 w-5 bg-ink" : "size-2 bg-line-strong group-hover:bg-ink-3")} />
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

const nav =
  "flex size-10 items-center justify-center rounded-md bg-surface text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] transition-[box-shadow,color] duration-150 hover:shadow-[inset_0_0_0_1px_var(--ink)]";
