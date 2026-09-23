import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { PeopleTable, type PersonRowView } from "@/components/admin/people-table";
import { fullName, membershipTitle } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { canSeePeople, peopleInScope } from "@/lib/permissions";
import { publishedPresence } from "@/lib/privacy";

export const metadata = { title: "Personer" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ vis?: string }> }) {
  const { vis } = await searchParams;
  const { db, org, user } = await loadAdmin();
  if (!canSeePeople(user)) redirect("/admin");

  const rows: PersonRowView[] = peopleInScope(user, org, db)
    .map((p) => {
      const presence = publishedPresence(db, org, p.id);
      const guardians = (p.guardianUserIds ?? []).flatMap((id) => db.users.filter((u) => u.id === id));
      const sport = p.memberships[0] ? org.sportOf(p.memberships[0].nodeId) : undefined;
      return {
        id: p.id,
        name: fullName(p),
        birthYear: p.birthYear,
        memberships: p.memberships.map((m) => ({
          role: membershipTitle(m.role, m.title, org.sportOf(m.nodeId)?.id),
          node: org.get(m.nodeId)?.name ?? "",
        })),
        groupIds: p.memberships.flatMap((m) => org.lineage(m.nodeId).map((n) => n.id)),
        sportId: sport?.id,
        account: p.userId ? "Egen bruker" : guardians.length ? `Foresatt: ${guardians.map((g) => g.name).join(", ")}` : "Ingen konto",
        hasUser: !!p.userId,
        presence: { photos: presence.photos.length, text: presence.text.length, activities: presence.activities.length },
        status: p.privacy.status,
        consent: p.privacy.photoConsent,
        openRequest: db.privacyRequests.some((r) => r.personId === p.id && r.status === "open"),
      };
    })
    .sort((a, b) => Number(b.openRequest) - Number(a.openRequest) || a.name.localeCompare(b.name, "nb"));

  const groups = org.nodes
    .filter((n) => n.kind !== "club" && rows.some((r) => r.groupIds.includes(n.id)))
    .map((n) => ({ id: n.id, label: org.trail(n.id).map((x) => x.name).join(" › ") }));

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Personer"
        description="Alle som er registrert i klubben. En person trenger ikke å ha brukerkonto — barn er personer, foresatte er brukere som er koblet til dem."
      />
      <PeopleTable rows={rows} groups={groups} initialView={vis === "samtykke" ? "consent" : "all"} />
    </div>
  );
}
