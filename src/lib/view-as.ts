import { isFullAdmin, PRESETS, roleKindFor } from "./access";
import { createOrg, type Org } from "./org";
import type { AccessPreset, Db, Permission, User } from "./types";

/**
 * «Se som»: a club administrator can look at admin as someone with a smaller role would, to see what a group leader
 * sees and can do. It is a cookie holding `preset:nodeId`, read in `signedIn` (lib/session.ts), and only honoured for a
 * club administrator with every right. The user stays the same (the same id, so what is written is still written by the
 * administrator), but their roles are replaced by the one chosen: the quick pick at that group, and, for the team leader,
 * the right to invite others, as for the group leaders who sign up themselves (lib/leader-signup.ts). Nothing else
 * is switched: the permissions are the ones a real user with that role would have, and changes are saved for real.
 */

export const VIEW_AS_COOKIE = "klubb-se-som";

/** The roles that can be viewed: the smaller quick picks. */
export const VIEW_AS_PRESETS: AccessPreset[] = ["teamLead", "coach", "parent"];

export interface ViewAsGroup {
  id: string;
  name: string;
  /** The levels above, «Sykling · Ungdom», to tell groups with the same name apart. */
  trail: string;
}

/** The groups and sections that can be viewed as: disciplines, age groups, teams and every group people join. */
export function viewAsGroups(db: Db, org: Org = createOrg(db.nodes)): ViewAsGroup[] {
  return org.nodes
    .filter((n) => n.kind !== "club" && (["discipline", "ageGroup", "team"].includes(n.kind) || org.isLeaf(n.id)))
    .map((n) => ({
      id: n.id,
      name: n.name,
      trail: org
        .trail(n.id)
        .slice(0, -1)
        .map((x) => x.name)
        .join(" · "),
    }))
    .sort((a, b) => a.trail.localeCompare(b.trail, "nb") || a.name.localeCompare(b.name, "nb"));
}

export const encodeViewAs = (preset: AccessPreset, nodeId: string) => `${preset}:${nodeId}`;

/** The user as the chosen role would see admin, or undefined when the value is not valid or `real` may not do this. */
export function viewAsUser(db: Db, real: User, value: string | undefined): { user: User; preset: AccessPreset; nodeId: string } | undefined {
  if (!value || !isFullAdmin(real)) return undefined;
  const [preset, nodeId] = value.split(":") as [AccessPreset, string];
  const info = VIEW_AS_PRESETS.includes(preset) ? PRESETS.find((p) => p.id === preset) : undefined;
  const org = createOrg(db.nodes);
  if (!info || !nodeId || nodeId === org.root.id || !org.get(nodeId)) return undefined;
  const can: Permission[] = [...info.can, ...(preset === "teamLead" ? (["users"] as const) : [])];
  return { user: { ...real, roles: [{ role: roleKindFor(can, nodeId, org), nodeId, can, preset }] }, preset, nodeId };
}
