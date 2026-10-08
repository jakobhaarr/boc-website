import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { PhotoDetailEditor } from "@/components/admin/photo-detail-editor";
import type { TaggablePerson } from "@/components/admin/people-tagger";
import { fullName, userById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { formatDateFull } from "@/lib/dates";
import { trailLabel } from "@/lib/org";
import { canAnonymise } from "@/lib/permissions";
import { choiceKey, photographerOptions } from "@/lib/photo-meta";

export const metadata = { title: "Bilde" };

/** One picture in the privacy check: its facts, and everything that can be done with it (see PhotoDetailEditor). */
export default async function PhotoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, org, user, today } = await loadAdmin();
  if (!canAnonymise(user)) redirect("/admin");
  const photo = db.photos.find((p) => p.id === id);
  if (!photo) notFound();

  const uploader = userById(db, photo.review?.uploadedByUserId);
  const at = photo.review?.uploadedAt;
  const stamp = at ? `${formatDateFull(at.slice(0, 10))} kl. ${at.slice(11, 16).replace(":", ".")}` : "ikke registrert";
  const people: TaggablePerson[] = db.people
    .map((p) => ({ id: p.id, name: p.privacy.status === "anonymised" ? "Anonymisert person" : fullName(p), status: p.privacy.status, consent: p.privacy.photoConsent }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  return (
    <div className="page pb-16">
      <div className="pt-4 md:pt-6">
        <Link href="/admin/personvern-kontroll#bilder" className="inline-flex items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Personvern-kontroll
        </Link>
      </div>
      <AdminHeader
        title="Bilde"
        description={`${trailLabel(org, photo.nodeId, { includeSelf: true })}. Lastet opp av ${uploader?.name ?? (photo.source.provider === "unsplash" ? "demobilde (Unsplash)" : "ukjent")}, ${stamp}.${photo.withdrawn ? ` Skjult: ${photo.withdrawn.reason}.` : ""}`}
      />
      <PhotoDetailEditor
        photoId={photo.id}
        src={photo.src}
        alt={photo.alt}
        options={photographerOptions(db, org, photo.review?.uploadedByUserId ?? user.id, photo.nodeId, today, { scope: db.people })}
        people={people}
        photographerKey={photo.photographer ? choiceKey(photo.photographer) : ""}
        tagged={photo.people.map((p) => p.personId)}
        noPeople={!!photo.noPeople}
        covered={photo.coveredPersonIds ?? []}
        clubName={db.club.shortName}
        hidden={!!photo.withdrawn || !!photo.awaitingConsent?.length}
        back="/admin/personvern-kontroll#bilder"
      />
    </div>
  );
}
