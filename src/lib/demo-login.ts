import { DEMO_ACCOUNTS } from "./demo-accounts";

/**
 * Sign-in for the board demo: «lagleder@boc.no» or «klubbadmin@boc.no» with the password «admin», so the talk can show
 * admin as a group administrator and as the club administrator without waiting for an e-mailed code.
 *
 * TEMPORARY, and a way past the e-mailed code, so it is off where it matters: locally it is on unless DEMO_LOGIN=off, and in
 * production it is on only while the environment variable DEMO_LOGIN is set (to any text other than «off» or «0»; the text is
 * also the key the session is signed with, so make it a long random one). Delete the variable and the demo sign-in is gone at
 * once, for everyone who is signed in with it too. Remove this file, demo-accounts.ts and what refers to them before the site
 * is used for real.
 *
 * The session is a cookie with the user's id and an HMAC of it, never the password. Web Crypto only.
 */

export const DEMO_COOKIE = "klubb-demo-login";
export const DEMO_PASSWORD = "admin";
/** Hours a demo session lasts. */
export const DEMO_SESSION_HOURS = 8;

const secret = () => {
  const v = process.env.DEMO_LOGIN?.trim();
  if (process.env.NODE_ENV === "production") return v && v !== "off" && v !== "0" ? v : undefined;
  return v === "off" ? undefined : v || "local-demo";
};

export const demoLoginEnabled = () => !!secret();

async function sign(userId: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret() ?? ""), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`demo-login:${userId}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The user id a demo address and password open, or undefined. */
export function demoUserIdFor(email: string, password: string): string | undefined {
  if (!demoLoginEnabled()) return undefined;
  const id = DEMO_ACCOUNTS[email.trim().toLowerCase()];
  return id && password === DEMO_PASSWORD ? id : undefined;
}

export async function demoToken(userId: string): Promise<string> {
  return `${userId}.${await sign(userId)}`;
}

/** The user id in a demo cookie, when it was made by this server with the present key. */
export async function userIdFromDemoToken(value: string | undefined): Promise<string | undefined> {
  if (!value || !demoLoginEnabled()) return undefined;
  const at = value.lastIndexOf(".");
  if (at < 1) return undefined;
  const id = value.slice(0, at);
  const given = value.slice(at + 1);
  const expected = await sign(id);
  if (given.length !== expected.length) return undefined;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0 && Object.values(DEMO_ACCOUNTS).includes(id) ? id : undefined;
}
