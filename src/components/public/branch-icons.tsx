import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Line icons for branches and sports, drawn to Feather's rules so they sit
 * with the lucide icons elsewhere: 24 px grid, 2 px round-capped stroke, no
 * fills. lucide has no velodrome, BMX jump or cross-country skier, hence our
 * own set. Matched on the node's name; unknown names get a neutral mark.
 */
const PATHS: Record<string, ReactNode> = {
  // Road bike: two wheels, a diamond frame and a drop bar.
  landevei: (
    <>
      <circle cx="5.5" cy="16.5" r="3.5" />
      <circle cx="18.5" cy="16.5" r="3.5" />
      <path d="M5.5 16.5 9 9h6.5l3 7.5M9 9l2.5 7.5 4-7.5" />
      <path d="M7.5 6.5h3M15.5 9l-.5-2.5h2.5a1 1 0 0 1 0 2" />
    </>
  ),
  // Terrain: a mountain with a lower ridge.
  terreng: <path d="m8 3 4 8 5-5 5 15H2L8 3z" />,
  // BMX: a bike in the air over a jump.
  bmx: (
    <>
      <path d="M2 21h5c4 0 5-6 9-6h6" />
      <circle cx="7" cy="9" r="2.5" />
      <circle cx="16" cy="6" r="2.5" />
      <path d="m7 9 4.5-1.5L16 6M11.5 7.5 10 4" />
    </>
  ),
  // Track: the oval of a velodrome with its infield.
  bane: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="6" />
      <rect x="7" y="10" width="10" height="4" rx="2" />
    </>
  ),
  // Indoor: a screen with an interval power trace.
  innendørs: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M6 13h2.5v-4h3v4H13V8h3v5h2" />
    </>
  ),
  fotball: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m12 7 4.3 3.1-1.6 5H9.3l-1.6-5L12 7z" />
    </>
  ),
  langrenn: (
    <>
      <circle cx="14.5" cy="4" r="1.5" />
      <path d="m13.5 7.5-3 5.5 4 2 .5 4.5M13 10l3.5 2.5M5 20l7.5-12M2 21.5h20" />
    </>
  ),
};
PATHS.sykkel = PATHS.landevei;
PATHS.banesykling = PATHS.bane;

const fallback = <path d="M22 12h-4l-3 9L9 3l-3 9H2" />;

export function BranchIcon({ name, className }: { name: string; className?: string }) {
  const key = name.toLowerCase().split(/[\s–-]/)[0];
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("size-5 shrink-0", className)}
    >
      {PATHS[key] ?? fallback}
    </svg>
  );
}
