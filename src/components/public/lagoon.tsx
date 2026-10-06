import { cn } from "@/lib/cn";

/**
 * Stand-in for a photo: slow, soft colour fields in teal and deep blue, after
 * the "Lagoon" flow gradient from Feralui's Gradient Builder (#EAFBF7, #5CE3E6,
 * #0F9CC2, #274A78). Used wherever a card, band or hero has no picture, so the
 * empty frame still belongs to the club, without borrowing the yellow that is
 * kept for actions. Pure CSS (see `.lagoon` in globals.css); the drift stops
 * for people who prefer reduced motion. `deep` darkens the lower half for
 * white text on top.
 */
export function Lagoon({ className, deep = false }: { className?: string; deep?: boolean }) {
  return <div aria-hidden className={cn("lagoon", deep && "lagoon--deep", className)} />;
}
