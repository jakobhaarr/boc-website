import type { Metadata } from "next";
import Link from "next/link";
import { StoryCard } from "@/components/public/story";
import { Section } from "@/components/ui/guides";
import { chipClass, EmptyState } from "@/components/ui/primitives";
import { articlesInSubtree, DEFAULT_NEWS_KINDS, publishedArticles } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { toStoryView } from "@/lib/views";

export const metadata: Metadata = { title: "Nyheter" };

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ idrett?: string }> }) {
  const { idrett } = await searchParams;
  const { db, org, now } = await loadSite();
  const sports = org.sports();
  const sport = sports.find((s) => s.slug === idrett);
  const articles = (sport ? articlesInSubtree(db, org, sport.id) : publishedArticles(db)).map((a) => toStoryView(a, db, org, now));
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
        </div>
      </Section>

      <Section rule="top" className="pt-12 pb-24 lg:pt-16">
        <div className="page">
          {articles.length === 0 ? (
            <EmptyState>Ingen innlegg fra {sport?.name.toLowerCase()} ennå.</EmptyState>
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
