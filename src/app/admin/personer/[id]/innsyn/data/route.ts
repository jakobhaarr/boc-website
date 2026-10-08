import { loadAdmin } from "@/lib/data/queries";
import { canAnonymise } from "@/lib/permissions";
import { buildPersonReport } from "@/lib/privacy-report";

export const dynamic = "force-dynamic";

/** The access report as a data file (GDPR art. 15 and 20): the same content as the page, for a club administrator to hand over. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, org, user, now } = await loadAdmin();
  if (!canAnonymise(user)) return new Response("Ingen tilgang", { status: 403 });
  const person = db.people.find((p) => p.id === id);
  if (!person) return new Response("Fant ikke personen", { status: 404 });
  const report = buildPersonReport(db, org, person, user.name, now);
  const file = `innsyn-${now.slice(0, 10)}.json`;
  return new Response(JSON.stringify(report, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "no-store" },
  });
}
