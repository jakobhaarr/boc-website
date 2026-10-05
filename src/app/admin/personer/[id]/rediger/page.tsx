import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { PersonEditor } from "@/components/admin/person-editor";
import { fullName } from "@/lib/content";
import { personDeletionBlock } from "@/lib/deletion";
import { loadAdmin } from "@/lib/data/queries";
import { canAnonymise, canSeePeople, isAdminOf, peopleInScope } from "@/lib/permissions";
import { publishedPresence } from "@/lib/privacy";

export const metadata = { title: "Rediger person" };

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, org, user } = await loadAdmin();
  if (!canSeePeople(user)) redirect("/admin");
  const person = peopleInScope(user, org, db).find((p) => p.id === id);
  if (!person) notFound();
  if (person.privacy.status === "anonymised") redirect(`/admin/personer/${id}`);

  const presence = publishedPresence(db, org, person.id);
  // Where an admin can put someone: the groups and levels they run.
  const groups = org.nodes
    .filter((n) => n.kind !== "club" && isAdminOf(user, org, n.id))
    .map((n) => ({ id: n.id, label: org.trail(n.id).map((x) => x.name).join(" › ") }));

  return (
    <div className="page pb-16">
      <div className="pt-4 md:pt-6">
        <Link href={`/admin/personer/${person.id}`} className="inline-flex items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          {fullName(person)}
        </Link>
      </div>
      <AdminHeader title="Rediger person" description="Endringer er synlige på nettsiden med en gang, der personen vises." className="!pt-3 md:!pt-4" />
      <PersonEditor
        person={{
          id: person.id,
          name: fullName(person),
          firstName: person.firstName,
          lastName: person.lastName,
          email: person.publicContact?.email ?? "",
          phone: person.publicContact?.phone ?? "",
          consentEmail: person.consentEmail ?? "",
        }}
        memberships={person.memberships.map((m) => ({
          nodeId: m.nodeId,
          role: m.role,
          title: m.title ?? "",
          path: org.trail(m.nodeId).map((x) => x.name).join(" › ") || "Klubben",
          editable: isAdminOf(user, org, m.nodeId),
        }))}
        groups={groups}
        erase={
          canAnonymise(user)
            ? {
                blocked: personDeletionBlock(db, person.id),
                articles: presence.articleIds.length,
                photos: presence.photos.length,
                activities: presence.activities.length,
              }
            : undefined
        }
      />
    </div>
  );
}
