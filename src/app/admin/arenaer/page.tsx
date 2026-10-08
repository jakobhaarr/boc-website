import { uploadedAt } from "@/lib/photo-src";
import { ChevronRight, MapPin, Plus } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { buttonClass } from "@/components/ui/button";
import { photoById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { canEditVenues } from "@/lib/permissions";
import { venueUsage } from "@/lib/venue-edit";

export const metadata = { title: "Arenaer" };

/** The club's venues: where groups train and meet, with a photo for each. */
export default async function VenuesPage() {
  const { db, user } = await loadAdmin();
  if (!canEditVenues(user)) notFound();
  const venues = [...db.venues].sort((a, b) => a.name.localeCompare(b.name, "nb"));

  return (
    <div className="page pb-16">
      <AdminHeader
        title="Arenaer"
        description="Stedene gruppene trener og møtes. Navnet, bildet og kartlenken vises på gruppesidene, under «Når og hvor»."
        actions={
          <Link href="/admin/arenaer/ny" className={buttonClass({ size: "md" })}>
            <Plus aria-hidden />
            Ny arena
          </Link>
        }
      />
      <Panel id="arenaer" title={`${venues.length} arenaer`}>
        <ul className="divide-y divide-line">
          {venues.map((v) => {
            const photo = photoById(db, v.photoId);
            const use = venueUsage(db, v.id);
            return (
              <li key={v.id}>
                <Link href={`/admin/arenaer/${v.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-sunken sm:px-5">
                  <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-sunken text-ink-3">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={uploadedAt(photo.src, 256)} alt="" className="size-full object-cover" />
                    ) : (
                      <MapPin aria-hidden className="size-5" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold tracking-[-0.01em] text-ink">{v.name}</span>
                    <span className="block t-small text-ink-2">
                      {v.area}
                      {v.surface ? ` · ${v.surface}` : ""}
                    </span>
                    <span className="block t-meta text-ink-3">{use.used ? `Brukes av ${use.groups.length} ${use.groups.length === 1 ? "gruppe" : "grupper"}` : "Ikke i bruk"}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-3" />
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
