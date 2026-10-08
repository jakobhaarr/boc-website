import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Photo } from "@/components/public/photo";
import { Inlines } from "@/components/public/rich-text";
import { StoryCard } from "@/components/public/story";
import { StravaLink } from "@/components/public/strava-link";
import { Guides } from "@/components/ui/guides";
import { ButtonLink } from "@/components/ui/button";
import { ACTION_LINK_MOBILE, Avatar, Breadcrumb, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { articlePhotoIds, articlesInSubtree, authorLine, cardStyleOf, heroPhotoFor, personById, photoById, portraitOf, userById } from "@/lib/content";
import { formatDateFull, formatDayMonth, formatTime } from "@/lib/dates";
import { loadSite } from "@/lib/data/queries";
import { plain } from "@/lib/rich-text";
import type { Photo as PhotoRecord } from "@/lib/types";
import { rideWith, toActivityView, toStoryView } from "@/lib/views";

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
  mdRatio,
  className,
  mediaClassName,
  priority,
}: {
  photo: PhotoRecord;
  sizes: string;
  ratio?: number;
  mdRatio?: number;
  className?: string;
  mediaClassName?: string;
  priority?: boolean;
}) {
  return (
    <figure className={className}>
      <Photo photo={photo} ratio={ratio} mdRatio={mdRatio} sizes={sizes} priority={priority} className={mediaClassName} />
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
  // In a club with one sport, the sport is understood: the trail starts below it.
  const trail = org.trail(node.id).filter((n) => !(org.sports().length === 1 && n.kind === "sport"));
  // A member story shows the person's portrait as it stands now (it can be changed in admin after the story was written), and none where the person's portrait may not be shown.
  const storyPerson = article.memberStory && article.aboutPersonId ? db.people.find((p) => p.id === article.aboutPersonId && p.privacy.status === "visible") : undefined;
  const hero = storyPerson ? (portraitOf(db, storyPerson) ?? (storyPerson.portraitPhotoId ? undefined : photoById(db, article.heroPhotoId))) : photoById(db, article.heroPhotoId);
  const author = userById(db, article.authorUserId);
  // The author's own portrait, as the register shows it: only with photo consent and while visible.
  const authorPerson = personById(db, author?.personId);
  const authorPortrait = authorPerson ? portraitOf(db, authorPerson) : undefined;
  const published = article.publishedAt ?? article.createdAt;
  const activity = article.relatedActivityId ? db.activities.find((a) => a.id === article.relatedActivityId) : undefined;
  const activityView = activity ? toActivityView(activity, db, org) : undefined;
  const more = articlesInSubtree(db, org, node.id)
    .filter((a) => a.id !== article.id)
    .slice(0, 3)
    .map((a) => toStoryView(a, db, org, now));
  // A member story ends with where and when to ride with them, while they may be shown.
  const member = article.aboutPersonId ? db.people.find((p) => p.id === article.aboutPersonId && p.privacy.status === "visible") : undefined;
  const rides = member ? rideWith(db, org, member.id, today, article.nodeId) : [];
  const ridesThemselves = !!member && member.memberships.length > 0;
  const anyRedacted = articlePhotoIds(article).some((id) => (photoById(db, id)?.redactions.length ?? 0) > 0);

  // A member story with a studio portrait is laid out as a profile (the header below).
  const profile = !!article.memberStory && !!hero && !hero.withdrawn && storyPerson && cardStyleOf(storyPerson, hero) === "studio";

  const textCol = "max-w-[40rem]";

  // «Eksempel» and the byline stand in the header on a phone; from lg they sit in the empty column at the left, sticky,
  // so they follow the reader down the page.
  const exampleNote = article.example ? (
    <p className="flex items-start gap-2.5 rounded-lg bg-warning-surface p-3.5 t-small text-ink-2 ring-1 ring-line">
      <Status tone="warning" className="shrink-0">
        Eksempel
      </Status>
      <span>Denne historien er skrevet for demoen. Personen er oppdiktet, og bildet er et illustrasjonsbilde, ikke et medlem av klubben.</span>
    </p>
  ) : null;
  const byline = (
    <div className="flex items-center gap-3">
      {author && <Avatar name={author.name} size={36} photo={authorPortrait ? { src: authorPortrait.src, focal: authorPortrait.focal } : undefined} />}
      <div className="t-small">
        <p className="font-medium text-ink">{authorLine(db, org, article)}</p>
        <p className="text-ink-3 tnum">
          <time dateTime={published}>
            {formatDateFull(published.slice(0, 10))} kl. {formatTime(published.slice(11, 16))}
          </time>
        </p>
      </div>
    </div>
  );
  const groupPhoto = node.kind !== "club" ? heroPhotoFor(db, org, node.id) : undefined;

  return (
    <article className="relative isolate">
      <Guides variant="edges" />
      {/* The sticky column below is only as tall as the story itself, so the note and the byline stop before «Mer fra …». */}
      <div className="relative">
      {/* From lg the example note and the byline stand in the empty column at the left of the text, sticky under the header,
          in a layer as tall as the whole article. */}
      {!profile && (exampleNote || author) && (
        <div className="pointer-events-none absolute inset-0 z-10 max-lg:hidden">
          <div className="page h-full">
            <div className="grid-page h-full">
              <div className="col-span-3 col-start-1 pt-[5.25rem]">
                <div className="pointer-events-auto sticky top-[calc(var(--header-h)+2rem)] grid gap-5">
                  {exampleNote}
                  {byline}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="relative">
      {profile && hero ? (
        /* A member with a studio portrait: the name and the words at the left, the person standing on the band's lower edge at the right, as in a leadership page. The band stays light (light-ground); the picture is a cut-out (scripts/cutout-white.py) so it stands on the soft grey ground itself. */
        <header className="light-ground profile-band overflow-hidden bg-[linear-gradient(0deg,#f6f6f6,#cbd3de)] [--text-muted:#3b4658]">
          <div className="page pt-6 lg:pt-10">
            <div className="grid-page items-end">
              <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-2 lg:self-center lg:pb-16">
                <Breadcrumb items={trail.length ? trail.map((n) => ({ label: n.name, href: org.href(n.id) })) : [{ label: "Klubben", href: "/" }]} />
                {article.example && (
                  <p className="mt-5 flex items-start gap-2.5 rounded-lg bg-warning-surface p-3.5 t-small text-ink-2 ring-1 ring-line">
                    <Status tone="warning" className="shrink-0">
                      Eksempel
                    </Status>
                    <span>Denne historien er skrevet for demoen. Personen er oppdiktet, og bildet er et illustrasjonsbilde, ikke et medlem av klubben.</span>
                  </p>
                )}
                <h1 className="mt-5 t-h1">
                  <Inlines content={article.title} />
                </h1>
                {article.lead && (
                  <p className="mt-4 t-body-lg text-ink-2">
                    <Inlines content={article.lead} />
                  </p>
                )}
              </div>
              <div className="col-span-4 mt-8 md:col-span-8 lg:col-span-5 lg:col-start-8 lg:mt-0">
                <Photo photo={hero} priority sizes="(min-width: 1024px) 480px, 100vw" className="!bg-transparent" />
              </div>
            </div>
          </div>
        </header>
      ) : (
        <>
      <header className="page pt-6 lg:pt-10">
        <div className="grid-page">
          <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-4">
            <Breadcrumb
              items={trail.length ? trail.map((n) => ({ label: n.name, href: org.href(n.id) })).concat([]) : [{ label: "Klubben", href: "/" }]}
            />
            {exampleNote && <div className="mt-5 lg:hidden">{exampleNote}</div>}
            <h1 className="mt-5 t-h1">
              <Inlines content={article.title} />
            </h1>
            {article.lead && (
              <p className="mt-4 t-body-lg text-ink-2">
                <Inlines content={article.lead} />
              </p>
            )}
            <div className="mt-6 border-t border-line pt-4 lg:hidden">{byline}</div>
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
              mdRatio={article.memberStory ? 15 / 8 : undefined}
              sizes="(min-width: 1344px) 1060px, 100vw"
              className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4"
              mediaClassName="rounded-lg md:rounded-xl"
            />
          </div>
        </div>
      )}
        </>
      )}

      {/* The same space above the footer as «Mer fra …» leaves, when there is nothing more. */}
      <div className={cn("page mt-10 lg:mt-14", more.length === 0 && "pb-24 lg:pb-32")}>
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
                      <p className="font-display text-[1.375rem] leading-[1.3] font-semibold tracking-[-0.006em] text-ink lg:text-[1.625rem]">
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

            {member && (
              <section aria-labelledby="sykle-med" className={cn(textCol, "mt-12 rounded-xl bg-sunken p-6 ring-1 ring-line sm:p-7")}>
                <h2 id="sykle-med" className="t-h3">
                  {ridesThemselves ? `Sykle med ${member.firstName}` : "Om gruppa"}
                </h2>
                {rides.map((g) => (
                  <div key={g.id} className="mt-5 border-t border-line pt-4">
                    <p className="t-label font-semibold text-ink">
                      {g.name}
                      {g.season && <span className="font-normal text-ink-3"> · {g.season}</span>}
                    </p>
                    {g.times.length ? (
                      <ul className="mt-1.5 space-y-1 t-body text-ink-2">
                        {g.times.map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 t-body text-ink-2">Tid og sted avtales i gruppa.</p>
                    )}
                    <Link href={g.href} className={cn("group mt-3 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover", ACTION_LINK_MOBILE)}>
                      Til gruppa
                      <ArrowRight aria-hidden className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                ))}
                {member.stravaUrl && (
                  <div className="mt-6 border-t border-line pt-5">
                    <StravaLink url={member.stravaUrl}>{`Følg ${member.firstName} på Strava`}</StravaLink>
                  </div>
                )}
              </section>
            )}

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
                <section aria-labelledby="om-gruppen" className="overflow-hidden rounded-lg bg-sunken p-5 shadow-[inset_0_0_0_1px_var(--border)]">
                  {/* People first: the group's own picture, of the people who ride in it. */}
                  {groupPhoto && <Photo photo={groupPhoto} ratio={16 / 9} sizes="320px" className="-mx-5 -mt-5 mb-4 !w-[calc(100%+2.5rem)] max-w-none" />}
                  <h2 id="om-gruppen" className="t-label font-semibold">
                    {node.name}
                  </h2>
                  <p className="mt-2 t-small text-ink-2">{node.summary}</p>
                  <ButtonLink href={org.href(node.id)} size="md" arrow className="mt-4 w-full">
                    Til siden for {node.name}
                  </ButtonLink>
                </section>
              )}
            </div>
          </aside>
        </div>
      </div>
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
    </article>
  );
}
