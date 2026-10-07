import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { QuoteManager } from "@/components/admin/quote-manager";
import { articleHref, cardStyleOf, frontQuoteOf, fullName, groupQuotesFor, photoById } from "@/lib/content";
import { plain } from "@/lib/rich-text";
import { loadAdmin } from "@/lib/data/queries";
import { can, canAnywhere } from "@/lib/access";
import { isClubAdmin } from "@/lib/permissions";

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
  if (!canAnywhere(user, "edit_group")) redirect("/admin");

  const groups = org.nodes.filter((n) => org.isLeaf(n.id) && n.kind !== "club" && can(user, org, n.id, "edit_group"));
  if (!groups.length) redirect("/admin");
  // «alle» and «forsiden» list quotes from every group the person may edit; otherwise one group, which is also where a new quote is added.
  const view = gruppe === "alle" || gruppe === "forsiden" ? gruppe : "gruppe";
  const node = groups.find((g) => g.id === gruppe) ?? groups[0];
  const shown = view === "gruppe" ? [node] : groups;

  const rows = shown.flatMap((n) =>
    groupQuotesFor(db, n, today).map((q) => {
      const person = db.people.find((p) => p.id === q.personId);
      const portrait = photoById(db, person?.portraitPhotoId);
      const story = db.articles.find((a) => a.memberStory && a.aboutPersonId === q.personId && a.status === "published");
      return {
        personId: q.personId,
        groupId: n.id,
        groupName: n.name,
        name: q.name,
        lastName: person?.lastName ?? "",
        // A parent added for this quote alone: the name is the quote's to change.
        quoteOnly: !!person && person.id.startsWith("bp-q-") && person.memberships.length === 0,
        detail: q.detail,
        relation: q.relation,
        quote: q.quote,
        example: q.example,
        front: q.front,
        // The front page says this very quote without it having been asked for: the person is in the club's list of member
        // quotes (Club.testimonials), and this is the quote the front page takes from them.
        onFront: (db.club.testimonials ?? []).some((t) => t.personId === q.personId) && frontQuoteOf(db, q.personId)?.nodeId === n.id,
        portrait: portrait && !portrait.withdrawn ? { src: portrait.src, focal: portrait.focal } : undefined,
        photoConsent: person?.privacy.photoConsent ?? "unknown",
        cardStyle: person ? cardStyleOf(person, portrait) : undefined,
        firstName: person?.firstName ?? q.name,
        strava: person?.stravaUrl ?? "",
        story: story
          ? {
              href: articleHref(story),
              title: plain(story.title),
              lead: plain(story.lead),
              // A pull quote is a line starting «> » in the text box.
              text: story.blocks.flatMap((b) => (b.type === "paragraph" ? [plain(b.content)] : b.type === "quote" ? [`> ${plain(b.content)}`] : [])).join("\n\n"),
            }
          : undefined,
      };
    }),
  );
  // On the front page, or asked for: the quotes the club administrator approves or has yet to approve.
  const quotes = view === "forsiden" ? rows.filter((r) => r.front || r.onFront) : rows;
  const waiting = groups.some((g) => (g.quotes ?? []).some((q) => q.front === "requested"));

  const used = new Set((node.quotes ?? []).map((q) => q.personId));
  const members = db.people
    .filter((p) => p.privacy.status === "visible" && p.memberships.some((m) => m.nodeId === node.id) && !used.has(p.id))
    .map((p) => ({ id: p.id, name: fullName(p), birthYear: p.birthYear }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Sitater"
        description="Hvorfor folk sykler i akkurat denne gruppa, med egne ord. Sitatene står på gruppesiden under «Derfor sykler de i …». Legg bare inn sitater personen selv har godkjent. Et sitat kan også foreslås for forsiden, og klubbadministrator godkjenner. Står sitatet på forsiden, er det de samme ordene der som her: du endrer dem bare ett sted."
      />
      {groups.length > 1 && (
        <nav aria-label="Grupper" className="mb-6 flex flex-wrap gap-1.5">
          {[
            { id: "alle", label: "Alle", mark: false },
            { id: "forsiden", label: "Forsiden", mark: isClubAdmin(user) && waiting },
            ...groups.map((g) => ({ id: g.id, label: g.name, mark: isClubAdmin(user) && (g.quotes ?? []).some((q) => q.front === "requested") })),
          ].map((f) => {
            const current = f.id === "alle" || f.id === "forsiden" ? f.id === view : view === "gruppe" && f.id === node.id;
            return (
              <Link
                key={f.id}
                href={`/admin/sitater?gruppe=${f.id}`}
                aria-current={current ? "page" : undefined}
                className={current ? "rounded-full bg-ink px-3 py-1 t-small font-medium text-ink-inverse" : "rounded-full px-3 py-1 t-small text-ink-2 ring-1 ring-line hover:text-ink"}
              >
                {f.label}
                {f.mark && <span aria-label="Venter på godkjenning for forsiden" className="ml-1.5 inline-block size-2 rounded-full bg-danger align-middle" />}
              </Link>
            );
          })}
        </nav>
      )}
      <QuoteManager
        group={view === "gruppe" ? { id: node.id, name: node.name, href: org.href(node.id) } : undefined}
        title={view === "alle" ? "Alle sitater" : view === "forsiden" ? "På forsiden" : `På siden til ${node.name}`}
        quotes={quotes}
        clubAdmin={isClubAdmin(user)}
        members={members}
      />
    </div>
  );
}
