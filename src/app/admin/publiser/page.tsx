import { redirect } from "next/navigation";
import { PublishComposer, type ComposerPerson, type ComposerTarget } from "@/components/admin/publish-composer";
import { fullName, membershipTitle } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { accessList, publishTargets, suggestedTarget } from "@/lib/permissions";

export const metadata = { title: "Nytt innlegg" };

export default async function PublishPage({ searchParams }: { searchParams: Promise<{ gruppe?: string; tekst?: string }> }) {
  const { gruppe, tekst } = await searchParams;
  const { db, org, user } = await loadAdmin();
  const targets = publishTargets(user, org);
  if (targets.length === 0) redirect("/admin");

  const views: ComposerTarget[] = targets.map(({ node, mode }) => ({
    id: node.id,
    name: node.kind === "club" ? "Hele klubben" : node.name,
    trail: org
      .trail(node.id)
      .slice(0, -1)
      .map((n) => n.name)
      .join(" · "),
    kicker: node.kind === "club" ? "Klubben" : [org.sportOf(node.id)?.name, node.kind === "sport" ? null : node.name].filter(Boolean).join(" · "),
    depth: org.lineage(node.id).length - 1,
    mode,
    rollup: org
      .lineage(node.id)
      .slice(1, -1)
      .reverse()
      .map((n) => n.name),
    approvers:
      mode === "approval"
        ? accessList(db, org, node.id)
            .filter((a) => a.role === "groupAdmin" || a.role === "sectionAdmin")
            .map((a) => a.user.name)
            .slice(0, 2)
        : [],
  }));

  const inTargets = (nodeId: string) => targets.some((t) => org.contains(t.node.id, nodeId));
  const people: ComposerPerson[] = db.people
    .filter((p) => p.memberships.some((m) => inTargets(m.nodeId)))
    .map((p) => ({
      id: p.id,
      name: fullName(p),
      firstName: p.firstName,
      role: membershipTitle(p.memberships[0].role, p.memberships[0].title, org.sportOf(p.memberships[0].nodeId)?.id),
      nodeIds: [...new Set(p.memberships.flatMap((m) => org.lineage(m.nodeId).map((n) => n.id)))],
      status: p.privacy.status,
      consent: p.privacy.photoConsent,
      athlete: p.memberships.some((m) => m.role === "athlete"),
    }))
    .sort((a, b) => Number(b.athlete) - Number(a.athlete) || a.firstName.localeCompare(b.firstName, "nb"));

  const initialTarget = (gruppe && views.find((v) => v.id === gruppe)?.id) || suggestedTarget(user, org) || views[0].id;

  return (
    <PublishComposer
      targets={views}
      people={people}
      initialTargetId={views.some((v) => v.id === initialTarget) ? initialTarget : views[0].id}
      initialText={tekst}
      authorName={user.name}
    />
  );
}
