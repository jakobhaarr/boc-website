import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { RaceManager } from "@/components/admin/race-manager";
import { can, canAnywhere } from "@/lib/access";
import { loadAdmin } from "@/lib/data/queries";

export const metadata = { title: "Sykkelritt" };

/**
 * The rides in the club's calendar (Race): the ones the club's riders enter together, and the club's own. They stand
 * on /sykkelritt, in the club year and in the terminliste. Whoever may edit a branch (Landevei, Terreng) manages its
 * rides; the pages some rides have of their own are not edited here.
 */
export default async function RacesPage() {
  const { db, org, user } = await loadAdmin();
  if (!canAnywhere(user, "edit_group")) redirect("/admin");

  const branches = org.nodes
    .filter((n) => n.kind === "discipline" && can(user, org, n.id, "edit_group"))
    .map((b) => ({ id: b.id, name: b.name, groups: org.groups(b.id).map((g) => ({ id: g.id, name: g.name })) }));
  const editable = new Set(branches.map((b) => b.id));
  const races = db.races
    .filter((r) => editable.has(r.nodeId))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((r) => ({
      id: r.id,
      nodeId: r.nodeId,
      branch: org.get(r.nodeId)?.name ?? "",
      name: r.name,
      date: r.date,
      endDate: r.endDate ?? "",
      place: r.place,
      format: r.format ?? "",
      organiser: r.organiser ?? "",
      url: r.url ?? "",
      ownEvent: !!r.ownEvent,
      groupIds: r.groupIds ?? [],
      ownPage: !!(r.page || r.slug || r.info),
    }));

  return (
    <div className="page pb-16">
      <AdminHeader title="Sykkelritt" description="Rittene klubben kjører sammen, og de klubben arrangerer selv. De står på sykkelritt-siden, i klubbåret og i terminlisten til gruppene som trener mot dem." />
      <RaceManager races={races} branches={branches} />
    </div>
  );
}
