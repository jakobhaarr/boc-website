import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { NodeHero } from "@/components/public/node/hero";
import { SplitSection } from "@/components/public/node/shared";
import { Photo } from "@/components/public/photo";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { formatSpan } from "@/lib/club-year";

export const metadata: Metadata = {
  title: "Mallorca",
  description: "Klubbens uke på Mallorca i mars og oktober: fellesturer i grupper på flere nivåer og rabattert hotell.",
};

/**
 * The Mallorca trips as one page: what the week is, when it is, and where to
 * ask. Only what the club has said about the trips is stated here (a week in
 * March and October, groups at several levels, a discounted hotel, often up to
 * 50 people, for members); prices, hotel and travel are not on the site, so the
 * page sends questions to the Landevei group's Spond. The trips link here from
 * the terminliste (Activity.page).
 */
export default async function MallorcaPage() {
  const { db, org, today } = await loadSite();
  const trips = db.activities
    .filter((a) => a.page?.href === "/mallorca" && a.status === "scheduled" && (a.endDate ?? a.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const landevei = org.get("b-landevei");
  const spond = landevei?.joinGroup;
  const photos = ["b-ph-mallorca-road", "b-ph-mallorca-forest", "b-ph-mallorca-street"].flatMap((id) => {
    const p = photoById(db, id);
    return p && !p.withdrawn ? [p] : [];
  });
  const season = (title: string) => title.replace(/^Treningstur til Mallorca,?\s*/i, "");

  return (
    <>
      <NodeHero
        breadcrumb={[{ label: db.club.name, href: "/" }, { label: "Mallorca" }]}
        eyebrow="Klubbtur"
        title="Mallorca"
        description="Rundt mars og oktober reiser klubben en uke til Mallorca. Fellesturer i grupper på flere nivåer, og rabattert hotell for medlemmer."
        video={{ src: "/video/mallorca-drone.mp4", poster: "/video/mallorca-drone-poster.jpg", label: "Droneopptak av BOC-syklister på en landevei på Mallorca" }}
        primaryHref="#datoer"
        primaryLabel="Se datoene"
        joinHref={spond?.url ?? "/sykkel/landevei"}
        joinLabel="Bli med i Landevei i Spond"
        leadWith="join"
        facts={[
          ...trips.slice(0, 2).map((t) => ({ value: formatSpan(t.date, t.endDate), label: `Mallorca, ${season(t.title)}` })),
          { value: "Opp mot 50", label: "deltakere, ofte" },
          { value: "Flere nivåer", label: "grupper etter fart" },
        ]}
      />

      <div className="alternate">
        <SplitSection id="opplegget" eyebrow="Opplegget" title="En uke med sykling i grupper.">
          <div className="max-w-[60ch] space-y-4 t-body-lg text-ink-2">
            <p>
              Rundt mars og oktober reiser klubben en uke til Mallorca. Vi sykler sammen i grupper på flere nivåer, så du kan velge en gruppe som passer farten din, og det er ofte opp mot 50 deltakere.
            </p>
            <p>Klubben har rabattert hotell for deltakerne.</p>
            <p>Mallorca-turene er for medlemmer. Du trenger ikke være rask: gruppene er satt sammen etter fart.</p>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <ButtonLink href="/sykkel/landevei" size="lg" variant="secondary" arrow>
              Se Landevei-gruppene
            </ButtonLink>
            <Link href="/bli-med" className="link t-small font-medium text-ink">
              Slik blir du medlem
            </Link>
          </div>
        </SplitSection>

        <SplitSection id="datoer" eyebrow="Datoer" title="Neste turer.">
          {trips.length ? (
            <ul className="max-w-[44rem] divide-y divide-line border-y border-line">
              {trips.map((t) => (
                <li key={t.id} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4">
                  <span className="font-display text-[1.5rem] leading-tight font-medium tracking-[-0.012em]">{formatSpan(t.date, t.endDate)}</span>
                  <span className="t-body text-ink-2">{t.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-body text-ink-2">Neste tur er ikke satt ennå.</p>
          )}
          <p className="mt-6 max-w-[60ch] t-body text-ink-2">
            Har du spørsmål om turen? Bli med i Spond-gruppa for Landevei og send melding der.
          </p>
          {spond && (
            <ExternalButton href={spond.url} size="lg" arrow className="mt-5 !bg-club-surface !text-on-club hover:!bg-[var(--club-primary-hover)]">
              {spond.label}
              <ArrowUpRight aria-hidden />
            </ExternalButton>
          )}
        </SplitSection>

        {photos.length > 0 && (
          <SplitSection id="bilder" eyebrow="Fra turene" title="Slik ser det ut.">
            <div className="grid gap-[var(--grid-gap)] sm:grid-cols-3">
              {photos.map((p) => (
                <Photo key={p.id} photo={p} ratio={4 / 5} sizes="(min-width: 1024px) 28vw, (min-width: 640px) 33vw, 100vw" className="rounded-lg" />
              ))}
            </div>
          </SplitSection>
        )}
      </div>
    </>
  );
}
