import { describe, expect, it } from "vitest";
import { appEnv, previewMayMail, previewMayPersist } from "../env";

describe("appEnv", () => {
  it("follows Vercel's environment when there is one", () => {
    expect(appEnv({ VERCEL_ENV: "production", NODE_ENV: "production" })).toBe("production");
    expect(appEnv({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe("preview");
    expect(appEnv({ VERCEL_ENV: "development", NODE_ENV: "development" })).toBe("development");
  });
  it("outside Vercel, a production build is production and anything else is development", () => {
    expect(appEnv({ NODE_ENV: "production" })).toBe("production");
    expect(appEnv({ NODE_ENV: "development" })).toBe("development");
    expect(appEnv({})).toBe("development");
  });
});

describe("what a preview may do", () => {
  it("keeps changes in memory and sends no mail unless told so", () => {
    expect(previewMayPersist({})).toBe(false);
    expect(previewMayMail({})).toBe(false);
    expect(previewMayPersist({ PREVIEW_PERSISTENT: "on" })).toBe(true);
    expect(previewMayMail({ PREVIEW_MAIL: " ON " })).toBe(true);
    expect(previewMayPersist({ PREVIEW_PERSISTENT: "yes" })).toBe(false);
  });
});
