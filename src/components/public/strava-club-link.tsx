import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

/** «Bli med i BOC på Strava»: the club's own Strava club (Club.stravaClubUrl). */
export function StravaClubLink({ url, clubName, className }: { url: string; clubName: string; className?: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn("inline-flex items-center gap-1.5 t-small font-medium text-club transition-colors hover:text-club-hover", className)}
    >
      Bli med i {clubName} på Strava
      <ArrowUpRight aria-hidden className="size-3.5" />
    </a>
  );
}
