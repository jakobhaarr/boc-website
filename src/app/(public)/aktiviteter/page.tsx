import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/public/photo";
import { Section } from "@/components/ui/guides";
import { photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import type { Photo as PhotoRecord } from "@/lib/types";

export const metadata: Metadata = {
  title: "Aktiviteter",
  description: "Treningsåret, sykkelritt, Mallorca-turen og anbefalte turer: velg hva du vil se.",
};

/**
 * Aktiviteter is a choice between three things the club does: the training
 * year (what used to be this page: the weekly rhythm and the dates), the
 * races, the Mallorca trips and the tours the club recommends. Each is a picture of people first, then a
 * line on what it is. Links from before, `/aktiviteter?gruppe=…`, go on to the
 * training year, which is where that filter lives.
 */
export default async function ActivitiesChoicePage({ searchParams }: { searchParams: Promise<{ gruppe?: string }> }) {
  const { gruppe } = await searchParams;
  if (gruppe) redirect(`/aktiviteter/treningsaret?gruppe=${encodeURIComponent(gruppe)}`);
  const { db } = await loadSite();
  const photo = (id: string): PhotoRecord | undefined => {
    const p = photoById(db, id);
    return p && !p.withdrawn ? p : undefined;
  };

  // The tours' own picture when one has been added, else a picture from the road branch.
  const routePhoto = db.routes.flatMap((t) => t.photoIds.map((id) => photo(id))).find((p) => !!p) ?? photo("b-ph-landevei-group") ?? photo("b-ph-landevei-corner");
  const choices = [
    {
      href: "/aktiviteter/treningsaret",
      title: "Treningsåret",
      text: "Ukerytmen gruppene følger hele sesongen, og datoene klubben har lagt ut. Velg idrett eller gruppe, så ser du bare det som gjelder deg.",
      label: "Se treningsåret",
      photo: photo("b-ph-bekkestua") ?? photo("b-ph-landevei-group"),
    },
    {
      href: "/sykkelritt",
      title: "Sykkelritt",
      text: "Rittene klubben kjører sammen, og Genus Open by BOC, som klubben arrangerer selv. De fleste kjører turritt, så du trenger ikke være rask.",
      label: "Se rittene",
      photo: photo("b-ph-styrkeproven-2023") ?? photo("b-ph-landevei-corner"),
    },
    {
      href: "/mallorca",
      title: "Mallorca-tur",
      text: "En uke på Mallorca i mars og oktober, i grupper på flere nivåer og med rabattert hotell for medlemmer.",
      label: "Se Mallorca-turen",
      photo: photo("b-ph-mallorca-road"),
    },
    {
      href: "/anbefalte-turer",
      title: "Anbefalte turer",
      text: "Turer medlemmene har syklet og vil anbefale, med rute i Strava, lengde og høydemeter. Filtrer på lengde, høydemeter og Mallorca.",
      label: "Se turene",
      photo: routePhoto,
    },
  ];

  return (
    <Section guides="edges">
      <div className="page pt-8 pb-16 lg:pt-14 lg:pb-24">
        <div className="grid-page">
          <div className="col-span-4 md:col-span-8 lg:col-span-9">
            <p className="t-eyebrow">Aktiviteter</p>
            <h1 className="mt-3 t-h1">
              Hva vil du se? <span className="text-ink-3">Trening hele året, ritt, eller en uke på Mallorca.</span>
            </h1>
          </div>
        </div>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:gap-6 xl:grid-cols-4">
          {choices.map((c) => (
            <li key={c.href} className="flex">
              <Link
                href={c.href}
                className="group flex w-full flex-col overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line transition-shadow duration-200 hover:shadow-[0_10px_30px_-14px_rgb(13_26_43/0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-sunken">
                  {c.photo && (
                    <Photo
                      photo={c.photo}
                      ratio={4 / 3}
                      sizes="(min-width: 1024px) 420px, 100vw"
                      className="absolute inset-0 h-full w-full transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h2 className="font-display text-[1.5rem] leading-[1.15] font-medium tracking-[-0.015em] lg:text-[1.75rem]">{c.title}</h2>
                  <p className="mt-3 t-body text-ink-2">{c.text}</p>
                  {/* The whole card is the link; this is what it says. */}
                  <span className="mt-auto flex pt-6">
                    <span className="inline-flex h-[3.25rem] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-action px-[18px] text-[16px] font-medium text-on-action transition-colors group-hover:bg-action-hover sm:h-10 sm:w-fit sm:text-[14px]">
                      {c.label}
                      <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
