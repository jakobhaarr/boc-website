import type { Metadata } from "next";
import { TripSignupForm } from "@/components/public/trip-signup-form";
import { TripSignupList } from "@/components/public/trip-signup-list";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { formatSpan } from "@/lib/club-year";
import { loadSite } from "@/lib/data/queries";
import { TripProgress } from "@/components/public/trip-progress";
import { publicSignups, roomsTaken, TRIP } from "@/lib/trip-signup";

export const metadata: Metadata = {
  title: "Påmelding til Mallorca",
  description: "Meld deg på klubbturen til Mallorca i mars 2027, og se hvem som er med.",
};

/** The sign-up for the club trip (lib/trip-signup.ts): the facts, the form and the open list of who is going. */
export default async function TripSignupPage() {
  const { db } = await loadSite();
  const rows = publicSignups(db.tripSignups);
  return (
    <>
      <Section className="pb-10 lg:pb-14">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: db.club.name, href: "/" }, { label: "Mallorca", href: "/mallorca" }, { label: "Påmelding" }]} />
          <div className="mt-8 max-w-[62ch]">
            <p className="t-eyebrow">Klubbtur</p>
            <h1 className="mt-3 t-h1">Påmelding til Mallorca</h1>
            <p className="mt-4 t-body text-ink-2">
              {TRIP.title}, {formatSpan(TRIP.from, TRIP.to)}. Vi har {TRIP.rooms} rom. Prisen er {TRIP.priceDouble} euro per person i dobbeltrom og {TRIP.priceSingle} euro i enkeltrom. Prisene inkluderer halvpensjon. Det blir tre grupper med ulikt nivå, og turen er for medlemmer av BOC. Du må være medlem før du drar. Påmeldingen er bindende når fakturaen, som sendes i desember, er betalt.
            </p>
          </div>
        </div>
      </Section>
      <Section rule="top" className="py-12 lg:py-16">
        <div className="page grid gap-12 lg:grid-cols-[minmax(0,34rem)_minmax(0,1fr)] lg:gap-16">
          {TRIP.open ? <TripSignupForm /> : <p className="t-body text-ink-2">Påmeldingen er stengt.</p>}
          <div className="min-w-0">
            <div className="mb-8 flex items-center gap-5">
              <TripProgress taken={roomsTaken(db.tripSignups)} total={TRIP.rooms} size={112} />
              <p className="t-small text-ink-2">
                {TRIP.rooms - Math.min(TRIP.rooms, roomsTaken(db.tripSignups))} rom igjen. Rommene regnes ut fra påmeldingene: ett enkeltrom per enkeltrom, og ett dobbeltrom per to i dobbeltrom.
              </p>
            </div>
            <h2 className="t-h3">Dette er påmeldt ({rows.length})</h2>
            <p className="mt-1 mb-4 t-small text-ink-3">Navn, datoer, rom, romkamerat og sykkel. Kontaktopplysninger vises ikke.</p>
            <TripSignupList rows={rows} />
          </div>
        </div>
      </Section>
    </>
  );
}
