import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/bits";
import { VenueEditor } from "@/components/admin/venue-editor";
import { photoById } from "@/lib/content";
import { loadAdmin } from "@/lib/data/queries";
import { canEditVenues } from "@/lib/permissions";
import { venueUsage } from "@/lib/venue-edit";

export const metadata = { title: "Rediger arena" };

export default async function EditVenuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db, user } = await loadAdmin();
  if (!canEditVenues(user)) notFound();
  const venue = id === "ny" ? undefined : db.venues.find((v) => v.id === id);
  if (id !== "ny" && !venue) notFound();
  const photo = photoById(db, venue?.photoId);
  const use = venue ? venueUsage(db, venue.id) : undefined;

  return (
    <div className="page pb-8">
      <div className="pt-4 md:pt-6">
        <Link href="/admin/arenaer" className="inline-flex items-center gap-1.5 t-small font-medium text-ink-2 hover:text-ink">
          <ArrowLeft aria-hidden className="size-4" />
          Arenaer
        </Link>
      </div>
      <AdminHeader title={venue ? venue.name : "Ny arena"} className="!pt-3 md:!pt-4" />
      <VenueEditor
        key={venue?.id ?? "ny"}
        venue={
          venue
            ? { id: venue.id, name: venue.name, area: venue.area, surface: venue.surface, address: venue.address ?? "", mapQuery: venue.mapQuery, preposition: venue.preposition ?? "på", note: venue.note ?? "" }
            : undefined
        }
        photo={photo ? { src: photo.src, alt: photo.alt } : undefined}
        usage={use ? { groups: use.groups, series: use.series, activities: use.activities } : undefined}
      />
    </div>
  );
}
