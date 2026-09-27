import type { Metadata } from "next";
import Link from "next/link";
import { StoryCard } from "@/components/public/story";
import { Section } from "@/components/ui/guides";
import { chipClass, EmptyState } from "@/components/ui/primitives";
import { articlesInSubtree, DEFAULT_NEWS_KINDS, publishedArticles } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { toStoryView } from "@/lib/views";

export const metadata: Metadata = { title: "Nyheter" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ idrett?: string; aar?: string }> }) {
  const { idrett, aar } = await searchParams;
  const { db, org, now } = await loadSite();
  const sports = org.sports();
  const sport = sports.find((s) => s.slug === idrett);
  const inSport = sport ? articlesInSubtree(db, org, sport.id) : publishedArticles(db);

  /* One chip per year there is news from (in the chosen sport), newest
     first, so last year's stories are one tap away. The year sits in the
     address (?aar=2025), next to the sport, so a filtered list can be shared. */
  const yearOf = (a: (typeof inSport)[number]) => (a.publishedAt ?? a.createdAt).slice(0, 4);
  const years = [...new Set(inSport.map(yearOf))].sort().reverse();
  const year = years.includes(aar ?? "") ? aar : undefined;
  const href = (params: { idrett?: string; aar?: string }) => {
    const q = new URLSearchParams(Object.entries(params).filter((e): e is [string, string] => !!e[1]));
    return q.size ? `/nyheter?${q}` : "/nyheter";
  };

  const articles = inSport.filter((a) => !year || yearOf(a) === year).map((a) => toStoryView(a, db, org, now));
  const top = articles.filter((a) => a.photo).slice(0, 2);
  const rest = articles.filter((a) => !top.includes(a));

  return (
    <>
      <Section className="pb-10">
        <div className="page pt-8 lg:pt-14">
          <p className="t-eyebrow">Nyheter</p>
          <h1 className="mt-3 max-w-[48rem] t-h1">
            Fra lag og grupper. <span className="text-ink-3">{db.club.identity.newsKinds ?? DEFAULT_NEWS_KINDS} fra hele klubben.</span>
          </h1>
          {/* With a single sport there is nothing to filter: "Alle" and the sport are the same list. */}
          {sports.length > 1 && (
            <nav aria-label="Filtrer etter idrett" className="scroll-x -mx-[var(--page-gutter)] mt-8 flex gap-1.5 px-[var(--page-gutter)] md:mx-0 md:px-0">
              <Link href="/nyheter" aria-current={!sport ? "page" : undefined} className={chipClass(!sport)}>
                Alle
              </Link>
              {sports.map((s) => (
                <Link key={s.id} href={`/nyheter?idrett=${s.slug}`} aria-current={sport?.id === s.id ? "page" : undefined} className={chipClass(sport?.id === s.id)}>
                  {s.name}
                </Link>
              ))}
            </nav>
          )}
          {years.length > 1 && (
            <nav
              aria-label="Filtrer etter år"
              className={`scroll-x -mx-[var(--page-gutter)] flex gap-1.5 px-[var(--page-gutter)] md:mx-0 md:px-0 ${sports.length > 1 ? "mt-3" : "mt-8"}`}
            >
              <Link href={href({ idrett: sport?.slug })} aria-current={!year ? "page" : undefined} className={chipClass(!year)}>
                Alle år
              </Link>
              {years.map((y) => (
                <Link key={y} href={href({ idrett: sport?.slug, aar: y })} aria-current={year === y ? "page" : undefined} className={chipClass(year === y)}>
                  {y}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </Section>

      <Section rule="top" className="pt-12 pb-24 lg:pt-16">
        <div className="page">
          {articles.length === 0 ? (
            <EmptyState>
              Ingen innlegg{sport ? ` fra ${sport.name.toLowerCase()}` : ""}
              {year ? ` i ${year}` : " ennå"}.
            </EmptyState>
          ) : (
            <>
              <div className="grid-page gap-y-10">
                {top.map((s) => (
                  <StoryCard key={s.id} story={s} headingLevel={2} className="col-span-4 lg:col-span-6" sizes="(min-width: 1024px) 640px, 100vw" />
                ))}
              </div>
              <div className="mt-14 grid-page">
                <div className="col-span-4 md:col-span-8 lg:col-span-9">
                  <div className="border-t border-line">
                    {rest.map((s) => (
                      <StoryCard key={s.id} story={s} variant="row" headingLevel={2} />
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Section>
    </>
  );
}
