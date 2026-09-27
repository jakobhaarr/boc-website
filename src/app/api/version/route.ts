import { currentClubId } from "@/lib/club";
import { currentVersion } from "@/lib/data/store";

export const dynamic = "force-dynamic";

/** Polled by open pages so admin changes appear without a manual reload. */
export async function GET() {
  const version = await currentVersion(await currentClubId());
  return Response.json({ version }, { headers: { "Cache-Control": "no-store" } });
}
