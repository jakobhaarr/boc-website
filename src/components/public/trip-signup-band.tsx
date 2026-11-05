import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { formatSpan } from "@/lib/club-year";
import { TRIP } from "@/lib/trip-signup";
import { TripProgress } from "@/components/public/trip-progress";

/**
 * The strip under the Mallorca hero that says the sign-up is open: the dates, the prices and a button to the form
 * (/mallorca/pamelding). Shown while `TRIP.open`; `signedUp` is the number of sign-ups so far.
 */
export function TripSignupBand({ signedUp, rooms }: { signedUp: number; rooms: number }) {
  if (!TRIP.open) return null;
  return (
    <Section labelledBy="pamelding" className="border-b border-line bg-club-tint py-8 lg:py-10">
      <div className="page flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[62ch]">
          <p className="t-eyebrow">Påmelding åpen</p>
          <h2 id="pamelding" className="mt-2 t-h3">
            {TRIP.title}, {formatSpan(TRIP.from, TRIP.to)}
          </h2>
          <p className="mt-2 t-body text-ink-2">
            Fra {TRIP.priceDouble} euro per person i dobbeltrom og {TRIP.priceSingle} euro i enkeltrom, halvpensjon inkludert. {TRIP.rooms} rom, tre grupper med ulikt nivå, for medlemmer av BOC, og du må være medlem før du drar. Påmeldingen er bindende når fakturaen i desember er betalt.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-5 sm:flex-row sm:items-center lg:gap-8">
          <TripProgress taken={rooms} total={TRIP.rooms} />
          <div className="flex flex-col gap-2 sm:w-56">
            <ButtonLink href="/mallorca/pamelding" size="lg" arrow className="max-sm:w-full">
              Meld deg på
            </ButtonLink>
            {signedUp > 0 && <p className="t-small text-ink-2">{signedUp} er påmeldt så langt</p>}
          </div>
        </div>
      </div>
    </Section>
  );
}
