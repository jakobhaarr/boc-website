import { describe, expect, it } from "vitest";
import { cardStyleOf, isWidePortrait, profileBesideQuotePhoto, quotePhotoOf, portraitOf, studioProblem } from "../content";
import type { Db, Person, Photo } from "../types";

const photo = (id: string, width = 800, height = 1000, over: Partial<Photo> = {}): Photo =>
  ({
    id,
    src: `/${id}.jpg`,
    width,
    height,
    focal: { x: 50, y: 50 },
    tone: "#000",
    alt: "",
    nodeId: "n",
    people: [],
    redactions: [],
    source: { provider: "upload" },
    ...over,
  }) as Photo;
const person = (over: Partial<Person> = {}): Person =>
  ({ id: "p", firstName: "Kari", lastName: "Berg", memberships: [], privacy: { status: "visible", photoConsent: "granted" }, ...over }) as Person;
const db = (...photos: Photo[]) => ({ photos }) as unknown as Db;

describe("quotePhotoOf: the picture on a quote card", () => {
  const profile = photo("profile");
  const own = photo("own");

  it("uses the person's own quote picture when there is one", () =>
    expect(quotePhotoOf(db(profile, own), person({ portraitPhotoId: "profile", quotePhotoId: "own" }))?.id).toBe("own"));
  it("falls back to the profile picture", () => expect(quotePhotoOf(db(profile), person({ portraitPhotoId: "profile" }))?.id).toBe("profile"));
  it("shows nothing without photo consent, whichever picture", () => {
    const p = person({ portraitPhotoId: "profile", quotePhotoId: "own", privacy: { status: "visible", photoConsent: "unknown" } });
    expect(quotePhotoOf(db(profile, own), p)).toBeUndefined();
    expect(portraitOf(db(profile, own), p)).toBeUndefined();
  });
  it("shows nothing for someone who asked not to be published or is anonymised", () => {
    for (const status of ["restricted", "anonymised"] as const)
      expect(quotePhotoOf(db(profile, own), person({ portraitPhotoId: "profile", quotePhotoId: "own", privacy: { status, photoConsent: "granted" } }))).toBeUndefined();
  });
  it("a withdrawn quote picture falls back to the profile picture", () =>
    expect(
      quotePhotoOf(db(profile, photo("own", 800, 1000, { withdrawn: { at: "2026-01-01T00:00", reason: "trukket" } })), person({ portraitPhotoId: "profile", quotePhotoId: "own" }))
        ?.id,
    ).toBe("profile"));
});

describe("profileBesideQuotePhoto", () => {
  const profile = photo("profile");
  it("is the profile picture only when the card uses a quote picture of its own", () => {
    expect(profileBesideQuotePhoto(db(profile, photo("own")), person({ portraitPhotoId: "profile", quotePhotoId: "own" }))?.id).toBe("profile");
    expect(profileBesideQuotePhoto(db(profile), person({ portraitPhotoId: "profile" }))).toBeUndefined();
    expect(profileBesideQuotePhoto(db(photo("own")), person({ quotePhotoId: "own" }))).toBeUndefined();
  });
});

describe("card style", () => {
  it("a wide picture is more than 50 % wider than tall", () => {
    expect(isWidePortrait({ width: 1600, height: 1000 })).toBe(true);
    expect(isWidePortrait({ width: 1500, height: 1000 })).toBe(false);
  });
  it("studio needs a white or see-through background and at most 20 % wider than tall", () => {
    expect(studioProblem(photo("a", 1000, 1000, { background: "white" }))).toBeUndefined();
    expect(studioProblem(photo("a", 1000, 1000, { background: "other" }))).toBeTruthy();
    expect(studioProblem(photo("a", 1300, 1000, { background: "white" }))).toBeTruthy();
  });
  it("a person's own choice wins, but studio falls back to colour when the picture does not qualify", () => {
    expect(cardStyleOf({ cardStyle: "natural" }, photo("a", 1600, 1000))).toBe("natural");
    expect(cardStyleOf({ cardStyle: "studio" }, photo("a", 1000, 1000, { background: "other" }))).toBe("color");
  });
  it("a picture that is not wide enough gets colour unless chosen otherwise", () => expect(cardStyleOf({}, photo("a", 800, 1000))).toBe("color"));
});
