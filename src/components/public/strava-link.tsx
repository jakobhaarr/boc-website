import { ArrowUpRight } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * A link back to Strava, as a button in Strava's orange, following Strava's
 * brand guidelines (developers.strava.com/guidelines, §3–4): the link text is
 * exactly «View on Strava», the orange is Strava's own #FC5200, the Strava
 * name is never larger than the text around it, and there is no Strava logo
 * — nothing here should look made or endorsed by Strava. The Norwegian
 * `label` in front says whose page it is and is not part of the link.
 *
 * The label has the same size and weight as every other large button.
 * White on #FC5200 is 3.3:1 — below WCAG AA's 4.5:1 for text that size;
 * kept because Strava's orange is what makes the button read as Strava's.
 */
export function StravaLink({ url, label, className }: { url: string; label: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <span className="t-small text-ink-2">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(buttonClass({ size: "lg" }), "!bg-[#FC5200] !text-white hover:!bg-[#E34A00]")}
      >
        View on Strava
        <ArrowUpRight aria-hidden />
      </a>
    </div>
  );
}
