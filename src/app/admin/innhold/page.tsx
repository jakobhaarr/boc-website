import Link from "next/link";
import { AdminHeader } from "@/components/admin/bits";
import { ContentActions } from "@/components/admin/content-actions";
import { buttonClass } from "@/components/ui/button";
import { chipClass, Status } from "@/components/ui/primitives";
import { articleHref, userById } from "@/lib/content";
import { relativeTime } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";
import { canApprove, canFeatureOnHomepage, strongestRole } from "@/lib/permissions";
import { excerpt, plain } from "@/lib/rich-text";
import type { Article } from "@/lib/types";

export const metadata = { title: "Innhold" };

type Tab = "godkjenning" | "publisert" | "forsiden" | "avvist";

export default async function ContentPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { db, org, user, now } = await loadAdmin();

  const manages = (a: Article) => {
    const role = strongestRole(user, org, a.nodeId);
    return role === "clubAdmin" || role === "sectionAdmin" || role === "groupAdmin";
  };
  const visible = db.articles.filter((a) => manages(a) || a.authorUserId === user.id);
  const feature = canFeatureOnHomepage(user);

  const tabs: { id: Tab; label: string; items: Article[] }[] = [
    { id: "godkjenning", label: "Til godkjenning", items: visible.filter((a) => a.status === "pending") },
    { id: "publisert", label: "Publisert", items: visible.filter((a) => a.status === "published") },
    ...(feature
      ? [{ id: "forsiden" as const, label: "Foreslått til forsiden", items: visible.filter((a) => a.status === "published" && a.homepageRequested && !a.onHomepage) }]
      : []),
    { id: "avvist", label: "Avvist", items: visible.filter((a) => a.status === "rejected") },
  ];
  const active = tabs.find((t) => t.id === status) ?? (tabs[0].items.length ? tabs[0] : tabs[1]);
  const items = [...active.items].sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Innhold"
        description="Innlegg fra lag og grupper. Bidragsytere sender inn, lagadministratorer og oppover publiserer."
        actions={
          <Link href="/admin/publiser" className={buttonClass({ size: "md" })}>
            Nytt innlegg
          </Link>
        }
      />

      <nav aria-label="Status" className="scroll-x -mx-4 flex gap-1.5 px-4 md:mx-0 md:px-0">
        {tabs.map((t) => (
          <Link key={t.id} href={`/admin/innhold?status=${t.id}`} aria-current={t.id === active.id ? "page" : undefined} className={chipClass(t.id === active.id)}>
            {t.label}
            <span className={t.id === active.id ? "text-ink-inverse/70 tnum" : "text-ink-3 tnum"}>{t.items.length}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        {items.length === 0 ? (
          <p className="px-5 py-8 t-small text-ink-2">
            {active.id === "godkjenning" ? "Ingen innlegg venter på godkjenning." : "Ingen innlegg her."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((a) => {
              const node = org.get(a.nodeId);
              const author = userById(db, a.authorUserId);
              const trail = org.trail(a.nodeId).map((n) => n.name).join(" › ") || "Klubben";
              return (
                <li key={a.id} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="t-label font-semibold">{plain(a.title)}</p>
                      {a.status === "pending" && <Status tone="warning">Til godkjenning</Status>}
                      {a.onHomepage && <Status tone="club">På forsiden</Status>}
                      {a.homepageRequested && !a.onHomepage && a.status === "published" && <Status tone="neutral">Foreslått til forsiden</Status>}
                      {a.privacyEditedAt && <Status tone="ink">Personvernredigert</Status>}
                    </div>
                    <p className="mt-0.5 t-small text-ink-3">
                      {trail} · {author?.name} · {relativeTime(a.publishedAt ?? a.createdAt, now)}
                    </p>
                    {a.status === "pending" && <p className="mt-2 max-w-[70ch] t-small text-ink-2">{excerpt(a.blocks, 220)}</p>}
                  </div>
                  <ContentActions
                    articleId={a.id}
                    href={a.status === "published" ? articleHref(a) : undefined}
                    canReview={a.status === "pending" && !!node && canApprove(user, org, a.nodeId)}
                    canFeature={feature && a.status === "published"}
                    onHomepage={a.onHomepage}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
