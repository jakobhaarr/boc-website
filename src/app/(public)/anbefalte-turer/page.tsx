import type { Metadata } from "next";
import { RouteExplorer, type RouteView } from "@/components/public/route-explorer";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Anbefalte turer",
  description: "Turene klubben anbefaler, med lenke til ruten på Strava, lengde, høydemeter og bilder.",
};

/**
 * The tours the club recommends (db.routes, kept in admin at /admin/turer). The route itself is on Strava, which each
 * card links to; the length and climbing are the club's own figures, typed in. The page filters them (length,
 * climbing, Mallorca) in the browser and shows the time each takes at a speed chosen with a slider.
 */
export default async function RecommendedRoutesPage() {
  const { db } = await loadSite();
  const routes: RouteView[] = db.routes.map((t) => ({
    id: t.id,
    name: t.name,
    stravaUrl: t.stravaUrl,
    distanceKm: t.distanceKm,
    elevationM: t.elevationM,
    mallorca: !!t.mallorca,
    description: t.description,
    stops: t.stops ?? [],
    // A picture that has been withdrawn in the privacy check is not shown.
    photos: t.photoIds.flatMap((id) => {
      const p = photoById(db, id);
      return p && !p.withdrawn ? [p] : [];
    }),
  }));

  return (
    <Section className="pb-20 lg:pb-28">
      <div className="page pt-6 lg:pt-10">
        <Breadcrumb items={[{ label: db.club.name, href: "/" }, { label: "Aktiviteter", href: "/aktiviteter" }, { label: "Anbefalte turer" }]} />
        <div className="mt-8 max-w-[62ch]">
          <p className="t-eyebrow">Aktiviteter</p>
          <h1 className="mt-3 t-h1">Anbefalte turer</h1>
          <p className="mt-4 t-body-lg text-ink-2">
            Turer medlemmene har syklet og vil anbefale. Velg lengde og høydemeter etter formen din, og åpne ruten i Strava for å følge den.
          </p>
        </div>
        <div className="mt-10">
          <RouteExplorer routes={routes} />
        </div>
      </div>
    </Section>
  );
}
