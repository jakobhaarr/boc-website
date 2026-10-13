import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { RouteManager } from "@/components/admin/route-manager";
import { can, canAnywhere } from "@/lib/access";
import { fullName, photoById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { photographerOptions } from "@/lib/photo-meta";

export const metadata = { title: "Anbefalte turer" };

/**
 * The tours the club recommends (RecommendedRoute), shown on /anbefalte-turer: the link to the route on Strava,
 * its length and climbing (typed in here, never read from Strava), whether it is on Mallorca, and the pictures.
 * Whoever may edit a branch (Landevei, Terreng) manages its tours.
 */
export default async function RoutesPage() {
  const { db, org, user, today } = await loadAdmin();
  if (!canAnywhere(user, "edit_group")) redirect("/admin");

  const branches = org.nodes.filter((n) => n.kind === "discipline" && can(user, org, n.id, "edit_group")).map((b) => ({ id: b.id, name: b.name }));
  const editable = new Set(branches.map((b) => b.id));
  const routes = db.routes
    .filter((t) => editable.has(t.nodeId))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"))
    .map((t) => ({
      id: t.id,
      nodeId: t.nodeId,
      branch: org.get(t.nodeId)?.name ?? "",
      name: t.name,
      stravaUrl: t.stravaUrl,
      distanceKm: t.distanceKm,
      elevationM: t.elevationM,
      mallorca: !!t.mallorca,
      description: t.description ?? "",
      stops: t.stops ?? [],
      photos: t.photoIds.flatMap((id) => {
        const p = photoById(db, id);
        return p ? [{ id: p.id, src: p.src, alt: p.alt }] : [];
      }),
    }));

  return (
    <div className="page pb-16">
      <AdminHeader title="Anbefalte turer" description="Turene klubben anbefaler: lenke til ruten på Strava, lengde, høydemeter og bilder. De står på siden Anbefalte turer, hvor besøkende kan filtrere på lengde, høydemeter og Mallorca." />
      <RouteManager
        routes={routes}
        branches={branches}
        photographers={photographerOptions(db, org, user.id, org.root.id, today, { scope: db.people })}
        clubName={db.club.shortName}
        members={db.people
          .filter((p) => p.privacy.status === "visible")
          .sort((a, b) => fullName(a).localeCompare(fullName(b), "nb"))
          .map((p) => ({ id: p.id, name: fullName(p), consent: p.privacy.photoConsent }))}
      />
    </div>
  );
}
