import { cookies } from "next/headers";
import type { Db, User } from "./types";

/**
 * Mock session. The prototype has no authentication: a cookie picks which
 * demo user the admin acts as, from the users of the club being viewed. Real
 * sign-in (Google, or e-mail with a one-time code) replaces this file and
 * nothing else.
 */

export const USER_COOKIE = "klubb-demo-user";

/** Users offered in the demo switcher: everyone with a role in this club. */
export function demoUsers(db: Db): User[] {
  return db.users.filter((u) => u.roles.length > 0);
}

export function defaultUser(db: Db): User {
  return db.users.find((u) => u.roles.some((r) => r.role === "clubAdmin")) ?? db.users[0];
}

export async function currentUser(db: Db): Promise<User> {
  const id = (await cookies()).get(USER_COOKIE)?.value;
  return db.users.find((u) => u.id === id && u.roles.length > 0) ?? defaultUser(db);
}
