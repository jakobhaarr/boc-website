"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";

/** Height of one age in the list, and how many show at once (odd, so one sits in the middle). */
const ROW = 44;
const VISIBLE = 5;
/**
 * The list is drawn as a drum seen from the front. A row `d` rows from the middle sits at angle d × WHEEL_STEP on a cylinder of the
 * radius that keeps the next row exactly one ROW away: its height on screen is R·sin(angle), so rows further out crowd towards the
 * middle, and it is turned by the same angle about the horizontal axis, so it leans away at the top and bottom. Only the look changes,
 * and only on the label inside each row: the row itself stays untransformed, since scroll-snap measures a row's transformed box and
 * would otherwise snap to, and pull the list towards, the wrong places.
 */
const WHEEL_STEP = 28;
const WHEEL_RADIUS = ROW / Math.sin((WHEEL_STEP * Math.PI) / 180);
const PERSPECTIVE = 380;

/**
 * An age picked by scrolling: a vertical list that snaps so one age rests in
 * the middle, as a phone's own pickers do.
 *
 * Scroll (touch, wheel or trackpad) picks; the value follows the scroll
 * position, rounded to the nearest row. Everything else sets the value and the
 * list scrolls to it:
 *   - ArrowDown/ArrowRight and ArrowUp/ArrowLeft move one age (down is older,
 *     as the list reads), PageDown/PageUp five, Home/End the ends;
 *   - digits type an age (two digits at most, within the range);
 *   - a tap on a row, and the − and + buttons from sm (a phone has the scroll).
 * The list itself is hidden from assistive technology; the wrapper is a
 * spinbutton with the value as its text, so a screen reader hears «20 år» and
 * nothing else.
 */
export function AgePicker({
  value,
  min,
  max,
  onChange,
  describedBy,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (age: number) => void;
  describedBy?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  /** True while our own animation scrolls the list; its scroll events are not the person scrolling. Cleared when the scrolling has been quiet. */
  const animating = useRef(false);
  const quiet = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** The age the person's own scroll just set, so the effect below does not scroll the list to a place it already is (a feedback loop). */
  const fromScroll = useRef<number | null>(null);
  const placed = useRef(false);
  const typed = useRef({ text: "", at: 0 });
  const list = useRef<HTMLDivElement>(null);

  /* Lay the rows around the drum for a scroll position (in rows, fractional, so it moves smoothly between two ages). Only the few rows
     near the middle are in view; the others keep whatever they had and are laid out when they come near. Written to the DOM directly,
     once per scroll event, since React would re-render 75 rows for it. */
  const wheel = (scrollTop: number) => {
    const rows = list.current?.children;
    if (!rows) return;
    const centre = scrollTop / ROW;
    for (let i = Math.max(0, Math.floor(centre) - 4); i <= Math.min(rows.length - 1, Math.ceil(centre) + 4); i++) {
      const d = i - centre;
      const angle = Math.max(-80, Math.min(80, d * WHEEL_STEP));
      const rad = (angle * Math.PI) / 180;
      const lift = WHEEL_RADIUS * Math.sin(rad) - d * ROW; // how far this row is pulled towards the middle, in px
      const row = rows[i].firstElementChild as HTMLElement; // the label, not the row: a transformed row would move its own snap point
      row.style.transform = `perspective(${PERSPECTIVE}px) translateY(${lift.toFixed(1)}px) rotateX(${(-angle).toFixed(1)}deg)`;
      row.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 0.25).toFixed(2));
    }
  };

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const ages = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  // Put the list at the value when something other than the person's scroll changed it: instantly the first time, smoothly afterwards.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const own = fromScroll.current === value;
    fromScroll.current = null;
    if (own) return;
    if (!placed.current) {
      placed.current = true;
      el.scrollTo({ top: (value - min) * ROW });
      wheel((value - min) * ROW);
      return;
    }
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    animating.current = !calm;
    // If the list is already there no scroll event comes; this keeps the person's own scrolling from being ignored for good.
    clearTimeout(quiet.current);
    quiet.current = setTimeout(() => (animating.current = false), 600);
    el.scrollTo({ top: (value - min) * ROW, behavior: calm ? "auto" : "smooth" });
  }, [value, min]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    wheel(el.scrollTop);
    if (animating.current) {
      clearTimeout(quiet.current);
      quiet.current = setTimeout(() => (animating.current = false), 150);
      return;
    }
    const next = clamp(min + Math.round(el.scrollTop / ROW));
    if (next === value) return;
    fromScroll.current = next;
    onChange(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const jump: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1, PageDown: 5, PageUp: -5 };
    if (e.key in jump) onChange(clamp(value + jump[e.key]));
    else if (e.key === "Home") onChange(min);
    else if (e.key === "End") onChange(max);
    else if (/^\d$/.test(e.key) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const now = Date.now();
      const text = ((now - typed.current.at > 900 ? "" : typed.current.text) + e.key).slice(-2);
      typed.current = { text, at: now };
      const n = Number(text);
      if (n >= min && n <= max) onChange(n);
    } else return;
    e.preventDefault();
  };

  const step = (by: number) => onChange(clamp(value + by));
  const stepClass =
    "hidden size-11 shrink-0 items-center justify-center rounded-full text-ink-2 shadow-[inset_0_0_0_1px_var(--border-strong)] transition-colors hover:text-ink disabled:opacity-40 sm:flex";

  return (
    <div className="flex w-full items-center justify-center gap-4">
      <button type="button" tabIndex={-1} aria-label="Ett år yngre" disabled={value <= min} onClick={() => step(-1)} className={stepClass}>
        <Minus aria-hidden className="size-4" />
      </button>
      <div className="relative w-full max-w-[15rem]">
        {/* The resting place: the row in the middle, in the club's tint, since the picker always holds a chosen age. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 h-11 -translate-y-1/2 rounded-[var(--radius-button)] border border-club-2 bg-[color-mix(in_srgb,var(--club-primary)_28%,var(--club-tint))]"
        />
        <div
          ref={scroller}
          role="spinbutton"
          tabIndex={0}
          aria-label="Alder"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={`${value} år`}
          aria-describedby={describedBy}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          style={{ height: ROW * VISIBLE, maskImage: "linear-gradient(transparent, black 15%, black 85%, transparent)", WebkitMaskImage: "linear-gradient(transparent, black 15%, black 85%, transparent)" }}
          className="relative snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-[var(--radius-button)] outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-club-2/50 [&::-webkit-scrollbar]:hidden"
        >
          <div ref={list} aria-hidden style={{ paddingBlock: ROW * ((VISIBLE - 1) / 2) }}>
            {ages.map((n) => {
              const away = Math.abs(n - value);
              return (
                <div
                  key={n}
                  onClick={() => onChange(n)}
                  style={{ height: ROW }}
                  className={cn(
                    "flex cursor-pointer snap-center items-center justify-center text-[19px] tabular-nums transition-colors duration-150",
                    away === 0 ? "font-semibold tracking-[-0.014em] text-ink" : away === 1 ? "text-ink-2" : "text-ink-3",
                  )}
                >
                  <span className="block">{away === 0 ? `${n} år` : n}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <button type="button" tabIndex={-1} aria-label="Ett år eldre" disabled={value >= max} onClick={() => step(1)} className={stepClass}>
        <Plus aria-hidden className="size-4" />
      </button>
    </div>
  );
}
