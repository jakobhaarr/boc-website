import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { ArticleEditor } from "@/components/admin/article-editor";
import type { HistoryRow } from "@/components/admin/group-editor";
import { articleHref, userById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { relativeTime } from "@/lib/dates";
import { rowsOf } from "@/lib/article-edit";
import { canChangeAuthor, canEditArticle, ROLE_LABEL, strongestRole } from "@/lib/permissions";
import { plain } from "@/lib/rich-text";

export const metadata = { title: "Rediger innlegg" };

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, org, user, now } = await loadAdmin();
  const article = db.articles.find((a) => a.id === id);
  if (!article || !canEditArticle(user, org, article)) notFound();

  // Anyone who has a role in the club can be named as author; the current author stays on the list.
  const authors = db.users
    .filter((u) => u.id === article.authorUserId || u.roles.some((r) => r.role !== "guardian"))
    .map((u) => {
      const role = u.roles.find((r) => r.role !== "guardian");
      return { id: u.id, name: u.name, detail: role ? `${ROLE_LABEL[role.role]}, ${org.get(role.nodeId)?.name ?? ""}`.replace(/, $/, "") : "" };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  const history: HistoryRow[] = db.audit
    .filter((a) => a.action === "editArticle" && a.articleId === article.id)
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      who: userById(db, a.actorUserId)?.name ?? "Ukjent",
      when: relativeTime(a.at, now),
      summary: a.summary,
      fields: [],
    }));

  const node = org.get(article.nodeId);
  const role = strongestRole(user, org, article.nodeId);

  return (
    <div className="page pb-8">
      <div className="pt-4 md:pt-6">
        <Link href="/admin/innhold" className="inline-flex items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Innhold
        </Link>
      </div>
      <AdminHeader
        eyebrow={`${node?.name ?? "Klubben"} · ${article.status === "published" ? "Publisert" : article.status === "pending" ? "Til godkjenning" : "Avvist"}`}
        title="Rediger innlegg"
        description={role === "contributor" ? "Innlegget venter på godkjenning. Du kan endre det før det publiseres." : "Endringer er synlige på nettsiden med en gang, og du kan gå tilbake til en tidligere versjon. Bilder og adressen til innlegget endres ikke."}
        className="!pt-3 md:!pt-4"
      />
      <ArticleEditor
        key={article.id}
        article={{
          id: article.id,
          href: article.status === "published" ? articleHref(article) : undefined,
          title: plain(article.title),
          lead: plain(article.lead),
          rows: rowsOf(article.blocks),
          authorUserId: article.authorUserId,
        }}
        authors={authors}
        canChangeAuthor={canChangeAuthor(user, org, article)}
        history={history}
        editedLine={article.editedAt ? `Sist redigert ${relativeTime(article.editedAt, now)} av ${userById(db, article.editedByUserId ?? "")?.name ?? "ukjent"}` : undefined}
      />
    </div>
  );
}
