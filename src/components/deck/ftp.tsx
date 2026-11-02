"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { WorkoutProfile } from "@/components/deck/workout-chart";
import type { ZwiftWorkout } from "@/lib/data/zwift-workouts";

/**
 * The rider's FTP in watts, typed in once and kept for every workout in the
 * deck. It lives in the browser's own storage (this device only, never sent
 * anywhere), because each slide is mounted on its own and the number should
 * follow you from one to the next. Without storage it works for the slide at
 * hand and is forgotten after.
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
export function FtpInput() {
  const ftp = useFtp();
  const [draft, setDraft] = useState("");
  // The number from another slide (or tab) fills the box; what is being typed is left alone until it is a valid number of its own.
  useEffect(() => {
    if (ftp !== null && Number(draft) !== ftp) setDraft(String(ftp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ftp]);

  return (
    <label className="relative z-10 flex shrink-0 items-center gap-4 text-[22px] text-ink-2">
      Skriv inn din FTP
      <span className="flex items-center gap-2 rounded-md bg-surface px-4 py-2 ring-1 ring-line focus-within:ring-2 focus-within:ring-[var(--club-primary)]">
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
          className="w-[72px] bg-transparent text-right font-display text-[28px] leading-none font-medium text-ink outline-none placeholder:text-ink-3 tabular-nums"
        />
        <span className="text-[22px] text-ink-3">W</span>
      </span>
    </label>
  );
}

/** The profile in watts once an FTP is typed in. */
export function FtpProfile({ workout }: { workout: ZwiftWorkout }) {
  return <WorkoutProfile workout={workout} ftp={useFtp()} />;
}
