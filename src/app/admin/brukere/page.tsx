import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { UserManager, type UserRow } from "@/components/admin/user-manager";
import { loadAdmin } from "@/lib/data/queries";
import { isClubAdmin, ROLE_EXPLAINER, ROLE_LABEL } from "@/lib/permissions";
import { ASSIGNABLE_ROLES, groupsWithoutAdmin, userPhoto } from "@/lib/user-admin";

export const metadata = { title: "Administratorer" };

export default async function UsersPage() {
  const { db, org, user } = await loadAdmin();
  if (!isClubAdmin(user)) redirect("/admin");

  const users: UserRow[] = db.users
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      active: u.active !== false && u.roles.length > 0,
      isSelf: u.id === user.id,
      photo: userPhoto(db, u),
      roles: u.roles.map((r) => ({
        role: r.role,
        roleLabel: ROLE_LABEL[r.role],
        nodeId: r.nodeId,
        nodeName: r.role === "clubAdmin" ? "Hele klubben" : (org.get(r.nodeId)?.name ?? "ukjent"),
      })),
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "nb"));

  // A club with one sport leaves the sport out of the path, except on the sport itself.
  const singleSport = org.sports().length === 1;
  const nodes = org.nodes
    .filter((n) => n.kind !== "club")
    .map((n) => {
      const trail = org.trail(n.id);
      return { id: n.id, label: (singleSport && n.kind !== "sport" ? trail.slice(1) : trail).map((x) => x.name).join(" › ") };
    });

  const roles = ASSIGNABLE_ROLES.map((role) => ({ role, label: ROLE_LABEL[role], explainer: ROLE_EXPLAINER[role] }));
  const unattended = groupsWithoutAdmin(db, org);

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Administratorer"
        description="Alle som kan logge inn i administrasjonen, og hva de kan gjøre. Hver person har sin egen e-postadresse og får en kode på e-post når de logger inn. Her inviterer du, endrer roller og stopper tilgang."
      />

      {unattended.length > 0 && (
        <Panel title="Trenger oppmerksomhet" className="mb-5">
          <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
            <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
            <div className="min-w-0 t-small">
              <p className="font-semibold text-ink">
                {unattended.length === 1 ? "1 gruppe har ingen som kan publisere for den" : `${unattended.length} grupper har ingen som kan publisere for dem`}
              </p>
              <p className="mt-0.5 text-ink-2">
                {unattended.map((g) => g.name).join(", ")}. Inviter en lagadministrator, eller gi en eksisterende bruker rollen.{" "}
                <Link href="/admin/struktur" className="underline underline-offset-4">
                  Se strukturen
                </Link>
              </p>
            </div>
          </div>
        </Panel>
      )}

      <UserManager users={users} roles={roles} nodes={nodes} rootId={org.root.id} siteName={db.club.name} />
    </div>
  );
}
