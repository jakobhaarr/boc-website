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
/** With only a few quotes the closed ones are wider, so the open card is not left too broad for its words and picture. */
const FEW_REM: Record<number, number[]> = { 2: [0, 20], 3: [0, 13, 9] };
const stripWidth = (distance: number, count: number) => {
  const rem = FEW_REM[count] ?? STRIP_REM;
  const width = rem[Math.min(distance, rem.length - 1)];
  // With many quotes the closed ones narrow further, or they would take most of the row from the open card.
  return count > 5 ? Math.max(1.25, width * Math.max(0.5, 5 / count)) : width;
};

/** The size of the quote on the open card of the row: 1.5 rem, a step down for the longest ones so they do not fill the card (a quote is at most 280 characters). */
const rowQuoteSize = (text: string) =>
  text.length <= 110
    ? "text-[2.1rem] leading-[1.15]"
    : text.length <= 160
      ? "text-[1.9rem] leading-[1.18]"
      : text.length <= 210
        ? "text-[1.7rem] leading-[1.2]"
        : text.length <= 260
          ? "text-[1.55rem] leading-[1.22]"
          : "text-[1.45rem] leading-[1.25]";

type Tone = { ground: string; text: string; sub: string; faint: string; mark: string; link: string };

const WHITE_TEXT = { text: "text-white", sub: "text-white/80", faint: "text-white/65", mark: "fill-white stroke-white", link: "bg-white text-[#0b1315] hover:bg-white/90" };

/**
 * The ground the words stand on, by the person's card style (Person.cardStyle, chosen in admin, else the portrait's own): «studio» is a
 * white card (a dark one in dark mode, the cut-out portrait standing on it), «natural» a dark ground under a blurred enlargement of the
 * photo itself (QuoteRow), and the default «color» a plain ground rotating black, the club's teal (its colour on
 * yellow) and light grey by place in the row. Each carries its own text colours so the words read on it.
 */
// The white studio card: its colours are in globals.css (.studio-*), white by day and dark in the site's dark mode.
const STUDIO: Tone = { ground: "studio-ground", text: "studio-text", sub: "studio-sub", faint: "studio-faint", mark: "studio-mark", link: "studio-link" };
const NATURAL: Tone = { ground: "bg-[#0b1315]", ...WHITE_TEXT };
const COLORS: Tone[] = [
  { ground: "bg-[#0b1315]", ...WHITE_TEXT },
  { ground: "bg-[var(--club-on-primary)]", text: "text-white", sub: "text-white/85", faint: "text-white/70", mark: "fill-white stroke-white", link: "bg-white text-[#0b1315] hover:bg-white/90" },
  { ground: "bg-[#e6e9ed]", text: "text-[#0b1315]", sub: "text-[#0b1315]/80", faint: "text-[#0b1315]/60", mark: "fill-[var(--club-on-primary)] stroke-[var(--club-on-primary)]", link: "bg-[#0b1315] text-white hover:bg-black" },
];
/** A natural photo this wide has room for the words in itself: it fills the card, subject at the right. */
const isWide = (photo?: { width: number; height: number }) => !!photo && photo.width / photo.height >= 1.5;
/**
 * In the wide card (mobile, and a single quote) a wide natural photo is shown as its right half, where the person is, in the square frame every card has (so the card does not change height when paged, and there is room to come close),
 * since its left half is room for words that the card sets beside the picture instead.
 */
