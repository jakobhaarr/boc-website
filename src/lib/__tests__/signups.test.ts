import { describe, expect, it } from "vitest";
import { isFull, shownSignups, signupsOnFront, signupsOnNode, signupState, validateResponse, validateSignup, type SignupInput } from "../signups";
import type { Signup } from "../types";

const signup = (over: Partial<Signup> = {}): Signup => ({
  id: "su1",
  title: "Sesongstart",
  summary: "Møt opp",
  kind: "form",
  onFront: true,
  nodeIds: [],
  createdAt: "2026-11-01T10:00",
  createdByUserId: "u1",
  ...over,
});

describe("signupState", () => {
  it("is open without dates", () => expect(signupState(signup(), "2026-11-08")).toBe("open"));
  it("is upcoming before the first day, open on it", () => {
    expect(signupState(signup({ opensOn: "2026-11-10" }), "2026-11-09")).toBe("upcoming");
    expect(signupState(signup({ opensOn: "2026-11-10" }), "2026-11-10")).toBe("open");
  });
  it("is open on the last day and closed the day after", () => {
    expect(signupState(signup({ closesOn: "2026-11-10" }), "2026-11-10")).toBe("open");
    expect(signupState(signup({ closesOn: "2026-11-10" }), "2026-11-11")).toBe("closed");
  });
  it("archived wins over dates", () => expect(signupState(signup({ archived: true }), "2026-11-08")).toBe("archived"));
});

describe("what the site shows", () => {
  const db = {
    signups: [
      signup({ id: "front", onFront: true }),
      signup({ id: "g1", onFront: false, nodeIds: ["boc1"] }),
      signup({ id: "both", onFront: true, nodeIds: ["boc1", "boc2"] }),
      signup({ id: "old", onFront: true, archived: true }),
      signup({ id: "ended", onFront: true, closesOn: "2026-01-01" }),
    ],
  };
  it("shows only open sign-ups", () => expect(shownSignups(db, "2026-11-08").map((s) => s.id)).toEqual(["front", "g1", "both"]));
  it("front page: those placed on the front", () => expect(signupsOnFront(db, "2026-11-08").map((s) => s.id)).toEqual(["front", "both"]));
  it("a group page: those placed on that group", () => {
    expect(signupsOnNode(db, "2026-11-08", "boc1").map((s) => s.id)).toEqual(["g1", "both"]);
    expect(signupsOnNode(db, "2026-11-08", "boc2").map((s) => s.id)).toEqual(["both"]);
    expect(signupsOnNode(db, "2026-11-08", "boc3")).toEqual([]);
  });
});

describe("isFull", () => {
  const answers = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `r${i}`, signupId: "su1", createdAt: "2026-11-01T10:00", name: "A B", email: `a${i}@x.no` }));
  it("a form with places is full when the answers reach them", () => {
    expect(isFull({ signupResponses: answers(2) }, signup({ capacity: 3 }))).toBe(false);
    expect(isFull({ signupResponses: answers(3) }, signup({ capacity: 3 }))).toBe(true);
  });
  it("no capacity is never full, and a banner is never full", () => {
    expect(isFull({ signupResponses: answers(50) }, signup())).toBe(false);
    expect(isFull({ signupResponses: answers(50) }, signup({ kind: "banner", capacity: 1 }))).toBe(false);
  });
});

describe("validateSignup", () => {
  const known = new Set(["boc1", "boc2"]);
  const input = (over: Partial<SignupInput> = {}): SignupInput => ({
    title: "Tittel",
    summary: "Tekst",
    kind: "form",
    href: "",
    linkLabel: "",
    opensOn: "",
    closesOn: "",
    capacity: "",
    onFront: true,
    nodeIds: [],
    ...over,
  });

  it("accepts a form on the front page", () => expect(validateSignup(input(), known).ok).toBe(true));
  it("needs a title and a text", () => {
    expect(validateSignup(input({ title: "  " }), known)).toMatchObject({ ok: false });
    expect(validateSignup(input({ summary: "" }), known)).toMatchObject({ ok: false });
  });
  it("a banner needs an https link", () => {
    expect(validateSignup(input({ kind: "banner", href: "" }), known)).toMatchObject({ ok: false });
    expect(validateSignup(input({ kind: "banner", href: "http://spond.com/x" }), known)).toMatchObject({ ok: false });
    expect(validateSignup(input({ kind: "banner", href: "https://spond.com/x" }), known)).toMatchObject({ ok: true });
  });
  it("must be placed somewhere", () => expect(validateSignup(input({ onFront: false, nodeIds: [] }), known)).toMatchObject({ ok: false }));
  it("drops unknown groups, keeps known ones once", () => {
    const res = validateSignup(input({ onFront: false, nodeIds: ["boc1", "boc1", "nope"] }), known);
    expect(res.ok && res.value.nodeIds).toEqual(["boc1"]);
  });
  it("last day cannot be before the first", () => expect(validateSignup(input({ opensOn: "2026-12-01", closesOn: "2026-11-01" }), known)).toMatchObject({ ok: false }));
  it("capacity is a whole number from 1, and only for forms", () => {
    expect(validateSignup(input({ capacity: "0" }), known)).toMatchObject({ ok: false });
    expect(validateSignup(input({ capacity: "2.5" }), known)).toMatchObject({ ok: false });
    expect(validateSignup(input({ capacity: "12" }), known)).toMatchObject({ ok: true });
    const banner = validateSignup(input({ kind: "banner", href: "https://s.no", capacity: "12" }), known);
    expect(banner.ok && banner.value.capacity).toBeUndefined();
  });
});

describe("validateResponse", () => {
  const ok = { name: "Kari Nordmann", email: "Kari@Example.no", phone: "", note: "" };
  it("accepts and lower-cases the address", () => {
    const res = validateResponse(ok);
    expect(res.ok && res.value.email).toBe("kari@example.no");
  });
  it("needs first and last name and a real address", () => {
    expect(validateResponse({ ...ok, name: "Kari" })).toMatchObject({ ok: false });
    expect(validateResponse({ ...ok, email: "kari@" })).toMatchObject({ ok: false });
  });
  it("phone is optional but must be valid when given", () => {
    expect(validateResponse({ ...ok, phone: "12" })).toMatchObject({ ok: false });
    expect(validateResponse({ ...ok, phone: "+47 900 00 000" })).toMatchObject({ ok: true });
  });
  it("the hidden field marks a program", () => {
    const res = validateResponse({ ...ok, website: "http://spam" });
    expect(res.ok && res.trap).toBe(true);
  });
});
