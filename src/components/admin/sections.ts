import { CalendarDays, Contact, FileText, LayoutGrid, Layers, MapPin, Network, Quote, Settings, UserCog, Users, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import type { RoleKind } from "@/lib/types";

/**
 * Each part of admin has its own colour, so a page can be told from the next
 * at a glance: in the top bar (a dot and the underline), in the page header
 * (the tinted icon) and in the phone's tab bar. The colours are the design
 * system's `--cat-*` pairs (each ≥ 5:1 on its tint), the club's own colours
 * for the people register, and plain ink for the pages that are about the
 * system itself (overview, users, settings).
 */

export type SectionIcon = "overview" | "groups" | "venues" | "activities" | "content" | "people" | "quotes" | "structure" | "users" | "externals" | "settings";

type Hue = 1 | 2 | 3 | 4 | 5 | 6 | "club" | "neutral";

export const SECTIONS: Record<SectionIcon, { icon: LucideIcon; hue: Hue }> = {
  overview: { icon: LayoutGrid, hue: "neutral" },
  content: { icon: FileText, hue: 1 },
  quotes: { icon: Quote, hue: 4 },
  groups: { icon: Layers, hue: 2 },
  activities: { icon: CalendarDays, hue: 3 },
  structure: { icon: Network, hue: 6 },
  venues: { icon: MapPin, hue: "club" },
  people: { icon: Users, hue: 5 },
  users: { icon: UserCog, hue: "neutral" },
  externals: { icon: Contact, hue: 4 },
  settings: { icon: Settings, hue: "neutral" },
};

/** The more specific path first: «/admin/personer» before «/admin». */
const ROUTES: [string, SectionIcon][] = [
  ["/admin/innhold", "content"],
  ["/admin/publiser", "content"],
  ["/admin/sitater", "quotes"],
  ["/admin/grupper", "groups"],
  ["/admin/aktiviteter", "activities"],
  ["/admin/struktur", "structure"],
  ["/admin/arenaer", "venues"],
  ["/admin/personer", "people"],
  ["/admin/brukere", "users"],
  ["/admin/eksterne", "externals"],
  ["/admin/innstillinger", "settings"],
];

export function sectionOf(pathname: string): SectionIcon {
  return ROUTES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? "overview";
}

/** The colour pair as CSS variables, to be set on an element and read as `var(--accent)` / `var(--accent-bg)` below it. */
export function accentVars(hue: Hue): CSSProperties {
  if (hue === "club") return { "--accent": "var(--club-link)", "--accent-bg": "var(--club-tint)" } as CSSProperties;
  if (hue === "neutral") return { "--accent": "var(--text-primary)", "--accent-bg": "var(--surface-sunken)" } as CSSProperties;
  return { "--accent": `var(--cat-${hue})`, "--accent-bg": `var(--cat-${hue}-bg)` } as CSSProperties;
}

export const sectionAccent = (icon: SectionIcon) => accentVars(SECTIONS[icon].hue);

/** A role is told apart by colour too: the more it may do, the cooler the hue. */
export const ROLE_HUE: Record<RoleKind, Hue> = {
  clubAdmin: 4,
  sectionAdmin: 1,
  groupAdmin: 2,
  contributor: 3,
  guardian: 6,
};
