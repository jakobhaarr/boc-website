import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Photo } from "@/components/public/photo";
import { Inlines } from "@/components/public/rich-text";
import { StoryCard } from "@/components/public/story";
import { Guides } from "@/components/ui/guides";
import { Avatar, Breadcrumb } from "@/components/ui/primitives";
import { upcoming } from "@/lib/activities";
import { cn } from "@/lib/cn";
import { articlePhotoIds, articlesInSubtree, authorLine, photoById, userById } from "@/lib/content";
import { formatDateFull, formatDayMonth, formatTime } from "@/lib/dates";
import { loadSite } from "@/lib/data/queries";
import { plain } from "@/lib/rich-text";
import type { Photo as PhotoRecord } from "@/lib/types";
import { toActivityView, toStoryView } from "@/lib/views";

type Props = { params: Promise<{ slug: string }> };

async function findArticle(slug: string) {
  const site = await loadSite();
  const article = site.db.articles.find((a) => a.slug === slug && a.status === "published");
  return { site, article };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await findArticle(slug);
  return article ? { title: plain(article.title), description: plain(article.lead) } : {};
}

function Figure({
  photo,
  sizes,
  ratio,
  className,
  mediaClassName,
  priority,
}: {
  photo: PhotoRecord;
  sizes: string;
  ratio?: number;
  className?: string;
  mediaClassName?: string;
  priority?: boolean;
}) {
  return (
    <figure className={className}>
      <Photo photo={photo} ratio={ratio} sizes={sizes} priority={priority} className={mediaClassName} />
      {(photo.caption || photo.credit || photo.redactions.length > 0) && (
        <figcaption className="mt-2.5 t-small text-ink-3">
          {photo.caption && (
            <span className="text-ink-2">
              <Inlines content={photo.caption} />{" "}
            </span>
          )}
          {photo.credit && <span>Foto: {photo.credit}</span>}
          {photo.redactions.length > 0 && <span className="block">Bildet er redigert av personvernhensyn.</span>}
        </figcaption>
      )}
    </figure>
  );
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const { site, article } = await findArticle(slug);
  if (!article) notFound();
  const { db, org, today, now } = site;

  const node = org.get(article.nodeId)!;
  const trail = org.trail(node.id);
  const hero = photoById(db, article.heroPhotoId);
  const author = userById(db, article.authorUserId);
  const published = article.publishedAt ?? article.createdAt;
  const activity = article.relatedActivityId ? db.activities.find((a) => a.id === article.relatedActivityId) : undefined;
  const activityView = activity ? toActivityView(activity, db, org) : undefined;
  const nextActivity = upcoming(
    db.activities.filter((a) => a.nodeId === node.id && a.status !== "cancelled"),
    today,
  )[0];
  const more = articlesInSubtree(db, org, node.id)
    .filter((a) => a.id !== article.id)
    .slice(0, 3)
    .map((a) => toStoryView(a, db, org, now));
  const anyRedacted = articlePhotoIds(article).some((id) => (photoById(db, id)?.redactions.length ?? 0) > 0);

  const textCol = "max-w-[40rem]";

  return (
    <article className="relative isolate">
      <Guides variant="edges" />
      <div className="relative">
      <header className="page pt-6 lg:pt-10">
        <div className="grid-page">
          <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-4">
            <Breadcrumb
              items={trail.length ? trail.map((n) => ({ label: n.name, href: org.href(n.id) })).concat([]) : [{ label: "Klubben", href: "/" }]}
            />
            <h1 className="mt-5 t-h1">
              <Inlines content={article.title} />
            </h1>
            {article.lead && (
              <p className="mt-4 t-body-lg text-ink-2">
                <Inlines content={article.lead} />
              </p>
            )}
            <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
              {author && <Avatar name={author.name} size={36} />}
              <div className="t-small">
                <p className="font-medium text-ink">{authorLine(db, org, article)}</p>
                <p className="text-ink-3 tnum">
                  <time dateTime={published}>
                    {formatDateFull(published.slice(0, 10))} kl. {formatTime(published.slice(11, 16))}
                  </time>
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {hero && !hero.withdrawn && (
        <div className="page mt-8 lg:mt-10">
          <div className="grid-page">
            <Figure
              photo={hero}
              priority
              ratio={3 / 2}
              sizes="(min-width: 1344px) 1060px, 100vw"
              className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4"
              mediaClassName="rounded-lg md:rounded-xl"
            />
          </div>
        </div>
      )}

      <div className="page mt-10 lg:mt-14">
        <div className="grid-page gap-y-12">
          <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-4">
            <div className="prose-club">
              {article.blocks.map((b, i) => {
                if (b.type === "paragraph") {
                  return (
                    <p key={i} className={textCol}>
                      <Inlines content={b.content} />
                    </p>
                  );
                }
                if (b.type === "heading") {
                  return (
                    <h2 key={i} className={cn(textCol, "!mt-10 t-h3")}>
                      {b.text}
                    </h2>
                  );
                }
                if (b.type === "list") {
                  const List = b.ordered ? "ol" : "ul";
                  return (
                    <List key={i} className={cn(textCol, b.ordered ? "list-decimal" : "list-disc", "space-y-2 pl-5 marker:text-club")}>
                      {b.items.map((item, j) => (
                        <li key={j} className="pl-1 text-[1.0625rem] leading-[1.65] text-ink lg:text-[1.125rem]">
                          <Inlines content={item} />
                        </li>
                      ))}
                    </List>
                  );
                }
                if (b.type === "quote") {
                  return (
                    <blockquote key={i} className={cn(textCol, "!my-10 border-l-2 border-club pl-5")}>
                      <p className="font-display text-[1.375rem] leading-[1.3] font-semibold tracking-[-0.01em] text-ink lg:text-[1.625rem]">
                        – <Inlines content={b.content} />
                      </p>
                      <footer className="mt-3 t-small text-ink-3">
                        <Inlines content={b.attribution} />
                      </footer>
                    </blockquote>
                  );
                }
                const photos = (b.type === "photo" ? [b.photoId] : b.photoIds)
                  .map((id) => photoById(db, id))
                  .filter((p): p is PhotoRecord => !!p && !p.withdrawn);
                if (!photos.length) return null;
                return (
                  <div key={i} className="!my-10 grid grid-cols-2 gap-3 sm:gap-4">
                    {photos.map((p, j) => {
                      const wide = j === 0 || (photos.length % 2 === 0 && j === photos.length - 1);
                      return (
                        <Figure
                          key={p.id}
                          photo={p}
                          ratio={wide ? 3 / 2 : 4 / 5}
                          sizes={wide ? "(min-width: 1024px) 740px, 100vw" : "(min-width: 1024px) 370px, 50vw"}
                          className={wide ? "col-span-2" : "col-span-1"}
                          mediaClassName="rounded-lg"
                        />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {article.privacyEditedAt && (
              <p className={cn(textCol, "mt-12 flex gap-2.5 border-t border-line pt-4 t-small text-ink-3")}>
                <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  Artikkelen ble redigert {formatDayMonth(article.privacyEditedAt.slice(0, 10))} av personvernhensyn.
                  {anyRedacted ? " Tekst og bilder er endret" : " Teksten er endret"} slik at en person ikke lenger kan gjenkjennes.
                </span>
              </p>
            )}
          </div>

          <aside className="col-span-4 md:col-span-8 lg:col-span-3 lg:col-start-10">
            <div className="space-y-10 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              {activityView?.result && (
                <section aria-labelledby="kampen" className="rounded-lg bg-surface p-5 shadow-card ring-1 ring-line">
                  <h2 id="kampen" className="t-label font-semibold">
                    Kampen
                  </h2>
                  <p className="mt-3 text-[17px] leading-snug font-semibold">{activityView.title}</p>
                  <p className="mt-1 font-display text-[2.75rem] leading-none font-semibold tnum">{activityView.result.label}</p>
                  <dl className="mt-4 grid grid-cols-[4rem_minmax(0,1fr)] gap-y-1.5 t-small">
                    <dt className="text-ink-3">Dato</dt>
                    <dd>{formatDayMonth(activityView.date)}</dd>
                    {activityView.place && (
                      <>
                        <dt className="text-ink-3">Sted</dt>
                        <dd>{activityView.place.name}</dd>
                      </>
                    )}
                    {activityView.people.map((p) => (
                      <div key={p.label} className="contents">
                        <dt className="text-ink-3">{p.label}</dt>
                        <dd>{p.text}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}
              {node.kind !== "club" && (
                <section aria-labelledby="om-gruppen" className="rounded-lg bg-sunken p-5 shadow-[inset_0_0_0_1px_var(--border)]">
                  <h2 id="om-gruppen" className="t-label font-semibold">
                    {node.name}
                  </h2>
                  <p className="mt-2 t-small text-ink-2">{node.summary}</p>
                  {nextActivity && (
                    <p className="mt-3 t-small text-ink-3">
                      Neste: <span className="text-ink">{toActivityView(nextActivity, db, org).title}</span>, {formatDayMonth(nextActivity.date)} kl.{" "}
                      {formatTime(nextActivity.start)}
                    </p>
                  )}
                  <Link href={org.href(node.id)} className="group mt-3 inline-flex items-center gap-1 t-small font-medium text-ink hover:text-club">
                    Til siden for {node.name}
                    <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </section>
              )}
            </div>
          </aside>
        </div>
      </div>

      {more.length > 0 && (
        <section aria-labelledby="mer" className="page mt-20 pb-24 lg:mt-28">
          <div className="grid-page">
            <div className="col-span-4 md:col-span-8 lg:col-span-12">
              <h2 id="mer" className="border-t border-guide pt-10 t-h2">
                Mer fra {node.kind === "club" ? "klubben" : node.name}
              </h2>
            </div>
            {more.map((s, i) => (
              <StoryCard
                key={s.id}
                story={s}
                className={cn("col-span-4 mt-8 lg:col-span-3", i === 0 && "lg:col-start-4")}
                sizes="(min-width: 1024px) 300px, (min-width: 768px) 50vw, 100vw"
              />
            ))}
          </div>
        </section>
      )}
      </div>
    </article>
  );
}
