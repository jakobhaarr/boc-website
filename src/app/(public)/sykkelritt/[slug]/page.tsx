import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { NodeHero } from "@/components/public/node/hero";
import { SplitSection } from "@/components/public/node/shared";
import { heroPhotoFor } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { formatSpan, nextEdition } from "@/lib/club-year";

type Props = { params: Promise<{ slug: string }> };

async function findRace(slug: string) {
  const site = await loadSite();
  const races = site.db.races.filter((r) => r.slug === slug && r.info);
  return { ...site, races, race: races[0] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { race } = await findRace((await params).slug);
  const name = race?.slug === "styrkeproven" ? "Styrkeprøven" : race?.name;
  return race?.info ? { title: name, description: race.info.lead } : {};
}

const MONTHS = ["januar", "februar", "mars", "april", "mai", "juni", "juli", "august", "september", "oktober", "november", "desember"];

/**
 * One race's page: what the organiser's own pages say, in the club's words, and
 * the club's groups that ride it. The organiser's site stays the place for
 * dates, prices and rules, and the page says so; what the club has read there
 * is dated (RaceInfo.checked). Styrkeprøven's routes share one page.
 */
export default async function RacePage({ params }: Props) {
  const { db, org, today, races, race } = await findRace((await params).slug);
  if (!race?.info) notFound();
  const { info } = race;
  const title = race.slug === "styrkeproven" ? "Styrkeprøven" : race.name;
  const groups = [...new Set(races.flatMap((r) => r.groupIds ?? []))].map((id) => org.get(id)).filter((n) => !!n);
  const next = nextEdition(race, today);
  const checked = `${MONTHS[Number(info.checked.slice(5, 7)) - 1]} ${info.checked.slice(0, 4)}`;
  const main = info.links[0];

  return (
    <>
      <NodeHero
        breadcrumb={[{ label: db.club.name, href: "/" }, { label: "Sykkelritt", href: "/sykkelritt" }, { label: title }]}
        eyebrow={race.organiser ? `Ritt · ${race.organiser}` : "Ritt"}
        title={title}
        description={info.lead}
        photo={heroPhotoFor(db, org, race.nodeId)}
        primaryHref="/sykkelritt#kalender"
        primaryLabel="Alle rittene"
        joinHref={main.url}
        joinLabel={main.label}
        leadWith="join"
        facts={info.facts.map((f) => ({ value: f.value, label: f.label }))}
      />

      <div className="alternate">
        {info.sections.map((s) => (
          <SplitSection key={s.title} id={s.title.toLowerCase().replace(/[^a-zæøå0-9]+/g, "-")} eyebrow="Om rittet" title={s.title}>
            <ul className="max-w-[60ch] space-y-3 t-body-lg text-ink-2">
              {s.items.map((item) => (
                <li key={item} className="border-t border-line pt-3 first:border-0 first:pt-0">
                  {item}
                </li>
              ))}
            </ul>
          </SplitSection>
        ))}

        {groups.length > 0 && (
          <SplitSection id="gruppene" eyebrow="BOC" title="Gruppene som kjører det.">
            <p className="max-w-[60ch] t-body-lg text-ink-2">
              {groups.map((g) => g!.name).join(", ")} kjører dette rittet sammen. Neste utgave: {next.confirmed ? formatSpan(next.start, next.end) : `ca. ${formatSpan(next.start, next.end)} (ikke kunngjort ennå)`}.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2">
              {groups.map((g) => (
                <Link key={g!.id} href={org.href(g!.id)} className="link t-small font-medium text-ink">
                  {g!.name}
                </Link>
              ))}
            </div>
          </SplitSection>
        )}

        <SplitSection id="arrangoren" eyebrow="Arrangøren" title="Les mer hos arrangøren.">
          <ul className="grid max-w-[44rem] divide-y divide-line border-y border-line">
            {info.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between gap-4 py-4 text-[17px] font-medium text-ink transition-colors hover:text-club">
                  {l.label}
                  <ArrowUpRight aria-hidden className="size-4 shrink-0 text-ink-3" />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-6 max-w-[60ch] t-small text-ink-3">
            Opplysningene er hentet fra arrangørens egne nettsider i {checked}. Datoer, priser og regler endrer seg fra år til år, så sjekk alltid arrangørens side før du melder deg på. Påmelding skjer hos arrangøren, og ritt er for medlemmer.
          </p>
        </SplitSection>
      </div>
    </>
  );
}
