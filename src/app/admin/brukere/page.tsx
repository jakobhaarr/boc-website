import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { UserManager, type UserRow } from "@/components/admin/user-manager";
import { loadAdmin } from "@/lib/data/queries";
import { accessLabel, can, canAnywhere, grantable, isFullAdmin, permsOf } from "@/lib/access";
import { ROLE_LABEL } from "@/lib/permissions";
import { groupsWithoutAdmin, userPhoto } from "@/lib/user-admin";

export const metadata = { title: "Brukere og tilgang" };

export default async function UsersPage() {
  const { db, org, user } = await loadAdmin();
  if (!canAnywhere(user, "users")) redirect("/admin");
  const fullAdmin = isFullAdmin(user);

  // Someone who may invite for one part of the club sees only the people with access to that part, and only that access.
  const mayHere = (nodeId: string) => can(user, org, nodeId, "users");
  const users: UserRow[] = db.users
    .filter((u) => fullAdmin || u.roles.some((r) => mayHere(r.nodeId)))
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      active: u.active !== false && u.roles.length > 0,
      isSelf: u.id === user.id,
      photo: userPhoto(db, u),
      roles: u.roles
        .filter((r) => fullAdmin || mayHere(r.nodeId))
        .map((r) => {
          const mine = new Set(grantable(user, org, r.nodeId));
          return {
            role: r.role,
            label: accessLabel(r, ROLE_LABEL),
            nodeId: r.nodeId,
            nodeName: r.nodeId === org.root.id ? "Hele klubben" : (org.get(r.nodeId)?.name ?? "ukjent"),
            can: permsOf(r),
            preset: r.preset,
            editable: mayHere(r.nodeId) && permsOf(r).every((p) => mine.has(p)),
          };
        }),
    }))
    .sort((a, b) => Number(b.active) - Number(a.active) || a.name.localeCompare(b.name, "nb"));

  // Where the person inviting may give access, and what they may give there. A club with one sport leaves the sport out of the path, except on the sport itself.
  const singleSport = org.sports().length === 1;
  const areas = org.nodes
    .filter((n) => mayHere(n.id))
    .map((n) => {
      const trail = org.trail(n.id);
      const label = n.kind === "club" ? "Hele klubben" : (singleSport && n.kind !== "sport" ? trail.slice(1) : trail).map((x) => x.name).join(" › ");
      return { id: n.id, label, allowed: grantable(user, org, n.id) };
    })
    .sort((a, b) => Number(b.id === org.root.id) - Number(a.id === org.root.id));

  const unattended = groupsWithoutAdmin(db, org);

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Brukere og tilgang"
        description="Alle som kan logge inn i administrasjonen, og hva de kan gjøre. Hver person har sin egen e-postadresse og får en kode på e-post når de logger inn. Her inviterer du og bestemmer hva hver enkelt kan gjøre."
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
                {unattended.map((g) => g.name).join(", ")}. Inviter noen som kan publisere, for eksempel en lagleder, eller gi en eksisterende bruker tilgangen.{" "}
                <Link href="/admin/struktur" className="underline underline-offset-4">
                  Se strukturen
                </Link>
              </p>
            </div>
          </div>
        </Panel>
      )}

      <UserManager users={users} areas={areas} rootId={org.root.id} siteName={db.club.name} fullAdmin={fullAdmin} />
    </div>
  );
}
