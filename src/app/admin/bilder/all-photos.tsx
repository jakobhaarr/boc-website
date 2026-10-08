import Link from "next/link";
import { Photo } from "@/components/public/photo";
import { Select } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/primitives";
import { fullName } from "@/lib/content";
import { relativeTime } from "@/lib/dates";
import type { Org } from "@/lib/org";
import type { Db, Photo as PhotoRecord } from "@/lib/types";

/** Who took a picture, for a filter and a label: the stored photographer, else the credit text, else nobody named. */
export const photographerName = (p: PhotoRecord) => p.photographer?.name ?? p.credit ?? p.source.photographer ?? "";

export type AllFilter = { gruppe?: string; fotograf?: string; person?: string; vis?: string; antall?: string };

const PAGE = 48;

/**
 * Every picture in the project, to look through and filter: by the group it belongs to (and the groups under it),
 * the photographer, a person who is tagged in it, and what is the matter with it. Plain links and a GET form,
 * so a filtered view can be linked to. Each picture opens its detail page, where the check and the corrections are made.
 */
export function AllPhotos({ db, org, now, filter }: { db: Db; org: Org; now: string; filter: AllFilter }) {
  const subtree = filter.gruppe ? org.subtree(filter.gruppe) : undefined;
  const matches = (p: PhotoRecord) => {
    if (subtree && !subtree.has(p.nodeId)) return false;
    if (filter.fotograf === "__ingen") {
      if (photographerName(p)) return false;
    } else if (filter.fotograf && photographerName(p) !== filter.fotograf) return false;
    if (filter.person && !p.people.some((x) => x.personId === filter.person)) return false;
    if (filter.vis === "venter" && p.review?.status !== "pending") return false;
    if (filter.vis === "skjult" && !p.withdrawn) return false;
    if (filter.vis === "ingen-tagget" && (p.people.length > 0 || p.noPeople || p.censored)) return false;
    if (filter.vis === "uten-samtykke" && !p.people.some((x) => db.people.find((q) => q.id === x.personId)?.privacy.photoConsent !== "granted")) return false;
    return true;
  };
  const stamp = (p: PhotoRecord) => p.review?.uploadedAt ?? "";
  const all = db.photos.filter(matches).sort((a, b) => stamp(b).localeCompare(stamp(a)));
  const limit = Math.max(PAGE, Number(filter.antall) || PAGE);
  const shown = all.slice(0, limit);

  const groups = org.nodes.filter((n) => db.photos.some((p) => org.subtree(n.id).has(p.nodeId)));
  const photographers = [...new Set(db.photos.map(photographerName).filter(Boolean))].sort((a, b) => a.localeCompare(b, "nb"));
  const taggedIds = [...new Set(db.photos.flatMap((p) => p.people.map((x) => x.personId)))];
  const people = taggedIds
    .map((id) => db.people.find((x) => x.id === id))
    .filter((x): x is NonNullable<typeof x> => !!x && x.privacy.status !== "anonymised")
    .map((x) => ({ id: x.id, name: fullName(x) }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  const query = new URLSearchParams({ status: "alle", ...(filter.gruppe && { gruppe: filter.gruppe }), ...(filter.fotograf && { fotograf: filter.fotograf }), ...(filter.person && { person: filter.person }), ...(filter.vis && { vis: filter.vis }) });
  const filtered = !!(filter.gruppe || filter.fotograf || filter.person || filter.vis);

  return (
    <div className="mt-4 grid gap-4">
      <form method="get" className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
        <input type="hidden" name="status" value="alle" />
        <label className="grid gap-1 t-small font-medium text-ink-2">
          Gruppe
          <Select name="gruppe" defaultValue={filter.gruppe ?? ""}>
            <option value="">Alle</option>
            {groups.map((n) => (
              <option key={n.id} value={n.id}>
                {"  ".repeat(Math.max(0, org.lineage(n.id).length - 1))}
                {n.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1 t-small font-medium text-ink-2">
          Fotograf
          <Select name="fotograf" defaultValue={filter.fotograf ?? ""}>
            <option value="">Alle</option>
            <option value="__ingen">Ikke oppgitt</option>
            {photographers.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1 t-small font-medium text-ink-2">
          Person tagget
          <Select name="person" defaultValue={filter.person ?? ""}>
            <option value="">Alle</option>
            {people.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="grid gap-1 t-small font-medium text-ink-2">
          Vis
          <Select name="vis" defaultValue={filter.vis ?? ""}>
            <option value="">Alle bilder</option>
            <option value="venter">Venter på kontroll</option>
            <option value="uten-samtykke">Tagget uten samtykke</option>
            <option value="ingen-tagget">Ingen tagget</option>
            <option value="skjult">Skjult</option>
          </Select>
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="inline-flex h-10 items-center rounded-md bg-action px-4 t-small font-medium text-ink-inverse hover:bg-action-hover">
            Vis bilder
          </button>
          {filtered && (
            <Link href="/admin/bilder?status=alle" className="t-small text-ink-3 underline underline-offset-2 hover:text-ink">
              Nullstill
            </Link>
          )}
          <p className="t-small text-ink-3" aria-live="polite">
            {all.length === 1 ? "1 bilde" : `${all.length} bilder`}
          </p>
        </div>
      </form>

      {shown.length === 0 ? (
        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          <EmptyState>Ingen bilder passer med valgene.</EmptyState>
        </div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((p) => {
            const name = photographerName(p);
            const place = org.get(p.nodeId)?.name ?? "Klubben";
            return (
              <li key={p.id} className="overflow-hidden rounded-lg border border-line bg-surface">
                <Link href={`/admin/personvern-kontroll/bilde/${p.id}`} className="group block">
                  <div className="overflow-hidden bg-sunken">
                    <Photo photo={p} ratio={3 / 2} sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw" grade={false} />
                  </div>
                  <div className="grid gap-1 px-3 py-2.5">
                    <p className="truncate t-small font-semibold text-ink group-hover:underline">{place}</p>
                    <p className="truncate t-meta text-ink-3">{name ? `Foto: ${name}` : "Fotograf ikke oppgitt"}</p>
                    <p className="t-meta text-ink-3">
                      {p.noPeople ? "Ingen personer" : p.people.length ? `${p.people.length} tagget` : "Ingen tagget"}
                      {p.review?.uploadedAt ? ` · ${relativeTime(p.review.uploadedAt, now)}` : ""}
                    </p>
                    {(p.withdrawn || p.review?.status === "pending") && (
                      <div className="flex flex-wrap gap-1">
                        {p.withdrawn && <Status tone="danger">Skjult</Status>}
                        {p.review?.status === "pending" && <Status tone="warning">Til kontroll</Status>}
                      </div>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {all.length > shown.length && (
        <div className="flex justify-center">
          <Link href={`/admin/bilder?${query}&antall=${limit + PAGE}`} className="inline-flex h-10 items-center rounded-md px-4 t-small font-medium text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-sunken">
            Vis flere ({all.length - shown.length} igjen)
          </Link>
        </div>
      )}
    </div>
  );
}
