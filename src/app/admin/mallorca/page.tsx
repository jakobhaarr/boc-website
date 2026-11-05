import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { TripSignupAdmin, type SignupRow } from "@/components/admin/trip-signup-admin";
import { loadAdmin } from "@/lib/data/queries";
import { canSeeSignups } from "@/lib/permissions";
import { TRIP } from "@/lib/trip-signup";

export const metadata = { title: "Mallorca-påmelding" };

/** Everything people wrote in the Mallorca sign-up, with contact details: only for those who run it (`canSeeSignups`). */
export default async function TripSignupsPage() {
  const { db, org, user } = await loadAdmin();
  if (!canSeeSignups(user, org)) redirect("/admin");
  const rows: SignupRow[] = db.tripSignups
    .filter((s) => s.tripId === TRIP.id)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((s) => ({ ...s }));
  return (
    <div className="page pb-16">
      <AdminHeader title="Mallorca-påmelding" description="Alle som har meldt seg på, med kontaktopplysninger. Bare du og de andre som styrer påmeldingen ser dette. Den åpne deltakerlisten på nettsiden viser bare navn, datoer, rom, romkamerat og sykkel." />
      <TripSignupAdmin rows={rows} rooms={TRIP.rooms} />
    </div>
  );
}
