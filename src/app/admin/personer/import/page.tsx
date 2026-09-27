import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { SpondImport } from "@/components/admin/spond-import";
import { loadAdmin } from "@/lib/data/queries";
import { canSeePeople, isAdminOf } from "@/lib/permissions";

export const metadata = { title: "Importer fra Spond" };

/**
 * New members from a Spond export, into one group the admin runs. The file
 * is read on the server and not kept; only name, birth year and photo
 * consent are taken (lib/spond-import.ts), and the admin sees what will
 * happen before anything is added.
 */
export default async function SpondImportPage({ searchParams }: { searchParams: Promise<{ gruppe?: string }> }) {
  const { gruppe } = await searchParams;
  const { org, user } = await loadAdmin();
  if (!canSeePeople(user)) redirect("/admin");
  const groups = org.nodes
    .filter((n) => org.isLeaf(n.id) && n.kind !== "club" && isAdminOf(user, org, n.id))
    .map((n) => ({ id: n.id, label: org.trail(n.id).map((x) => x.name).join(" › ") }));
  if (!groups.length) redirect("/admin/personer");

  return (
    <div className="page pb-16">
      <AdminHeader
        eyebrow={
          <Link href="/admin/personer" className="t-small text-ink-3 hover:text-ink">
            ‹ Personer
          </Link>
        }
        title="Importer fra Spond"
        description="Last opp medlemseksporten fra en Spond-gruppe (.xlsx). Vi leser bare navn, fødselsår og fotosamtykke. E-post, telefon, adresse, skole, politiattest og foresatte hentes ikke inn."
      />
      {/* The prototype's admin is open to anyone who switches demo user, and the store lives in memory. */}
      <p role="note" className="mb-6 rounded-lg bg-warning-surface px-4 py-3 t-small text-warning">
        Dette er en demo: alle som åpner den kan se administrasjonen. Ikke last opp ekte medlemslister her før løsningen har innlogging og lagring.
      </p>
      <SpondImport groups={groups} initialGroupId={groups.find((g) => g.id === gruppe)?.id ?? groups[0].id} />
    </div>
  );
}
