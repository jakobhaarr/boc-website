import { accessLabel, can, canAnywhere, canClubWide, isFullAdmin, permissionsAt, permsOf } from "./access";
import type { Org } from "./org";
import type { Article, Db, OrgNode, Permission, Person, RoleKind, User } from "./types";

/**
 * Permission model: an assignment is attached to a node and inherited by every
 * node below it, and gives permissions (lib/access.ts): the ones it lists, or
 * for the club's five old roles the ones that role has always had. What a user
 * may do at a node is the union over the assignments covering it. The strongest
 * role is only the nearest label. This is the rule set a future Supabase RLS
 * policy would mirror.
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
  const held = permissionsAt(user, org, nodeId);
  if (held.has("publish_posts")) return "direct";
  return held.has("write_posts") ? "approval" : null;
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

/** Everything for the whole club. A board member with a smaller set is not one. */
export const isClubAdmin = isFullAdmin;

/** What running a node means: any of the permissions that change how it looks or who is in it. */
const MANAGEMENT: Permission[] = ["publish_posts", "edit_group", "members", "structure"];

export function isAdminOf(user: User, org: Org, nodeId: string): boolean {
  const held = permissionsAt(user, org, nodeId);
  return MANAGEMENT.some((p) => held.has(p));
}

export const canApprove = (user: User, org: Org, nodeId: string) => can(user, org, nodeId, "publish_posts");

/**
 * Who may edit an article's text: whoever runs the group it is on, and its
 * author while it still waits for approval. A contributor never edits their
 * own piece after it is published, since that would skip the approval.
 */
export function canEditArticle(user: User, org: Org, article: Pick<Article, "nodeId" | "authorUserId" | "status">): boolean {
  return can(user, org, article.nodeId, "publish_posts") || (article.authorUserId === user.id && article.status === "pending");
}

/** Venues belong to the club, not to one group: those who run a section or the club edit them. */
export const canEditVenues = (user: User) => canAnywhere(user, "venues");

/** Naming another author is for those who run the group. */
export const canChangeAuthor = (user: User, org: Org, article: Pick<Article, "nodeId">) => can(user, org, article.nodeId, "publish_posts");

/** Irreversible — reserved for club administrators. */
export const canAnonymise = (user: User) => canClubWide(user, "privacy");
export const canFeatureOnHomepage = (user: User) => canClubWide(user, "club");
export const canChangeClubSettings = (user: User) => canClubWide(user, "club");

/** People an admin user can see in the people register. */
export function peopleInScope(user: User, org: Org, db: Db): Person[] {
  if (isClubAdmin(user)) return db.people;
  const adminNodes = user.roles.filter((r) => permsOf(r).includes("members")).map((r) => r.nodeId);
  return db.people.filter(
    (p) =>
      user.guardianOfPersonIds.includes(p.id) ||
      p.memberships.some((m) => adminNodes.some((n) => org.contains(n, m.nodeId))),
  );
}

/** Runs something: has any of the management permissions. */
export const canSeePeople = (user: User) => user.roles.some((r) => MANAGEMENT.some((p) => permsOf(r).includes(p)));

/** Photo consent is registered by whoever runs a group the person belongs to. */
export function canRecordConsent(user: User, org: Org, person: Person): boolean {
  return person.memberships.some((m) => can(user, org, m.nodeId, "members"));
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
  return { role: accessLabel(top[0], ROLE_LABEL), scope };
}
