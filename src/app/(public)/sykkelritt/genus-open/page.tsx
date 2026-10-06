import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SplitSection } from "@/components/public/node/shared";
import { VideoHero } from "@/components/public/video-hero";
import { loadSite } from "@/lib/data/queries";
import { formatSpan, nextEdition } from "@/lib/club-year";
import { formatTime } from "@/lib/dates";

export const metadata: Metadata = {
  title: "Genus Open by BOC",
  description: "Genus Open by BOC, klubbens eget ritt sammen med Genus: fra Bogstad opp til toppen av slalåmbakken.",
};

/**
 * Genus Open by BOC, the club's own race, on a page of its own: the film from
 * 2022 behind the name, the facts the club has (when, where, who is behind it)
 * and the whole film below with its controls. The date is the next edition on
 * the same weekday as the last. The race, the activity and the calendar link here
 * (Race.page, Activity.page).
 */
export default async function GenusOpenPage() {
  const { db, org, today } = await loadSite();
  const race = db.races.find((r) => r.ownEvent);
  if (!race) notFound();
  const activity = db.activities.find((a) => a.page?.href === "/sykkelritt/genus-open");
  const sponsor = db.club.sponsors?.find((s) => s.name === "Genus");
  const next = nextEdition(race, today);
  const date = `${formatSpan(next.start, next.end)} ${next.start.slice(0, 4)}`;
  const time = activity ? `kl. ${formatTime(activity.start)}${activity.end ? `–${formatTime(activity.end)}` : ""}` : undefined;
  const lead = activity?.description ?? "Klubbens eget ritt, med Genus som hovedsamarbeidspartner.";

  return (
    <>
      <VideoHero
        label="Genus Open by BOC"
        video={{ src: "/video/genus-open-2022.mp4", poster: "/video/genus-open-2022-poster.jpg", label: "Film fra Genus Open 2022: syklister og Tryvann tårn fra luften" }}
        eyebrow="Klubbens eget ritt"
        title="Genus Open by BOC"
        lead={lead}
        primary={{ href: "#filmen", label: "Se filmen fra 2022" }}
        secondary={{ href: "/sykkelritt", label: "Alle sykkelritt" }}
        facts={[
          { value: date, label: "Neste utgave" },
          ...(time ? [{ value: time, label: "Tidspunkt" }] : []),
          { value: "Bogstad til Tryvann", label: "Via Sørkedalen" },
          ...(sponsor ? [{ value: sponsor.name, label: sponsor.kind }] : []),
        ]}
      />

      <div className="alternate">
        <SplitSection id="om" eyebrow="Om rittet" title="Opp til toppen av slalåmbakken.">
          <div className="max-w-[60ch] space-y-4 t-body-lg text-ink-2">
            <p>{lead}</p>
            <p>Genus Open arrangeres av Bærum og Omegn Cykleklubb{sponsor ? `, med ${sponsor.name} som ${sponsor.kind.toLowerCase()}` : ""}.</p>
          </div>
          <dl className="mt-8 grid max-w-[44rem] grid-cols-[7rem_minmax(0,1fr)] gap-x-4 gap-y-2 t-body">
            <dt className="text-ink-3">Neste utgave</dt>
            <dd>{date}</dd>
            {time && (
              <>
                <dt className="text-ink-3">Tid</dt>
                <dd>{time}</dd>
              </>
            )}
            <dt className="text-ink-3">Løypa</dt>
            <dd>{race.place}</dd>
          </dl>
        </SplitSection>

        <SplitSection id="filmen" eyebrow="Filmen" title="Genus Open 2022.">
          <figure>
            <video
              className="aspect-video w-full max-w-[56rem] rounded-xl bg-inverse object-cover"
              src="/video/genus-open-2022.mp4"
              poster="/video/genus-open-2022-poster.jpg"
              controls
              playsInline
              preload="none"
              aria-label="Film fra Genus Open 2022"
            />
            <figcaption className="mt-3 t-small text-ink-3">Genus Open 2022. En film av Jakob Jølstad.</figcaption>
          </figure>
          <p className="mt-8 t-small text-ink-3">
            Se også <Link href="/sykkelritt" className="link text-ink">alle sykkelrittene</Link> klubben kjører.
          </p>
        </SplitSection>
      </div>
    </>
  );
}
