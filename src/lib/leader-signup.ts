import type { Org } from "./org";
import { can, isFullAdmin } from "./access";
import type { Db } from "./types";

/**
 * TEMPORARY self-service sign-up for the group leaders' meeting (/bli-gruppeleder): each leader makes their own user and
 * takes responsibility for their group, instead of the club administrator inviting them one by one.
 *
 * It gives out access without an invitation, and is OPEN by default: anyone with the address can take a group nobody runs,
 * but only the owner of the e-mail address can sign in, since the sign-in code goes there. Setting the environment
 * variable LEADER_SIGNUP to «off» closes the page and the action at once; any other text (not «open») becomes a meeting
 * code the form asks for. Users already made stay,
 * with the same access as an invited team leader (the «Lagleder» quick pick), and can be changed or deactivated under
 * /admin/brukere. Remove this file, the page, the form and `claimGroup` in actions.ts when the meeting is over.
 *
 * A group can be claimed only while no active user other than a club administrator can publish for it, so the form cannot take a group away
 * from, or add to, someone who is already responsible.
 */

const setting = () => process.env.LEADER_SIGNUP?.trim() ?? "";
const CLOSED = ["off", "closed", "stengt", "0"];
const OPEN = ["", "open", "åpen"];

/** Open by default. LEADER_SIGNUP=off closes the page and the action at once. */
export const leaderSignupEnabled = () => !CLOSED.includes(setting().toLowerCase());
/** Any other value of LEADER_SIGNUP is a meeting code the form then asks for. */
export const signupNeedsCode = () => leaderSignupEnabled() && !OPEN.includes(setting().toLowerCase());

/** Compares in constant time, so the answer does not depend on how many characters were right. */
export function signupCodeMatches(given: string): boolean {
  if (!leaderSignupEnabled()) return false;
  if (!signupNeedsCode()) return true;
  const wanted = setting();
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
