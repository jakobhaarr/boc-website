import { ArrowUpRight } from "lucide-react";
import { ActivityDate, ActivityRow } from "@/components/public/activity";
import { GroupCarousel } from "@/components/public/group-carousel";
import { JoinBand } from "@/components/public/join-band";
import { JoinWizard } from "@/components/public/join-wizard";
import { ContactPerson, MemberGrid, TrainingSchedule } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { Blocks } from "@/components/public/blocks";
import { RidingRules } from "@/components/public/node/riding-rules";
import { SeasonSummary } from "@/components/public/node/season-summary";
import { SpondNote } from "@/components/public/schedule-explorer";
import { StoryAccordion } from "@/components/public/story-accordion";
import { Testimonials } from "@/components/public/testimonials";
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
  photoById,
  portraitOf,
  presenterFor,
  slugify,
} from "@/lib/content";
import type { Site } from "@/lib/data/queries";
import { firstTrainingFor, nextTrainingFor } from "@/lib/first-training";
import { meetUpPlan } from "@/lib/meet-up";
import { seasonOf, seasonView } from "@/lib/seasons";
import { terminliste } from "@/lib/timetable";
import type { OrgNode, Race } from "@/lib/types";
import { mapUrl, sessionsFor, toActivityView, toStoryView } from "@/lib/views";
import { NodeHero, type HeroFact } from "./hero";
import { FirstTraining } from "./first-training";
import { MeetUpPlan } from "./meet-up";
import { ContactGrid, ResultsList, SeasonRow, SplitSection } from "./shared";

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
     or over. Children are never listed, and neither is anyone whose age the
     club does not know. Fewer than four reads as a registry gap, not a group.
     The group's own coaches (BOC: its Road Captains) ride with it, so in a
     group for adults (ageRange from 17) they head the list with their title;
     holding the role is what tells us they are grown-ups, not a birth year. */
  const adultYear = Number(today.slice(0, 4)) - 18;
  const riders = athletes
    .filter((p) => p.privacy.status === "visible" && p.birthYear !== undefined && p.birthYear <= adultYear)
    .map((p) => ({ id: p.id, name: fullName(p), photo: portraitOf(db, p) }))
    // A big group only shows the first tiles until «Vis alle» (MemberGrid); those with a portrait lead so the collapsed row is not mostly initials.
    .sort((a, b) => Number(!!b.photo) - Number(!!a.photo));
  const leaders =
    (node.ageRange?.[0] ?? 0) >= 17
      ? db.people.flatMap((p) => {
          const m = p.memberships.find((x) => x.nodeId === node.id && (x.role === "coach" || x.role === "headCoach"));
          return m && p.privacy.status === "visible" && !riders.some((r) => r.id === p.id)
            ? [{ id: p.id, name: fullName(p), photo: portraitOf(db, p), title: membershipTitle(m.role, m.title), lead: m.role === "headCoach" }]
            : [];
        })
        // The group's leader first.
        .sort((a, b) => Number(b.lead) - Number(a.lead))
      : [];
  const members = [...leaders, ...riders];
  const showMembers = riders.length >= 4;
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
  const quotes = groupQuotesFor(db, node, today);
  // The next ordinary session leads the hero's card; the next race or camp follows it.
  const nextTraining = nextTrainingFor(db, org, node.id, today, now);
  const stories = [...articlesInSubtree(db, org, node.id), ...articlesFromParents(db, org, node.id)]
    .sort(byPublishedDesc)
    .slice(0, 5)
    .map((a) => toStoryView(a, db, org, now));
  const venues = (node.venueIds ?? []).flatMap((id) => db.venues.filter((v) => v.id === id));
  const siblings = parent && parent.kind !== "sport" && parent.kind !== "club" ? org.children(parent.id).filter((c) => c.id !== node.id) : [];
  const spond = node.externalLinks?.find((l) => l.kind === "spond");
  const usefulLinks = node.externalLinks?.filter((l) => l.kind !== "spond") ?? [];
  const manager = contacts.find((c) => c.membership.role === "teamManager") ?? contacts.find((c) => !c.inherited) ?? contacts[0];
  const managerEmail = manager?.person.publicContact?.email;
  const managerPhone = manager?.person.publicContact?.phone;
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
          .filter((n) => !org.soleGroup(n.id))
          .map((n) => ({ label: n.name, href: org.href(n.id) }))}
        eyebrow={context}
        title={node.pageHeading ?? node.name}
        titleLogo={node.titleLogo}
        description={node.description ?? node.summary}
        photo={photo}
        primaryHref={node.heroActions?.primary.href ?? `/aktiviteter?gruppe=${node.id}`}
        primaryLabel={node.heroActions?.primary.label ?? `Se aktiviteter i ${node.name}`}
        joinHref={node.heroActions?.secondary.href ?? (firstTraining.length ? "#forste-trening" : "#bli-med")}
        joinLabel={node.heroActions?.secondary.label ?? (firstTraining.length ? "Før første trening" : undefined)}
        next={nextTraining ? dates.find((a) => a.kind !== "training") : dates[0]}
        nextTraining={nextTraining}
        nextTrainingHref={firstTraining.length ? "#forste-trening" : node.participation?.wizard ? "#slik-deltar-du" : simple ? "#nar-og-hvor" : "#faste"}
        facts={facts}
        presenter={
          presenter && {
            name: fullName(presenter.person),
            // The club's word for whoever leads a group, where it has one (Road Captain on Landevei).
            title:
              org.lineage(node.id).reverse().find((n) => n.leadTitle)?.leadTitle ??
              membershipTitle(presenter.membership.role, presenter.membership.title),
            photo: portraitOf(db, presenter.person),
            phone: presenter.person.publicContact?.phone,
            email: presenter.person.publicContact?.email,
            href: "#kontakt",
          }
        }
      />

      {/* Why people ride in this group, right under the hero's own facts —
          the same cards as «Fra medlemmene» on the front page. A parent's
          card names the relation where a rider's names the group. */}
      {quotes.length > 0 && (
        <Section labelledBy="sitater" rule="top" className="py-16 lg:py-24">
          <div className="page">
            <Testimonials
              items={quotes.map((q) => ({
                id: q.id,
                firstName: q.name,
                age: q.age,
                groups: q.relation ? [q.relation] : [],
                quote: q.quote,
                photo: q.photo,
                example: q.example,
                inDeck: false,
              }))}
              heading={
                <>
                  <p className="t-eyebrow">Fra gruppa</p>
                  <h2 id="sitater" className="mt-3 t-h2">
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
            simple ? { href: "#nar-og-hvor", label: "Oppmøtested og kart" } : sessions.length ? { href: "#faste", label: "Hele ukeplanen" } : undefined
          }
        >
          <FirstTraining items={firstTraining} />
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
        <SplitSection id="gruppa" eyebrow={sport?.id === "fotball" ? "Laget" : "Gruppa"} title={`${members.length} ${memberWord} i ${node.name}`}>
          <MemberGrid members={members} />
        </SplitSection>
      )}

      {/* «Når og hvor» leads for a group with one simple rhythm: where and when
          to turn up comes before the dates further out. */}
      {simple && (
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
          link={{ href: `/aktiviteter?gruppe=${node.id}#terminliste`, label: "Hele terminlisten" }}
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
                        <a
                          href={mapUrl(v.mapQuery)}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="mt-2 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover"
                        >
                          Veibeskrivelse <ArrowUpRight aria-hidden className="size-3.5" />
                        </a>
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
            : managerEmail && manager
              ? { href: `mailto:${managerEmail}?subject=${encodeURIComponent(`Prøvetrening ${node.name}`)}`, label: `Send e-post til ${manager.person.firstName}` }
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
          ) : managerPhone && (
            <>
              eller ring{" "}
              <a className="link tnum text-white" href={`tel:${managerPhone.replace(/\s/g, "")}`}>
                {managerPhone}
              </a>
            </>
          )
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
                email={c.person.publicContact?.email}
                photo={portraitOf(db, c.person)}
                className="py-5"
              />
            ))}
          </ContactGrid>
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
          <div className="mt-1 font-display text-[1.625rem] font-semibold tracking-[-0.02em] tnum text-ink-3">{dayOfMonth(ride.start)}</div>
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
      {race.url ? <ArrowUpRight aria-hidden className="mt-1 size-4 text-ink-3" /> : <span />}
    </>
  );
  const className = "-mx-3 grid grid-cols-[3rem_minmax(0,1fr)_1.25rem] items-start gap-x-3 rounded-lg border-b border-line px-3 py-3.5 sm:gap-x-5";
  return race.url ? (
    <a href={race.url} target="_blank" rel="noreferrer noopener" className={cn(className, "transition-colors hover:bg-sunken")}>
      {body}
    </a>
  ) : (
    <div className={className}>{body}</div>
  );
}
