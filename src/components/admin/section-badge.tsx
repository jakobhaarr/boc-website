"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { SECTIONS, sectionOf } from "./sections";

/** The tinted icon of the part of admin you are in, in its colour (set on <main> by the admin chrome). */
export function SectionBadge({ className }: { className?: string }) {
  const Icon = SECTIONS[sectionOf(usePathname())].icon;
  return (
    <span aria-hidden className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--accent-bg)] text-[var(--accent)]", className)}>
      <Icon className="size-5" strokeWidth={1.9} />
    </span>
  );
}
