import { describe, expect, it } from "vitest";
import { roomsOf, validateTripSignup, TRIP, type TripSignupInput } from "../trip-signup";
import type { TripSignup } from "../types";

const input = (over: Partial<TripSignupInput> = {}): TripSignupInput => ({
  name: "Kari Nordmann",
  email: "kari@example.no",
  phone: "+47 900 00 000",
  arrival: TRIP.from,
  departure: TRIP.to,
  room: "double",
  shareWith: "Ola",
  bike: "own",
  nextOfKinName: "Per Nordmann",
  nextOfKinPhone: "911 11 111",
  note: "",
  confirmMember: true,
  confirmBinding: true,
  listed: true,
  ...over,
});

describe("validateTripSignup", () => {
  it("accepts a complete sign-up", () => expect(validateTripSignup(input()).ok).toBe(true));
  it("needs both confirmations", () => {
    expect(validateTripSignup(input({ confirmMember: false }))).toMatchObject({ ok: false });
    expect(validateTripSignup(input({ confirmBinding: false }))).toMatchObject({ ok: false });
  });
  it("arrival and return must lie near the week, and in order", () => {
    expect(validateTripSignup(input({ arrival: "2027-01-01" }))).toMatchObject({ ok: false });
    expect(validateTripSignup(input({ arrival: TRIP.to, departure: TRIP.from }))).toMatchObject({ ok: false });
  });
  it("a single room has no roommate", () => {
    const res = validateTripSignup(input({ room: "single", shareWith: "Ola" }));
    expect(res.ok && res.value.shareWith).toBeUndefined();
  });
  it("marks a program by the hidden field", () => {
    const res = validateTripSignup(input({ website: "x" }));
    expect(res.ok && res.trap).toBe(true);
  });
});

describe("roomsOf: roommates count as one room", () => {
  const p = (id: string, name: string, room: TripSignup["room"], shareWith?: string): TripSignup => ({
    id,
    tripId: TRIP.id,
    createdAt: "2026-11-01T10:00",
    name,
    email: `${id}@x.no`,
    phone: "900 00 000",
    arrival: TRIP.from,
    departure: TRIP.to,
    room,
    shareWith,
    bike: "own",
    nextOfKinName: "x",
    nextOfKinPhone: "900 00 000",
    listed: true,
  });
  it("two who name each other share a room", () => expect(roomsOf([p("a", "Ola Hansen", "double", "Kari"), p("b", "Kari Berg", "double", "Ola")])).toHaveLength(1));
  it("one who names someone who does not name them back still shares with them", () =>
    expect(roomsOf([p("a", "Ola Hansen", "double", "Kari"), p("b", "Kari Berg", "double")])).toHaveLength(1));
  it("a single room is one person's own", () => expect(roomsOf([p("a", "Ola Hansen", "single"), p("b", "Kari Berg", "single")])).toHaveLength(2));
  it("a double-room person nobody matches keeps a room of their own", () => expect(roomsOf([p("a", "Ola Hansen", "double")])).toHaveLength(1));
  it("a shared first name goes to the one who named them back", () => {
    const rooms = roomsOf([p("a", "Erik Hansen", "double", "Erik Berg"), p("b", "Erik Berg", "double", "Erik Hansen"), p("c", "Erik Lie", "double")]);
    expect(rooms).toHaveLength(2);
    expect(
      rooms
        .find((r) => r.people.some((x) => x.id === "a"))!
        .people.map((x) => x.id)
        .sort(),
    ).toEqual(["a", "b"]);
  });
});
