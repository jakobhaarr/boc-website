"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
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
 * Member quotes. With one quote, one wide card, after Apple's «Specialist» card; with several, from lg up, a row in the
 * manner of Stripe's «What's happening»: one card open wide, the rest closing up beside it, narrower the further they
 * are from it, each only a slice of the person's picture, and a click on a slice opens it. Below lg, and with one
 * quote, the wide card is paged with two buttons and dots (below). The card: the quote
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
  const several = items.length > 1;

  return (
    <div>
      {(heading || several) && (
        <div className="mb-8 flex items-end justify-between gap-6 lg:mb-10">
          <div className="min-w-0">{heading}</div>
          {several && (
            <div className="flex shrink-0 gap-2 max-lg:hidden" role="group" aria-label="Bla i sitatene">
              <button type="button" onClick={() => go(index - 1)} aria-label="Forrige sitat" className={nav}>
                <ChevronLeft aria-hidden className="size-4" />
              </button>
              <button type="button" onClick={() => go(index + 1)} aria-label="Neste sitat" className={nav}>
                <ChevronRight aria-hidden className="size-4" />
              </button>
            </div>
          )}
        </div>
      )}
      {several && <QuoteRow items={items} index={index} onPick={setIndex} />}
      <div className={cn(several && "lg:hidden")}>
        <QuoteCard items={items} index={index} go={go} />
      </div>
    </div>
  );
}

/** How wide a card is, in rem, by how many places it is from the open one. The open one takes what is left. */
const STRIP_REM = [0, 10, 6, 3.5, 2];
const stripWidth = (distance: number) => STRIP_REM[Math.min(distance, STRIP_REM.length - 1)];

/** The size of the quote on the open card of the row, which is narrower than the wide card. */
const rowQuoteSize = (text: string) =>
  text.length <= 90 ? "text-[2.1rem] leading-[1.12]" : text.length <= 150 ? "text-[1.75rem] leading-[1.16]" : text.length <= 210 ? "text-[1.5rem] leading-[1.22]" : "text-[1.3rem] leading-[1.28]";

function QuoteRow({ items, index, onPick }: { items: TestimonialView[]; index: number; onPick: (i: number) => void }) {
  return (
    <ul aria-label="Sitater fra medlemmer" className="flex h-[30rem] gap-3 max-lg:hidden">
      {items.map((t, i) => {
        const open = i === index;
        const width = stripWidth(Math.abs(i - index));
        return (
          <li
            key={t.id}
            style={open ? { flex: "1 1 0%" } : { flex: `0 0 ${width}rem` }}
            className="relative min-w-0 overflow-hidden rounded-xl bg-inverse transition-[flex] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <div className="absolute inset-0">
              {t.photo ? <Photo photo={t.photo} ratio={4 / 5} sizes={open ? "(min-width: 1024px) 800px, 100vw" : "240px"} className="absolute inset-0 h-full w-full" /> : <Lagoon deep className="absolute inset-0" />}
            </div>
            {open ? (
              <>
                {/* The foot is dark enough for white type on any picture. */}
                <div aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgb(9_14_22/0)_30%,rgb(9_14_22/0.78))]" />
                {/* The words come in once the card has opened, so they are not set in a narrow strip on the way. */}
                <figure className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-8 text-white anim-fade" style={{ animationDelay: "380ms" }}>
                  <Quote aria-hidden className="size-9 fill-[var(--club-primary)] stroke-[var(--club-primary)]" strokeWidth={1.5} />
                  <blockquote className={cn("max-w-[32ch] font-display font-medium tracking-[-0.018em] text-balance", rowQuoteSize(t.quote))}>{t.quote}</blockquote>
                  <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="t-body-lg font-semibold">
                      {t.firstName}
                      {t.age !== undefined && <span className="font-normal text-white/75">, {t.age}</span>}
                    </span>
                    {t.groups.length > 0 && <span className="t-small text-white/75">{t.groups.join(" · ")}</span>}
                    {t.example && <Status tone="warning">Eksempel</Status>}
                    {t.href && (
                      <Link href={t.href} className="group inline-flex items-center t-small font-medium text-white underline underline-offset-4 hover:text-white/80">
                        Les {storyOf(t.firstName)}
                        <HoverArrow />
                      </Link>
                    )}
                  </figcaption>
                </figure>
              </>
            ) : (
              <button
                type="button"
                onClick={() => onPick(i)}
                aria-label={`Vis sitatet fra ${t.firstName}`}
                className="absolute inset-0 cursor-pointer bg-black/25 transition-colors duration-200 hover:bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}

function QuoteCard({ items, index, go }: { items: TestimonialView[]; index: number; go: (i: number) => void }) {
  return (
    <div>
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
                  {/* A quotation mark says it is a quote, so the words themselves carry no «». */}
                  <Quote aria-hidden className="-mb-2 size-9 fill-[var(--club-primary)] stroke-[var(--club-primary)] sm:size-11" strokeWidth={1.5} />
                  <blockquote className={cn("font-display font-medium tracking-[-0.018em] text-balance text-ink", quoteSize(t.quote))}>{t.quote}</blockquote>
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
