"use client";

import { Info } from "lucide-react";
import Link from "next/link";
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import type { GlossaryEntry } from "@/lib/glossary";

const GlossaryContext = createContext<GlossaryEntry[]>([]);

/** The club's glossary (lib/glossary.ts), set once in the public layout. */
export function GlossaryProvider({ entries, children }: { entries: GlossaryEntry[]; children: ReactNode }) {
  return <GlossaryContext.Provider value={entries}>{children}</GlossaryContext.Provider>;
}

/**
 * Running text with the club's glossary terms marked: the first time each
 * term appears it gets a dotted underline and an «i», and its explanation
 * opens as a tooltip. Everything else is left as plain text.
 */
export function GlossaryText({ text }: { text: string }) {
  const entries = useContext(GlossaryContext);
  if (!entries.length) return text;

  const seen = new Set<string>();
  const parts: ReactNode[] = [];
  let rest = text;
  while (rest) {
    // The earliest match of any term not marked yet.
    let hit: { entry: GlossaryEntry; index: number; match: string } | undefined;
    for (const entry of entries) {
      if (seen.has(entry.id)) continue;
      const m = new RegExp(entry.pattern, "i").exec(rest);
      if (m && (!hit || m.index < hit.index)) hit = { entry, index: m.index, match: m[0] };
    }
    if (!hit) {
      parts.push(rest);
      break;
    }
    seen.add(hit.entry.id);
    if (hit.index) parts.push(rest.slice(0, hit.index));
    parts.push(<Term key={parts.length} entry={hit.entry} label={hit.match} />);
    rest = rest.slice(hit.index + hit.match.length);
  }
  return <>{parts}</>;
}

/**
 * One marked term. Opens on hover (with a short grace period, so the pointer
 * can travel into the tooltip and its link), on keyboard focus and on tap;
 * closes on Escape, on a tap elsewhere and when the pointer leaves. The
 * tooltip is nudged sideways to stay inside the window.
 */
function Term({ entry, label }: { entry: GlossaryEntry; label: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [shift, setShift] = useState(0);
  const wrap = useRef<HTMLSpanElement>(null);
  const tip = useRef<HTMLSpanElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const show = () => {
    window.clearTimeout(timer.current);
    setOpen(true);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: PointerEvent) => !wrap.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !tip.current) return;
    // Measured from where the tooltip sits unshifted, so reopening starts fresh.
    const r = tip.current.getBoundingClientRect();
    const left = r.left - shift;
    const margin = 12;
    setShift(left + r.width > window.innerWidth - margin ? window.innerWidth - margin - (left + r.width) : left < margin ? margin - left : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- measured once per opening
  }, [open]);

  return (
    <span
      ref={wrap}
      className="relative inline"
      onPointerEnter={(e) => e.pointerType === "mouse" && show()}
      onPointerLeave={(e) => e.pointerType === "mouse" && hide()}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => (open ? setOpen(false) : show())}
        onFocus={show}
        onBlur={(e) => !wrap.current?.contains(e.relatedTarget as Node) && hide()}
        className="inline cursor-help text-left underline decoration-current/40 decoration-dotted decoration-1 underline-offset-[3px] transition-colors hover:decoration-current"
      >
        {label}
        <Info aria-hidden className="ml-0.5 inline size-[0.8em] -translate-y-[0.1em] opacity-70" />
      </button>
      {open && (
        <span
          ref={tip}
          id={id}
          role="tooltip"
          style={{ transform: `translateX(${shift}px)` }}
          className="absolute top-full left-0 z-40 mt-2 block w-[min(18rem,calc(100vw-24px))] rounded-lg bg-surface p-4 text-left text-[14px] leading-[1.45] font-normal tracking-normal text-ink-2 normal-case shadow-popover ring-1 ring-line"
        >
          {entry.text}
          {entry.href && (
            <Link href={entry.href} className="mt-2 block font-medium text-club hover:text-club-hover" onClick={() => setOpen(false)}>
              {entry.hrefLabel ?? "Les mer"} ›
            </Link>
          )}
        </span>
      )}
    </span>
  );
}
