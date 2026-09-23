import Link from "next/link";
import { ActivityExplorer } from "@/components/public/activity-explorer";
import { ClubYearView } from "@/components/public/club-year";
import { GroupFinder } from "@/components/public/group-finder";
import { JerseyShowcase } from "@/components/public/jersey-showcase";
import { Photo } from "@/components/public/photo";
import { Sponsors } from "@/components/public/sponsors";
import { StoryCard } from "@/components/public/story";
import { FactStrip } from "@/components/public/node/hero";
import { ButtonLink, HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { SectionHeader, TextLink } from "@/components/ui/primitives";
import { contactsFor, DEFAULT_NEWS_KINDS, fullName, homepageArticles, membershipTitle, photoById, publishedArticles } from "@/lib/content";
import { buildClubYear } from "@/lib/club-year";
import { loadSite } from "@/lib/data/queries";
import { buildExplorer, youthExplorer } from "@/lib/finder";
import { toStoryView } from "@/lib/views";

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Front page, built around the two reasons people join a club: finding a
 * group to train with, and having people to race and travel with.
 *
 * The order is an argument, not a menu. The photograph and the statement
 * come first, because an adult comparing the club to the free social rides
 * nearby needs a reason before they will answer anything; the finder's
 * three questions follow once they have it; the club year and every group
 * come after. Nothing is asked of anyone above the fold.
 *
 * 1 who the club is · 2 three questions · 3 the club year: races, trips and
 * winter programmes · 4 every group · 5 this week · 6–7 stories · 8 the rest
 * of the club · 9 partners.
 */
export default async function HomePage() {
  const { db, org, today, now } = await loadSite();
  const { club } = db;
  const kitPhoto = photoById(db, club.kit?.photoId);
  const hero = photoById(db, club.heroPhotoId);
  const narrowHero = club.id === "boc" ? photoById(db, "b-ph-hero-narrow") : undefined;

  const groups = org.nodes.filter((n) => n.kind !== "club" && org.isLeaf(n.id));
  const minAge = Math.min(...groups.map((g) => g.ageRange?.[0] ?? 99));

  /* Stories */
  const withPhoto = (id?: string) => {
    const p = photoById(db, id);
    return !!p && !p.withdrawn;
  };
  const leadArticle = homepageArticles(db).find((a) => withPhoto(a.heroPhotoId));
  const lead = leadArticle ? toStoryView(leadArticle, db, org, now) : undefined;
  const rest = publishedArticles(db)
    .filter((a) => a.id !== leadArticle?.id)
    .map((a) => toStoryView(a, db, org, now));
  const photoStories = rest.filter((s) => s.photo).slice(0, 2);
  const listStories = rest.filter((s) => !photoStories.includes(s)).slice(0, 4);

  /* Finder: in a one-sport club the second question is the branch, otherwise the sport. */
  const explorer = buildExplorer(db, org, today);
  const singleSport = explorer.length === 1;
  const finderChoices = singleSport
    ? explorer[0].branches.map((b) => ({ id: b.id, name: b.name, groups: b.groups }))
    : explorer.map((s) => ({ id: s.id, name: s.name, groups: s.branches.flatMap((b) => b.groups) }));

  /* The club year */
  const year = buildClubYear(db, org, today);
  const showYear = !!club.identity.year && year.lanes.length > 0;

  const branches = org.sports().length === 1 ? org.children(org.sports()[0].id).filter((c) => !org.isLeaf(c.id)) : [];
  const heroFacts = [
    { value: groups.length, label: "lag og grupper" },
    { value: "Hele året", label: "fellestreninger" },
    club.identity.reach ?? { value: `${minAge} år`, label: "yngste gruppe" },
    branches.length
      ? { value: branches.length, label: "disipliner" }
      : { value: org.sports().length, label: org.sports().length === 1 ? "idrett" : "idretter" },
  ];

  const admin = contactsFor(db, org, club.id, { inherit: false });
  const hasYouth = youthExplorer(db, org, today).youth.length > 0;
  const venues = db.venues.filter((v) => v.id !== "klubbhuset");

  // The same finder twice: on the hero's panel from lg, under the band below it.
  const finderProps = {
    title: singleSport ? `Finn ${explorer[0].name.toLowerCase()}gruppen for deg` : "Finn gruppen for deg",
    choices: finderChoices,
    choiceNoun: singleSport ? "disiplin" : "idrett",
    allHref: "#finn-aktivitet",
    note: singleSport ? "Alle kan prøve to økter før innmelding." : "Barn og ungdom kan prøve før de melder seg inn.",
  };


  /* The sections under the hero alternate white and light grey, counted over
     the ones this club actually shows — the club year, the editorial story
     and the kit only appear when there is something for them — so no two
     neighbours ever share a ground. */
  const shown = [
    "partnere",
    "finn-gruppen",
    ...(showYear && club.identity.year ? ["klubbaret"] : []),
    "finn-aktivitet",
    ...(lead?.photo ? ["sak"] : []),
    "nyheter",
    ...(club.kit ? ["drakt"] : []),
    "om",
  ];
  const tone = (section: string) => (shown.indexOf(section) % 2 ? ("sunken" as const) : ("default" as const));
  return (
    <>
      {/* 1 ── Who the club is ──────────────────────────────────────────────
          One band: the photograph, with the statement on it.

          It did not always work. With the finder riding on the band as well
          and a headline that ran to five lines, the treatment needed to keep
          white type legible swallowed the picture — and the picture is what
          says what kind of club this is, faster than any sentence. Both of
          those are gone: the finder has a section of its own, and the
          statement is three short lines. It ends at 56% of the width while
          the riders in club kit sit from 62% out, so the scrim treats the
          bottom-left corner and leaves them alone (.hero-scrim in
          globals.css).

          The band runs edge to edge up to 1728 px — the width a 16" MacBook
          Pro reports. Past that the photograph stops growing and the band
          carries on in the header's colour to the screen edges, square and
          flush under the header. Its height is fixed from lg, and the
          statement is lifted off the foot of the band so it sits closer to
          the optical centre than to the bottom edge.

          Below lg the band comes apart into three: the photograph on its own,
          then the statement and its actions on the header's colour, then the
          numbers. On a narrow screen the statement would cover most of the
          picture, so it moves off it — and with nothing on the photograph,
          it needs no scrim. */}
      <section aria-label={club.name} className="relative bg-[var(--header-bg,var(--surface-inverse))]">
        <div className="relative mx-auto max-w-[1728px]">
          <div className="relative isolate overflow-hidden lg:h-[calc(100svh-var(--header-h))] lg:min-h-[38rem] lg:max-h-[52rem] lg:bg-inverse min-[1729px]:h-[38rem] min-[1729px]:min-h-0">
            <div className="relative aspect-[5/3] overflow-hidden bg-inverse lg:absolute lg:inset-0 lg:-z-20 lg:aspect-auto">
              {club.heroVideoUrl ? (
                <video
                  className="size-full object-cover"
                  src={club.heroVideoUrl}
                  poster={hero?.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  aria-label={hero?.alt}
                />
              ) : (
                hero && (
                  <>
                    {narrowHero && (
                      <Photo
                        photo={narrowHero}
                        ratio={4 / 5}
                        mdRatio={16 / 9}
                        priority
                        sizes="(max-width: 1024px) 100vw, 0px"
                        className="!aspect-auto size-full min-[1025px]:hidden"
                      />
                    )}
                    <Photo
                      photo={hero}
                      ratio={4 / 5}
                      mdRatio={16 / 9}
                      priority
                      sizes={narrowHero ? "(min-width: 1025px) min(1728px, 100vw), 0px" : "(min-width: 1728px) 1728px, 100vw"}
                      className={narrowHero ? "!aspect-auto size-full max-[1024px]:hidden" : "!aspect-auto size-full"}
                    />
                  </>
                )
              )}
            </div>
            <div aria-hidden className="hero-scrim max-lg:hidden" />

            <div className="page grid-page lg:h-full">
              <div className="col-span-full flex flex-col justify-center pt-10 pb-12 md:pt-12 md:pb-14 lg:col-span-7 lg:pt-10 lg:pb-28">
                <p className={`t-eyebrow !text-white/75 ${club.logo === "wordmark" ? "ml-0.5" : ""}`}>
                  {club.name} · siden {club.founded}
                </p>
                <h1 className="mt-3 t-display text-white lg:!text-[2.75rem] xl:!text-[3.25rem]">
                  {club.identity.headline} <span className="text-white/85">{club.identity.headlineMuted}</span>
                </h1>
                <p className="mt-5 max-w-[46ch] t-body-lg text-white/82">{club.identity.intro}</p>
                {/* One low-commitment action — look at what the club does, the way
                    ODP says "scout the routes" rather than "join" — and one door
                    for the other audience, which the main menu also carries. */}
                <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
                  <ButtonLink
                    href="#finn-aktivitet"
                    brand
                    className="!bg-club-surface !text-on-club hover:!bg-[var(--club-primary-hover)]"
                    arrow
                  >
                    {showYear ? "Se alle grupper" : "Finn din aktivitet"}
                  </ButtonLink>
                  {hasYouth && (
                    <Link href="/barn-og-ungdom" className="inline-flex items-center t-small font-medium text-white hover:text-white/80">
                      Til barn og ungdom
                      <HoverArrow />
                    </Link>
                  )}
                </div>
              </div>
            </div>
            <FactStrip facts={heroFacts} overlay />
          </div>
        </div>
      </section>

      {/* 1b ── Partners ──────────────────────────────────────────────────
          Straight under the hero's numbers: the first thing after the club
          says who it is, is who stands behind it. The footer repeats them. */}
      <Section tone={tone("partnere")}>
        <div className="page">
          <Sponsors sponsors={club.sponsors} />
        </div>
      </Section>

      {/* 2 ── Three questions ───────────────────────────────────────────────
          The finder used to ride on the hero, where it asked "how old are
          you?" before the page had given anyone a reason to answer — and it
          covered the photograph doing it. It sits here instead, under the
          statement and the club's numbers: whoever is still reading has the
          reason, and the question is now worth their time. ODP puts its own
          levels below the fold for the same reason. */}
      <Section id="finn-gruppen" labelledBy="finn-gruppen-tittel" tone={tone("finn-gruppen")} rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page grid-page items-center gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-5">
            <p className="t-eyebrow">Ny i klubben?</p>
            <h2 id="finn-gruppen-tittel" className="mt-3 t-h1">
              Tre spørsmål, <span className="text-ink-3">så vet du hvor du passer inn.</span>
            </h2>
            <p className="mt-6 max-w-[42ch] t-body text-ink-2">
              {singleSport
                ? "Alder, disiplin og nivå. Du trenger ikke vite hva du leter etter — vi viser hvilke grupper som passer, og når de trener."
                : "Alder, idrett og nivå. Du trenger ikke vite hva du leter etter — vi viser hvilke grupper som passer, og når de trener."}
            </p>
            <TextLink href="#finn-aktivitet" className="mt-6 t-small">
              Eller bla gjennom alle {groups.length} gruppene
            </TextLink>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">
            <GroupFinder {...finderProps} />
          </div>
        </div>
      </Section>

      {/* 3 ── The club year ─────────────────────────────────────────────── */}
      {showYear && club.identity.year && (
        <Section id="klubbaret" labelledBy="klubbaret-tittel" tone={tone("klubbaret")} rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
          <div className="page">
            <div className="grid-page gap-y-6">
              <div className="col-span-4 md:col-span-8 lg:col-span-8">
                <p className="t-eyebrow">Klubbåret</p>
                <h2 id="klubbaret-tittel" className="mt-3 t-h1">
                  {club.identity.year.headline} <span className="text-ink-3">{club.identity.year.headlineMuted}</span>
                </h2>
              </div>
              <p className="col-span-4 self-end t-small text-ink-2 md:col-span-8 lg:col-span-4">
                {club.identity.year.note}
              </p>
            </div>
            <div className="mt-10 lg:mt-14">
              <ClubYearView
                year={year}
                categories={singleSport ? explorer[0].branches.map((b) => b.name) : explorer.map((s) => s.name)}
              />
            </div>
          </div>
        </Section>
      )}

      {/* 4 ── Every group ─────────────────────────────────────────────────── */}
      <Section id="finn-aktivitet" labelledBy="finn-aktivitet-tittel" tone={tone("finn-aktivitet")} rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page">
          <div className="grid-page gap-y-6">
            <div className="col-span-4 md:col-span-8 lg:col-span-9">
              <p className="t-eyebrow">Finn din aktivitet</p>
              <h2 id="finn-aktivitet-tittel" className="mt-3 t-h1">
                {groups.length} lag og grupper.{" "}
                <span className="text-ink-3">Velg idrett og alder, så ser du hvilke grupper som passer og når de trener.</span>
              </h2>
            </div>
            <p className="col-span-4 self-end t-small text-ink-2 md:col-span-8 lg:col-span-3 lg:col-start-10">
              Barn og ungdom kan prøve noen treninger før de melder seg inn.{" "}
              <Link href="/bli-med" className="inline-flex items-center font-medium text-club hover:text-club-hover">
                Slik blir du medlem
                <HoverArrow />
              </Link>
            </p>
          </div>
          <div className="mt-10 lg:mt-14">
            <ActivityExplorer sports={explorer} />
          </div>
        </div>
      </Section>

      {/* 6 ── Editorial story ───────────────────────────────────────────── */}
      {lead?.photo && (
        <Section guides="edges" tone={tone("sak")} rule="both" labelledBy="sak-tittel" className="overflow-hidden">
          <div className="page">
            <div className="grid-page items-center gap-y-8 pt-16 lg:py-0">
              <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:py-24 lg:pr-[var(--grid-gap)]">
                <p className="t-eyebrow">Fra klubben</p>
                <Link href={lead.kickerHref} className="mt-5 inline-flex rounded-sm t-small font-medium text-ink-2 hover:text-ink">
                  {lead.kicker}
                </Link>
                <h2 id="sak-tittel" className="mt-1.5 t-h1">
                  <Link href={lead.href} className="decoration-club/30 decoration-2 underline-offset-[6px] hover:underline">
                    {lead.title}
                  </Link>
                </h2>
                {lead.lead && <p className="mt-5 max-w-[46ch] t-body-lg text-ink-2">{lead.lead}</p>}
                <p className="mt-5 t-small text-ink-3">
                  {upperFirst(lead.date)} · {lead.author}
                </p>
                <ButtonLink href={lead.href} variant="secondary" arrow className="mt-8">
                  Les saken
                </ButtonLink>
              </div>
              <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">
                <div className="edge-media">
                  <Photo photo={lead.photo} ratio={4 / 3} sizes="(min-width: 1024px) 60vw, 100vw" className="lg:aspect-auto lg:h-[42rem]" />
                </div>
              </div>
            </div>
          </div>
        </Section>
      )}

      {/* 7 ── More stories ──────────────────────────────────────────────── */}
      <Section labelledBy="nyheter-tittel" tone={tone("nyheter")} rule="top" className="py-20 lg:py-28">
        <div className="page">
          <SectionHeader
            id="nyheter-tittel"
            eyebrow="Nyheter"
            title="Fra lag og grupper."
            titleMuted={`${club.identity.newsKinds ?? DEFAULT_NEWS_KINDS}.`}
            href="/nyheter"
            linkLabel="Alle nyheter"
          />
          <div className="mt-10 grid-page gap-y-10 lg:mt-14">
            {photoStories.map((s) => (
              <StoryCard key={s.id} story={s} ratio={4 / 5} className="col-span-4 md:col-span-4 lg:col-span-3" sizes="(min-width: 1024px) 300px, 50vw" />
            ))}
            <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">
              <div className="border-t border-line">
                {listStories.map((s) => (
                  <StoryCard key={s.id} story={s} variant="row" headingLevel={3} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* 7b ── The club kit ─────────────────────────────────────────────
          Fixed, not news: how a member gets the kit, which BOC sells in
          periodic drops announced in Spond, and the partner benefits that
          go with membership. Shown for clubs that have written `kit`. */}
      {club.kit && (
        <Section labelledBy="drakt-tittel" tone={tone("drakt")} rule="top" className="py-20 lg:py-28">
          <div className="page grid-page items-center gap-y-10">
            <div className="col-span-4 md:col-span-8 lg:col-span-5">
              <p className="t-eyebrow">Klubbdrakt</p>
              <h2 id="drakt-tittel" className="mt-3 t-h1">
                {club.kit.headline} {club.kit.headlineMuted && <span className="text-ink-3">{club.kit.headlineMuted}</span>}
              </h2>
              <div className="mt-6 max-w-[52ch] space-y-3 t-body text-ink-2">
                {club.kit.text.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
                {club.kit.links.map((l) => (
                  <TextLink key={l.href} href={l.href} className="t-small">
                    {l.label}
                  </TextLink>
                ))}
              </div>
            </div>
            {club.kit.jerseys ? (
              <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">
                <JerseyShowcase jerseys={club.kit.jerseys} />
              </div>
            ) : (
              kitPhoto && (
                <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:col-start-7">
                  <Photo photo={kitPhoto} ratio={11 / 4} sizes="(min-width: 1024px) 640px, 100vw" className="rounded-lg md:rounded-xl" />
                </div>
              )
            )}
          </div>
        </Section>
      )}

      {/* 8 ── The club ──────────────────────────────────────────────────── */}
      <Section tone={tone("om")} rule="top" labelledBy="om-tittel" className="py-20 lg:py-28">
        <div className="page">
          <div className="grid-page gap-y-4">
            <p className="col-span-4 t-eyebrow md:col-span-8 lg:col-span-3 lg:pt-2">Om klubben</p>
            <h2 id="om-tittel" className="col-span-4 t-h2 md:col-span-8 lg:col-span-9">
              {club.identity.aboutHeadline} <span className="text-ink-3">{club.identity.aboutMuted}</span>
            </h2>
          </div>
          <div className="mt-14 grid-page gap-y-10 lg:mt-20">
            <div className="col-span-4 border-t border-guide pt-5 lg:col-span-3">
              <h3 className="t-label font-semibold">Medlemskap</h3>
              <dl className="mt-3 space-y-1.5 t-small">
                {[
                  ["Voksne", club.membership.adult],
                  ["Barn og ungdom", club.membership.youth],
                  ["Familie", club.membership.family],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-ink-2">{k}</dt>
                    <dd className="tnum text-ink">{v} kr</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 t-small text-ink-3">{club.membership.note}</p>
              <TextLink href="/bli-med" className="mt-4 t-small">
                Bli medlem
              </TextLink>
              {club.grasrotandelenOrgNumber && (
                <TextLink href="/om-klubben#grasrotandelen" className="mt-2 t-small">
                  Støtt oss med Grasrotandelen
                </TextLink>
              )}
            </div>
            <div className="col-span-4 border-t border-guide pt-5 lg:col-span-3">
              <h3 className="t-label font-semibold">Anlegg</h3>
              <ul className="mt-3 space-y-1.5 t-small">
                {venues.map((v) => (
                  <li key={v.id} className="flex justify-between gap-4">
                    <span className="text-ink">{v.name.replace(" kunstgress", "")}</span>
                    <span className="text-ink-3">{v.area}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-4 border-t border-guide pt-5 lg:col-span-3">
              <h3 className="t-label font-semibold">Kontakt</h3>
              <address className="mt-3 space-y-3 t-small not-italic text-ink-2">
                <p>
                  {club.address.street}
                  <br />
                  {club.address.postalCode} {club.address.city}
                </p>
                <p>
                  <a href={`mailto:${club.email}`} className="link text-ink">
                    {club.email}
                  </a>
                  <br />
                  <a href={`tel:${club.phone.replace(/\s/g, "")}`} className="link tnum text-ink">
                    {club.phone}
                  </a>
                </p>
              </address>
            </div>
            <div className="col-span-4 border-t border-guide pt-5 lg:col-span-3">
              <h3 className="t-label font-semibold">Administrasjon</h3>
              <ul className="mt-3 space-y-3 t-small">
                {admin.map((c) => (
                  <li key={c.person.id}>
                    <span className="block text-ink">{fullName(c.person)}</span>
                    <span className="block text-ink-3">{membershipTitle(c.membership.role, c.membership.title)}</span>
                  </li>
                ))}
              </ul>
              <TextLink href="/om-klubben" className="mt-4 t-small">
                Mer om klubben
              </TextLink>
            </div>
          </div>
        </div>
      </Section>

    </>
  );
}
