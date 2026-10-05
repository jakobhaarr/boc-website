import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { RoleKind } from "@/lib/types";
import { accentVars, ROLE_HUE } from "./sections";

/** A role as a small coloured label, so who may do what can be read down a list. */
export function RoleChip({ role, children, className }: { role: RoleKind; children: ReactNode; className?: string }) {
  return (
    <span style={accentVars(ROLE_HUE[role])} className={cn("inline-flex items-center rounded-sm bg-[var(--accent-bg)] px-1.5 py-[3px] text-[12px] leading-none font-medium whitespace-nowrap text-[var(--accent)]", className)}>
      {children}
    </span>
  );
}
