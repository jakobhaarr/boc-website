import { currentClubId } from "@/lib/club";
import { getDb } from "@/lib/data/store";

export const dynamic = "force-dynamic";

/** Polled by open pages so admin changes appear without a manual reload. */
export async function GET() {
  const db = getDb(await currentClubId());
  return Response.json({ version: db.version }, { headers: { "Cache-Control": "no-store" } });
}
