import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { TripSignupAdmin, type SignupRow } from "@/components/admin/trip-signup-admin";
import { Breadcrumb } from "@/components/ui/primitives";
import { loadAdmin } from "@/lib/data/queries";
import { canSeeSignups } from "@/lib/permissions";
import { allSignups, sheetConfigured, sheetWritable } from "@/lib/trip-sheet";
import { roomsTaken, TRIP } from "@/lib/trip-signup";

export const metadata = { title: "Mallorca-påmelding" };

/** Everything people wrote in the Mallorca sign-up, with contact details: only for those who run it (`canSeeSignups`). */
export default async function TripSignupsPage() {
  const { db, org, user } = await loadAdmin();
  if (!canSeeSignups(user, org)) redirect("/admin");
  const rows: SignupRow[] = await allSignups(db);
  return (
    <div className="page pb-16">
      <Breadcrumb className="pt-6 md:pt-8" items={[{ label: "Påmeldinger", href: "/admin/pameldinger" }, { label: "Mallorca-påmelding" }]} />
      <AdminHeader title="Mallorca-påmelding" description="Alle som har meldt seg på, med kontaktopplysninger. Bare du og de andre som styrer påmeldingen ser dette. Den åpne deltakerlisten på nettsiden viser bare navn, datoer, rom, romkamerat og sykkel." />
      <TripSignupAdmin rows={rows} rooms={TRIP.rooms} taken={roomsTaken(rows)} weekAgo={new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 16)} sheet={{ read: sheetConfigured(), write: sheetWritable() }} />
    </div>
  );
}
