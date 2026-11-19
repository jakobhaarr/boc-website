import { describe, expect, it } from "vitest";
import { GOALS, goalHeading, QUESTIONS, resolvePointId, strategyPoints } from "../strategy-2027-2030";
import { checkComment, cleanBody, type StrategyComment } from "../strategy-comments";

const ID = "2b1f0c4e-8a7d-4f3b-9c21-5d6e7f8a9b0c";
const base = { id: ID, pointId: "kommunikasjon-sesonginformasjon", author: "Henrik Munthe", body: "Bra forslag." };
const stored = (over: Partial<StrategyComment>): StrategyComment => ({ ...base, parentId: null, createdAt: "2026-11-19T12:00:00.000Z", ...over });
const none = () => null;

describe("strategy text", () => {
  it("numbers the goals in order, with goal 3 and goal 4 as written", () => {
    expect(GOALS.map(goalHeading)).toEqual([
      "Mål 1 – Trening og aktivitet",
      "Mål 2 – Rekruttering og medlemsutvikling",
      "Mål 3 – Bærum Sykkelpark og klubbhuset",
      "Mål 4 – Kommunikasjon",
      "Mål 5 – Drift og økonomi",
      "Mål 6 – Rammevilkår for sykling",
    ]);
  });
  it("gives every point a unique id", () => {
    const ids = strategyPoints().flatMap((p) => [p.id, ...p.formerIds]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("kommunikasjon-sesonginformasjon");
  });
  it("ties every open question to a goal", () => {
    expect(QUESTIONS).toHaveLength(6);
    for (const q of QUESTIONS) expect(GOALS.some((g) => g.id === q.goal)).toBe(true);
  });
  it("knows no made-up ids", () => {
    expect(resolvePointId("finnes-ikke")).toBeNull();
  });
});

describe("checkComment", () => {
  it("accepts a plain comment", () => {
    expect(checkComment(base, none)).toEqual({ ok: true, value: { ...base, parentId: null } });
  });
  it("refuses empty or blank posts", () => {
    expect(checkComment({ ...base, body: "" }, none).ok).toBe(false);
    expect(checkComment({ ...base, body: "   \n\t  " }, none).ok).toBe(false);
  });
  it("refuses names outside the five", () => {
    expect(checkComment({ ...base, author: "Henrik" }, none).ok).toBe(false);
  });
  it("refuses unknown points, bad ids and too long posts", () => {
    expect(checkComment({ ...base, pointId: "x" }, none).ok).toBe(false);
    expect(checkComment({ ...base, id: "abc" }, none).ok).toBe(false);
    expect(checkComment({ ...base, body: "a".repeat(4001) }, none).ok).toBe(false);
  });
  it("puts a reply under a comment on the same point only", () => {
    const parent = stored({ id: "11111111-1111-4111-8111-111111111111" });
    const lookup = (id: string) => (id === parent.id ? parent : null);
    expect(checkComment({ ...base, parentId: parent.id }, lookup)).toMatchObject({ ok: true, value: { parentId: parent.id } });
    expect(checkComment({ ...base, pointId: "kommunikasjon-opplaering", parentId: parent.id }, lookup).ok).toBe(false);
    expect(checkComment({ ...base, parentId: "22222222-2222-4222-8222-222222222222" }, lookup).ok).toBe(false);
  });
  it("hangs a reply to a reply on the top comment", () => {
    const root = stored({ id: "11111111-1111-4111-8111-111111111111" });
    const reply = stored({ id: "33333333-3333-4333-8333-333333333333", parentId: root.id });
    const lookup = (id: string) => [root, reply].find((c) => c.id === id) ?? null;
    expect(checkComment({ ...base, parentId: reply.id }, lookup)).toMatchObject({ ok: true, value: { parentId: root.id } });
  });
});

describe("cleanBody", () => {
  it("keeps line breaks, drops control characters and runs of blank lines", () => {
    expect(cleanBody("  Hei\u0007\r\n\n\n\nhei  ")).toBe("Hei\n\nhei");
  });
});
