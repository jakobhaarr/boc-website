import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { QuoteManager } from "@/components/admin/quote-manager";
import { fullName, groupQuotesFor } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { canSeePeople, isAdminOf, isClubAdmin } from "@/lib/permissions";

export const metadata = { title: "Sitater" };

/**
 * Quotes on the group pages (OrgNode.quotes). A group admin sees the groups
 * they run; a section or club admin every group under them, one at a time
 * (?gruppe=). The quotes and the people who can be quoted follow the same
 * scope: members of the group who may be shown, or a parent added by name.
 */
export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ gruppe?: string }> }) {
  const { gruppe } = await searchParams;
  const { db, org, user, today } = await loadAdmin();
  if (!canSeePeople(user)) redirect("/admin");

  const groups = org.nodes.filter((n) => org.isLeaf(n.id) && n.kind !== "club" && isAdminOf(user, org, n.id));
  if (!groups.length) redirect("/admin");
  const node = groups.find((g) => g.id === gruppe) ?? groups[0];

  const quotes = groupQuotesFor(db, node, today);
  const quoted = new Set((node.quotes ?? []).map((q) => q.personId));
  const members = db.people
    .filter((p) => p.privacy.status === "visible" && p.memberships.some((m) => m.nodeId === node.id) && !quoted.has(p.id))
    .map((p) => ({ id: p.id, name: fullName(p), birthYear: p.birthYear }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Sitater"
        description="Hvorfor folk sykler i akkurat denne gruppa, med egne ord. Sitatene står på gruppesiden under «Derfor sykler de i …». Legg bare inn sitater personen selv har godkjent. Et sitat kan også foreslås for forsiden, og klubbadministrator godkjenner."
      />
      {groups.length > 1 && (
        <nav aria-label="Grupper" className="mb-6 flex flex-wrap gap-1.5">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/admin/sitater?gruppe=${g.id}`}
              aria-current={g.id === node.id ? "page" : undefined}
              className={
                g.id === node.id
                  ? "rounded-full bg-ink px-3 py-1 t-small font-medium text-ink-inverse"
                  : "rounded-full px-3 py-1 t-small text-ink-2 ring-1 ring-line hover:text-ink"
              }
            >
              {g.name}
              {isClubAdmin(user) && (g.quotes ?? []).some((q) => q.front === "requested") && (
                <span aria-label="Venter på godkjenning for forsiden" className="ml-1.5 inline-block size-2 rounded-full bg-danger align-middle" />
              )}
            </Link>
          ))}
        </nav>
      )}
      <QuoteManager
        group={{ id: node.id, name: node.name, href: org.href(node.id) }}
        quotes={quotes.map((q) => ({ personId: q.personId, name: q.name, detail: q.detail, relation: q.relation, quote: q.quote, example: q.example, front: q.front }))}
        clubAdmin={isClubAdmin(user)}
        members={members}
      />
    </div>
  );
}
