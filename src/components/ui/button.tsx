import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse" | "link";
export type ButtonSize = "sm" | "md" | "lg";

interface Style {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /** Brand expression for a page's main CTA. Never use for filters or workflow controls. */
  brand?: boolean;
  /**
   * Which edges the diagonal cuts. The default trails the button, pointing
   * forward; "both" cuts the leading edge too, so the second of a pair is a
   * parallelogram leaning the same way as the first, and the gap between them
   * becomes a parallel channel.
   */
  slant?: "right" | "both";
}

/**
 * Chevron that grows a shaft when its link or button is hovered.
 * Signals "this takes you somewhere" without shouting.
 */
export function HoverArrow({ className }: { className?: string }) {
  return (
    <svg className={cn("hover-arrow", className)} width="10" height="10" viewBox="0 0 10 10" aria-hidden>
      <path className="hover-arrow__line" d="M0 5h7" />
      <path className="hover-arrow__tip" d="M1 1l4 4-4 4" />
    </svg>
  );
}

/**
 * Buttons are compact (32 / 40 / 48 px), square and medium weight. A public
 * page's main CTA may opt into `brand`, which cuts its trailing edge on the
 * same 21.25-degree diagonal as the club wordmark panel. Workflow controls and
 * destructive actions stay rectilinear, so the diagonal remains an
 * identity/forward-motion signal rather than generic decoration.
 *
 * Where two buttons stand side by side, the second takes the diagonal on both
 * edges (`slant="both"`) so the two cuts run parallel, the gap between them
 * reads as one channel, and the second still points forward. A slanted secondary trades its inset
 * ring for .btn-slant-outline, whose edge follows the clipped shape the whole
 * way round — an inset ring would be cut away along the diagonal.
 */
export function buttonClass({ variant = "primary", size = "md", block, brand = false, slant = "right" }: Style = {}) {
  const isLink = variant === "link";
  const isBrand = brand && !isLink;
  const both = isBrand && slant === "both";
  return cn(
    "relative inline-flex select-none items-center justify-center whitespace-nowrap font-medium tracking-[-0.006em]",
    "transition-[background-color,box-shadow,color,transform] duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-45 aria-disabled:pointer-events-none aria-disabled:opacity-45",
    "[&_svg:not(.hover-arrow)]:shrink-0",
    !isLink && "gap-1.5 rounded-none active:translate-y-px",
    isBrand &&
      (both
        ? "[clip-path:polygon(var(--button-slant)_0,100%_0,calc(100%-var(--button-slant))_100%,0_100%)]"
        : "[clip-path:polygon(0_0,100%_0,calc(100%-var(--button-slant))_100%,0_100%)]"),
    !isLink && size === "sm" && cn("h-8 text-[13px] [&_svg:not(.hover-arrow)]:size-3.5", isBrand ? cn("[--button-slant:13px]", both ? "px-5" : "pl-3 pr-5") : "pl-3 pr-3"),
    !isLink && size === "md" && cn("h-10 text-[14px] [&_svg:not(.hover-arrow)]:size-4", isBrand ? cn("[--button-slant:16px]", both ? "px-7" : "pl-[18px] pr-7") : "pl-[18px] pr-[18px]"),
    !isLink && size === "lg" && cn("h-12 text-[15px] [&_svg:not(.hover-arrow)]:size-[18px]", isBrand ? cn("[--button-slant:19px]", both ? "px-9" : "pl-6 pr-9") : "pl-6 pr-6"),
    isLink && size === "sm" && "text-[13px]",
    isLink && size === "md" && "text-[14px]",
    isLink && size === "lg" && "text-[15px]",
    variant === "primary" &&
      "bg-action text-on-action hover:bg-action-hover",
    variant === "secondary" &&
      cn(
        "text-ink",
        isBrand
          ? cn("btn-slant-outline", both && "btn-slant-outline--both")
          : "bg-surface shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-sunken hover:shadow-[inset_0_0_0_1px_var(--text-muted)]",
      ),
    variant === "ghost" && "text-ink-2 hover:bg-sunken hover:text-ink",
    variant === "danger" && "bg-danger text-white hover:bg-danger-hover",
    variant === "inverse" && "bg-white text-[#0d1a2b] hover:bg-white/90",
    isLink && "text-club hover:text-club-hover",
    block && "w-full",
  );
}

type WithArrow = { arrow?: boolean };

export function Button({
  variant,
  size,
  block,
  brand,
  slant,
  arrow,
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Style & WithArrow) {
  return (
    <button type={type} className={cn(buttonClass({ variant, size, block, brand, slant }), className)} {...props}>
      {children}
      {arrow && <HoverArrow />}
    </button>
  );
}

export function ButtonLink({ variant, size, block, brand, slant, arrow, className, children, ...props }: ComponentProps<typeof Link> & Style & WithArrow) {
  return (
    <Link className={cn(buttonClass({ variant, size, block, brand, slant }), className)} {...props}>
      {children}
      {arrow && <HoverArrow />}
    </Link>
  );
}

export function ExternalButton({
  variant,
  size,
  block,
  brand,
  slant,
  arrow,
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Style & WithArrow) {
  return (
    <a target="_blank" rel="noreferrer noopener" className={cn(buttonClass({ variant, size, block, brand, slant }), className)} {...props}>
      {children}
      {arrow && <HoverArrow />}
    </a>
  );
}
