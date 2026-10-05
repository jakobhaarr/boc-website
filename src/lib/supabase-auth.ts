/**
 * Sign-in with a one-time code, over Supabase Auth's REST API (plain fetch,
 * no client package, like lib/data/supabase.ts). Server-side only.
 *
 * Flow: a person the club has invited (a User with an e-mail, see
 * `sendLoginCode` in app/actions.ts) asks for a code; Supabase e-mails six
 * digits (the template must print `{{ .Token }}`); `verifyCode` swaps the
 * code for an access token (valid about an hour) and a refresh token. The
 * site keeps both in httpOnly cookies (lib/session.ts). Nobody can sign up
 * here: Supabase's own sign-ups are off, and the auth user is created by the
 * server only for an e-mail that is already an active User of the club.
 *
 * Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and the public (anon or
 * publishable) key. Without all three, sign-in by code is not offered.
 */

const url = () => process.env.SUPABASE_URL?.replace(/\/$/, "");
const publicKey = () => process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

export const signInByCodeAvailable = () => !!(url() && publicKey() && serviceKey());

export const SESSION_ACCESS_COOKIE = "klubb-at";
export const SESSION_REFRESH_COOKIE = "klubb-rt";
/** How long a browser stays signed in without visiting admin: the refresh cookie's lifetime, renewed at every refresh. */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const publicHeaders = () => ({ apikey: publicKey()!, "Content-Type": "application/json" });
const adminHeaders = () => ({ apikey: serviceKey()!, Authorization: `Bearer ${serviceKey()}`, "Content-Type": "application/json" });

/** Makes sure Supabase knows this e-mail, so a code can be sent to it. Never creates a User of the club. */
export async function ensureAuthUser(email: string): Promise<void> {
  const res = await fetch(`${url()}/auth/v1/admin/users`, { method: "POST", headers: adminHeaders(), body: JSON.stringify({ email, email_confirm: true }), cache: "no-store" });
  // 422 email_exists: already there, which is the normal case after the first sign-in.
  if (!res.ok && res.status !== 422) throw new Error(`Supabase Auth: kunne ikke opprette bruker (${res.status})`);
}

/** Asks Supabase to e-mail a code to an existing auth user (`create_user: false`: no sign-ups). */
export async function sendCode(email: string): Promise<void> {
  const res = await fetch(`${url()}/auth/v1/otp`, { method: "POST", headers: publicHeaders(), body: JSON.stringify({ email, create_user: false }), cache: "no-store" });
  if (!res.ok) throw new Error(`Supabase Auth: kunne ikke sende kode (${res.status})`);
}

function tokensFrom(body: unknown): AuthTokens | null {
  const b = body as { access_token?: unknown; refresh_token?: unknown } | null;
  return typeof b?.access_token === "string" && typeof b?.refresh_token === "string" ? { accessToken: b.access_token, refreshToken: b.refresh_token } : null;
}

/** Swaps the e-mailed code for tokens; null when the code is wrong or has expired. */
export async function verifyCode(email: string, code: string): Promise<AuthTokens | null> {
  const res = await fetch(`${url()}/auth/v1/verify`, { method: "POST", headers: publicHeaders(), body: JSON.stringify({ type: "email", email, token: code }), cache: "no-store" });
  return res.ok ? tokensFrom(await res.json()) : null;
}

/** The e-mail an access token belongs to, asked of Supabase on each use so a signed-out or banned session stops at once. */
export async function emailOf(accessToken: string): Promise<string | null> {
  const res = await fetch(`${url()}/auth/v1/user`, { headers: { apikey: publicKey()!, Authorization: `Bearer ${accessToken}` }, cache: "no-store" });
  if (!res.ok) return null;
  const user = (await res.json()) as { email?: unknown };
  return typeof user.email === "string" ? user.email : null;
}

export async function refreshTokens(refreshToken: string): Promise<AuthTokens | null> {
  const res = await fetch(`${url()}/auth/v1/token?grant_type=refresh_token`, { method: "POST", headers: publicHeaders(), body: JSON.stringify({ refresh_token: refreshToken }), cache: "no-store" });
  return res.ok ? tokensFrom(await res.json()) : null;
}

/** Ends the session at Supabase too, not just in the browser. */
export async function revokeSession(accessToken: string): Promise<void> {
  await fetch(`${url()}/auth/v1/logout`, { method: "POST", headers: { apikey: publicKey()!, Authorization: `Bearer ${accessToken}` }, cache: "no-store" }).catch(() => {});
}

/** True when the token has run out (or is about to). Reads the expiry only; Supabase decides whether the token is valid. */
export function accessTokenExpired(accessToken: string, skewSeconds = 30): boolean {
  try {
    const payload = JSON.parse(atob(accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    return typeof payload.exp !== "number" || payload.exp - skewSeconds <= Date.now() / 1000;
  } catch {
    return true;
  }
}

export const sessionCookie = (maxAge: number = SESSION_MAX_AGE) => ({
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge,
});
