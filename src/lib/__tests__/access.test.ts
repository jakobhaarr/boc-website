import { describe, expect, it } from "vitest";
import { can, grantable, grantProblem, isFullAdmin, permissionsAt, PRESETS, roleKindFor } from "../access";
import { createOrg } from "../org";
import { canManageSignups, canSetHonorary } from "../permissions";
import type { User } from "../types";

// A small tree: club > sport > two groups.
const node = (id: string, parentId: string | null, kind: string) => ({ id, parentId, kind, name: id, slug: id, sortOrder: 0 }) as never;
const org = createOrg([node("club", null, "club"), node("sport", "club", "sport"), node("g1", "sport", "team"), node("g2", "sport", "team")]);
const root = org.root.id;
const user = (roles: unknown[]) => ({ roles }) as unknown as User;

const clubAdmin = user([{ role: "clubAdmin", nodeId: root }]);
const board = user([{ role: "clubAdmin", nodeId: root, can: PRESETS.find((p) => p.id === "board")!.can }]);
const groupAdmin = user([{ role: "groupAdmin", nodeId: "g1" }]);

describe("legacy roles keep their meaning", () => {
  it("a group admin publishes in their group only", () => {
    expect(can(groupAdmin, org, "g1", "publish_posts")).toBe(true);
    expect(can(groupAdmin, org, "g2", "publish_posts")).toBe(false);
  });
  it("a group admin cannot invite", () => expect(can(groupAdmin, org, "g1", "users")).toBe(false));
  it("a club administrator is a full admin", () => expect(isFullAdmin(clubAdmin)).toBe(true));
});

describe("the board member quick pick", () => {
  it("is not a full club admin", () => expect(isFullAdmin(board)).toBe(false));
  it("cannot anonymise or invite", () => {
    expect(can(board, org, root, "privacy")).toBe(false);
    expect(can(board, org, root, "users")).toBe(false);
  });
  it("manages members and groups across the club", () => {
    expect(can(board, org, "g2", "members")).toBe(true);
    expect(can(board, org, "g2", "edit_group")).toBe(true);
  });
});

describe("granting access", () => {
  const lead = user([{ role: "groupAdmin", nodeId: "g1", can: ["write_posts", "publish_posts", "users"] }]);
  it("someone can grant only what they hold, where they hold it", () => {
    expect(grantProblem(lead, org, "g1", ["write_posts"])).toBeUndefined();
    expect(grantProblem(lead, org, "g1", ["members"])).toBeTruthy();
    expect(grantProblem(lead, org, "g2", ["write_posts"])).toBeTruthy();
  });
  it("club-wide permissions are only given at the top", () => {
    expect(grantProblem(clubAdmin, org, "g1", ["privacy"])).toBeTruthy();
    expect(grantProblem(clubAdmin, org, root, ["privacy", "club", "users"])).toBeUndefined();
  });
  it("grantable is exactly what is held", () => expect([...grantable(lead, org, "g1")].sort()).toEqual(["publish_posts", "users", "write_posts"]));
  it("a read-only assignment holds no actions", () => expect(permissionsAt(user([{ role: "contributor", nodeId: "g1", can: [] }]), org, "g1").size).toBe(0));
  it("the role label follows the permissions and the place", () => {
    expect(roleKindFor(["write_posts"], "g1", org)).toBe("contributor");
    expect(roleKindFor(["publish_posts"], "g1", org)).toBe("groupAdmin");
    expect(roleKindFor(["publish_posts"], "sport", org)).toBe("sectionAdmin");
    expect(roleKindFor([], root, org)).toBe("clubAdmin");
  });
});

describe("sign-ups and honorary members are for the whole club's board", () => {
  it("club administrators and board members manage sign-ups and name honorary members", () => {
    for (const u of [clubAdmin, board]) {
      expect(canManageSignups(u, org)).toBe(true);
      expect(canSetHonorary(u, org)).toBe(true);
    }
  });
  it("a group admin does not", () => {
    expect(canManageSignups(groupAdmin, org)).toBe(false);
    expect(canSetHonorary(groupAdmin, org)).toBe(false);
  });
});
