import { describe, expect, it } from "vitest";
import { honoraryMembers } from "../honorary-members";

const person = (name: [string, string], honorary: { year: number } | undefined, status: "visible" | "restricted" | "anonymised" = "visible") => ({
  firstName: name[0],
  lastName: name[1],
  honorary,
  privacy: { status, photoConsent: "granted" as const },
});

describe("honoraryMembers", () => {
  it("the club's own list comes with a known year first, newest first", () => {
    const list = honoraryMembers("boc");
    expect(list[0].year).toBe(2026);
    expect(list.map((m) => m.year ?? 0)).toEqual([...list.map((m) => m.year ?? 0)].sort((a, b) => b - a));
  });
  it("a club without a list has none", () => expect(honoraryMembers("osk")).toEqual([]));
  it("adds people marked in admin, with their year", () => expect(honoraryMembers("osk", [person(["Kari", "Berg"], { year: 2027 })])).toEqual([{ name: "Kari Berg", year: 2027 }]));
  it("leaves out people who are not visible", () => {
    expect(honoraryMembers("osk", [person(["A", "B"], { year: 2027 }, "restricted"), person(["C", "D"], { year: 2027 }, "anonymised")])).toEqual([]);
  });
  it("leaves out people who are not marked honorary", () => expect(honoraryMembers("osk", [person(["A", "B"], undefined)])).toEqual([]));
  it("does not list someone twice who is both in the club's list and marked in admin", () => {
    const names = honoraryMembers("boc", [person(["Arild", "Salte"], { year: 2026 })]).filter((m) => m.name === "Arild Salte");
    expect(names).toHaveLength(1);
  });
});
