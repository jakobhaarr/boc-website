import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { MembershipManager } from "@/components/admin/membership-manager";
import { loadAdmin } from "@/lib/data/queries";
import { canChangeClubSettings } from "@/lib/permissions";

export const metadata = { title: "Medlemskap og priser" };

/**
 * The club's membership rates (Club.membership), set in one place. Bli med, Barn og ungdom and the front page read them from here,
 * so a price is changed once. Only whoever may change the club's settings sees the page.
 */
export default async function MembershipPage() {
  const { db, user } = await loadAdmin();
  if (!canChangeClubSettings(user)) redirect("/admin");
  return (
    <div className="page pb-16">
      <AdminHeader title="Medlemskap og priser" description="Prisene på de ulike medlemskapene. De brukes overalt på nettsiden der en pris nevnes, så du endrer dem bare her. Rekkefølgen her er rekkefølgen på nettsiden." />
      <MembershipManager initial={db.club.membership} clubName={db.club.shortName} />
    </div>
  );
}
