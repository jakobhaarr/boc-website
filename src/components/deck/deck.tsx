"use client";

import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface DeckSlide {
  id: string;
  /** Ground of the slide: the club's dark header colour, paper, or the club's yellow. */
  tone: "dark" | "light" | "brand";
  /** What the slide says, for the counter's title and screen readers. */
  title: string;
  content: ReactNode;
}

const W = 1600;
const H = 900;

/**
 * A 16:9 presentation in the browser. Every slide is laid out on a fixed
 * 1600 × 900 stage and scaled to fit the window, so it reads the same on a
 * laptop, a projector and a phone turned sideways.
 *
 * Moving: → / space / page down and ← / page up, Home and End, a click on the
 * right or left third of the slide, or a swipe. F toggles full screen. The
 * slide number is in the address (#3), so a link can open on a given slide
 * and reloading keeps your place.
 */
export function Deck({ slides, title }: { slides: DeckSlide[]; title: string }) {
  const [index, setIndex] = useState(0);
  const [scale, setScale] = useState(1);
  // The address is only written once it has been read, or the first render's
  // «#1» would overwrite the slide a link asked for.
  const [synced, setSynced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);

  const go = useCallback((next: number) => setIndex(Math.max(0, Math.min(slides.length - 1, next))), [slides.length]);

  // Follow the address: on load, and when someone changes the number in it.
  useEffect(() => {
    const read = () => {
      const fromHash = Number(window.location.hash.slice(1));
      if (fromHash >= 1 && fromHash <= slides.length) setIndex(fromHash - 1);
      setSynced(true);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [slides.length]);

  useEffect(() => {
    if (synced && window.location.hash !== `#${index + 1}`) window.history.replaceState(null, "", `#${index + 1}`);
  }, [index, synced]);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / W, window.innerHeight / H));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void root.current?.requestFullscreen();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) go(index + 1);
      else if (["ArrowLeft", "PageUp"].includes(e.key)) go(index - 1);
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(slides.length - 1);
      else if (e.key === "f" || e.key === "F") fullscreen();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go, fullscreen, slides.length]);

  const slide = slides[index];
  const nav =
    "flex size-11 items-center justify-center rounded-md bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition-[background-color,opacity] hover:bg-white/20 disabled:opacity-30";

  return (
    <div
      ref={root}
      className="fixed inset-0 overflow-hidden bg-black"
      onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const dx = e.changedTouches[0].clientX - touch.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touch.current = null;
      }}
    >
      <h1 className="sr-only">{title}</h1>
      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}
      >
        <section
          key={slide.id}
          aria-roledescription="lysbilde"
          aria-label={`${index + 1} av ${slides.length}: ${slide.title}`}
          className={cn(
            "deck-slide anim-fade relative size-full overflow-hidden",
            slide.tone === "dark" && "page-dark",
            slide.tone === "light" && "bg-bg text-ink",
            slide.tone === "brand" && "bg-club-surface text-on-club",
          )}
        >
          {slide.content}
          {/* Click zones: the left third goes back, the right third forward. */}
          <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize" onClick={() => go(index - 1)} />
          <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize" onClick={() => go(index + 1)} />
        </section>
      </div>

      {/* Progress along the top edge of the window */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-white/10">
        <div className="h-full bg-[var(--club-primary)] transition-[width] duration-300" style={{ width: `${((index + 1) / slides.length) * 100}%` }} />
      </div>

      <div className="absolute right-4 bottom-4 flex items-center gap-2">
        <span aria-live="polite" className="mr-2 rounded-md bg-black/40 px-2.5 py-1.5 text-[13px] font-medium text-white tabular-nums backdrop-blur-md">
          {index + 1} / {slides.length}
        </span>
        <button type="button" className={nav} onClick={() => go(index - 1)} disabled={index === 0} aria-label="Forrige lysbilde">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" className={nav} onClick={() => go(index + 1)} disabled={index === slides.length - 1} aria-label="Neste lysbilde">
          <ChevronRight className="size-5" />
        </button>
        <button type="button" className={nav} onClick={fullscreen} aria-label="Fullskjerm (F)">
          <Maximize2 className="size-4" />
        </button>
      </div>
    </div>
  );
}
