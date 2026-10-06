import { ArrowUpRight } from "lucide-react";
import { ExternalButton } from "@/components/ui/button";
import { formatDayMonth } from "@/lib/dates";
import type { ISODate } from "@/lib/types";

/**
 * Grasrotandelen: Norsk Tipping gives a share of a player's stake to the club
 * the player picks. The recipient page on norsk-tipping.no has the club's
 * running total, the number of givers and the button that picks the club, so
 * the panel carries the two numbers as they stood on a date (they are Norsk
 * Tipping's and move, so the date is stated) and sends people there. The
 * embedded statistics frame it replaces showed «Org.nr: undefined» and nothing
 * else, and the old recipient link was a 404.
 */
export function Grasrotandelen({
  orgNumber,
  clubName,
  stats,
}: {
  orgNumber: string;
  clubName: string;
  stats?: { year: number; amountNok: number; givers: number; asOf: ISODate };
}) {
  const url = `https://www.norsk-tipping.no/grasrotandelen/mottaker/${orgNumber}`;
  return (
    <div>
      {stats && (
        <dl className="grid max-w-[40rem] gap-x-10 gap-y-6 sm:grid-cols-2">
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5">
            <dt className="t-small text-ink-3">Generert til klubben hittil i {stats.year}</dt>
            <dd className="font-display text-[2.5rem] leading-none font-medium tracking-[-0.02em] tnum text-ink">{stats.amountNok.toLocaleString("nb-NO")} kr</dd>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line pt-5">
            <dt className="t-small text-ink-3">Grasrotgivere</dt>
            <dd className="font-display text-[2.5rem] leading-none font-medium tracking-[-0.02em] tnum text-ink">{stats.givers}</dd>
          </div>
        </dl>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3">
        <ExternalButton href={url} size="lg" arrow className="!bg-club-surface !text-on-club hover:!bg-[var(--club-primary-hover)]">
          Velg {clubName} som grasrotmottaker
        </ExternalButton>
        <a href={url} target="_blank" rel="noreferrer noopener" className="link inline-flex items-center gap-1 t-small font-medium text-ink">
          Se utviklingen hos Norsk Tipping
          <ArrowUpRight aria-hidden className="size-3.5" />
        </a>
      </div>
      <p className="mt-4 max-w-[52ch] t-small text-ink-3">
        {stats ? `Tallene er fra Norsk Tipping ${formatDayMonth(stats.asOf)} ${stats.asOf.slice(0, 4)}. ` : ""}De oppdateres hos dem, og du velger mottaker på deres side.
      </p>
    </div>
  );
}
