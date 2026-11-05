import { accessLabel, accessSentence, can, isFullAdmin, permsOf } from "./access";
import { photoById } from "./content";
import type { Org } from "./org";
import { ROLE_LABEL } from "./permissions";
import type { Db, LocalDateTime, Person, RoleAssignment, RoleKind, User } from "./types";

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

/**
 * Keeps member and user in step: a user who is given access to a group is also a member of it. The member is the user's
 * linked person, else the person already pointing at the user, else a person in the register with the same e-mail
 * address (consent or public), else a new one. The membership is «Frivillig», which no public page shows as a contact, so
 * no name is published by this; the person starts with photo consent unknown, like any new person. Both links are set
 * (`User.personId`, `Person.userId`). Runs inside a write, on the database it is given.
 */
export function ensureMember(db: Db, user: User, nodeIds: string[]): Person {
  const email = normaliseEmail(user.email);
  const alive = (p: Person) => p.privacy.status !== "anonymised";
  let person =
    db.people.find((p) => p.id === user.personId && alive(p)) ??
    db.people.find((p) => p.userId === user.id && alive(p)) ??
    db.people.find((p) => alive(p) && [p.consentEmail, p.publicContact?.email].some((e) => e && normaliseEmail(e) === email));
  if (!person) {
    const parts = user.name.trim().split(/\s+/);
    const lastName = parts.length > 1 ? parts.pop()! : "";
    person = { id: `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, firstName: parts.join(" "), lastName, memberships: [], privacy: { status: "visible", photoConsent: "unknown" }, consentEmail: email };
    db.people.push(person);
  }
  for (const nodeId of nodeIds) if (!person.memberships.some((m) => m.nodeId === nodeId)) person.memberships.push({ nodeId, role: "volunteer" });
  person.userId = user.id;
  user.personId = person.id;
  return person;
}

/**
 * Moves everything that points at user `from` over to user `to`: the author, reviewer and editor of articles, who uploaded
 * and approved a photo, who made a venue, who is in the log, a guardian link, who confirmed an identity. Found by the field
 * names (…UserId, …UserIds, and an identity of kind «user»), so a field added later with that name follows along. The users
 * themselves are not touched. Runs inside a write.
 */
export function reassignUser(db: Db, from: string, to: string): void {
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) return value.forEach(walk);
    if (!value || typeof value !== "object") return;
    const o = value as Record<string, unknown>;
    for (const [key, v] of Object.entries(o)) {
      if (/UserId$/.test(key) && v === from) o[key] = to;
      else if (/UserIds$/.test(key) && Array.isArray(v)) o[key] = [...new Set(v.map((x) => (x === from ? to : x)))];
      else walk(v);
    }
    if (o.kind === "user" && o.refId === from) o.refId = to;
  };
  const { users: _users, ...rest } = db;
  void _users;
  walk(rest);
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

export const hasRole = (user: User, role: Pick<RoleAssignment, "role" | "nodeId">) => user.roles.some((r) => r.role === role.role && r.nodeId === role.nodeId);

/** Active club administrators, optionally as the club would stand after `change` is applied. */
const activeClubAdmins = (users: User[]) => users.filter((u) => u.active !== false && isFullAdmin(u));

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
    if (isFullAdmin(target) && !isFullAdmin(after)) return "Du kan ikke fjerne din egen tilgang som klubbadministrator.";
  }
  return undefined;
}

/** What a user can do, in a few words for a list: «Klubbadministrator», «Lagadministrator · Zwift». */
export function roleSummary(org: Org, user: User): string {
  if (!user.roles.length) return "Ingen tilgang";
  return user.roles.map((r) => (r.role === "clubAdmin" ? accessLabel(r, ROLE_LABEL) : `${accessLabel(r, ROLE_LABEL)} · ${org.get(r.nodeId)?.name ?? "ukjent"}`)).join(", ");
}

/** The access as part of a sentence, for the invitation: «lagadministrator for Zwift», «klubbadministrator». */
export function roleSentence(org: Org, user: Pick<User, "roles">): string {
  const parts = user.roles.map((r) => accessSentence(r, org.get(r.nodeId)?.name ?? "klubben", ROLE_LABEL));
  return parts.join(" og ") || "bruker";
}

/**
 * Groups nobody who can publish for them is able to sign in as: no active
 * user is a group, section or club administrator covering them. Someone has
 * to be able to keep the page up to date.
 */
export function groupsWithoutAdmin(db: Db, org: Org): { id: string; name: string }[] {
  const admins = db.users.filter((u) => u.active !== false);
  return org.nodes
    .filter((n) => n.kind !== "club" && org.isLeaf(n.id))
    .filter((n) => !admins.some((u) => can(u, org, n.id, "publish_posts")))
    .map((n) => ({ id: n.id, name: n.name }));
}

/**
 * Groups with no team leader of their own: no active user other than a club administrator holds a role directly at the
 * group that lets them publish for it. A section's administrator (a discipline) covers the groups below only from
 * above, which is not a leader for the group itself. Used for the notice on the overview (/admin).
 * Method: a group (a leaf below the club) is without leader when no active user outside the full administrators has a
 * role with `nodeId` equal to the group and the right to publish.
 */
export function groupsWithoutLeader(db: Db, org: Org): { id: string; name: string }[] {
  const leaders = db.users.filter((u) => u.active !== false && !isFullAdmin(u));
  return org.nodes
    .filter((n) => n.kind !== "club" && org.isLeaf(n.id))
    .filter((n) => !leaders.some((u) => u.roles.some((r) => r.nodeId === n.id && permsOf(r).includes("publish_posts"))))
    .map((n) => ({ id: n.id, name: n.name }));
}

/**
 * The picture shown for a user in admin: the one they set themselves, or else
 * the portrait of the person they are linked to (never an anonymised person's).
 * Admin only; the public site follows the person's photo consent instead.
 */
export function userPhoto(db: Db, user: Pick<User, "avatar" | "personId">): { src: string; focal?: { x: number; y: number } } | undefined {
  if (user.avatar) return { src: user.avatar.src };
  const person = db.people.find((p) => p.id === user.personId && p.privacy.status !== "anonymised");
  const photo = photoById(db, person?.portraitPhotoId);
  return photo ? { src: photo.src, focal: photo.focal } : undefined;
}

/**
 * Newly added users, for the club administrator's overview.
 *
 * Source: the audit log. `User` has no creation date; both ways of adding a user (inviteUser, claimGroup at the
 * group-leader meeting) write an `inviteUser` audit entry with the user's id and the club-time `at`. The earliest such
 * entry per user is when the user was added. Method: keep users that still exist and whose entry is no older than `days`
 * days (compared by date in club time), newest first. Limits: users from the seed have no entry and never show here, and
 * the log keeps only the latest 300 entries, so the list is reliable for recent days only.
 */
export interface NewUser {
  user: User;
  addedAt: LocalDateTime;
  /** Who invited them; the user themselves when they took a group at the meeting. */
  addedBy?: string;
}

export function newUsers(db: Db, today: string, days = 14): NewUser[] {
  const first = new Map<string, { at: LocalDateTime; actor: string }>();
  for (const e of db.audit) {
    if (e.action !== "inviteUser" || !e.userId) continue;
    const seen = first.get(e.userId);
    if (!seen || e.at < seen.at) first.set(e.userId, { at: e.at, actor: e.actorUserId });
  }
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const from = cutoff.toISOString().slice(0, 10);
  return [...first.entries()]
    .filter(([, v]) => v.at.slice(0, 10) >= from)
    .flatMap(([id, v]) => {
      const user = db.users.find((u) => u.id === id);
      return user ? [{ user, addedAt: v.at, addedBy: db.users.find((u) => u.id === v.actor)?.name }] : [];
    })
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}
