"use client";

import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { HoverArrow } from "@/components/ui/button";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { TestimonialView } from "@/lib/content";
import { Lagoon } from "./lagoon";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Photo } from "./photo";

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
  const several = items.length > 1;
  // With several, the second stands open and the first closes up beside it, so it is plain at once that there is more to go to both ways.
  const [index, setIndex] = useState(several ? 1 : 0);
  const go = (i: number) => setIndex((i + items.length) % items.length);
  const root = useRef<HTMLDivElement>(null);
  const goRef = useRef(go);
  goRef.current = go;
  const indexRef = useRef(index);
  indexRef.current = index;

  // The arrow keys page the quotes while the stage is on screen, unless the reader is typing or using a modifier.
  useEffect(() => {
    if (!several) return;
    const onKey = (e: KeyboardEvent) => {
      const box = root.current?.getBoundingClientRect();
      const onScreen = !!box && box.bottom > 0 && box.top < window.innerHeight && box.height > 0;
      if (!onScreen || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      goRef.current(indexRef.current + (e.key === "ArrowRight" ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [several]);

  return (
    <div ref={root}>
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
const STRIP_REM = [0, 7, 4.5, 3, 2];
const stripWidth = (distance: number) => STRIP_REM[Math.min(distance, STRIP_REM.length - 1)];

/** The size of the quote on the open card of the row: 1.5 rem whatever its length (a quote is at most 280 characters). */
const rowQuoteSize = () => "text-[1.5rem] leading-[1.22]";

type Tone = { ground: string; text: string; sub: string; faint: string; mark: string; link: string };

const WHITE_TEXT = { text: "text-white", sub: "text-white/80", faint: "text-white/65", mark: "fill-white stroke-white", link: "bg-white text-[#0b1315] hover:bg-white/90" };

/**
 * The ground the words stand on, by the person's card style (Person.cardStyle, chosen in admin, else the portrait's own): «studio» is a
 * white card (white stays white on a dark page too), «natural» a dark ground under a blurred enlargement of the
 * photo itself (QuoteRow), and the default «color» a plain ground rotating black, the club's teal (its colour on
 * yellow) and light grey by place in the row. Each carries its own text colours so the words read on it.
 */
const STUDIO: Tone = { ground: "bg-white", text: "text-[#0b1315]", sub: "text-[#0b1315]/80", faint: "text-[#0b1315]/60", mark: "fill-[var(--club-on-primary)] stroke-[var(--club-on-primary)]", link: "bg-[#0b1315] text-white hover:bg-black" };
const NATURAL: Tone = { ground: "bg-[#0b1315]", ...WHITE_TEXT };
const COLORS: Tone[] = [
  { ground: "bg-[#0b1315]", ...WHITE_TEXT },
  { ground: "bg-[var(--club-on-primary)]", text: "text-white", sub: "text-white/85", faint: "text-white/70", mark: "fill-white stroke-white", link: "bg-white text-[#0b1315] hover:bg-white/90" },
  { ground: "bg-[#e6e9ed]", text: "text-[#0b1315]", sub: "text-[#0b1315]/80", faint: "text-[#0b1315]/60", mark: "fill-[var(--club-on-primary)] stroke-[var(--club-on-primary)]", link: "bg-[#0b1315] text-white hover:bg-black" },
];
/** A natural photo this wide has room for the words in itself: it fills the card, subject at the right. */
const isWide = (photo?: { width: number; height: number }) => !!photo && photo.width / photo.height >= 1.5;
/**
 * In the wide card (mobile, and a single quote) a wide natural photo is shown as its right half, where the person is, in a taller frame so the head is whole,
 * since its left half is room for words that the card sets beside the picture instead.
 */
const inRight = (photo: PhotoRecord, style?: string): PhotoRecord => (style === "natural" && isWide(photo) ? { ...photo, zoom: Math.max(photo.zoom ?? 1, 1.4) } : photo);

const toneOf = (style: string | undefined, i: number): Tone => (style === "studio" ? STUDIO : style === "natural" ? NATURAL : COLORS[i % COLORS.length]);

/** The height of the row in rem; the open card's picture is as wide as its own shape makes it at this height. */
const ROW_REM = 32;
/** How wide a picture may be shaped: a very wide one is cropped rather than crowding the words out. */
const shapeOf = (photo?: { width: number; height: number }) => (photo ? Math.min(1.3, Math.max(0.8, photo.width / photo.height)) : 4 / 5);

function QuoteRow({ items, index, onPick }: { items: TestimonialView[]; index: number; onPick: (i: number) => void }) {
  return (
    <ul aria-label="Sitater fra medlemmer" style={{ height: `${ROW_REM}rem` }} className="flex gap-3 max-lg:hidden">
      {items.map((t, i) => {
        const open = i === index;
        const width = stripWidth(Math.abs(i - index));
        const style = t.cardStyle;
        const tone = toneOf(style, i);
        const picture = t.photo ? (
          <Photo photo={t.photo} ratio={open ? shapeOf(t.photo) : 4 / 5} sizes={open ? "(min-width: 1024px) 800px, 100vw" : "240px"} className={cn("absolute inset-0 h-full w-full", style === "studio" && "!bg-transparent")} />
        ) : (
          <Lagoon deep className="absolute inset-0" />
        );
        return (
          <li
            key={t.id}
            style={open ? { flex: "1 1 0%" } : { flex: `0 0 ${width}rem` }}
            className={cn(
              "relative flex min-w-0 flex-col overflow-hidden rounded-xl transition-[flex] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              open ? tone.ground : "bg-inverse",
            )}
          >
            {open ? (
              <div className="relative flex min-h-0 flex-1">
                {/* A wide natural photo fills the card, a lightening of its left side keeping the words readable; a narrower one gets a blurred, darkened enlargement of itself to stand on. */}
                {style === "natural" && t.photo && isWide(t.photo) && (
                  <>
                    <Photo photo={t.photo} sizes="(min-width: 1024px) 1100px, 100vw" className="pointer-events-none absolute inset-0 h-full w-full" />
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent to-75%" />
                  </>
                )}
                {style === "natural" && t.photo && !isWide(t.photo) && (
                  <>
                    <div aria-hidden className="pointer-events-none absolute inset-0 scale-125 blur-2xl">
                      <Photo photo={t.photo} sizes="240px" grade={false} className="absolute inset-0 h-full w-full" />
                    </div>
                    <div aria-hidden className="pointer-events-none absolute inset-0 bg-black/55" />
                  </>
                )}
                {/* The words stand on their own ground at the left, the picture keeps the face clear at the right. */}
                <figure className={cn("flex min-w-0 flex-col justify-center gap-4 px-9 py-8 anim-fade", tone.text, style === "studio" ? "pointer-events-none absolute inset-0 z-10 [&_a]:pointer-events-auto" : cn("relative flex-1", style === "natural" && isWide(t.photo) && "max-w-[50%]"))} style={{ animationDelay: "380ms" }}>
                  <Quote aria-hidden className={cn("size-7", tone.mark)} strokeWidth={1.5} />
                  <blockquote className={cn("font-display font-medium tracking-[-0.018em] text-balance", style === "studio" && "max-w-[29rem]", rowQuoteSize())}>{t.quote}</blockquote>
                  <figcaption className="grid gap-1">
                    <span className="text-[1.4rem] leading-tight font-semibold">
                      {t.firstName}
                      {t.age !== undefined && <span className={cn("font-normal", tone.sub)}>, {t.age}</span>}
                    </span>
                    {t.groups.length > 0 && <span className={cn("text-[1rem]", tone.faint)}>{t.groups.join(" · ")}</span>}
                    {t.example && (
                      <span>
                        <Status tone="warning">Eksempel</Status>
                      </span>
                    )}
                    {t.href && (
                      <Link href={t.href} className={cn("group mt-3 inline-flex h-10 w-fit items-center gap-2 rounded-[var(--radius-button)] px-[18px] t-small font-medium transition-colors", tone.link)}>
                        Les mer om {t.firstName}
                        <HoverArrow />
                      </Link>
                    )}
                  </figcaption>
                </figure>
                {!(style === "natural" && isWide(t.photo)) && (
                <div
                  className="relative shrink-0"
                  style={{
                    width: `${ROW_REM * shapeOf(t.photo)}rem`,
                    // A studio picture on white is pushed a fifth of its width out past the card's right edge (the card clips it) and the words, set across the whole card, run a little over its edge.
                    ...(style === "studio" ? { marginRight: `${-0.2 * ROW_REM * shapeOf(t.photo)}rem`, marginLeft: "auto" } : { maxWidth: "62%" }),
                    // The sharp picture melts into the blurred one at its left edge.
                    ...(style === "natural" ? { maskImage: "linear-gradient(to right, transparent, black 22%)", WebkitMaskImage: "linear-gradient(to right, transparent, black 22%)" } : {}),
                  }}
                >
                  {picture}
                </div>
                )}
              </div>
            ) : (
              <>
                <div className="relative min-h-0 flex-1">{picture}</div>
                <button
                  type="button"
                  onClick={() => onPick(i)}
                  aria-label={`Vis sitatet fra ${t.firstName}`}
                  className="absolute inset-0 cursor-pointer bg-black/25 transition-colors duration-200 hover:bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white"
                />
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function QuoteCard({ items, index, go }: { items: TestimonialView[]; index: number; go: (i: number) => void }) {
  // On a phone the buttons sit far below the picture, so the card is swiped too: a mostly sideways drag of 50 px or more.
  const start = useRef<{ x: number; y: number } | null>(null);
  const swipe = (e: React.TouchEvent) => {
    const from = start.current;
    start.current = null;
    const end = e.changedTouches[0];
    if (!from || !end || items.length < 2) return;
    const dx = end.clientX - from.x;
    const dy = end.clientY - from.y;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(dy) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  return (
    <div
      className="touch-pan-y"
      onTouchStart={(e) => (start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={swipe}
      onTouchCancel={() => (start.current = null)}
    >
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
                <div className={cn("relative order-first overflow-hidden lg:order-last lg:aspect-auto lg:min-h-[24rem]", t.photo && inRight(t.photo, t.cardStyle) !== t.photo ? "aspect-[5/4]" : "aspect-[16/9]")}>
                  <div className="absolute inset-0">
                    {t.photo ? (
                      <Photo photo={inRight(t.photo, t.cardStyle)} ratio={t.photo && inRight(t.photo, t.cardStyle) !== t.photo ? 5 / 4 : 16 / 9} sizes="(min-width: 1024px) 560px, 100vw" className="absolute inset-0 h-full w-full" />
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
                  <Quote aria-hidden className="-mb-2 size-9 fill-[var(--club-link)] stroke-[var(--club-link)] sm:size-11" strokeWidth={1.5} />
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
                      <Link href={t.href} className="group mt-3 inline-flex h-10 w-fit items-center gap-2 rounded-[var(--radius-button)] bg-action px-[18px] t-small font-medium text-on-action transition-colors hover:bg-action-hover">
                        Les mer om {t.firstName}
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
