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
 * White on #FC5200 is 3.3:1, which passes only as large text, so the label
 * on the button is bold at 19 px (WCAG's 14 pt bold) rather than the 15 px
 * of other large buttons.
 */
export function StravaLink({ url, label, className }: { url: string; label: string; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      <span className="t-small text-ink-2">{label}</span>
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className={cn(buttonClass({ size: "lg" }), "!bg-[#FC5200] !text-[1.1875rem] !font-bold !text-white hover:!bg-[#E34A00]")}
      >
        View on Strava
        <ArrowUpRight aria-hidden />
      </a>
    </div>
  );
}
