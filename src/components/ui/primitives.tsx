import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/content";
import { HoverArrow } from "./button";

/* ─── Status ────────────────────────────────────────────────────────────── */

export type Tone = "neutral" | "success" | "warning" | "danger" | "club" | "ink";

const TONE: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-2 ring-1 ring-inset ring-line",
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  club: "bg-club-tint text-club",
  ink: "bg-inverse text-ink-inverse",
};

const DOT: Record<Tone, string> = {
  neutral: "bg-ink-3",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  club: "bg-club-surface",
  ink: "bg-ink",
};

/** Compact status label. Small radius on purpose — not a pill. */
export function Status({ tone = "neutral", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-sm px-1.5 text-[12px] leading-none font-medium whitespace-nowrap [&_svg]:size-3.5",
        TONE[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** Inline status without a surface: a dot and text, for dense rows. */
export function StatusDot({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  const text = tone === "neutral" ? "text-ink-3" : tone === "club" ? "text-club" : `text-${tone}`;
  return (
    <span className={cn("inline-flex items-center gap-1.5 t-meta whitespace-nowrap", text, className)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[tone])} />
      {children}
    </span>
  );
}

/* ─── Avatar ────────────────────────────────────────────────────────────── */

export function Avatar({
  name,
  size = 36,
  tone = "neutral",
  className,
}: {
  name: string;
  size?: 24 | 28 | 32 | 36 | 40 | 48 | 64;
  tone?: "neutral" | "club" | "muted";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight select-none",
        tone === "neutral" && "bg-sunken text-ink-2 ring-1 ring-inset ring-line",
        tone === "club" && "bg-club-surface text-on-club",
        tone === "muted" && "bg-sunken text-ink-3 ring-1 ring-inset ring-dashed ring-line-strong",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/* ─── Breadcrumb ────────────────────────────────────────────────────────── */

export function Breadcrumb({ items, className }: { items: { label: string; href?: string }[]; className?: string }) {
  return (
    <nav aria-label="Brødsmuler" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 t-small text-ink-3">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="inline-flex items-center gap-1">
              {item.href && !last ? (
                <Link href={item.href} className="-mx-1.5 rounded-sm px-1.5 py-0.5 transition-colors hover:bg-sunken hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? "font-medium text-ink" : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight aria-hidden className="size-3.5 text-line-strong" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ─── Links ─────────────────────────────────────────────────────────────── */

export function TextLink({ className, children, arrow = true, tone = "club", ...props }: ComponentProps<typeof Link> & { arrow?: boolean; tone?: "club" | "ink" }) {
  return (
    <Link
      className={cn(
        "inline-flex items-center font-medium transition-colors",
        tone === "club" ? "text-club hover:text-club-hover" : "text-ink hover:text-club",
        className,
      )}
      {...props}
    >
      {children}
      {arrow && <HoverArrow />}
    </Link>
  );
}

/* ─── Eyebrow ─────────────────────────────────────────────────────────── */

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("t-eyebrow", className)}>{children}</p>;
}

/* ─── Section header ───────────────────────────────────────────────────── */

/**
 * Eyebrow, a headline that can continue in a quieter tone, optional
 * description and a link aligned to the baseline.
 */
export function SectionHeader({
  title,
  titleMuted,
  eyebrow,
  id,
  href,
  linkLabel,
  description,
  className,
  rule = "none",
}: {
  title: string;
  titleMuted?: string;
  eyebrow?: string;
  id?: string;
  href?: string;
  linkLabel?: string;
  description?: ReactNode;
  className?: string;
  rule?: "strong" | "subtle" | "none";
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        rule === "strong" && "border-t border-ink pt-4",
        rule === "subtle" && "border-t border-line pt-4",
        className,
      )}
    >
      <div className="min-w-0 max-w-[48rem]">
        {eyebrow && <p className="mb-2.5 t-eyebrow">{eyebrow}</p>}
        <h2 id={id} className="t-h2">
          {title}
          {titleMuted && <span className="text-ink-3"> {titleMuted}</span>}
        </h2>
        {description && <p className="mt-3 max-w-[58ch] t-body text-ink-2">{description}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="mb-1 inline-flex shrink-0 items-center t-small font-medium text-club transition-colors hover:text-club-hover">
          {linkLabel}
          <HoverArrow />
        </Link>
      )}
    </div>
  );
}

/* ─── Filter chip ──────────────────────────────────────────────────────── */

export function chipClass(selected: boolean) {
  return cn(
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3.5 text-[13px] font-medium whitespace-nowrap transition-[background-color,box-shadow,color] duration-150",
    selected
      ? "bg-inverse text-ink-inverse shadow-[0_1px_2px_rgb(13_26_43/0.2)]"
      : "bg-surface text-ink-2 shadow-[inset_0_0_0_1px_var(--border)] hover:text-ink hover:shadow-[inset_0_0_0_1px_var(--border-strong)]",
  );
}

/** Multi-select toggle: quieter than a single-choice chip, with a check. */
export function ToggleChip({ selected, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-[background-color,box-shadow,color] duration-150",
        selected
          ? "bg-surface text-ink shadow-[inset_0_0_0_1px_var(--border-strong)]"
          : "bg-transparent text-ink-3 shadow-[inset_0_0_0_1px_var(--border)] hover:text-ink-2",
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 items-center justify-center rounded-[2.5px] border transition-colors",
          selected ? "border-ink bg-ink text-ink-inverse" : "border-line-strong bg-surface",
        )}
      >
        {selected && (
          <svg viewBox="0 0 12 12" className="size-2.5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M2.5 6.2 5 8.5l4.5-5" />
          </svg>
        )}
      </span>
      {children}
    </button>
  );
}

/* ─── Empty state ──────────────────────────────────────────────────────── */

export function EmptyState({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg bg-sunken px-5 py-5 shadow-[inset_0_0_0_1px_var(--border)]", className)}>
      <p className="t-small text-ink-2">{children}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/* ─── Keyline list ─────────────────────────────────────────────────────── */

export function Definition({ items, className }: { items: { term: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((i) => (
        <div key={i.term} className="grid grid-cols-[7.5rem_1fr] gap-4 py-3 t-small">
          <dt className="text-ink-3">{i.term}</dt>
          <dd className="text-ink">{i.value}</dd>
        </div>
      ))}
    </dl>
  );
}
