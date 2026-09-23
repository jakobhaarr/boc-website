import type { Org } from "./org";
import type { Db, OrgNode, Person, RoleKind, User } from "./types";

/**
 * Permission model: a role is attached to a node and inherited by every node
 * below it. The strongest role covering a node decides what a user can do
 * there. This is the rule set a future Supabase RLS policy would mirror.
 */

export const ROLE_LABEL: Record<RoleKind, string> = {
  clubAdmin: "Klubbadministrator",
  sectionAdmin: "Seksjonsadministrator",
  groupAdmin: "Lagadministrator",
  contributor: "Bidragsyter",
  guardian: "Foresatt",
};

export const ROLE_EXPLAINER: Record<RoleKind, string> = {
  clubAdmin: "Hele klubben, inkludert forsiden og personvern.",
  sectionAdmin: "Én del av klubben og alt under den.",
  groupAdmin: "Publiserer direkte og holder siden for egne lag oppdatert.",
  contributor: "Sender inn innlegg. En administrator godkjenner før publisering.",
  guardian: "Kan sende inn innlegg til barnets lag for godkjenning.",
};

const RANK: Record<RoleKind, number> = {
  clubAdmin: 5,
  sectionAdmin: 4,
  groupAdmin: 3,
  contributor: 2,
  guardian: 1,
};

export type PublishMode = "direct" | "approval";

export interface CoveringRole {
  role: RoleKind;
  /** Node the role is attached to. */
  nodeId: string;
  inherited: boolean;
}

export function rolesCovering(user: User, org: Org, nodeId: string): CoveringRole[] {
  return user.roles
    .filter((r) => org.contains(r.nodeId, nodeId))
    .map((r) => ({ role: r.role, nodeId: r.nodeId, inherited: r.nodeId !== nodeId }))
    .sort((a, b) => RANK[b.role] - RANK[a.role]);
}

export function strongestRole(user: User, org: Org, nodeId: string): RoleKind | null {
  return rolesCovering(user, org, nodeId)[0]?.role ?? null;
}

export function publishMode(user: User, org: Org, nodeId: string): PublishMode | null {
  const role = strongestRole(user, org, nodeId);
  if (!role) return null;
  return RANK[role] >= RANK.groupAdmin ? "direct" : "approval";
}

/** Every node a user may post to, with the mode that applies. */
export function publishTargets(user: User, org: Org): { node: OrgNode; mode: PublishMode }[] {
  return org.nodes
    .map((node) => ({ node, mode: publishMode(user, org, node.id) }))
    .filter((t): t is { node: OrgNode; mode: PublishMode } => t.mode !== null)
    .sort((a, b) => a.node.sortOrder - b.node.sortOrder);
}

/**
 * Composer default: the most specific node the user is responsible for.
 * A J16-2 team manager lands on J16-2; a club admin on the club.
 */
export function suggestedTarget(user: User, org: Org): string | undefined {
  const candidates = [...user.roles].sort(
    (a, b) => org.lineage(b.nodeId).length - org.lineage(a.nodeId).length || RANK[b.role] - RANK[a.role],
  );
  return candidates[0]?.nodeId;
}

export const isClubAdmin = (user: User) => user.roles.some((r) => r.role === "clubAdmin");

export function isAdminOf(user: User, org: Org, nodeId: string): boolean {
  const role = strongestRole(user, org, nodeId);
  return role !== null && RANK[role] >= RANK.groupAdmin;
}

export const canApprove = isAdminOf;
export const canEditActivities = isAdminOf;

/** Irreversible — reserved for club administrators. */
export const canAnonymise = (user: User) => isClubAdmin(user);
export const canFeatureOnHomepage = (user: User) => isClubAdmin(user);
export const canChangeClubSettings = (user: User) => isClubAdmin(user);

/** People an admin user can see in the people register. */
export function peopleInScope(user: User, org: Org, db: Db): Person[] {
  if (isClubAdmin(user)) return db.people;
  const adminNodes = user.roles.filter((r) => RANK[r.role] >= RANK.groupAdmin).map((r) => r.nodeId);
  return db.people.filter(
    (p) =>
      user.guardianOfPersonIds.includes(p.id) ||
      p.memberships.some((m) => adminNodes.some((n) => org.contains(n, m.nodeId))),
  );
}

export const canSeePeople = (user: User) => user.roles.some((r) => RANK[r.role] >= RANK.groupAdmin);

/** Photo consent is registered by whoever runs a group the person belongs to. */
export function canRecordConsent(user: User, org: Org, person: Person): boolean {
  return person.memberships.some((m) => isAdminOf(user, org, m.nodeId));
}

/** Who can work on a node, and whether that access is inherited from above. */
export function accessList(db: Db, org: Org, nodeId: string) {
  return db.users
    .flatMap((user) =>
      rolesCovering(user, org, nodeId)
        .filter((r) => r.role !== "guardian")
        .slice(0, 1)
        .map((r) => ({ user, role: r.role, fromNode: org.get(r.nodeId)!, inherited: r.inherited })),
    )
    .sort((a, b) => RANK[b.role] - RANK[a.role] || a.user.name.localeCompare(b.user.name, "nb"));
}

/** "Lagadministrator · J16-2" */
export function scopeSummary(user: User, org: Org): { role: string; scope: string } {
  const top = [...user.roles].sort((a, b) => RANK[b.role] - RANK[a.role]);
  const role = top[0]?.role;
  if (!role) return { role: "Ingen rolle", scope: "" };
  const nodes = top.filter((r) => r.role === role).map((r) => org.get(r.nodeId)?.name ?? "");
  const scope = role === "clubAdmin" ? `Hele ${org.root.name}` : nodes.join(" og ");
  return { role: ROLE_LABEL[role], scope };
}
