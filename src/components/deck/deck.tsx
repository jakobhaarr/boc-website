"use client";

import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from "lucide-react";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

export interface DeckSlide {
  id: string;
  /** Ground of the slide: the club's dark header colour, paper, or the club's yellow. */
  tone: "dark" | "light" | "brand";
  /** What the slide says, for the counter's title and screen readers. */
  title: string;
  content: ReactNode;
  /**
   * How many steps the slide is built in (default 1). Forward moves through
   * the steps before the next slide, back moves through them before the
   * previous one. The slide's content reads the current step with useDeckStep().
   */
  steps?: number;
  /** The step the slide is printed at in the PDF, where there is no moving through steps (default 0). */
  printStep?: number;
}

const StepContext = createContext(0);

/** The step the current slide is on, counted from 0. Only meaningful inside a slide's content. */
export const useDeckStep = () => useContext(StepContext);

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
 *
 * Full screen on a phone is landscape. Where the browser can lock the
 * orientation (Chrome on Android, in full screen) it does; where it cannot (an
 * iPhone has no full screen for a page, and no lock) the deck fills the screen
 * itself and, if the phone is held upright, turns the whole deck a quarter
 * turn, so it is read with the phone on its side either way.
 */
/** Gives the orientation back after a lock; a browser without the lock API, or with nothing locked, just does nothing. */
function unlockOrientation() {
  try {
    screen.orientation?.unlock?.();
  } catch {
    // Nothing was locked.
  }
}

