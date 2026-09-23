import { connection } from "next/server";
import { currentClubId } from "@/lib/club";
import { nowLocal, todayISO } from "@/lib/dates";
import { createOrg } from "@/lib/org";
import { currentUser } from "@/lib/session";
import { getDb } from "./store";

/**
 * Repository entry points used by pages. Everything is read per request
 * (no static rendering), so admin changes are visible on the next render.
 * The club comes from the demo cookie; in production it would come from the
 * host name.
 */

export async function loadSite() {
  await connection();
  const clubId = await currentClubId();
  const db = getDb(clubId);
  const org = createOrg(db.nodes);
  const theme = db.themes.find((t) => t.id === db.club.themeId) ?? db.themes[0];
  /** True for clubs with a single sport — the navigation and front page adapt. */
  const singleSport = org.sports().length === 1;
  return { clubId, db, org, theme, singleSport, today: todayISO(), now: nowLocal() };
}

export async function loadAdmin() {
  const site = await loadSite();
  const user = await currentUser(site.db);
  return { ...site, user };
}

export type Site = Awaited<ReturnType<typeof loadSite>>;
export type AdminSite = Awaited<ReturnType<typeof loadAdmin>>;
