// Checks the permission rules in src/lib/access.ts on a small tree: who may do what where, and that nobody can give more than they hold.
// Run with: npm run check:access

import { createOrg } from "../src/lib/org.ts";
import { can, grantable, grantProblem, isFullAdmin, permissionsAt, roleKindFor, PRESETS } from "../src/lib/access.ts";
const node = (id: string, parentId: string | null, kind: string, sortOrder = 0) => ({ id, parentId, kind, name: id, slug: id, sortOrder }) as any;
const org = createOrg([node("club", null, "club"), node("sport", "club", "sport"), node("g1", "sport", "team"), node("g2", "sport", "team")]);
const root = org.root.id;
const U = (roles: any[]) => ({ roles }) as any;
const t = (name: string, ok: boolean) => console.log((ok ? "ok   " : "FAIL ") + name);
// legacy
const legacyAdmin = U([{ role: "groupAdmin", nodeId: "g1" }]);
t("legacy groupAdmin publishes in g1", can(legacyAdmin, org, "g1", "publish_posts"));
t("legacy groupAdmin not in g2", !can(legacyAdmin, org, "g2", "publish_posts"));
t("legacy groupAdmin cannot invite", !can(legacyAdmin, org, "g1", "users"));
t("legacy clubAdmin full", isFullAdmin(U([{ role: "clubAdmin", nodeId: root }])));
// preset board at root is not full admin
const board = U([{ role: "clubAdmin", nodeId: root, can: PRESETS.find((p) => p.id === "board")!.can }]);
t("board member is not a full club admin", !isFullAdmin(board));
t("board member cannot anonymise (club-wide)", !can(board, org, root, "privacy"));
// lagleder who may invite in g1
const lead = U([{ role: "groupAdmin", nodeId: "g1", can: ["write_posts", "publish_posts", "users"] }]);
t("lead may invite in g1", can(lead, org, "g1", "users"));
t("lead may not invite in g2", !can(lead, org, "g2", "users"));
t("lead can grant only what they hold", grantProblem(lead, org, "g1", ["write_posts"]) === undefined);
t("lead cannot grant members (not held)", !!grantProblem(lead, org, "g1", ["members"]));
t("lead cannot grant invite beyond? holds users so can", grantProblem(lead, org, "g1", ["users"]) === undefined);
t("lead cannot grant in g2", !!grantProblem(lead, org, "g2", ["write_posts"]));
t("club-wide permission only at root", !!grantProblem(U([{ role: "clubAdmin", nodeId: root }]), org, "g1", ["privacy"]));
t("full admin can grant anything at root", grantProblem(U([{ role: "clubAdmin", nodeId: root }]), org, root, ["privacy", "club", "users"]) === undefined);
t("grantable for lead at g1 is exactly what is held", JSON.stringify(grantable(lead, org, "g1").sort()) === JSON.stringify(["publish_posts", "users", "write_posts"]));
t("read-only assignment has no actions", permissionsAt(U([{ role: "contributor", nodeId: "g1", can: [] }]), org, "g1").size === 0);
t("role kind derived", roleKindFor(["write_posts"], "g1", org) === "contributor" && roleKindFor(["publish_posts"], "g1", org) === "groupAdmin" && roleKindFor(["publish_posts"], "sport", org) === "sectionAdmin" && roleKindFor([], root, org) === "clubAdmin");
