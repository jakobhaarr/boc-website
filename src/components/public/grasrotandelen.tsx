import { ArrowUpRight } from "lucide-react";

/**
 * Grasrotandelen: Norsk Tipping gives a share of a player's stake to the club
 * they pick, and publishes the club's running total in a small embed. The
 * numbers are theirs and update on their side, so the panel is their iframe
 * rather than a copy — sandboxed, lazy and with a plain link beside it for
 * anyone the frame fails for.
 */
export function Grasrotandelen({ orgNumber, clubName }: { orgNumber: string; clubName: string }) {
  return (
    <div>
      <iframe
        src={`https://www.norsk-tipping.no/grasrotandelen/statistikk/iframe/${orgNumber}`}
        title={`Grasrotandelen: statistikk for ${clubName}`}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-popups"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[26rem] w-full rounded-lg bg-surface shadow-card ring-1 ring-line"
      />
      <p className="mt-3 t-small text-ink-3">
        Tallene kommer fra Norsk Tipping og oppdateres hos dem.{" "}
        <a
          href={`https://www.norsk-tipping.no/grasrotandelen/din-grasrotmottaker/${orgNumber}`}
          target="_blank"
          rel="noreferrer noopener"
          className="link inline-flex items-center gap-1 font-medium text-ink"
        >
          Velg {clubName} som grasrotmottaker
          <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
      </p>
    </div>
  );
}
