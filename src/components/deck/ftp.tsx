"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { WorkoutProfile } from "@/components/deck/workout-chart";
import { cn } from "@/lib/cn";
import { parseBlock, parseSteps, type Segment, type ZwiftWorkout } from "@/lib/data/zwift-workouts";

/**
 * The rider's FTP in watts, typed in once and kept for every workout. It lives
 * in the browser's own storage (this device only, never sent anywhere), because
 * each slide is mounted on its own and the number should follow you from one to
 * the next, and from the deck to the phone page. Without storage it lives in
 * memory for the visit. On the phone page the box is fixed at the top, so there
 * is one FTP for the whole plan and no box per workout.
 */
const KEY = "boc-zwift-ftp";
/** What is taken for an FTP: under 50 W is a slip of the keys, over 600 W is not a rider's. */
const MIN = 50;
const MAX = 600;

const listeners = new Set<() => void>();
let memory: number | null = null;

function read(): number | null {
  try {
    const v = Number(window.localStorage.getItem(KEY));
    return v >= MIN && v <= MAX ? v : null;
  } catch {
    return memory;
  }
}

function write(value: number | null) {
  memory = value;
  try {
    if (value === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, String(value));
  } catch {
    // Storage is blocked: the number lives in memory for this visit.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export const useFtp = () => useSyncExternalStore(subscribe, read, () => null);

/** The input for the FTP: watts, whole numbers. Keys typed here are not the deck's (arrows, space and F move or fill the screen). */
export function FtpInput({ phone = false, label }: { /** The upright phone's page: a full-width row at the size of the page's own type, not the deck stage's. */ phone?: boolean; label?: string }) {
  const ftp = useFtp();
  const [draft, setDraft] = useState("");
  // The number from another slide (or tab) fills the box; what is being typed is left alone until it is a valid number of its own.
  useEffect(() => {
    if (ftp !== null && Number(draft) !== ftp) setDraft(String(ftp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ftp]);

  return (
    <label className={cn("relative z-10 flex items-center gap-4 text-ink-2", phone ? "w-full justify-between text-[17px]" : "shrink-0 text-[22px]")}>
      {label ?? "Skriv inn din FTP"}
      <span className={cn("flex items-center gap-2 rounded-md bg-surface ring-1 ring-line focus-within:ring-2 focus-within:ring-[var(--club-primary)]", phone ? "px-4 py-2.5" : "px-4 py-2")}>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="250"
          value={draft}
          maxLength={3}
          aria-label="Din FTP i watt"
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "").slice(0, 3);
            setDraft(digits);
            const n = Number(digits);
            write(digits && n >= MIN && n <= MAX ? n : null);
          }}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn("bg-transparent text-right font-display leading-none font-medium text-ink outline-none placeholder:text-ink-3 tabular-nums", phone ? "w-[84px] text-[24px]" : "w-[72px] text-[28px]")}
        />
        <span className="text-[20px] text-ink-3">W</span>
      </span>
    </label>
  );
}

/**
 * The profile in watts once an FTP is typed in. On the phone (`compact`) the
 * chart can be pressed or dragged along to pick a block, and a line under it
 * says what the block is (see Readout): the blocks are too narrow there to
 * carry their length and watts in the chart itself.
 */
export function FtpProfile({ workout, compact = false }: { workout: ZwiftWorkout; compact?: boolean }) {
  const ftp = useFtp();
  const [selected, setSelected] = useState<number | null>(null);
  return (
    <>
      <WorkoutProfile workout={workout} ftp={ftp} compact={compact} selected={compact ? selected : null} onSelect={compact ? setSelected : undefined} />
      {compact && <Readout workout={workout} ftp={ftp} selected={selected} />}
    </>
  );
}

const length = (sec: number) => (sec < 60 ? `${sec} s` : `${Math.floor(sec / 60)} min${sec % 60 ? ` ${sec % 60} s` : ""}`);
const clock = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

/** One block in words: «2 min · 90 % · 270 W», a ramp as «5 min · 35 til 55 % · 105 til 165 W», with the cadence where there is one. */
function describe(s: Segment, ftp: number | null) {
  const w = (pct: number) => Math.round(((ftp ?? 0) * pct) / 100);
  const pct = s.from === s.to ? `${s.from} %` : `${s.from} til ${s.to} %`;
  const watts = ftp ? (s.from === s.to ? ` · ${w(s.from)} W` : ` · ${w(s.from)} til ${w(s.to)} W`) : "";
  return `${length(s.sec)} · ${pct}${watts}${s.rpm ? ` · ${s.rpm} rpm` : ""}`;
}

/**
 * Every block of the workout in order, with the minute it starts at: what the
 * profile's labels cannot hold on a phone. Lines the page repeats one after
 * another («2x 2min …», four times over) are written as «4 ×». In watts once an
 * FTP is typed in.
 */
export function BlockList({ workout }: { workout: ZwiftWorkout }) {
  const ftp = useFtp();
  let at = 0;
  const rows: { start: number; line: string; times: number }[] = [];
  for (const line of workout.steps) {
    const last = rows[rows.length - 1];
    if (last && last.line === line) last.times += 1;
    else rows.push({ start: at, line, times: 1 });
    const { count, parts } = parseBlock(line);
    at += count * parts.reduce((sum, p) => sum + p.sec, 0);
  }
  return (
    <details className="group rounded-lg ring-1 ring-line open:bg-surface">
      <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between px-5 text-[17px] font-medium [&::-webkit-details-marker]:hidden">
        Se detaljert oversikt
        <span aria-hidden className="text-ink-3 transition-transform group-open:rotate-45">+</span>
      </summary>
      <ol className="divide-y divide-line border-t border-line">
        {rows.map((r, i) => {
          const { count, parts } = parseBlock(r.line);
          const total = r.times * count;
          return (
            <li key={i} className="flex gap-4 px-5 py-3 text-[16px] leading-[1.35]">
              <span className="w-12 shrink-0 text-ink-3 tabular-nums">{clock(r.start)}</span>
              <span className="min-w-0">
                {total > 1 && <span className="font-semibold text-[var(--club-primary)]">{total} × </span>}
                {parts.map((p, k) => (
                  <span key={k} className="block">
                    {describe(p, ftp)}
                  </span>
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </details>
  );
}

/**
 * What the picked block is, in words: its length, % of FTP and watts, where it
 * starts and ends, and the cadence if the page asks for one. The box keeps its
 * height whether or not a block is picked, so the page does not jump.
 */
function Readout({ workout, ftp, selected }: { workout: ZwiftWorkout; ftp: number | null; selected: number | null }) {
  const segments = parseSteps(workout.steps);
  const s = selected !== null ? segments[selected] : undefined;
  const start = selected !== null ? segments.slice(0, selected).reduce((sum, x) => sum + x.sec, 0) : 0;
  return (
    <div aria-live="polite" className="mt-3 flex min-h-[76px] flex-col justify-center rounded-lg bg-surface px-4 py-3 ring-1 ring-line">
      {s ? (
        <>
          <p className="text-[19px] leading-[1.25] font-semibold">{describe(s, ftp)}</p>
          <p className="mt-1 text-[14px] leading-[1.3] text-ink-3 tabular-nums">
            Fra {clock(start)} til {clock(start + s.sec)}
            {!ftp && ". Skriv inn FTP øverst for å se watt."}
          </p>
        </>
      ) : (
        <p className="text-[15px] leading-[1.4] text-ink-3">Trykk eller dra over grafen for å se lengde{ftp ? " og watt" : ", prosent av FTP og (med FTP) watt"} for hver blokk.</p>
      )}
    </div>
  );
}
