"use client";

import Image, { type StaticImageData } from "next/image";
import { useDeckStep } from "@/components/deck/deck";
import { cn } from "@/lib/cn";

/**
 * Step 6 of the sign-up (the wizard's «Velg dagens intervalløkt»), built in
 * steps: the three things to do on the left, the one being done lit, and its
 * screenshot from Zwift on the right, the pictures crossfading. It is the same
 * three pictures the wizard on the Zwift page lets you browse.
 */
export function ZwiftPick({ items, shots }: { items: string[]; shots: { src: StaticImageData; alt: string }[] }) {
  const step = useDeckStep();
  const ratio = `${shots[0].src.width} / ${shots[0].src.height}`;
  return (
    <div className="grid grid-cols-[480px_minmax(0,1fr)] items-start gap-14">
      <ol className="space-y-6">
        {items.map((item, i) => (
          <li key={item} aria-current={i === step ? "step" : undefined} className={cn("flex items-baseline gap-5 text-[32px] leading-[1.25] font-medium tracking-[-0.01em] transition-opacity duration-500", i !== step && "opacity-30")}>
            <span className={cn("flex size-12 shrink-0 translate-y-[-3px] items-center justify-center self-center rounded-full font-display text-[24px] font-semibold transition-colors duration-500", i === step ? "bg-[var(--club-primary)] text-[var(--club-on-primary)]" : "bg-surface text-ink-2 ring-1 ring-line")}>{i + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
      <div className="relative ml-auto w-full max-w-[800px] overflow-hidden rounded-lg shadow-[0_24px_48px_-24px_rgb(0_0_0/0.6)] ring-1 ring-black/20" style={{ aspectRatio: ratio }}>
        {shots.map((s, i) => (
          <Image key={i} src={s.src} alt={s.alt} fill sizes="800px" className={cn("object-cover transition-opacity duration-500", i === step ? "opacity-100" : "opacity-0")} aria-hidden={i !== step} />
        ))}
      </div>
    </div>
  );
}
