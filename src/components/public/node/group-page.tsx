import { ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ActivityDate, ActivityRow } from "@/components/public/activity";
import { GroupCarousel } from "@/components/public/group-carousel";
import { JoinBand } from "@/components/public/join-band";
import { AutoplayVideo } from "@/components/public/autoplay-video";
import { JoinWizard } from "@/components/public/join-wizard";
import { ContactPerson, MemberGrid, TrainingSchedule } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { Blocks } from "@/components/public/blocks";
import { RidingRules } from "@/components/public/node/riding-rules";
import { SeasonSummary } from "@/components/public/node/season-summary";
import { SpondNote } from "@/components/public/schedule-explorer";
import { StoryAccordion } from "@/components/public/story-accordion";
import { QuoteStage } from "@/components/public/quote-stage";
import { ExternalButton } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { past, relevantTo } from "@/lib/activities";
import { nextEdition, terminlisteSeasons } from "@/lib/club-year";
import { cn } from "@/lib/cn";
import { dayOfMonth, formatDayMonth, formatMonthShort, formatTime, weekdayName } from "@/lib/dates";
import {
  articlesFromParents,
  articlesInSubtree,
  athletesIn,
  byPublishedDesc,
  contactsFor,
  fullName,
  groupQuotesFor,
  heroPhotoFor,
  membershipTitle,
  presenterFor,
  photoById,
  portraitOf,
  slugify,
} from "@/lib/content";
import type { Site } from "@/lib/data/queries";
import { firstTrainingFor } from "@/lib/first-training";
import { meetUpPlan } from "@/lib/meet-up";
import { seasonOf, seasonView } from "@/lib/seasons";
import { terminliste } from "@/lib/timetable";
import type { OrgNode, Race } from "@/lib/types";
import { mapUrl, sessionsFor, toActivityView, toStoryView } from "@/lib/views";
import { NodeHero, type HeroFact } from "./hero";
import { FirstTraining } from "./first-training";
import { MeetUpPlan, slotFact } from "./meet-up";
import { ContactGrid, ResultsList, SeasonRow, SplitSection, WinterOffer } from "./shared";

/**
 * Every team or group gets this page automatically from the hierarchy:
 * activities, schedule, results, stories (including posts published one
 * level up), contacts and venues all resolve from structural data.
 */
