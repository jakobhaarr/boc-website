import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { ConsentResend } from "@/components/admin/consent-resend";
import { PhotoReviewActions } from "@/components/admin/photo-review-actions";
import { Photo } from "@/components/public/photo";
import { chipClass, EmptyState, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { articleHref, articlePhotoIds, fullName, userById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { diffDays, relativeTime } from "@/lib/dates";
import { isClubAdmin } from "@/lib/permissions";
import { choiceKey, PHOTO_REVIEW_DAYS, pendingPhotos, photographerOptions, reviewState } from "@/lib/photo-meta";
import { plain } from "@/lib/rich-text";

export const metadata = { title: "Bilder" };

const KIND_LABEL = { user: "lastet opp av fotografen", member: "medlem", external: "ekstern", club: "ingen kreditering" } as const;

export default async function PhotosPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const { db, org, user, now, today } = await loadAdmin();
  if (!isClubAdmin(user)) redirect("/admin");

  const waiting = pendingPhotos(db);
  const checked = db.photos
    .filter((p) => p.review?.status === "approved" && p.review.approvedAt && p.review.approvedByUserId !== p.review.uploadedByUserId)
    .sort((a, b) => b.review!.approvedAt!.localeCompare(a.review!.approvedAt!))
    .slice(0, 30);
  const tab = status === "kontrollert" ? "kontrollert" : "kontroll";
  const photos = tab === "kontroll" ? waiting : checked;
  const consentWaiting = db.consentRequests.filter((r) => r.status === "pending");
  const overdue = waiting.filter((p) => reviewState(p, now) === "overdue");

  /** Where a picture is used, so the administrator can see what it belongs to. */
  const usedAt = (photoId: string, nodeId: string): string => {
    const article = db.articles.find((a) => articlePhotoIds(a).includes(photoId));
    if (article) return `Innlegg: ${plain(article.title.map((i) => (i.type === "mention" ? { type: "text" as const, text: i.neutral } : i)))}`;
    const group = db.nodes.find((n) => n.coverPhotoId === photoId);
    if (group) return `Hovedbilde for ${group.name}`;
    const venue = db.venues.find((v) => v.photoId === photoId);
    if (venue) return `Bilde av arenaen ${venue.name}`;
    return org.get(nodeId)?.name ?? "Klubben";
  };

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Bilder"
        description="Bilder publiseres med en gang. Her kontrollerer du etterpå hvem som tok dem og hvem som er med, og godkjenner eller retter. Står et bilde ubehandlet for lenge, blir det en rød varsel."
      />

      {overdue.length > 0 && (
        <div role="status" className="mb-5 flex gap-3 rounded-lg border border-danger/25 bg-danger-surface px-4 py-3">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="t-small text-ink">
            <span className="font-semibold text-danger">{overdue.length === 1 ? "1 bilde har" : `${overdue.length} bilder har`} ventet i over {PHOTO_REVIEW_DAYS} dager på kontroll.</span> De er allerede på nettsiden, så gå gjennom dem snart.
          </p>
        </div>
      )}

      {consentWaiting.length > 0 && (
        <section aria-labelledby="samtykke-venter" className="mb-5 overflow-hidden rounded-lg border border-line bg-surface">
          <h2 id="samtykke-venter" className="border-b border-line px-4 py-3 t-label font-semibold sm:px-5">
            Venter på samtykke
          </h2>
          <ul className="divide-y divide-line">
            {consentWaiting.map((r) => {
              const person = db.people.find((p) => p.id === r.personId);
              const where = org.get(db.photos.find((p) => r.photoIds.includes(p.id))?.nodeId ?? "")?.name ?? "klubben";
              return (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <p className="min-w-0 t-small text-ink-2">
                    <span className="font-medium text-ink">{person ? fullName(person) : "Ukjent"}</span> er spurt på e-post om {r.photoIds.length === 1 ? "1 bilde" : `${r.photoIds.length} bilder`} på {where}, {relativeTime(r.createdAt, now)}
                    {r.sent > 1 ? ` (sendt ${r.sent} ganger)` : ""}. Bildene er skjult til svaret kommer.
                  </p>
                  <ConsentResend requestId={r.id} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <nav aria-label="Status" className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
        <Link href="/admin/bilder" aria-current={tab === "kontroll" ? "page" : undefined} className={cn(chipClass(tab === "kontroll"), "justify-between sm:justify-start")}>
          Til kontroll
          <span className={cn("tnum", tab === "kontroll" ? "text-ink-inverse/70" : overdue.length ? "font-semibold text-danger" : "text-ink-3")}>{waiting.length}</span>
        </Link>
        <Link href="/admin/bilder?status=kontrollert" aria-current={tab === "kontrollert" ? "page" : undefined} className={cn(chipClass(tab === "kontrollert"), "justify-between sm:justify-start")}>
          Kontrollert
          <span className={cn("tnum", tab === "kontrollert" ? "text-ink-inverse/70" : "text-ink-3")}>{checked.length}</span>
        </Link>
      </nav>

      <div className="mt-4 overflow-hidden rounded-lg border border-line bg-surface">
        {photos.length === 0 ? (
          <EmptyState>{tab === "kontroll" ? "Ingen bilder venter på kontroll." : "Ingen kontrollerte bilder ennå."}</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {photos.map((p) => {
              const review = p.review!;
              const state = reviewState(p, now);
              const days = diffDays(now.slice(0, 10), review.uploadedAt.slice(0, 10));
              const uploader = userById(db, review.uploadedByUserId);
              const where = usedAt(p.id, p.nodeId);
              const photographer = p.photographer;
              const taggedPeople = p.people.map((pp) => db.people.find((x) => x.id === pp.personId)).filter((x) => !!x);
              const isPlace = p.nodeId === org.root.id;
              // The members who can be ticked: everyone in the group the picture belongs to.
              const roster = isPlace
                ? undefined
                : db.people
                    .filter((x) => x.memberships.some((m) => m.nodeId === p.nodeId || org.contains(p.nodeId, m.nodeId)))
                    .map((x) => ({ id: x.id, name: fullName(x), status: x.privacy.status, consent: x.privacy.photoConsent }))
                    .sort((a, b) => a.name.localeCompare(b.name, "nb"));
              return (
                <li key={p.id} className={cn("grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 px-4 py-4 sm:px-5 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center md:gap-x-5", state === "overdue" && "bg-danger-surface/50")}>
                  <div className="max-h-24 w-24 shrink-0 self-start overflow-hidden rounded-md bg-sunken sm:w-32">
                    <Photo photo={p} ratio={3 / 2} sizes="128px" grade={false} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="t-label font-semibold">{where}</p>
                      {tab === "kontroll" ? (
                        state === "overdue" ? <Status tone="danger">Har ventet i {days} dager</Status> : <Status tone="warning">Til kontroll</Status>
                      ) : (
                        <Status tone="success">Kontrollert</Status>
                      )}
                    </div>
                    <p className="mt-0.5 t-small text-ink-3">
                      Lastet opp av {uploader?.name ?? "ukjent"} · {relativeTime(review.uploadedAt, now)}
                      {tab === "kontrollert" && review.approvedAt && ` · kontrollert ${relativeTime(review.approvedAt, now)} av ${userById(db, review.approvedByUserId ?? "")?.name ?? "ukjent"}`}
                    </p>
                    <dl className="mt-2 grid gap-0.5 t-small">
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-ink-3">Foto:</dt>
                        <dd className="text-ink">{photographer ? `${photographer.name} (${KIND_LABEL[photographer.kind]})` : "ikke oppgitt"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="shrink-0 text-ink-3">Med på bildet:</dt>
                        <dd className="text-ink">
                          {p.noPeople ? "Ingen identifiserbare personer" : taggedPeople.length ? taggedPeople.map((x) => fullName(x!)).join(", ") : "ikke angitt"}
                        </dd>
                      </div>
                      {p.censored ? (
                        <div className="flex gap-2">
                          <dt className="shrink-0 text-ink-3">Sladdet:</dt>
                          <dd className="text-ink">{p.censored === 1 ? "1 person uten samtykke er dekket til" : `${p.censored} personer uten samtykke er dekket til`}</dd>
                        </div>
                      ) : null}
                      {taggedPeople.some((x) => x!.privacy.photoConsent !== "granted") && (
                        <div className="flex gap-2">
                          <dt className="shrink-0 font-medium text-danger">Mangler samtykke:</dt>
                          <dd className="text-danger">{taggedPeople.filter((x) => x!.privacy.photoConsent !== "granted").map((x) => fullName(x!)).join(", ")}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    {tab === "kontroll" ? (
                      <PhotoReviewActions
                        photoId={p.id}
                        options={photographerOptions(db, org, review.uploadedByUserId, p.nodeId, today, { members: !isPlace })}
                        people={roster}
                        photographerKey={photographer ? choiceKey(photographer) : ""}
                        tagged={p.people.map((pp) => pp.personId)}
                        noPeople={!!p.noPeople}
                        clubName={db.club.shortName}
                        heading={where}
                      />
                    ) : null}
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
