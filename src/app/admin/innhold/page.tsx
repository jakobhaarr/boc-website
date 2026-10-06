import { FileText } from "lucide-react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/bits";
import { ContentActions } from "@/components/admin/content-actions";
import { Photo } from "@/components/public/photo";
import { buttonClass } from "@/components/ui/button";
import { chipClass, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { articleHref, articlePhotoIds, photoById, userById } from "@/lib/content";
import { relativeTime } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";
import { TrashList, type TrashRow } from "@/components/admin/trash-list";
import { diffDays } from "@/lib/dates";
import { TRASH_DAYS } from "@/lib/deletion";
import { canApprove, canEditArticle, canFeatureOnHomepage, isAdminOf, strongestRole } from "@/lib/permissions";
import { excerpt, plain } from "@/lib/rich-text";
import type { Article } from "@/lib/types";

export const metadata = { title: "Innlegg" };

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
  // The trash: articles deleted from groups the user runs, with how long they are kept.
  const trash: TrashRow[] = db.audit
    .filter((e) => e.deletedArticle && isAdminOf(user, org, e.deletedArticle.article.nodeId))
    .map((e) => ({
      auditId: e.id,
      title: plain(e.deletedArticle!.article.title.map((i) => (i.type === "mention" ? { type: "text" as const, text: i.neutral } : i))),
      where: org.get(e.deletedArticle!.article.nodeId)?.name ?? "Slettet gruppe",
      deletedBy: userById(db, e.actorUserId)?.name ?? "ukjent",
      deletedWhen: relativeTime(e.at, now),
      daysLeft: Math.max(0, TRASH_DAYS - diffDays(now.slice(0, 10), e.at.slice(0, 10))),
    }));
  const showTrash = status === "slettet";
  const active = tabs.find((t) => t.id === status) ?? (tabs[0].items.length ? tabs[0] : tabs[1]);
  const items = [...active.items].sort((a, b) => (b.publishedAt ?? b.createdAt).localeCompare(a.publishedAt ?? a.createdAt));

  // The first picture of the article that may be shown: the lead picture, or else one inside it.
  // A withdrawn photo (someone in it was anonymised) is left out; redactions are applied by Photo itself.
  const thumbnailOf = (a: Article) => articlePhotoIds(a).map((id) => photoById(db, id)).find((p) => p && !p.withdrawn);

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Innlegg"
        description="Innlegg fra lag og grupper. Bidragsytere sender inn, lagadministratorer og oppover publiserer."
        actions={
          <Link href="/admin/publiser" className={buttonClass({ size: "md" })}>
            Nytt innlegg
          </Link>
        }
      />

      <nav aria-label="Status" className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
        {tabs.map((t) => (
          <Link key={t.id} href={`/admin/innhold?status=${t.id}`} aria-current={!showTrash && t.id === active.id ? "page" : undefined} className={cn(chipClass(!showTrash && t.id === active.id), "justify-between sm:justify-start")}>
            {t.label}
            <span className={!showTrash && t.id === active.id ? "text-ink-inverse/70 tnum" : "text-ink-3 tnum"}>{t.items.length}</span>
          </Link>
        ))}
        <Link href="/admin/innhold?status=slettet" aria-current={showTrash ? "page" : undefined} className={cn(chipClass(showTrash), "justify-between sm:justify-start")}>
          Slettet
          <span className={showTrash ? "text-ink-inverse/70 tnum" : "text-ink-3 tnum"}>{trash.length}</span>
        </Link>
      </nav>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        {showTrash ? (
          <TrashList rows={trash} />
        ) : items.length === 0 ? (
          <p className="px-5 py-8 t-small text-ink-2">
            {active.id === "godkjenning" ? "Ingen innlegg venter på godkjenning." : "Ingen innlegg her."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {items.map((a) => {
              const node = org.get(a.nodeId);
              const author = userById(db, a.authorUserId);
              const trail = org.trail(a.nodeId).map((n) => n.name).join(" › ") || "Klubben";
              const thumb = thumbnailOf(a);
              return (
                <li key={a.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-x-5">
                  {/* self-start: the cell is not stretched to the height of the text beside it, which left grey under the picture. */}
                  <div className="max-h-24 w-24 shrink-0 self-start overflow-hidden rounded-md bg-sunken sm:w-32">
                    {thumb ? (
                      <Photo photo={thumb} ratio={3 / 2} sizes="128px" grade={false} />
                    ) : (
                      <div aria-hidden className="flex aspect-[3/2] items-center justify-center bg-[var(--accent-bg)] text-[var(--accent)]">
                        <FileText className="size-6" strokeWidth={1.6} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="t-label font-semibold">{plain(a.title)}</p>
                      {a.status === "pending" && <Status tone="warning">Til godkjenning</Status>}
                      {a.onHomepage && <Status tone="club">På forsiden</Status>}
                      {a.homepageRequested && !a.onHomepage && a.status === "published" && <Status tone="neutral">Foreslått til forsiden</Status>}
                      {a.privacyEditedAt && <Status tone="ink">Personvernredigert</Status>}
                      {a.editedAt && <Status tone="neutral">Redigert</Status>}
                    </div>
                    <p className="mt-0.5 t-small text-ink-3">
                      {trail} · {author?.name} · {relativeTime(a.publishedAt ?? a.createdAt, now)}
                    </p>
                    {a.status === "pending" && <p className="mt-2 max-w-[70ch] t-small text-ink-2">{excerpt(a.blocks, 220)}</p>}
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <ContentActions
                      articleId={a.id}
                      href={a.status === "published" ? articleHref(a) : undefined}
                      canReview={a.status === "pending" && !!node && canApprove(user, org, a.nodeId)}
                      canFeature={feature && a.status === "published"}
                      onHomepage={a.onHomepage}
                      editHref={canEditArticle(user, org, a) ? `/admin/innhold/${a.id}` : undefined}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
