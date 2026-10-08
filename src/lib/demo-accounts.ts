/**
 * The demo sign-ins (see lib/demo-login.ts): which address stands for which user of the club. Only addresses, no password,
 * so the sign-in form can know when to ask for one. The user ids are the seed's: a group administrator (Ungdom and Junior)
 * for the talk's second step, and the club administrator for the third.
 */
export const DEMO_ACCOUNTS: Record<string, string> = {
  "lagleder@boc.no": "bu-gunhild",
  "klubbadmin@boc.no": "bu-christian",
};

export const isDemoEmail = (email: string) => Object.hasOwn(DEMO_ACCOUNTS, email.trim().toLowerCase());
