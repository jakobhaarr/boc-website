import type { Org } from "./org";
import { can, isFullAdmin } from "./access";
import type { Db } from "./types";

/**
 * TEMPORARY self-service sign-up for the group leaders' meeting (/bli-gruppeleder): each leader makes their own user and
 * takes responsibility for their group, instead of the club administrator inviting them one by one.
 *
 * It is a way to give out access without an invitation, so it is off unless the environment variable LEADER_SIGNUP is set.
 * Its value is the meeting code the leaders are given at the meeting (short enough to read out, but not guessable); the
 * value «open» means no code at all, for when the room has bad internet and the least possible friction matters (anyone
 * with the address can then take a group nobody runs, but only the owner of the e-mail address can sign in, since the
 * sign-in code goes there). Deleting the variable closes the page and the action at once. Users already made stay,
 * with the same access as an invited team leader (the «Lagleder» quick pick), and can be changed or deactivated under
 * /admin/brukere. Remove this file, the page, the form and `claimGroup` in actions.ts when the meeting is over.
 *
 * A group can be claimed only while no active user other than a club administrator can publish for it, so the form cannot take a group away
 * from, or add to, someone who is already responsible.
 */

export const signupCode = () => process.env.LEADER_SIGNUP?.trim() || undefined;
export const leaderSignupEnabled = () => !!signupCode();
/** False when LEADER_SIGNUP is «open»: the form then asks for no meeting code. */
export const signupNeedsCode = () => !!signupCode() && signupCode()!.toLowerCase() !== "open";

/** Compares in constant time, so the answer does not depend on how many characters were right. */
export function signupCodeMatches(given: string): boolean {
  const wanted = signupCode();
  if (!wanted) return false;
  if (!signupNeedsCode()) return true;
  const a = new TextEncoder().encode(given.trim().toLowerCase());
  const b = new TextEncoder().encode(wanted.toLowerCase());
  let diff = a.length ^ b.length;
  for (let i = 0; i < b.length; i++) diff |= (a[i] ?? 0) ^ b[i];
  return diff === 0;
}

export interface ClaimableGroup {
  id: string;
  name: string;
  /** The levels above, «Sykling · Ungdom», to tell groups with the same name apart. */
  trail: string;
  taken: boolean;
}

/** Every group people join (leaf), with whether someone already runs it. */
export function claimableGroups(db: Db, org: Org): ClaimableGroup[] {
  // The club administrators can publish everywhere, so they do not make a group «taken»: only someone given this group or its section.
  const active = db.users.filter((u) => u.active !== false && !isFullAdmin(u));
  return org.nodes
    .filter((n) => n.kind !== "club" && org.isLeaf(n.id))
    .map((n) => ({
      id: n.id,
      name: n.name,
      trail: org
        .trail(n.id)
        .slice(0, -1)
        .map((x) => x.name)
        .join(" · "),
      taken: active.some((u) => can(u, org, n.id, "publish_posts")),
    }))
    .sort((a, b) => a.trail.localeCompare(b.trail, "nb") || a.name.localeCompare(b.name, "nb"));
}