export function Deck({ slides, title, pdfHref }: { slides: DeckSlide[]; title: string; pdfHref?: string }) {
  const [index, setIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [view, setView] = useState({ w: W, h: H });
  // Full screen: the browser's own, or (where there is none) the deck filling the screen by itself.
  const [full, setFull] = useState(false);
  const [phone, setPhone] = useState(false);
  // The address is only written once it has been read, or the first render's
  // «#1» would overwrite the slide a link asked for.
  const [synced, setSynced] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);

  const go = useCallback(
    (next: number) => {
      setIndex(Math.max(0, Math.min(slides.length - 1, next)));
      setStep(0);
    },
    [slides.length],
  );
  const stepsOf = (i: number) => slides[i].steps ?? 1;
  // Forward and back go through a slide's steps first; back into a built slide lands on its last step.
  const forward = useCallback(() => {
    if (step < (slides[index].steps ?? 1) - 1) setStep(step + 1);
    else if (index < slides.length - 1) go(index + 1);
  }, [step, index, slides, go]);
  const backward = useCallback(() => {
    if (step > 0) setStep(step - 1);
    else if (index > 0) {
      setIndex(index - 1);
      setStep((slides[index - 1].steps ?? 1) - 1);
    }
  }, [step, index, slides]);

  // Follow the address: on load, and when someone changes the number in it.
  useEffect(() => {
    const read = () => {
      const fromHash = Number(window.location.hash.slice(1));
      if (fromHash >= 1 && fromHash <= slides.length) {
        setIndex(fromHash - 1);
        setStep(0);
      }
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
    const fit = () => {
      setView({ w: window.innerWidth, h: window.innerHeight });
      setPhone(window.matchMedia("(pointer: coarse)").matches && Math.min(window.innerWidth, window.innerHeight) < 600);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Leaving the browser's full screen (the back gesture, Esc) leaves the deck's too, and gives the orientation back.
  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        setFull(false);
        unlockOrientation();
      }
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const fullscreen = useCallback(async () => {
    if (full) {
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => {});
      unlockOrientation();
      setFull(false);
      return;
    }
    setFull(true);
    const el = root.current;
    if (el?.requestFullscreen) {
      try {
        await el.requestFullscreen();
        // Held upright, the phone is turned on its side; only works in full screen, and not on every browser.
        await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.("landscape").catch(() => {});
      } catch {
        // The deck still fills the screen by itself.
      }
    }
  }, [full]);

  // Esc leaves the deck's own full screen (the browser's has its own Esc).
  useEffect(() => {
    if (!full) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) setFull(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [full]);

  // A phone held upright in full screen: the whole deck is turned a quarter turn, to be read on its side.
  const turned = full && phone && view.h > view.w;
  const [vw, vh] = turned ? [view.h, view.w] : [view.w, view.h];
  const scale = Math.min(vw / W, vh / H);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (["ArrowRight", "PageDown", " "].includes(e.key)) forward();
      else if (["ArrowLeft", "PageUp"].includes(e.key)) backward();
      else if (e.key === "Home") go(0);
      else if (e.key === "End") go(slides.length - 1);
      else if (e.key === "f" || e.key === "F") void fullscreen();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [forward, backward, go, fullscreen, slides.length]);

  const slide = slides[index];
  const nav =
    "flex size-11 items-center justify-center rounded-md bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-md transition-[background-color,opacity] hover:bg-white/20 disabled:opacity-30";

  return (
    <div
      ref={root}
      className="fixed inset-0 overflow-hidden bg-black"
      // A swipe along the deck's own sideways axis: along the screen's vertical one when the deck is turned.
      onTouchStart={(e) => (touch.current = turned ? e.touches[0].clientY : e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touch.current === null) return;
        const d = (turned ? e.changedTouches[0].clientY : e.changedTouches[0].clientX) - touch.current;
        if (Math.abs(d) > 40) (d < 0 ? forward : backward)();
        touch.current = null;
      }}
    >
      <h1 className="sr-only">{title}</h1>
      <div
        className="absolute"
        style={turned ? { top: "50%", left: "50%", width: vw, height: vh, transform: "translate(-50%, -50%) rotate(90deg)" } : { inset: 0 }}
      >
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
          <StepContext.Provider value={step}>{slide.content}</StepContext.Provider>
          {/* Click zones: the left third goes back, the right third forward. */}
          <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 left-0 w-1/3 cursor-w-resize" onClick={backward} />
          <button type="button" tabIndex={-1} aria-hidden className="absolute inset-y-0 right-0 w-1/3 cursor-e-resize" onClick={forward} />
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
        <button type="button" className={nav} onClick={backward} disabled={index === 0 && step === 0} aria-label="Forrige lysbilde">
          <ChevronLeft className="size-5" />
        </button>
        <button type="button" className={nav} onClick={forward} disabled={index === slides.length - 1 && step >= stepsOf(index) - 1} aria-label="Neste lysbilde">
          <ChevronRight className="size-5" />
        </button>
        {pdfHref && (
          <a href={pdfHref} download className={nav} aria-label="Last ned som PDF" title="Last ned som PDF">
            <Download className="size-4" />
          </a>
        )}
        <button type="button" className={nav} onClick={() => void fullscreen()} aria-label={full ? "Avslutt fullskjerm (F)" : "Fullskjerm (F)"}>
          {full ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        </button>
      </div>
      </div>
    </div>
  );
}

/**
 * The deck as it is printed to PDF: every slide on its own 1600 × 900 page, in
 * order, each at its `printStep` (the end state of a slide built in steps).
 * Opened at /user-experience?pdf and saved with the browser's print, or by
 * scripts/make-pdf.sh, which is what the download link serves.
 */
export function PrintDeck({ slides, title }: { slides: DeckSlide[]; title: string }) {
  return (
    <div className="deck-print bg-black">
      <style>{`
        @page { size: ${W}px ${H}px; margin: 0; }
        html, body { margin: 0; background: #000; }
        .deck-print * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .deck-print section { break-after: page; page-break-after: always; }
        .deck-print section:last-child { break-after: auto; page-break-after: auto; }
        .deck-print .anim-fade { animation: none !important; }
      `}</style>
      <h1 className="sr-only">{title}</h1>
      {slides.map((slide) => (
        <section
          key={slide.id}
          aria-label={slide.title}
          style={{ width: W, height: H }}
          className={cn(
            "deck-slide relative overflow-hidden",
            slide.tone === "dark" && "page-dark",
            slide.tone === "light" && "bg-bg text-ink",
            slide.tone === "brand" && "bg-club-surface text-on-club",
          )}
        >
          <StepContext.Provider value={slide.printStep ?? 0}>{slide.content}</StepContext.Provider>
        </section>
      ))}
    </div>
  );
}
