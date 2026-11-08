import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { ButtonLink } from "@/components/ui/button";
import { PeopleTable, type PersonRowView } from "@/components/admin/people-table";
import { fullName, membershipTitle, photoById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { can, canAnywhere } from "@/lib/access";
import { canAnonymise, isClubAdmin, peopleInScope } from "@/lib/permissions";
import { publishedPresence } from "@/lib/privacy";
import { emailOf } from "@/lib/user-admin";

export const metadata = { title: "Medlemmer" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ vis?: string }> }) {
  const { vis } = await searchParams;
  const { db, org, user } = await loadAdmin();
  if (!canAnywhere(user, "members")) redirect("/admin");

  const rows: PersonRowView[] = peopleInScope(user, org, db)
    .map((p) => {
      const presence = publishedPresence(db, org, p.id);
      const guardians = (p.guardianUserIds ?? []).flatMap((id) => db.users.filter((u) => u.id === id));
      const sport = p.memberships[0] ? org.sportOf(p.memberships[0].nodeId) : undefined;
      const portrait = p.privacy.status !== "anonymised" ? photoById(db, p.portraitPhotoId) : undefined;
      return {
        id: p.id,
        name: fullName(p),
        photo: portrait ? { src: portrait.src, focal: portrait.focal } : undefined,
        birthYear: p.birthYear,
        memberships: p.memberships.map((m) => ({
          role: membershipTitle(m.role, m.title, org.sportOf(m.nodeId)?.id),
          node: org.get(m.nodeId)?.name ?? "",
        })),
        groupIds: p.memberships.flatMap((m) => org.lineage(m.nodeId).map((n) => n.id)),
        membershipNodeIds: [...new Set(p.memberships.map((m) => m.nodeId))],
        sportId: sport?.id,
        email: emailOf(p),
        merge: {
          birth: p.birthDate ?? (p.birthYear ? String(p.birthYear) : undefined),
          email: p.consentEmail || undefined,
          strava: p.stravaUrl || undefined,
          portrait:
            p.portraitPhotoId && photoById(db, p.portraitPhotoId) && p.privacy.status !== "anonymised"
              ? { id: p.portraitPhotoId, src: photoById(db, p.portraitPhotoId)!.src }
              : undefined,
        },
        account: p.userId ? "Egen bruker" : guardians.length ? `Foresatt: ${guardians.map((g) => g.name).join(", ")}` : "Ingen konto",
        hasUser: !!p.userId,
        presence: { photos: presence.photos.length, text: presence.text.length, activities: presence.activities.length },
        honorary: !!p.honorary,
        status: p.privacy.status,
        consent: p.privacy.photoConsent,
        openRequest: db.privacyRequests.some((r) => r.personId === p.id && r.status === "open"),
      };
    })
    .sort((a, b) => Number(b.openRequest) - Number(a.openRequest) || a.name.localeCompare(b.name, "nb"));

  const groups = org.nodes
    .filter((n) => n.kind !== "club" && rows.some((r) => r.groupIds.includes(n.id)))
    .map((n) => ({
      id: n.id,
      label: org
        .trail(n.id)
        .map((x) => x.name)
        .join(" › "),
    }));

  // For the bulk actions: the groups the user may add people to or take them out of, and whether they may erase people.
  const manageGroups = org.nodes
    .filter((n) => n.kind !== "club" && org.isLeaf(n.id) && can(user, org, n.id, "members"))
    .map((n) => ({
      id: n.id,
      label: org
        .trail(n.id)
        .map((x) => x.name)
        .join(" › "),
    }));

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Medlemmer"
        description="Alle som er registrert i klubben. En person trenger ikke å ha brukerkonto: barn er personer, og foresatte er brukere som er koblet til dem."
        actions={
          <ButtonLink href="/admin/personer/import" variant="secondary" size="sm">
            Importer fra Spond
          </ButtonLink>
        }
      />
      <PeopleTable
        rows={rows}
        groups={groups}
        initialView={vis === "samtykke" ? "consent" : "all"}
        canDelete={canAnonymise(user)}
        canMerge={isClubAdmin(user)}
        manageGroups={manageGroups}
      />
    </div>
  );
}
