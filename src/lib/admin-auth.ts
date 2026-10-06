/**
 * The prototype's admin lock: one shared password, for local development only.
 * In production there is no shared password: it is ignored even if ADMIN_PASSWORD
 * is still set, and the only way in is the e-mailed code (lib/supabase-auth.ts).
 * Locally, set ADMIN_PASSWORD and every admin page (src/proxy.ts) and every
 * server action (context() in app/actions.ts) asks for it; leave it unset and
 * admin stays open. In production `adminLocked` is always true and nobody
 * passes it without a session.
 *
 * The cookie holds an HMAC of a fixed message keyed with the password, never
 * the password itself, so changing the password signs everyone out. Web
 * Crypto only, so the same code runs in the proxy and in server actions.
 */

export const ADMIN_COOKIE = "klubb-admin";
const passwordConfigured = () => process.env.NODE_ENV !== "production" && !!process.env.ADMIN_PASSWORD;
/**
 * Locked whenever a password is set, and always in production: a deploy
 * without ADMIN_PASSWORD keeps admin closed to everyone instead of open.
 * Only local development (no password, not production) leaves it open.
 */
export const adminLocked = () => passwordConfigured() || process.env.NODE_ENV === "production";

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
  if (!passwordConfigured() || !value) return false;
  const expected = await adminToken();
  if (value.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < value.length; i++) diff |= value.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

/** Constant-time comparison of a submitted password with ADMIN_PASSWORD. */
export async function passwordMatches(submitted: string): Promise<boolean> {
  if (!adminLocked()) return true;
  if (!passwordConfigured() || !submitted) return false;
  return (await sign(submitted)) === (await adminToken());
}
