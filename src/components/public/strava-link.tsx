import { cn } from "@/lib/cn";

/**
 * A link back to Strava, as Strava's brand guidelines ask
 * (developers.strava.com/guidelines, §3–4): the link text is exactly
 * «View on Strava», set bold and underlined so it reads as a link, and the
 * Strava name is never larger than the text around it. No Strava logo —
 * nothing here should look made or endorsed by Strava. Strava's orange
 * (#FC5200) is one of the allowed treatments, but it falls below 4.5:1 on
 * the light grounds, so the link keeps the ink colour. The Norwegian
 * `label` in front says whose page it is and is not part of the link.
 */
export function StravaLink({ url, label, className }: { url: string; label: string; className?: string }) {
  return (
    <p className={cn("t-small text-ink-2", className)}>
      {label}:{" "}
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        className="font-semibold text-ink underline decoration-1 underline-offset-2 transition-colors hover:text-club"
      >
        View on Strava
      </a>
    </p>
  );
}
