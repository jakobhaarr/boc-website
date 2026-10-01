import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { GroupEditor, type HistoryRow } from "@/components/admin/group-editor";
import { fullName, photoById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { relativeTime } from "@/lib/dates";
import { FIRST_TRAINING_FIELDS, formValuesOf } from "@/lib/group-fields";
import { groupImpact } from "@/lib/deletion";
import { isAdminOf } from "@/lib/permissions";
import { paceGuideOf } from "@/lib/rider-fit";
import type { NodeKind } from "@/lib/types";

export const metadata = { title: "Rediger gruppe" };

const EDITABLE: NodeKind[] = ["discipline", "ageGroup", "team"];

const FIELD_NAMES: Record<string, string> = {
  summary: "kort beskrivelse",
  description: "om gruppa",
  joinInfo: "slik blir du med",
  firstTraining: "første trening",
  paceGuide: "fart og FTP",
  name: "navn",
  ageLabel: "aldersbeskrivelse",
  ageRange: "aldersgrenser",
};

export default async function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, org, user, now } = await loadAdmin();
  const node = org.get(id);
  if (!node || !EDITABLE.includes(node.kind) || !isAdminOf(user, org, node.id)) notFound();

  // What the public page says when the group leaves a fact empty: the nearest level above that has it.
  const above = org.lineage(node.id).slice(0, -1).reverse();
  const inherited = Object.fromEntries(
    FIRST_TRAINING_FIELDS.flatMap((f) => {
      const from = above.find((n) => n.firstTraining?.[f.key]);
      return from ? [[f.key, { value: from.firstTraining![f.key]!, from: from.name }]] : [];
    }),
  );

  const history: HistoryRow[] = db.audit
    .filter((a) => a.action === "editGroup" && a.change?.nodeId === node.id)
    .slice(0, 12)
    .map((a) => ({
      id: a.id,
      who: db.users.find((u) => u.id === a.actorUserId)?.name ?? "Ukjent",
      when: relativeTime(a.at, now),
      summary: a.summary,
      fields: Object.keys(a.change!.fields).map((k) => FIELD_NAMES[k] ?? k),
    }));

  return (
    <div className="page pb-8">
      <div className="pt-4 md:pt-6">
        <Link href="/admin/grupper" className="inline-flex items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Grupper
        </Link>
      </div>
      <AdminHeader eyebrow={org.trail(node.id).slice(0, -1).map((n) => n.name).join(" · ") || undefined} title={node.name} className="!pt-3 md:!pt-4" />
      <GroupEditor
        key={node.id}
        group={{ id: node.id, name: node.name, href: org.href(node.id) }}
        values={formValuesOf(node)}
        inherited={inherited}
        guide={paceGuideOf(node) ?? null}
        history={history}
        photo={photoById(db, node.coverPhotoId) ? { src: photoById(db, node.coverPhotoId)!.src, alt: photoById(db, node.coverPhotoId)!.alt } : undefined}
        members={db.people
          .filter((p) => p.privacy.status === "visible" && p.memberships.some((m) => org.subtree(node.id).has(m.nodeId)))
          .sort((a, b) => fullName(a).localeCompare(fullName(b), "nb"))
          .map((p) => ({ id: p.id, name: fullName(p) }))}
        structure={
          node.parentId && isAdminOf(user, org, node.parentId)
            ? {
                name: node.name,
                ageLabel: node.ageLabel ?? "",
                ageFrom: node.ageRange ? String(node.ageRange[0]) : "",
                ageTo: node.ageRange ? String(node.ageRange[1]) : "",
                impact: groupImpact(db, org, node.id),
              }
            : undefined
        }
      />
    </div>
  );
}
