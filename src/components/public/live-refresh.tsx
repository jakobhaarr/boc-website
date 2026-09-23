"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export const CHANGE_CHANNEL = "klubbnettside";

/** Tell other tabs in this browser that content changed. */
export function announceChange() {
  if (typeof BroadcastChannel === "undefined") return;
  const bc = new BroadcastChannel(CHANGE_CHANNEL);
  bc.postMessage({ at: Date.now() });
  bc.close();
}

/**
 * Keeps an open page in step with the mock store. Same-browser tabs update
 * instantly via BroadcastChannel; other devices pick changes up by polling
 * the store version.
 */
export function LiveRefresh({ version }: { version: number }) {
  const router = useRouter();
  const known = useRef(version);

  useEffect(() => {
    known.current = version;
  }, [version]);

  useEffect(() => {
    let busy = false;
    const check = async () => {
      if (busy || document.hidden) return;
      busy = true;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        const { version: latest } = (await res.json()) as { version: number };
        if (latest !== known.current) {
          known.current = latest;
          router.refresh();
        }
      } catch {
        /* offline or server restarting — try again next tick */
      } finally {
        busy = false;
      }
    };

    const interval = window.setInterval(check, 3000);
    document.addEventListener("visibilitychange", check);
    const bc = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(CHANGE_CHANNEL) : null;
    bc?.addEventListener("message", () => router.refresh());

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
      bc?.close();
    };
  }, [router]);

  return null;
}
