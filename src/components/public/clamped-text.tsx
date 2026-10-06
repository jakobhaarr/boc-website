"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * A text that shows its first lines and opens on «Les mer». Whether it is long
 * enough to need it is judged by `long` (the caller counts characters), since the
 * server cannot measure lines: a short text is shown whole, without the button.
 */
export function ClampedText({ long, lines = 3, className, children }: { long: boolean; lines?: 2 | 3 | 4; className?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const clamp = lines === 2 ? "line-clamp-2" : lines === 4 ? "line-clamp-4" : "line-clamp-3";
  return (
    <div className={className}>
      <div className={cn("space-y-3", long && !open && clamp)}>{children}</div>
      {long && (
        <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="mt-2 t-small font-medium text-club hover:text-club-hover">
          {open ? "Vis mindre" : "Les mer"}
        </button>
      )}
    </div>
  );
}
