"use client";

import { useEffect, useRef } from "react";
import { AutoplayVideo } from "@/components/public/autoplay-video";

/**
 * A film that starts edge to edge and, as you scroll, shrinks into a television
 * drawn in HTML and CSS, as wide as the hero card above it (the page's content
 * width). The same pinned-and-shrinking scroll as Apple's product pages.
 *
 * How: the section is taller than the screen and its content sticks under the
 * header while you scroll through the extra height. Under the hero it starts with an empty stretch, so the film is not in view
 * until you have scrolled a little. `--p` (0 to 1) is how far
 * through that distance you are; it is written straight to the section's style
 * on scroll, with no React state, so the page does not re-render. Everything
 * else is CSS from `--p`: the width goes from 100% to the page's content width
 * (the same sum as `.page`: its max width and gutters), the bezel and rounded
 * corners grow from nothing, and the stand fades in.
 *
 *
 * For anyone who has asked for less motion the section is not pinned: it is
 * the finished television, still, with the film showing its controls (see
 * AutoplayVideo).
 */
export function ScrollTv({ src, label, width, height }: { src: string; label: string; width: number; height: number }) {
  const ref = useRef<HTMLElement>(null);
  const stick = useRef<HTMLDivElement>(null);
  const lead = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    const pin = stick.current;
    const gap = lead.current;
    if (!el || !pin || !gap) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      // The film waits below the fold (the lead) until you have scrolled a little. It is pinned from the moment its own top
      // reaches the header, and stays so for the rest of the section's height: that stretch is what `--p` runs over.
      const rect = el.getBoundingClientRect();
      const lead = gap.offsetHeight;
      const headerTop = parseFloat(getComputedStyle(pin).top) || 0;
      const travel = rect.height - lead - pin.offsetHeight;
      const p = travel > 0 ? Math.min(1, Math.max(0, (headerTop - (rect.top + lead)) / travel)) : 1;
      // Ease the start and the end so the film settles into the frame rather than stopping dead.
      const eased = p * p * (3 - 2 * p);
      el.style.setProperty("--p", eased.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <section
      ref={ref}
      aria-label={label}
      className="relative bg-[var(--header-bg,#0d1a2b)] [--card:calc(min(100%,var(--page-max)+var(--page-gutter)*2)-var(--page-gutter)*2)] [--lead:max(14rem,30svh)] [--p:0] h-[calc(var(--lead)+100svh+70svh)] motion-reduce:h-auto motion-reduce:py-16 lg:h-[calc(var(--lead)+100svh+90svh)]"
    >
      {/* The film's lead: empty dark space the film scrolls up out of, so it is not on the screen when the page opens. */}
      <div ref={lead} aria-hidden className="h-[var(--lead)] motion-reduce:hidden" />
      {/* `safe center`: centred, but when the edge-to-edge film is taller than the area (a wide, short screen) it sits at the top
          and runs out below the screen, instead of running up over the facts above it or being cropped. As it shrinks it fits and centres. */}
      <div
        ref={stick}
        className="sticky top-[var(--header-h)] flex h-[calc(100svh-var(--header-h))] flex-col items-center justify-center motion-reduce:static motion-reduce:h-auto"
        style={{ justifyContent: "safe center" }}
      >
        {/* The width: the full width of the screen at 0, the hero card's at 1. */}
        <div className="mx-auto" style={{ width: "calc(100% + (var(--card) - 100%) * var(--p))" }}>
          <div
            className="relative"
            style={{
              padding: "calc(var(--p) * clamp(8px, 1.1vw, 14px))",
              borderRadius: "calc(var(--p) * 20px)",
              // The set's body: the page's dark, lifted a little so it reads against it.
              background: "color-mix(in srgb, var(--header-bg, #0d1a2b), white calc(var(--p) * 14%))",
              boxShadow: "0 0 0 1px rgb(255 255 255 / calc(var(--p) * 0.12)), 0 calc(var(--p) * 40px) calc(var(--p) * 90px) calc(var(--p) * -24px) rgb(0 0 0 / calc(var(--p) * 0.7))",
            }}
          >
            {/* Plays by itself, without sound and in a loop; whoever has asked for less motion gets it still, with controls. */}
            <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: `${width} / ${height}`, borderRadius: "calc(var(--p) * 10px)" }}>
              <AutoplayVideo src={src} label={label} />
              {/* A faint reflection across the glass, there once it is a television. */}
              <div aria-hidden className="pointer-events-none absolute inset-0" style={{ opacity: "var(--p)", background: "linear-gradient(115deg, rgb(255 255 255 / 0.1), transparent 38%)" }} />
            </div>
          </div>
        </div>
        {/* The stand: a neck and a foot, growing in as the frame closes (no height at 0, so it never pushes the film out of place). */}
        <div aria-hidden className="flex flex-col items-center overflow-hidden" style={{ opacity: "var(--p)", width: "calc(var(--card) * 0.2)", height: "calc(var(--p) * 1.75rem)" }}>
          <div className="h-3 w-[18%] min-w-4 bg-[color-mix(in_srgb,var(--header-bg,#0d1a2b),white_10%)] sm:h-5" />
          <div className="h-1.5 w-full rounded-full bg-[color-mix(in_srgb,var(--header-bg,#0d1a2b),white_16%)] sm:h-2" />
        </div>
      </div>
    </section>
  );
}
