import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type GuideVariant = "columns" | "edges" | "all" | "none";

/**
 * Guide lines on the column boundaries of a grid of the page's width —
 * drawn in the middle of each gap, so content never touches a line.
 *
 *   columns  outer edges + every 3 columns on desktop (4 cells),
 *            every 4 on tablet (2 cells), edges only on phones
 *   edges    outer edges only
 *   all      every column boundary (grid documentation)
 *
 * GuideLines fills its nearest positioned parent; Guides places the lines in
 * the page container so they align with every section's content.
 */
export function GuideLines({ variant = "columns", dashed, className }: { variant?: GuideVariant; dashed?: boolean; className?: string }) {
  if (variant === "none") return null;
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", dashed && "guides--dashed", className)}>
      <div className="guides-grid">
        {variant === "edges" && <span className="guide-line col-span-full" />}
        {variant === "columns" &&
          [0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cn(
                "guide-line",
                i === 0 && "col-span-4 lg:col-span-3",
                i === 1 && "hidden md:block md:col-span-4 lg:col-span-3",
                i >= 2 && "hidden lg:block lg:col-span-3",
              )}
            />
          ))}
        {variant === "all" &&
          Array.from({ length: 12 }).map((_, i) => (
            <span key={i} className={cn("guide-line", i >= 8 && "hidden lg:block", i >= 4 && i < 8 && "hidden md:block")} />
          ))}
      </div>
    </div>
  );
}

/**
 * A section's guide layer. On the public pages it carries only the slanted
 * lines (.guides::before in globals.css); the vertical column lines were
 * dropped from them, and GuideLines now only documents the grid on
 * /design-system. `variant="none"` leaves a section without the layer.
 */
export function Guides({ variant = "columns", className }: { variant?: GuideVariant; className?: string }) {
  if (variant === "none") return null;
  return <div aria-hidden className={cn("guides", className)} />;
}

/**
 * Page section with the grid layer built in. Tone changes the surface;
 * `rule` draws a full-width horizontal line that the vertical guides cross.
 * Sections placed one after another continue the same vertical lines.
 */
export function Section({
  id,
  labelledBy,
  tone = "default",
  guides = "edges",
  rule,
  className,
  children,
}: {
  id?: string;
  labelledBy?: string;
  tone?: "default" | "sunken" | "inverse";
  guides?: GuideVariant;
  rule?: "top" | "bottom" | "both";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn(
        "relative isolate",
        tone === "sunken" && "bg-sunken",
        tone === "inverse" && "on-inverse bg-club-2 text-on-club-2",
        (rule === "top" || rule === "both") && "rule-t",
        (rule === "bottom" || rule === "both") && "rule-b",
        className,
      )}
    >
      <Guides variant={guides} />
      <div className="relative">{children}</div>
    </section>
  );
}
