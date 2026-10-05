import { AdminHeader } from "@/components/admin/bits";
import { StructureExplorer, type StructureNode } from "@/components/admin/structure-explorer";
import { inSubtree, upcoming } from "@/lib/activities";
import { articlesInSubtree, contactsFor, fullName, membershipTitle } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { accessList, isAdminOf, ROLE_EXPLAINER, ROLE_LABEL } from "@/lib/permissions";
import type { RoleKind } from "@/lib/types";

export const metadata = { title: "Struktur" };

export default async function StructurePage({ searchParams }: { searchParams: Promise<{ node?: string; mangler?: string }> }) {
  const { node: nodeParam, mangler } = await searchParams;
  const { db, org, user, today } = await loadAdmin();

  const nodes: StructureNode[] = org.nodes.map((n) => {
    const subtree = org.subtree(n.id);
    // The same rule as the warning on the overview: a group with nobody listed as trainer or team manager on its page.
    const missingContact = n.kind !== "club" && org.isLeaf(n.id) && contactsFor(db, org, n.id, { inherit: false }).length === 0;
    const members = db.people.filter((p) => p.memberships.some((m) => subtree.has(m.nodeId)));
    return {
      id: n.id,
      parentId: n.parentId,
      name: n.name,
      kind: n.kind,
      levelLabel: org.levelLabel(n),
      ageLabel: n.ageLabel,
      href: org.href(n.id),
      groups: org.groups(n.id).length,
      athletes: members.filter((p) => p.memberships.some((m) => m.role === "athlete" && subtree.has(m.nodeId))).length,
      staff: members.filter((p) => p.memberships.some((m) => m.role !== "athlete" && subtree.has(m.nodeId))).length,
      weekly: db.series.filter((s) => subtree.has(s.nodeId) && s.to >= today).length,
      upcoming: upcoming(inSubtree(db.activities, org, n.id), today, 13).length,
      stories: articlesInSubtree(db, org, n.id).length,
      rollup: org
        .lineage(n.id)
        .slice(1, -1)
        .reverse()
        .map((x) => x.name),
      access: accessList(db, org, n.id).map((a) => ({
        name: a.user.name,
        role: ROLE_LABEL[a.role],
        from: a.fromNode.name,
        inherited: a.inherited,
        needsApproval: a.role === "contributor",
      })),
      contacts: contactsFor(db, org, n.id, { inherit: false })
        .slice(0, 4)
        .map((c) => ({ name: fullName(c.person), title: membershipTitle(c.membership.role, c.membership.title) })),
      missingContact,
      canManage: isAdminOf(user, org, n.id),
      path: org.trail(n.id).map((x) => x.name).join(" › "),
    };
  });

  const roles = (["clubAdmin", "sectionAdmin", "groupAdmin", "contributor", "guardian"] as RoleKind[]).map((role) => ({
    role: ROLE_LABEL[role],
    explainer: ROLE_EXPLAINER[role],
    examples: db.users
      .filter((u) => u.roles.some((r) => r.role === role))
      .slice(0, 3)
      .map((u) => `${u.name} (${u.roles.filter((r) => r.role === role).map((r) => org.get(r.nodeId)?.name).join(", ")})`),
  }));

  const missing = nodes.filter((n) => n.missingContact);
  // From the overview's warning the first group without a contact is already open.
  const initialId =
    nodeParam && org.get(nodeParam) ? nodeParam : mangler === "kontaktperson" && missing[0] ? missing[0].id : "j16-2";

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Struktur"
        description="Slik er klubben organisert. Sider, aktiviteter, innlegg og tilgang følger strukturen: det som publiseres på et lag vises også på nivåene over, og en rolle gjelder alt under nivået den er gitt på."
      />
      <StructureExplorer nodes={nodes} rootId={org.root.id} initialId={initialId} roles={roles} showMissingContacts={mangler === "kontaktperson"} />
    </div>
  );
}
