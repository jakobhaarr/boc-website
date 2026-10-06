import type { Org } from "./org";
import type { AccessPreset, Permission, RoleAssignment, RoleKind, User } from "./types";

/**
 * Who may do what, as permissions. Being invited to an area lets a person
 * read what is there; every action that changes something is a permission of
 * its own, given on purpose by whoever invites. A permission is given for an
 * area and counts for everything below it.
 *
 * The five roles the club has always had keep their meaning: an assignment
 * without `can` has the permissions its role maps to (LEGACY_PERMISSIONS).
 * A new invitation stores the permissions it ticked, and the role is then
 * only the nearest label. The quick picks (PRESETS) are not roles either:
 * they tick a set and stay editable before the invitation goes out.
 */

export interface PermissionInfo {
  id: Permission;
  /** What the person can do, in the words of the admin. */
  label: string;
  hint: string;
  group: "news" | "group" | "people" | "club";
  /** Reserved for the whole club: only given at the top. */
  clubWide?: boolean;
  /** Lets the person change who may do what, so it is shown with a warning. */
  sensitive?: boolean;
}

export const PERMISSIONS: PermissionInfo[] = [
  { id: "write_posts", label: "Skrive nyheter", hint: "Innleggene sendes til godkjenning før de vises.", group: "news" },
  { id: "publish_posts", label: "Publisere og redigere nyheter", hint: "Publiserer direkte, redigerer og sletter innlegg, og godkjenner andres.", group: "news" },
  { id: "edit_group", label: "Redigere gruppesiden", hint: "Tekster, første trening, sitater og hovedbilde.", group: "group" },
  { id: "activities", label: "Administrere aktiviteter", hint: "Avlyse og gjenopprette økter.", group: "group" },
  { id: "structure", label: "Opprette og slette grupper", hint: "Endre hvordan klubben er bygd opp.", group: "group" },
  { id: "venues", label: "Administrere arenaer", hint: "Treningssteder og bildene av dem.", group: "group" },
  { id: "members", label: "Administrere medlemmer", hint: "Endre personer og gruppemedlemskap, registrere fotosamtykke og hente inn fra Spond.", group: "people" },
  { id: "users", label: "Invitere brukere", hint: "Kan gi andre tilgang, men aldri mer enn man selv har.", group: "people", sensitive: true },
  { id: "club", label: "Styre forsiden og klubbinnstillinger", hint: "Hva som vises på forsiden, farger og fotografer.", group: "club", clubWide: true },
  { id: "privacy", label: "Anonymisere og slette personer", hint: "Kan ikke angres.", group: "club", clubWide: true, sensitive: true },
];

