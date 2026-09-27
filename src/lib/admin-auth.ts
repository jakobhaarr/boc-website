/**
 * The prototype's admin lock: one shared password, until real sign-in
 * (e-mail with a one-time code) replaces it. Set ADMIN_PASSWORD and every
 * admin page (src/proxy.ts) and every server action (context() in
 * app/actions.ts) asks for it; leave it unset, as in local development, and
 * admin stays open as before.
 *
 * The cookie holds an HMAC of a fixed message keyed with the password, never
 * the password itself, so changing the password signs everyone out. Web
 * Crypto only, so the same code runs in the proxy and in server actions.
 */

export const ADMIN_COOKIE = "klubb-admin";
export const adminLocked = () => !!process.env.ADMIN_PASSWORD;

async function sign(password: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("klubbnettside-admin-v1"));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value that proves the password was given. */
export async function adminToken(): Promise<string> {
  return sign(process.env.ADMIN_PASSWORD ?? "");
}

/** True when admin is unlocked for this cookie value (always, when no password is set). */
export async function isAdminToken(value: string | undefined): Promise<boolean> {
  if (!adminLocked()) return true;
  if (!value) return false;
  const expected = await adminToken();
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Constant-time comparison of a submitted password with ADMIN_PASSWORD. */
export async function passwordMatches(submitted: string): Promise<boolean> {
  if (!adminLocked()) return true;
  return (await sign(submitted)) === (await adminToken());
}
