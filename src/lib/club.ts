import { cookies } from "next/headers";

/**
 * The platform serves many clubs from the same code; the prototype ships two
 * of them so the difference is visible: a multi-sport club and a club with
 * one sport. A cookie picks which club this browser is looking at, the same
 * way a host name or a tenant id would in production. Each club has its own
 * store (see data/store.ts) — nothing is shared but the design system.
 */

export const CLUB_COOKIE = "klubb-demo-club";
export const DEFAULT_CLUB_ID = "osk";

export const DEMO_CLUBS = [
  { id: "osk", name: "Oslo Sportsklubb", shortName: "OSK", kind: "Fleridrettsklubb", note: "Fotball, sykkel og langrenn" },
  { id: "boc", name: "Bærum og Omegn Cykleklubb", shortName: "BOC", kind: "Én idrett", note: "Landevei, terreng, BMX, banesykling og innendørs" },
] as const;

export type ClubId = (typeof DEMO_CLUBS)[number]["id"];

export const isClubId = (value?: string): value is ClubId => DEMO_CLUBS.some((c) => c.id === value);

export async function currentClubId(): Promise<ClubId> {
  const value = (await cookies()).get(CLUB_COOKIE)?.value;
  return isClubId(value) ? value : DEFAULT_CLUB_ID;
}
