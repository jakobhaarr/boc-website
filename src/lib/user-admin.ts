import type { Org } from "./org";
import { ROLE_LABEL } from "./permissions";
import type { Db, RoleAssignment, RoleKind, User } from "./types";

/**
 * Rules for who may sign in and with what role, as plain functions on the
 * database, so they can be checked without a server. Only club administrators
 * manage users (the server actions check that); what a change is allowed to do
 * is decided here. The one rule behind most of them: the club must never be
 * left without an active club administrator, and nobody may lock themselves out.
 */

export const ASSIGNABLE_ROLES: RoleKind[] = ["clubAdmin", "sectionAdmin", "groupAdmin", "contributor", "guardian"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normaliseEmail = (value: string) => value.trim().toLowerCase();

export function validateName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return "Skriv navnet.";
  if (name.length > 80) return "Navnet kan være opptil 80 tegn.";
  return undefined;
}

/** Checks the address, and that no other user has it. `ownId` is the user being edited, if any. */
export function validateEmail(db: Db, value: string, ownId?: string): string | undefined {
  const email = normaliseEmail(value);
  if (!email) return "Skriv e-postadressen.";
  if (email.length > 254 || !EMAIL.test(email)) return "Skriv en gyldig e-postadresse.";
  if (db.users.some((u) => u.id !== ownId && normaliseEmail(u.email) === email)) return "Denne e-postadressen er allerede i bruk.";
  return undefined;
}

/** A club role sits on the club itself; every other role sits on one part of it. */
export function validateRole(org: Org, role: RoleKind, nodeId: string): string | undefined {
  if (!ASSIGNABLE_ROLES.includes(role)) return "Ukjent rolle.";
  const node = org.get(nodeId);
  if (!node) return "Velg hvor rollen gjelder.";
  if (role === "clubAdmin") return nodeId === org.root.id ? undefined : "Klubbadministrator gjelder hele klubben.";
  if (nodeId === org.root.id) return `${ROLE_LABEL[role]} må gis på en idrett, gren eller gruppe, ikke på hele klubben.`;
  return undefined;
}

export const hasRole = (user: User, role: RoleAssignment) => user.roles.some((r) => r.role === role.role && r.nodeId === role.nodeId);

/** Active club administrators, optionally as the club would stand after `change` is applied. */
const activeClubAdmins = (users: User[]) => users.filter((u) => u.active !== false && u.roles.some((r) => r.role === "clubAdmin"));

/**
 * Why a change to `target` must not happen, or undefined if it may. `after`
 * is the user as it would look afterwards; `actorId` is who makes the change.
 */
export function lockoutProblem(db: Db, actorId: string, target: User, after: User | null): string | undefined {
  const others = db.users.filter((u) => u.id !== target.id);
  const stillThere = after ? [...others, after] : others;
  if (activeClubAdmins(stillThere).length === 0) return "Klubben må ha minst én aktiv klubbadministrator.";
  if (target.id === actorId) {
    if (!after || after.active === false) return "Du kan ikke deaktivere deg selv.";
    if (!after.roles.some((r) => r.role === "clubAdmin")) return "Du kan ikke fjerne din egen rolle som klubbadministrator.";
  }
  return undefined;
}

/** What a user can do, in a few words for a list: «Klubbadministrator», «Lagadministrator · Zwift». */
export function roleSummary(org: Org, user: User): string {
  if (!user.roles.length) return "Ingen tilgang";
  return user.roles.map((r) => (r.role === "clubAdmin" ? ROLE_LABEL[r.role] : `${ROLE_LABEL[r.role]} · ${org.get(r.nodeId)?.name ?? "ukjent"}`)).join(", ");
}

/**
 * Groups nobody who can publish for them is able to sign in as: no active
 * user is a group, section or club administrator covering them. Someone has
 * to be able to keep the page up to date.
 */
export function groupsWithoutAdmin(db: Db, org: Org): { id: string; name: string }[] {
  const strong: RoleKind[] = ["clubAdmin", "sectionAdmin", "groupAdmin"];
  const admins = db.users.filter((u) => u.active !== false);
  return org.nodes
    .filter((n) => n.kind !== "club" && org.isLeaf(n.id))
    .filter((n) => !admins.some((u) => u.roles.some((r) => strong.includes(r.role) && org.contains(r.nodeId, n.id))))
    .map((n) => ({ id: n.id, name: n.name }));
}