export function GroupPage({ node, site }: { node: OrgNode; site: Site }) {
  const { db, org, today, now } = site;
  const parent = org.parent(node.id);
  const sport = org.sportOf(node.id);
  const photo = heroPhotoFor(db, org, node.id);
  const athletes = athletesIn(db, node.id);
  const contacts = contactsFor(db, org, node.id);
  const presenter = presenterFor(contacts);
  /* The group itself, for adult groups only: members who are visible and 18
     or over, and only those who have said yes to photos and have a portrait
     (portraitOf): they are the ones shown by name. Everyone else, children
     included, is only counted («og 16 andre medlemmer»), so a name never
     appears on the page without consent. The group's own coaches (BOC: its
     Road Captains) ride with it, so in a group for adults (ageRange from 17)
     they head the list with their title when they have a portrait too; they
     are listed as contacts on the page either way. */
  const adultYear = Number(today.slice(0, 4)) - 18;
  // Open to adults (Zwift is from 15 to 99); a group of children alone has no list of names.
  const adultGroup = (node.ageRange?.[1] ?? 0) >= 18;
  const leaders = adultGroup
    ? db.people
        .flatMap((p) => {
          const m = p.memberships.find((x) => x.nodeId === node.id && (x.role === "teamManager" || x.role === "headCoach" || x.role === "coach"));
          // A leader is named on the page as a contact anyway, so they are listed with or without a portrait.
          return m && p.privacy.status === "visible" ? [{ id: p.id, name: fullName(p), photo: portraitOf(db, p), title: membershipTitle(m.role, m.title), rank: m.role === "coach" ? 1 : 0 }] : [];
        })
        // The group's leader first, then its other coaches.
        .sort((a, b) => a.rank - b.rank)
    : [];
  const riders = athletes
    .filter((p) => p.privacy.status === "visible" && p.birthYear !== undefined && p.birthYear <= adultYear && !leaders.some((l) => l.id === p.id))
    .flatMap((p) => {
      const portrait = portraitOf(db, p);
      return portrait ? [{ id: p.id, name: fullName(p), photo: portrait }] : [];
    });
  const members = [...leaders, ...riders];
  /* The group's size, as a number only: everyone who is a member and not anonymised. */
  const memberCount = athletes.filter((p) => p.privacy.status !== "anonymised").length;
  // Leaders who also ride are named, so they are not among «the others».
  const otherMembers = Math.max(0, memberCount - riders.length - leaders.filter((l) => athletes.some((p) => p.id === l.id)).length);
  const showMembers = members.length >= 1;
  const relevant = relevantTo(db.activities, org, node.id);
  const view = (a: (typeof relevant)[number]) => toActivityView(a, db, org);
  // Dated things the club has announced; the weekly rhythm lives below.
  const dates = terminliste(relevant, today).slice(0, 6).map(view);
  /* Rides the group trains towards (Race.groupIds), at their next edition —
     projected from the organiser's last one, and marked so, until the new
     date is out. They sit in the terminliste with the club's own dates. */
  const rides = db.races
    .filter((r) => r.groupIds?.includes(node.id))
    .map((r) => ({ race: r, ...nextEdition(r, today) }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const seasons = terminlisteSeasons(db, org, node.id, today).filter((s) => s.href !== org.href(node.id));
  const listed = [
    ...dates.map((a) => ({ key: a.id, date: a.date, activity: a })),
    ...rides.map((r) => ({ key: r.race.id, date: r.start, ride: r })),
    ...seasons.map((s) => ({ key: s.id, date: s.start, season: s })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  /* A group with one simple rhythm (simpleSchedule) gets one «Når og hvor»:
     a card per meeting point and time, and the months it runs. */
  const { slots, months } = meetUpPlan(db, org, [node.id]);
  const simple = !!node.simpleSchedule && slots.length > 0;
  const results = past(
    relevant.filter((a) => a.result),
    today,
  )
    .slice(0, 4)
    .map(view);
  const sessions = sessionsFor(db, org, node.id, today);
  const firstTraining = firstTrainingFor(db, org, node.id, today);
  /* For a group with one simple rhythm «Når og hvor» is shown inside «Dette bør
     du vite», and replaces the rows that say the same thing in smaller type:
     the times, when to arrive and the Spond step. Without any first-training
     facts the section does not exist, and «Når og hvor» keeps its own place. */
  const meetUpInFirst = simple && firstTraining.length > 0;
  const firstRows = meetUpInFirst ? firstTraining.filter((i) => !["tid", "arrive", "spondFirstTime"].includes(i.id)) : firstTraining;
  const quotes = groupQuotesFor(db, node, today);
  const stories = [...articlesInSubtree(db, org, node.id), ...articlesFromParents(db, org, node.id)]
    .sort(byPublishedDesc)
    .slice(0, 5)
    .map((a) => toStoryView(a, db, org, now));
  const venues = (node.venueIds ?? []).flatMap((id) => db.venues.filter((v) => v.id === id));
  const siblings = parent && parent.kind !== "sport" && parent.kind !== "club" ? org.children(parent.id).filter((c) => c.id !== node.id) : [];
  const spond = node.externalLinks?.find((l) => l.kind === "spond");
  // Where questions go: the group's Spond, whether it is listed as a link or is how people join.
  const spondAsk = spond ?? (node.joinGroup?.kind === "spond" ? { url: node.joinGroup.url, label: node.joinGroup.label } : undefined);
  const usefulLinks = node.externalLinks?.filter((l) => l.kind !== "spond") ?? [];
  const announcement = node.announcement && (!node.announcement.until || now < node.announcement.until) ? node.announcement : undefined;
  const announcementOpen = !!announcement?.opensAt && now >= announcement.opensAt;

  // Clubs that sign members up elsewhere (BOC uses Spond) send people there.
  const joinFallback = db.club.signupUrl
    ? { href: db.club.signupUrl, label: `Meld deg inn i ${db.club.shortName}`, external: true }
    : { href: "/bli-med", label: "Slik blir du medlem" };

  const season = seasonView(db, org, node.id, seasonOf(today), today);
  const nextSeasonHref = season.next ? org.href(season.next.node.id) : undefined;
  const levelLabel = org.levelLabel(node);
  const context = parent && parent.kind !== "club" ? `${levelLabel} i ${parent.name}` : levelLabel;
  const memberWord = sport?.id === "fotball" ? "spillere" : "utøvere";
  const weekdays = [...new Set(sessions.map((s) => s.weekday))].sort((a, b) => a - b);
  const days = weekdays.length;
  /* «Mandag + onsdag kl. 19.00» under «2 dager i uken»: which days, and the
     clock when every session starts at the same time. */
  const dayNames = weekdays.map((w) => weekdayName(w)).join(" + ");
  const clock = new Set(sessions.map((s) => s.start)).size === 1 && !sessions[0]?.startApprox ? ` kl. ${formatTime(sessions[0].start)}` : "";
  const rhythm = `${dayNames.charAt(0).toUpperCase()}${dayNames.slice(1)}${clock}`;
  const [league, district] = (node.league ?? "").split(",").map((s) => s.trim());

  const facts: HeroFact[] = [
    // When and where to turn up leads the strip: it is what a newcomer came for.
    ...(node.participation?.wizard ? [] : slots.slice(0, 2).map(slotFact)),
    /* A group that rides races together (Race.groupIds) — BOC 1–4 — leads
       with how many it rides in a year rather than an age: «Fra 17 år» says
       nothing about an adult group, «5 ritt i året» says what it is for.
       Counted from the races that list the group, one edition each. */
    ...(node.leadFact
      ? [node.leadFact]
      : rides.length
        ? [{ value: `${rides.length} ritt i året`, label: "Sammen med gruppa" }]
        : node.ageLabel
          ? [{ value: node.ageLabel, label: "Alder" }]
          : []),
    ...(league ? [{ value: league, label: district ?? "Serie" }] : []),
    ...(days ? [{ value: `${days} ${days === 1 ? "dag" : "dager"} i uken`, label: rhythm }] : []),
    ...(node.seasonFocus ? [{ value: node.seasonFocus, label: "Sesongfokus" }] : []),
    ...(node.seasonFact ? [node.seasonFact] : []),
    ...(node.moreFacts ?? []),
    // A squad size means something for a football team; for a group that
    // rides together it only counts who happens to be registered in the demo.
    ...(athletes.length && sport?.id === "fotball" ? [{ value: athletes.length, label: memberWord }] : []),
  ];

  return (
    <div className={node.pageTone === "dark" ? "page-dark" : undefined}>
      <NodeHero
        breadcrumb={org
          .lineage(node.id)
          // In a club with one sport, the club and the sport are understood: the trail starts at the discipline.
          .filter((n) => !org.soleGroup(n.id) && !(org.sports().length === 1 && (n.kind === "club" || n.kind === "sport")))
          .map((n) => ({ label: n.name, href: org.href(n.id) }))}
        eyebrow={context}
        title={node.pageHeading ?? node.name}
        titleLogo={node.titleLogo}
        description={node.description ?? node.summary}
        photo={photo}
        anchorToSlant={node.heroAnchor === "slant"}
        primaryHref={node.heroActions?.primary.href ?? `/aktiviteter/treningsaret?gruppe=${node.id}#terminliste`}
        primaryLabel={node.heroActions?.primary.label ?? "Se terminliste"}
        joinHref={node.heroActions?.secondary.href ?? (firstTraining.length ? "#forste-trening" : "#bli-med")}
        // Spond is where sessions are signed up for, so the main action is to come along, not to browse a list.
        joinLabel={node.heroActions?.secondary.label ?? "Prøv en trening"}
        facts={facts}
        leadWith="join"
        presenter={
          presenter && {
            name: fullName(presenter.person),
            // The club's word for whoever leads a group, where it has one (Road Captain on Landevei).
            title: org.lineage(node.id).reverse().find((n) => n.leadTitle)?.leadTitle ?? membershipTitle(presenter.membership.role, presenter.membership.title),
            photo: portraitOf(db, presenter.person),
            phone: presenter.person.publicContact?.phone,
            // «Alle kontakter» only when there is more than this one person to see.
            href: contacts.length > 1 ? "#kontakt" : undefined,
          }
        }
      />

      {/* A film right under the top of the page, as wide as the film on the Mallorca page (VideoHero): edge to edge up to the page's widest. */}
      {node.video && (
        <section aria-label={node.video.label} className="bg-[var(--header-bg,#0d1a2b)]">
          <div className="mx-auto max-w-[1728px]">
            {/* Plays by itself, without sound and in a loop, like the film on the Mallorca page; whoever has asked for less motion gets it still, with controls. */}
            <div style={{ aspectRatio: `${node.video.width} / ${node.video.height}` }}>
              <AutoplayVideo src={node.video.src} label={node.video.label} />
            </div>
          </div>
        </section>
      )}

      {/* The sections take turns being white and light grey (.alternate in globals.css), whichever of them the group has. */}
      <div className="alternate">
      {/* Why people ride in this group, right under the hero's own facts —
          as one wide card at a time (QuoteStage). A parent's
          card names the relation where a rider's names the group. */}
      {quotes.length > 0 && (
        <Section labelledBy="sitater" rule="top" className="py-16 lg:py-24">
          <div className="page">
            <QuoteStage
              items={quotes.map((q) => ({
                id: q.id,
                firstName: q.name,
                age: q.age,
                groups: q.relation ? [q.relation] : [],
                groupLinks: [],
                quote: q.quote,
                photo: q.photo,
                cardStyle: q.cardStyle,
                example: q.example,
                href: q.href,
                inDeck: false,
              }))}
              heading={
                <>
                  <p className="t-eyebrow">Fra gruppa</p>
                  <h2 id="sitater" className="mt-3 t-h1">
                    Derfor sykler de {node.namePreposition ?? "i"} {node.name}.
                  </h2>
                </>
              }
            />
          </div>
        </Section>
      )}

      {/* What to know before turning up: where and when, how hard, what to
          bring, who to look for, and that trying comes before joining. Only
          what the club has said. */}
      {firstTraining.length > 0 && (
        <SplitSection
          id="forste-trening"
          eyebrow="Første trening"
          title="Dette bør du vite"
          titleMuted="før du kommer."
          link={
            meetUpInFirst ? undefined : simple ? { href: "#nar-og-hvor", label: "Oppmøtested og kart" } : sessions.length ? { href: "#faste", label: "Hele ukeplanen" } : undefined
          }
        >
          {meetUpInFirst && (
            <div id="nar-og-hvor" className="scroll-mt-[var(--header-h)]">
              <h3 className="mb-5 t-h3">Møt opp og bli med</h3>
              <MeetUpPlan slots={slots} months={months} />
              {spond && <SpondNote url={spond.url} label={`Åpne ${spond.label}`} className="mt-8" />}
            </div>
          )}
          <WinterOffer seasons={seasons} today={today} className={meetUpInFirst ? "mt-12" : undefined} />
          {firstRows.length > 0 && (
            <div className={meetUpInFirst || seasons.length ? "mt-12" : undefined}>
              <FirstTraining items={firstRows} />
            </div>
          )}
        </SplitSection>
      )}

      {announcement && !announcement.inline && (
        <Section rule="both" className="bg-club-surface py-8 lg:py-10">
          <div className="page grid-page items-center gap-y-6">
            <div className="col-span-4 md:col-span-8 lg:col-span-8">
              <p className="t-eyebrow text-on-club/70">{announcement.eyebrow}</p>
              <h2 className="mt-2 t-h2 text-on-club">{announcementOpen && announcement.titleOpen ? announcement.titleOpen : announcement.title}</h2>
              <p className="mt-3 max-w-[64ch] t-body text-on-club/80">{announcement.text}</p>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-4 lg:flex lg:justify-end">
              <ExternalButton href={announcement.href} variant="inverse" size="lg" brand arrow>
                {announcement.linkLabel}
              </ExternalButton>
            </div>
          </div>
        </Section>
      )}

      {node.participation && (
        <SplitSection
          id="slik-deltar-du"
          eyebrow="Praktisk"
          title={node.participation.title}
          link={
            node.participation.source
              ? { href: node.participation.source.url, label: node.participation.source.label }
              : undefined
          }
        >
          {node.participation.intro && <p className="mb-6 max-w-[68ch] t-body text-ink-2">{node.participation.intro}</p>}
          {node.participation.wizard ? (
            <JoinWizard id={node.id} steps={node.participation.wizard} done={node.participation.wizardDone} joinGroup={node.joinGroup} />
          ) : (
            <ol className="grid gap-3 sm:grid-cols-2">
              {node.participation.steps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-lg bg-sunken p-4 ring-1 ring-line">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-club-surface text-[13px] font-semibold text-on-club">
                    {index + 1}
                  </span>
                  <span className="pt-0.5 t-small text-ink-2">{step}</span>
                </li>
              ))}
            </ol>
          )}
          {node.participation.note && <p className="mt-5 t-small text-ink-3">{node.participation.note}</p>}
        </SplitSection>
      )}

      {/* Who rides in the group, right after how to join it. */}
      {showMembers && (
        <SplitSection id="gruppa" eyebrow={sport?.id === "fotball" ? "Laget" : "Gruppa"} title={`${memberCount} ${memberWord} i ${node.name}`}>
          <MemberGrid members={members} others={otherMembers} />
        </SplitSection>
      )}

      {/* «Når og hvor» leads for a group with one simple rhythm: where and when
          to turn up comes before the dates further out. */}
      {simple && !meetUpInFirst && (
        <SplitSection id="nar-og-hvor" eyebrow="Når og hvor" title="Møt opp og bli med">
          <MeetUpPlan slots={slots} months={months} />
          {spond && <SpondNote url={spond.url} label={`Åpne ${spond.label}`} className="mt-8" />}
        </SplitSection>
      )}

      {!node.hideSections?.includes("terminliste") && (
        <SplitSection
          id="neste"
          eyebrow="Datoer"
          title="Terminliste"
          link={{ href: `/aktiviteter/treningsaret?gruppe=${node.id}#terminliste`, label: "Hele terminlisten" }}
          extra={
            spond && (
              <a href={spond.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
                {spond.label}
                <ArrowUpRight aria-hidden className="size-3.5" />
              </a>
            )
          }
        >
          {listed.length ? (
            listed.map((item) =>
              "activity" in item ? (
                <ActivityRow key={item.key} activity={item.activity} today={today} leading="date" showTrail={false} />
              ) : "season" in item ? (
                <SeasonRow key={item.key} season={item.season} today={today} />
              ) : (
                <RideRow key={item.key} ride={item.ride} today={today} />
              ),
            )
          ) : (
            <EmptyState>Ingen kamper, ritt eller arrangementer er publisert for {node.name} ennå. Faste treninger står {simple ? "over" : "under"}.</EmptyState>
          )}
        </SplitSection>
      )}

      {!simple && (
        <>
        {!node.hideSections?.includes("season") && (
          <SplitSection
            id="sesongen"
            eyebrow="Året i korte trekk"
            title={`Sesongen ${season.season}`}
            link={nextSeasonHref ? { href: nextSeasonHref, label: `Neste sesong: ${season.next?.node.name}` } : undefined}
          >
            <SeasonSummary view={season} nodeName={node.name} nextHref={nextSeasonHref} />
          </SplitSection>
        )}

        <SplitSection id="faste" eyebrow="Ukeplan" title="Faste treninger">
          <div className="grid gap-y-12 lg:grid-cols-3 lg:gap-x-[var(--grid-gap)]">
            <div className="lg:col-span-2">
              <TrainingSchedule sessions={sessions} empty={node.summary ?? `${node.name} har ingen faste treninger akkurat nå.`} />
              {spond && <SpondNote url={spond.url} label={`Åpne ${spond.label}`} className="mt-6" />}
              {/* An announcement set inline sits with the weekly plan, as a note rather than a band. */}
              {announcement?.inline && (
                <aside className="mt-6 flex flex-col gap-4 rounded-lg bg-sunken p-5 ring-1 ring-line sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="t-meta font-semibold text-club">{announcement.eyebrow}</p>
                    <p className="mt-1 text-[16px] leading-snug font-semibold text-ink">
                      {announcementOpen && announcement.titleOpen ? announcement.titleOpen : announcement.title}
                    </p>
                    <p className="mt-1 t-small text-ink-2">{announcement.text}</p>
                  </div>
                  <a
                    href={announcement.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex shrink-0 items-center gap-1 t-small font-medium text-club hover:underline"
                  >
                    {announcement.linkLabel}
                    <ArrowUpRight aria-hidden className="size-3.5" />
                  </a>
                </aside>
              )}
            </div>
            {venues.length > 0 && (
              <div>
                <h3 className="border-b border-line pb-3 t-label font-semibold">Hvor vi trener</h3>
                <div className="divide-y divide-line">
                  {venues.map((v) => {
                    const vp = photoById(db, v.photoId);
                    return (
                      <div key={v.id} className="py-4">
                        {vp && <Photo photo={vp} ratio={16 / 9} sizes="(min-width: 1024px) 300px, 100vw" className="mb-3 rounded-lg" />}
                        <p className="text-[15px] font-semibold">{v.name}</p>
                        <p className="t-small text-ink-3">
                          {v.area} · {v.surface}
                        </p>
                        {v.note && <p className="mt-1.5 t-small text-ink-2">{v.note}</p>}
                        {!v.online && (
                        <a
                          href={mapUrl(v.mapQuery)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-2 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover"
                        >
                          Veibeskrivelse <ArrowUpRight aria-hidden className="size-3.5" />
                        </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </SplitSection>
        </>
      )}

      {usefulLinks.length > 0 && (
        <SplitSection id="lenker" eyebrow="Mer om tilbudet" title="Nyttige lenker">
          <div className="grid gap-3 sm:grid-cols-2">
            {usefulLinks.map((link) => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center justify-between gap-4 rounded-lg bg-sunken p-4 t-small font-medium text-ink-2 ring-1 ring-line hover:text-ink"
              >
                {link.label}
                <ArrowUpRight aria-hidden className="size-4 shrink-0" />
              </a>
            ))}
          </div>
        </SplitSection>
      )}

      <RidingRules org={org} nodeId={node.id} />

      {/* The club's own sections for this page (OrgNode.sections), e.g. BMX's «Løp og konkurranser». */}
      {node.sections?.map((sec) => (
        <SplitSection key={sec.title} id={sec.id ?? slugify(sec.title)} eyebrow={sec.eyebrow} title={sec.title}>
          <Blocks blocks={sec.blocks} />
        </SplitSection>
      ))}

      {results.length > 0 && (
        <SplitSection id="resultater" eyebrow="Kamper" title="Siste resultater">
          <ResultsList results={results} />
        </SplitSection>
      )}

      <SplitSection id="innlegg" eyebrow="Nyheter" title={`Fra ${node.name}`} link={{ href: "/nyheter", label: "Alle nyheter" }}>
        {stories.length ? <StoryAccordion stories={stories} /> : <EmptyState>Ingen innlegg fra {node.name} ennå.</EmptyState>}
      </SplitSection>

      <JoinBand
        title={`Prøv en trening med ${node.name}`}
        text={node.joinInfo ?? sport?.joinInfo}
        photo={photoById(db, db.club.joinPhotoId) ?? heroPhotoFor(db, org, sport?.id ?? node.id)}
        action={
          // A group joined through its Spond group (Zwift) sends people there; others to the person who runs it.
          node.joinGroup
            ? { href: node.joinGroup.url, label: node.joinGroup.label, external: true }
            : spond
              ? { href: spond.url, label: "Bli med i Spond-gruppa", external: true }
              : joinFallback
        }
        footnote={
          node.joinGroup && node.participation ? (
            <>
              Deretter:{" "}
              <a className="link text-white" href="#slik-deltar-du">
                {node.participation.title}
              </a>
            </>
          ) : undefined
        }
        options={siblings.map((s) => ({ id: s.id, name: s.name, href: org.href(s.id) }))}
      />

      {contacts.length > 0 && (
        <SplitSection id="kontakt" eyebrow="Kontakt" title={sport?.id === "fotball" ? "Trenere og lagledere" : "Trenere og kontakt"}>
          <ContactGrid>
            {contacts.map((c) => (
              <ContactPerson
                key={`${c.person.id}-${c.membership.nodeId}`}
                name={fullName(c.person)}
                title={membershipTitle(c.membership.role, c.membership.title)}
                note={c.inherited ? org.get(c.membership.nodeId)?.name : undefined}
                phone={c.person.publicContact?.phone}
                photo={portraitOf(db, c.person)}
                className="py-5"
              />
            ))}
          </ContactGrid>
          {/* Leaders are reached through the group's Spond, not by e-mail; a phone number is for the day itself (trips, changes). */}
          {spondAsk && (
            <p className="mt-5 t-small text-ink-2">
              Har du spørsmål? Bli med i{" "}
              <a href={spondAsk.url} target="_blank" rel="noreferrer noopener" className="link text-ink">
                {spondAsk.label}
              </a>{" "}
              og send melding der. Telefonnummeret er for turer og endringer samme dag.
            </p>
          )}
          {/* One more way to reach the group, where the group has given one; an address in it is a link. */}
          {node.contactNote && (
            <p className="mt-3 t-small text-ink-2">
              {node.contactNote.split(/([\w.+-]+@[\w.-]+\.[a-z]{2,})/i).map((part, i) =>
                i % 2 ? (
                  <a key={i} href={`mailto:${part}`} className="link text-ink">
                    {part}
                  </a>
                ) : (
                  part
                ),
              )}
            </p>
          )}
        </SplitSection>
      )}

      {siblings.length > 0 && parent && (
        <Section labelledBy="andre" rule="top" className="py-16 lg:py-24">
          <div className="page">
            <SectionHeader id="andre" eyebrow={parent.name} title={`Andre lag i ${parent.name}.`} href={org.href(parent.id)} linkLabel={`Til ${parent.name}`} />
            <GroupCarousel
              label={`Andre lag i ${parent.name}`}
              className="mt-8"
              items={siblings.map((s) => ({
                id: s.id,
                name: s.name,
                href: org.href(s.id),
                eyebrow: s.ageLabel,
                text: s.summary,
                photo: heroPhotoFor(db, org, s.id),
              }))}
            />
          </div>
        </Section>
      )}
      </div>
    </div>
  );
}

/**
 * A ride the group trains towards, in its terminliste. Until the organiser
 * publishes the next edition the date is projected from the last one, so the
 * row says «ca.» and when it was.
 */
function RideRow({ ride, today }: { ride: { race: Race; start: string; end?: string; confirmed: boolean; previous?: string }; today: string }) {
  const { race } = ride;
  const body = (
    <>
      {ride.confirmed ? (
        <ActivityDate date={ride.start} today={today} />
      ) : (
        // A projected date has no weekday worth showing: the organiser moves the ride to its own day.
        <div className="w-12 text-center leading-none">
          <div className="t-overline text-ink-3">ca.</div>
          <div className="mt-1 font-display text-[1.625rem] font-semibold tracking-[-0.012em] tnum text-ink-3">{dayOfMonth(ride.start)}</div>
          <div className="mt-0.5 t-meta text-ink-3">{formatMonthShort(ride.start)}</div>
        </div>
      )}
      <div className="min-w-0">
        <div className="mb-0.5 t-meta font-semibold text-club">Ritt</div>
        <div className="text-[15px] leading-snug font-semibold text-ink">{race.name}</div>
        <div className="mt-0.5 t-small text-ink-3">
          {[race.place, race.organiser].filter(Boolean).join(" · ")}
        </div>
        {!ride.confirmed && ride.previous && (
          <div className="mt-0.5 t-small text-ink-3">
            Dato ikke kunngjort ennå. Var {formatDayMonth(ride.previous)} {ride.previous.slice(0, 4)}.
          </div>
        )}
      </div>
      {race.page ? <ArrowRight aria-hidden className="mt-1 size-4 text-ink-3" /> : race.url ? <ArrowUpRight aria-hidden className="mt-1 size-4 text-ink-3" /> : <span />}
    </>
  );
  const className = "-mx-3 grid grid-cols-[3rem_minmax(0,1fr)_1.25rem] items-start gap-x-3 rounded-lg border-b border-line px-3 py-3.5 sm:gap-x-5";
  return race.page ? (
    <Link href={race.page.href} className={cn(className, "transition-colors hover:bg-sunken")}>
      {body}
    </Link>
  ) : race.url ? (
    <a href={race.url} target="_blank" rel="noreferrer noopener" className={cn(className, "transition-colors hover:bg-sunken")}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
