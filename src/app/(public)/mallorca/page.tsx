import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AutoplayVideo } from "@/components/public/autoplay-video";
import { FactStrip } from "@/components/public/node/hero";
import { SplitSection } from "@/components/public/node/shared";
import { PhotoCarousel } from "@/components/public/photo-carousel";
import { ButtonLink, ExternalButton, HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
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
  const photos = ["b-ph-mallorca-road", "b-ph-mallorca-street", "b-ph-mallorca-lane", "b-ph-mallorca-forest", "b-ph-mallorca-side", "b-ph-mallorca-track"].flatMap((id) => {
    const p = photoById(db, id);
    return p && !p.withdrawn ? [p] : [];
  });
  const season = (title: string) => title.replace(/^Treningstur til Mallorca,?\s*/i, "");

  return (
    <>
      {/* The film runs edge to edge under the header, like the photograph on the front page, with the name and
          the actions on a dark wash to the left and the dates along the foot. Below lg the film stands over
          the text, which then sits on the header's colour. */}
      <section aria-label="Mallorca" className="relative bg-[var(--header-bg,#0d1a2b)] text-white">
        <div className="relative mx-auto max-w-[1728px]">
          <div className="relative isolate overflow-hidden lg:h-[calc(100svh-var(--header-h))] lg:max-h-[50rem] lg:min-h-[36rem]">
            <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:absolute lg:inset-0 lg:-z-20 lg:aspect-auto">
              <AutoplayVideo src="/video/mallorca-drone.mp4" poster="/video/mallorca-drone-poster.jpg" label="Droneopptak av BOC-syklister på en landevei på Mallorca" className="absolute inset-0" />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
              style={{ background: "linear-gradient(to right, rgb(0 0 0 / 0.82), rgb(0 0 0 / 0.6) 30%, rgb(0 0 0 / 0.2) 52%, transparent 68%), linear-gradient(to top, rgb(0 0 0 / 0.5), transparent 30%)" }}
            />
            <div className="page grid-page lg:h-full">
              <div className="col-span-full flex flex-col justify-center pt-8 pb-10 lg:col-span-6 lg:pt-10 lg:pb-28">
                <p className="t-eyebrow !text-white/75">Klubbtur</p>
                <h1 className="mt-3 t-display text-white lg:!text-[3.25rem]">Mallorca</h1>
                <p className="mt-5 max-w-[42ch] t-body-lg text-white/85">
                  Rundt mars og oktober reiser klubben en uke til Mallorca. Fellesturer i grupper på flere nivåer, og rabattert hotell for medlemmer.
                </p>
                <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
                  {spond ? (
                    <ExternalButton href={spond.url} size="lg" arrow className="!bg-club-surface !text-on-club hover:!bg-[var(--club-primary-hover)]">
                      Bli med i Landevei i Spond
                    </ExternalButton>
                  ) : (
                    <ButtonLink href="/sykkel/landevei" size="lg" arrow className="!bg-club-surface !text-on-club hover:!bg-[var(--club-primary-hover)]">
                      Se Landevei-gruppene
                    </ButtonLink>
                  )}
                  <Link href="#datoer" className="inline-flex items-center t-small font-medium text-white hover:text-white/80">
                    Se datoene
                    <HoverArrow />
                  </Link>
                </div>
              </div>
            </div>
            <FactStrip
              overlay
              facts={[
                ...trips.slice(0, 2).map((t) => ({ value: formatSpan(t.date, t.endDate), label: `Mallorca, ${season(t.title)}` })),
                { value: "Opp mot 50", label: "deltakere, ofte" },
                { value: "Flere nivåer", label: "grupper etter fart" },
              ]}
            />
          </div>
        </div>
      </section>

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
          <Section labelledBy="bilder" rule="top" className="py-16 lg:py-24">
            <div className="page">
              <p className="t-eyebrow">Fra turene</p>
              <h2 id="bilder" className="mt-3 mb-8 scroll-mt-28 t-h2">
                Slik ser det ut.
              </h2>
              <PhotoCarousel photos={photos} label="Bilder fra Mallorca-turene" />
            </div>
          </Section>
        )}
      </div>
    </>
  );
}
