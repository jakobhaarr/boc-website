import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Pieces shared by the club's decks (/presentasjon/…, /user-experience): the
 * three slanted bars of the wordmark, the fact strip's slant as a texture,
 * the slide frame with its eyebrow and headline, and a few small elements.
 * All sizes are in px on the 1600 × 900 stage (deck.tsx).
 */

/* Three slanted bars, as in the header's wordmark: the deck's signature. */
export function Slashes({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute top-0 right-24 flex h-40 gap-5", className)}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="block h-full w-7 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
      ))}
    </div>
  );
}

/* The fact strip's slant as a faint texture across the slide. */
export function Slants() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: "repeating-linear-gradient(111.25deg, transparent 0 399px, var(--guide-strong) 399px 400px)" }}
    />
  );
}

export function Frame({ eyebrow, title, muted, logo, size = 76, children }: { eyebrow?: string; title: string; muted?: string; logo: StaticImageData; /** Headline size in px. */ size?: number; children?: ReactNode }) {
  return (
    <>
      <Slants />
      <div className="relative flex h-full flex-col px-[120px] pt-[110px] pb-[96px]">
        <p className="text-[22px] font-semibold tracking-[0.12em] text-[var(--club-link)] uppercase">{eyebrow ?? "BOC · Gruppe Zwift"}</p>
        <h2 className="mt-5 max-w-[1200px] font-display leading-[1.04] font-medium tracking-[-0.019em]" style={{ fontSize: size }}>
          {title} {muted && <span className="text-ink-3">{muted}</span>}
        </h2>
        <div className="mt-14 min-h-0 flex-1">{children}</div>
      </div>
      <Image src={logo} alt="" className="absolute top-[104px] right-[120px] h-9 w-auto" />
    </>
  );
}

export function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="flex items-baseline gap-5 text-[34px] leading-[1.25] font-medium tracking-[-0.01em]">
      <span className="flex size-14 shrink-0 translate-y-[-4px] items-center justify-center self-center rounded-full bg-[var(--club-primary)] font-display text-[28px] font-semibold text-[var(--club-on-primary)]">
        {n}
      </span>
      <span>{children}</span>
    </p>
  );
}

export function Shot({ src, alt, className }: { src: StaticImageData; alt: string; className?: string }) {
  return <Image src={src} alt={alt} className={cn("h-auto rounded-lg shadow-[0_24px_48px_-24px_rgb(13_26_43/0.45)] ring-1 ring-black/10", className)} />;
}

export function Bullets({ items, size = 34 }: { items: ReactNode[]; /** Text size in px. */ size?: number }) {
  return (
    <ul className="space-y-5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-5 leading-[1.3] tracking-[-0.01em]" style={{ fontSize: size }}>
          <span aria-hidden className="mt-[0.5em] block size-3 shrink-0 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * An iPhone: black frame, rounded corners, the island at the top, around a screen drawn in code (children). `height` is
 * the whole phone in px on the stage; `ratio` the screen's width over height.
 */
export function Phone({ height, ratio, label, children, className }: { height: number; ratio: number; label: string; children: (screenHeight: number) => ReactNode; className?: string }) {
  const bezel = Math.round(height * 0.018);
  const screenHeight = height - bezel * 2;
  return (
    <div
      role="img"
      aria-label={label}
      className={cn("relative shrink-0 bg-[#0b0b0d] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.7)] ring-1 ring-white/20", className)}
      style={{ height, width: screenHeight * ratio + bezel * 2, borderRadius: height * 0.075, padding: bezel }}
    >
      <div className="relative overflow-hidden" style={{ height: screenHeight, borderRadius: height * 0.057 }}>
        {children(screenHeight)}
      </div>
      {/* The island */}
      <span aria-hidden className="absolute left-1/2 z-10 -translate-x-1/2 rounded-full bg-black" style={{ top: bezel + height * 0.012, width: height * 0.13, height: height * 0.038 }} />
    </div>
  );
}

/**
 * A laptop: the lid with a thin black frame and the camera, around a screen drawn in code (children), and the base
 * under it. `width` is the lid's width in px on the stage; `ratio` the screen's width over height.
 */
export function Laptop({ width, ratio, label, children, className }: { width: number; ratio: number; label: string; children: (screenWidth: number) => ReactNode; className?: string }) {
  const bezel = Math.round(width * 0.014);
  const screenWidth = width - bezel * 2;
  return (
    <div role="img" aria-label={label} className={cn("shrink-0", className)} style={{ width }}>
      <div className="relative bg-[#0b0b0d] ring-1 ring-white/20" style={{ padding: bezel, paddingTop: bezel * 1.4, borderRadius: `${width * 0.018}px ${width * 0.018}px 0 0` }}>
        <div className="relative overflow-hidden" style={{ borderRadius: width * 0.006 }}>
          {children(screenWidth)}
        </div>
        <span aria-hidden className="absolute left-1/2 -translate-x-1/2 rounded-full bg-[#1c1c21]" style={{ top: bezel * 0.5, width: width * 0.006, height: width * 0.006 }} />
      </div>
      {/* The base, a little wider than the lid, with the notch for opening it */}
      <div
        className="relative mx-auto bg-gradient-to-b from-[#c9ccd1] to-[#8d9097]"
        style={{ width: width * 1.08, marginLeft: -width * 0.04, height: width * 0.02, borderRadius: `0 0 ${width * 0.03}px ${width * 0.03}px` }}
      >
        <span aria-hidden className="absolute left-1/2 top-0 -translate-x-1/2 bg-[#6f7278]" style={{ width: width * 0.14, height: width * 0.007, borderRadius: `0 0 ${width * 0.01}px ${width * 0.01}px` }} />
      </div>
    </div>
  );
}
