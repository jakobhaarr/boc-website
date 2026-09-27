import { ArrowUpRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * A button to a page on Strava — the club's Strava club, a member's profile —
 * in Strava's orange, within Strava's brand guidelines
 * (developers.strava.com/guidelines): a truthful, plain-text reference to
 * Strava («Bli med i BOC på Strava»), the name no larger than the text
 * around it, and no Strava logo, so nothing here looks made or endorsed by
 * Strava. The «View on Strava» wording in §3 is for links back to Strava data
 * shown on a site; this site shows none, it only points to pages on Strava.
 *
 * The label has the same size and weight as every other large button.
 * White on #FC5200 is 3.3:1 — below WCAG AA's 4.5:1 for text that size;
 * kept because Strava's orange is what makes the button read as Strava's.
 */
export function StravaLink({ url, children, className }: { url: string; children: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(buttonClass({ size: "lg" }), "!bg-[#FC5200] !text-white hover:!bg-[#E34A00]", className)}
    >
      {children}
      <ArrowUpRight aria-hidden />
    </a>
  );
}