/** A wide natural photo has its person at the right: wherever it is cut narrow, the cut is taken from the right side (focal point at 78 % or further right). */
const subjectRight = (photo: PhotoRecord, style?: string): PhotoRecord => (style === "natural" && isWide(photo) ? { ...photo, focal: { ...photo.focal, x: Math.max(photo.focal.x, 78) } } : photo);
const inRight = (photo: PhotoRecord, style?: string): PhotoRecord => (style === "natural" && isWide(photo) ? { ...subjectRight(photo, style), zoom: Math.max(photo.zoom ?? 1, 1.4) } : photo);

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
        const width = stripWidth(Math.abs(i - index), items.length);
        const style = t.cardStyle;
        const tone = toneOf(style, i);
        const picture = t.photo ? (
          <Photo photo={subjectRight(t.photo, style)} ratio={open ? shapeOf(t.photo) : 4 / 5} sizes={open ? "(min-width: 1024px) 800px, 100vw" : "240px"} className={cn("absolute inset-0 h-full w-full", style === "studio" && "!bg-transparent")} />
        ) : (
          <Lagoon deep className="absolute inset-0" />
        );
        // A closed card's picture is laid out once, at a fixed width, and the card only clips it: the picture is not
        // rescaled frame by frame while the cards open and close, which is what made the row stutter.
        const stripPicture = t.photo ? (
          <Photo photo={subjectRight(t.photo, style)} ratio={4 / 5} sizes="240px" className="absolute inset-0 h-full w-full" />
        ) : (
          <Lagoon deep className="absolute inset-0" />
        );
        return (
          <li
            key={t.id}
            style={open ? { flex: "1 1 0%" } : { flex: `0 0 ${width}rem` }}
            className={cn(
              "relative flex min-w-0 flex-col overflow-hidden rounded-xl [container-type:inline-size] transition-[flex] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
              open ? tone.ground : "bg-inverse",
            )}
          >
            {open ? (
              <div className="relative flex min-h-0 flex-1">
                {/* A wide natural photo fills the card, a lightening of its left side keeping the words readable; a narrower one gets a blurred, darkened enlargement of itself to stand on. */}
                {style === "natural" && t.photo && isWide(t.photo) && (
                  <div className="anim-fade pointer-events-none absolute inset-0" style={{ animationDelay: "250ms" }}>
                    <Photo photo={subjectRight(t.photo, style)} sizes="(min-width: 1024px) 1100px, 100vw" className="absolute inset-0 h-full w-full" />
                    <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent to-85%" />
                  </div>
                )}
                {style === "natural" && t.photo && !isWide(t.photo) && (
                  <div className="anim-fade pointer-events-none absolute inset-0" style={{ animationDelay: "250ms" }}>
                    <div aria-hidden className="absolute inset-0 scale-125 blur-2xl">
                      <Photo photo={t.photo} sizes="240px" grade={false} className="absolute inset-0 h-full w-full" />
                    </div>
                    <div aria-hidden className="absolute inset-0 bg-black/55" />
                  </div>
                )}
                {/* The words stand on their own ground at the left, the picture keeps the face clear at the right. */}
                <figure className={cn("flex min-w-0 flex-col justify-center gap-4 py-8 anim-fade", tone.text, style === "studio" ? "pointer-events-none absolute inset-0 z-10 [&_a]:pointer-events-auto" : cn("relative flex-1", style === "natural" && isWide(t.photo) && "max-w-[64%]"))} style={{ animationDelay: "380ms", paddingInline: "clamp(1.5rem, 9cqw, 4.5rem)" }}>
                  <Quote aria-hidden className={cn("size-7", tone.mark)} strokeWidth={1.5} />
                  <blockquote className={cn("font-display font-medium tracking-[-0.018em] text-balance", style === "studio" && "max-w-[31rem]", rowQuoteSize(t.quote))}>{t.quote}</blockquote>
                  <figcaption className="grid gap-1">
                    <span className="text-[1.3rem] leading-tight font-semibold">
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
                  className="anim-fade relative shrink-0"
                  style={{
                    animationDelay: "250ms",
                    // The picture never takes more than about half of the card, which matters when many quotes have narrowed it.
                    width: style === "studio" ? `${ROW_REM * shapeOf(t.photo)}rem` : `min(${ROW_REM * shapeOf(t.photo)}rem, 52cqw)`,
                    // A studio picture on white is pushed a fifth of its width out past the card's right edge (the card clips it) and the words, set across the whole card, run a little over its edge.
                    ...(style === "studio" ? { marginRight: `${-0.2 * ROW_REM * shapeOf(t.photo)}rem`, marginLeft: "auto" } : {}),
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
                <div className="relative min-h-0 flex-1">
                  <div className="absolute inset-y-0 left-1/2 w-[max(25.6rem,100%)] -translate-x-1/2">{stripPicture}</div>
                </div>
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
  // On a phone the buttons sit far below the picture, so the card is dragged too, a little like a card in a pile: it
  // follows the finger and the next one shows beneath it, but nothing leaves the pile. Let go past a quarter of the
  // width (or with a quick flick) and it slides off and the card beneath takes its place; short of that it springs back.
  const n = items.length;
  const [drag, setDrag] = useState<{ dx: number; moving: boolean; leaving: 1 | -1 | 0 }>({ dx: 0, moving: false, leaving: 0 });
  const gesture = useRef<{ x: number; y: number; t: number; width: number; locked: boolean; id: number } | null>(null);
  const justDragged = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const down = (e: React.PointerEvent<HTMLDivElement>) => {
    if (n < 2 || drag.leaving !== 0 || (e.pointerType === "mouse" && e.button !== 0)) return;
    gesture.current = { x: e.clientX, y: e.clientY, t: e.timeStamp, width: e.currentTarget.getBoundingClientRect().width, locked: false, id: e.pointerId };
  };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.locked) {
      // Wait to see which way it goes: sideways takes the card, up or down is the page scrolling.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;
        return;
      }
      g.locked = true;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // No capture for a pointer the browser does not know: the drag still follows the events it gets.
      }
    }
    setDrag({ dx, moving: true, leaving: 0 });
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g || !g.locked) return;
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 0);
    const dx = e.clientX - g.x;
    const speed = Math.abs(dx) / Math.max(1, e.timeStamp - g.t);
    if (Math.abs(dx) > g.width * 0.25 || (Math.abs(dx) > 30 && speed > 0.5)) {
      const dir = dx < 0 ? 1 : -1;
      setDrag({ dx: -dir * g.width * 1.2, moving: false, leaving: dir });
      timer.current = setTimeout(() => {
        go(index + dir);
        setDrag({ dx: 0, moving: false, leaving: 0 });
      }, 240);
    } else {
      setDrag({ dx: 0, moving: false, leaving: 0 });
    }
  };
  const cancel = () => {
    gesture.current = null;
    if (drag.leaving === 0) setDrag({ dx: 0, moving: false, leaving: 0 });
  };
  // The card beneath: the next when dragging left, the previous when dragging right.
  const beneath = drag.leaving !== 0 ? (index + drag.leaving + n) % n : drag.dx !== 0 ? (index + (drag.dx < 0 ? 1 : -1) + n) % n : -1;
  const progress = Math.min(1, Math.abs(drag.dx) / 320);

  return (
    <div
      // Each card has its own edge (rounded, ringed), so a dragged one is not cut off by a box around the stack; it is only the page's width that clips it.
      className="-mx-[var(--page-gutter)] touch-pan-y overflow-x-clip px-[var(--page-gutter)]"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={cancel}
      onClickCapture={(e) => {
        // A drag that ends over the link is not a click on it.
        if (justDragged.current) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="relative">
        <ul aria-label="Sitater fra medlemmer" className="grid">
          {items.map((t, i) => {
            const active = i === index;
            return (
              <li
                key={t.id}
                aria-hidden={!active}
                inert={!active}
                className={cn(
                  "col-start-1 row-start-1 grid overflow-hidden rounded-xl bg-surface ring-1 ring-line lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
                  active ? "z-10 opacity-100" : "pointer-events-none opacity-0",
                  i === beneath && "!opacity-100",
                  !drag.moving && "transition-[opacity,transform,box-shadow] duration-300",
                )}
                style={
                  active && drag.dx !== 0
                    ? { transform: `translateX(${drag.dx}px) rotate(${(drag.dx / 320) * 4}deg)`, boxShadow: "0 22px 40px -12px rgb(0 0 0 / 0.45), 0 8px 16px -8px rgb(0 0 0 / 0.25)", transitionDuration: drag.leaving ? "240ms" : undefined }
                    : i === beneath
                      ? { transform: `scale(${0.94 + 0.06 * (drag.leaving ? 1 : progress)})`, boxShadow: "0 10px 24px -12px rgb(0 0 0 / 0.3)" }
                      : undefined
                }
              >
                {/* Below lg the picture is a strip on top and the text follows it. */}
                <div className="relative order-first aspect-square overflow-hidden lg:order-last lg:aspect-auto lg:min-h-[24rem] lg:overflow-visible">
                  {/* From lg the picture reaches 12 rem to the left of its column, under the surface below, so the slanted edge cuts through the whole of it and the column's own straight edge never shows at the foot. */}
                  <div className="absolute inset-0 lg:left-[-12rem]">
                    {t.photo ? (
                      <Photo photo={inRight(t.photo, t.cardStyle)} ratio={1} sizes="(min-width: 1024px) 560px, 100vw" className="absolute inset-0 h-full w-full" />
                    ) : (
                      <Lagoon deep className="absolute inset-0" />
                    )}
                  </div>
                  {/* On a phone the name and age stand on the picture, as on a dating card, over a shade at its foot. */}
                  <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent lg:hidden" />
                  <p className="absolute inset-x-0 bottom-0 px-5 pb-4 text-[1.75rem] leading-none font-semibold text-white [text-shadow:0_1px_8px_rgb(0_0_0/0.35)] lg:hidden">
                    {t.firstName}
                    {t.age !== undefined && <span className="font-normal text-white/90">, {t.age}</span>}
                  </p>
                  {/* The surface leans into the picture; skewed about its middle, so the angle holds at any height. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-[-20rem] hidden w-[calc(20rem+4.5rem)] bg-surface lg:block"
                    style={{ transform: "skewX(-21.25deg)" }}
                  />
                </div>

                <figure className={cn("relative z-10 flex flex-col justify-center gap-6 p-6 sm:p-10 lg:py-14 lg:pr-4 lg:pl-14", items.length > 1 && "lg:pb-24")}>
                  {/* A quotation mark says it is a quote, so the words themselves carry no «». */}
                  <Quote aria-hidden className="-mb-2 size-9 fill-[var(--club-link)] stroke-[var(--club-link)] sm:size-11" strokeWidth={1.5} />
                  <blockquote className={cn("font-display font-medium tracking-[-0.018em] text-balance text-ink", quoteSize(t.quote))}>{t.quote}</blockquote>
                  <figcaption className="grid gap-1">
                    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 t-body-lg font-semibold text-ink">
                      <span className="max-lg:hidden">
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
                      <Link href={t.href} className="group mt-3 inline-flex h-10 w-fit items-center gap-2 rounded-[var(--radius-button)] bg-action px-[18px] t-small font-medium text-on-action transition-colors hover:bg-action-hover max-sm:h-[3.25rem] max-sm:w-full max-sm:justify-center max-sm:text-[16px]">
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
          <div className="mt-4 flex items-center gap-4">
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
