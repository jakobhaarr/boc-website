import { cache } from "react";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "./admin-auth";
import { emailOf, SESSION_ACCESS_COOKIE } from "./supabase-auth";
import type { Db, User } from "./types";

/**
 * Who is acting in admin. In production one way in only: a session from
 * signing in with an e-mailed code (lib/supabase-auth.ts). The access token in
 * the cookie is asked of Supabase, and its e-mail must belong to an active user
 * of this club that has a role. Locally, without that set up, a demo user can
 * be picked instead (lib/admin-auth.ts, the user cookie), so development needs
 * no mail.
 *
 * Production never falls back to another user: no valid user means no access.
 */

export const USER_COOKIE = "klubb-demo-user";

export type SignedIn = { user: User; via: "code" | "password" };

/** Users offered in the demo switcher: everyone with a role in this club. */
export function demoUsers(db: Db): User[] {
  return db.users.filter((u) => u.roles.length > 0);
}

/** Local development only: the club's first administrator, so a fresh browser needs no sign-in step. */
export function defaultUser(db: Db): User {
  return db.users.find((u) => u.roles.some((r) => r.role === "clubAdmin")) ?? db.users[0];
}

/** The user a given e-mail may sign in as: invited (has a role) and not deactivated. */
export function userForEmail(db: Db, email: string): User | undefined {
  const wanted = email.trim().toLowerCase();
  return db.users.find((u) => u.email.toLowerCase() === wanted && u.active !== false && u.roles.length > 0);
}

// One question to Supabase per request, however many times the page asks who is acting.
const emailOfToken = cache((accessToken: string) => emailOf(accessToken));

export async function signedIn(db: Db): Promise<SignedIn | null> {
  const jar = await cookies();

  const accessToken = jar.get(SESSION_ACCESS_COOKIE)?.value;
  if (accessToken) {
    const email = await emailOfToken(accessToken);
    const user = email ? userForEmail(db, email) : undefined;
    if (user) return { user, via: "code" };
  }

  // The demo way in is for local development only.
  if (process.env.NODE_ENV !== "production" && (await isAdminToken(jar.get(ADMIN_COOKIE)?.value))) {
    const id = jar.get(USER_COOKIE)?.value;
    const user = db.users.find((u) => u.id === id && u.roles.length > 0);
    if (user) return { user, via: "password" };
    return { user: defaultUser(db), via: "password" };
  }
  return null;
}
