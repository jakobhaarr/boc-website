"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A short, silent clip that loops behind or beside the text (the Mallorca
 * drone flight). It starts on its own, without sound, as phones require. For
 * someone who has asked their system for less motion it does not play: the
 * poster stays and the controls appear, so the clip is there if they want it.
 */
export function AutoplayVideo({ src, poster, label, className }: { src: string; poster: string; label: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ref.current?.pause();
    setStill(true);
  }, []);

  return <video ref={ref} className={cn("size-full object-cover", className)} src={src} poster={poster} autoPlay={!still} muted loop playsInline preload="metadata" controls={still} aria-label={label} />;
}
