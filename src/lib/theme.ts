import type { CSSProperties } from "react";
import type { ClubTheme } from "./types";

/** Club theme → CSS custom properties consumed by globals.css tokens. */
export function themeStyle(t: ClubTheme): CSSProperties {
  return {
    "--club-primary": t.primary,
    "--club-primary-hover": t.primaryHover,
    "--club-on-primary": t.onPrimary,
    "--club-link": t.link,
    "--club-link-hover": t.linkHover,
    "--club-secondary": t.secondary,
    "--club-on-secondary": t.onSecondary,
    "--club-accent": t.accent,
    "--club-tint": t.tint,
    ...(t.action && { "--action": t.action.background, "--action-hover": t.action.hover, "--on-action": t.action.text }),
    ...(t.header && {
      "--header-bg": t.header.background,
      "--header-ink": t.header.text,
      "--header-link": t.header.link,
      "--header-action": t.header.action.background,
      "--header-action-hover": t.header.action.hover,
      "--on-header-action": t.header.action.text,
    }),
  } as CSSProperties;
}

function channel(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2.x contrast ratio, e.g. 7.9 */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 10) / 10;
}