export const PERMISSION_GROUPS: { id: PermissionInfo["group"]; label: string }[] = [
  { id: "news", label: "Nyheter" },
  { id: "group", label: "Gruppen" },
  { id: "people", label: "Folk" },
  { id: "club", label: "Hele klubben" },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSIONS.map((p) => p.id);
const CLUB_WIDE = new Set<Permission>(PERMISSIONS.filter((p) => p.clubWide).map((p) => p.id));
export const permissionLabel = (id: Permission) => PERMISSIONS.find((p) => p.id === id)?.label ?? id;

/** What each of the old roles may do. Keeps every existing user exactly where they were. */
export const LEGACY_PERMISSIONS: Record<RoleKind, Permission[]> = {
  guardian: ["write_posts"],
  contributor: ["write_posts"],
  groupAdmin: ["write_posts", "publish_posts", "edit_group", "activities", "members", "structure"],
  sectionAdmin: ["write_posts", "publish_posts", "edit_group", "activities", "members", "structure", "venues"],
  clubAdmin: ALL_PERMISSIONS,
};

export interface PresetInfo {
  id: AccessPreset;
  label: string;
  hint: string;
  can: Permission[];
}

/** Quick picks: a starting point, never a rule. */
export const PRESETS: PresetInfo[] = [
  { id: "parent", label: "Forelder", hint: "Kan skrive nyheter til godkjenning, ellers ingenting.", can: ["write_posts"] },
  { id: "coach", label: "Trener", hint: "Publiserer nyheter og avlyser økter.", can: ["write_posts", "publish_posts", "activities"] },
  { id: "teamLead", label: "Lagleder", hint: "Holder gruppesiden oppdatert og passer på medlemmene.", can: ["write_posts", "publish_posts", "edit_group", "activities", "members"] },
  { id: "board", label: "Styremedlem", hint: "Alt om innhold og medlemmer for hele klubben, men ikke å invitere eller slette personer.", can: ["write_posts", "publish_posts", "edit_group", "activities", "structure", "venues", "members"] },
];

export const presetLabel = (id: AccessPreset) => PRESETS.find((p) => p.id === id)?.label ?? "";

/** The permissions an assignment gives. */
export const permsOf = (a: RoleAssignment): Permission[] => a.can ?? LEGACY_PERMISSIONS[a.role];

/** The permissions a person has at a node: the union over every assignment covering it. */
export function permissionsAt(user: Pick<User, "roles">, org: Org, nodeId: string): Set<Permission> {
  const out = new Set<Permission>();
  for (const r of user.roles) if (org.contains(r.nodeId, nodeId)) for (const p of permsOf(r)) out.add(p);
  return out;
}

export const can = (user: Pick<User, "roles">, org: Org, nodeId: string, permission: Permission) => permissionsAt(user, org, nodeId).has(permission);

export const canAnywhere = (user: Pick<User, "roles">, permission: Permission) => user.roles.some((r) => permsOf(r).includes(permission));

/** Holds a whole-club permission: an assignment at the top that includes it. */
export const canClubWide = (user: Pick<User, "roles">, permission: Permission) => user.roles.some((r) => r.role === "clubAdmin" && permsOf(r).includes(permission));

/** Everything, for the whole club: what «klubbadministrator» has always meant. */
export const isFullAdmin = (user: Pick<User, "roles">) => user.roles.some((r) => r.role === "clubAdmin" && ALL_PERMISSIONS.every((p) => permsOf(r).includes(p)));

/** Permissions that make sense for an area: the whole-club ones only at the top. */
export const applicablePermissions = (isRoot: boolean): Permission[] => ALL_PERMISSIONS.filter((p) => isRoot || !CLUB_WIDE.has(p));

/** What `actor` may give at a node: what they hold there themselves, and nothing above it. */
export function grantable(actor: Pick<User, "roles">, org: Org, nodeId: string): Permission[] {
  const held = permissionsAt(actor, org, nodeId);
  return applicablePermissions(nodeId === org.root.id).filter((p) => held.has(p));
}

/** The role kind closest to a set of permissions at a node, for labels and colours. */
export function roleKindFor(can: Permission[], nodeId: string, org: Org): RoleKind {
  if (nodeId === org.root.id) return "clubAdmin";
  if (can.includes("publish_posts")) return org.isLeaf(nodeId) ? "groupAdmin" : "sectionAdmin";
  return "contributor";
}

/** Why a set of permissions may not be given at a node by this actor, or undefined. */
export function grantProblem(actor: Pick<User, "roles">, org: Org, nodeId: string, requested: Permission[]): string | undefined {
  if (!org.get(nodeId)) return "Velg hvor personen skal få tilgang.";
  if (requested.some((p) => !ALL_PERMISSIONS.includes(p))) return "Ukjent tilgang.";
  const isRoot = nodeId === org.root.id;
  const offered = new Set(applicablePermissions(isRoot));
  const wrongPlace = requested.find((p) => !offered.has(p));
  if (wrongPlace) return `«${permissionLabel(wrongPlace)}» gjelder hele klubben og kan bare gis der.`;
  if (!can(actor, org, nodeId, "users")) return "Du har ikke tilgang til å invitere brukere her.";
  const ok = new Set(grantable(actor, org, nodeId));
  const tooMuch = requested.find((p) => !ok.has(p));
  if (tooMuch) return `Du kan ikke gi «${permissionLabel(tooMuch)}», for du har den ikke selv her.`;
  return undefined;
}

/** The label for an assignment in a list: the quick pick it was made from, the old role, or «Egendefinert». */
export function accessLabel(a: RoleAssignment, roleLabels: Record<RoleKind, string>): string {
  if (a.preset) return presetLabel(a.preset);
  if (!a.can) return roleLabels[a.role];
  if (a.role === "clubAdmin" && ALL_PERMISSIONS.every((p) => a.can!.includes(p))) return roleLabels.clubAdmin;
  return "Egendefinert";
}

/** The access as part of a sentence for the invitation: «lagleder for BOC 3», «tilgang til BOC 3». */
export function accessSentence(a: RoleAssignment, nodeName: string, roleLabels: Record<RoleKind, string>): string {
  const label = accessLabel(a, roleLabels);
  if (label === "Egendefinert") return `tilgang til ${nodeName}`;
  return a.role === "clubAdmin" && !a.preset ? label.toLowerCase() : `${label.toLowerCase()} for ${nodeName}`;
}

/** The preset whose permissions exactly match a set, if any. */
export const presetMatching = (can: Permission[]): AccessPreset | undefined =>
  PRESETS.find((p) => p.can.length === can.length && p.can.every((x) => can.includes(x)))?.id;
