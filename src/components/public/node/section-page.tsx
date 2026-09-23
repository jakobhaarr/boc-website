import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { ActivityRow } from "@/components/public/activity";
import { GroupCarousel } from "@/components/public/group-carousel";
import { JoinBand } from "@/components/public/join-band";
import { ContactPerson } from "@/components/public/people";
import { StoryAccordion } from "@/components/public/story-accordion";
import { Section } from "@/components/ui/guides";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { inSubtree } from "@/lib/activities";
import { articlesInSubtree, contactsFor, fullName, heroPhotoFor, membershipTitle } from "@/lib/content";
import { terminlisteSeasons } from "@/lib/club-year";
import type { Site } from "@/lib/data/queries";
import { YOUTH_MAX_AGE } from "@/lib/finder";
import type { Org } from "@/lib/org";
import { terminliste } from "@/lib/timetable";
import type { OrgNode } from "@/lib/types";
import { toActivityView, toStoryView } from "@/lib/views";
import { NodeHero, type HeroFact } from "./hero";
import { ContactGrid, SeasonRow, SplitSection } from "./shared";

/** "2 lag", "3 grupper" — counted in the sport's own word for a group. */
export function groupCount(org: Org, nodeId: string, n: number) {
  const word = (org.sportOf(nodeId)?.levelLabels?.team ?? "Gruppe").toLowerCase();
  if (n === 1) return `1 ${word}`;
  return `${n} ${word === "lag" ? "lag" : word.endsWith("e") ? `${word}r` : `${word}er`}`;
}

/** Intermediate levels — a discipline, an age group with several teams. */
export function SectionPage({ node, site }: { node: OrgNode; site: Site }) {
  const { db, org, today, now } = site;
  const parent = org.parent(node.id);
  const sport = org.sportOf(node.id);
  const children = org.children(node.id);
  const groups = org.groups(node.id);
  const youthGroups = groups.filter((g) => g.ageRange && g.ageRange[1] <= YOUTH_MAX_AGE);
  const adultGroups = groups.filter((g) => !youthGroups.includes(g) && (g.ageRange?.[0] ?? 0) >= 17);
  const mixedGroups = groups.filter((g) => !youthGroups.includes(g) && !adultGroups.includes(g));
  const audiences = [
    { groups: adultGroups, label: "for voksne" },
    { groups: mixedGroups, label: "for ungdom og voksne" },
    { groups: youthGroups, label: "for barn og ungdom" },
  ].filter((a) => a.groups.length);
  const dates = terminliste(inSubtree(db.activities, org, node.id), today)
    .slice(0, 6)
    .map((a) => toActivityView(a, db, org));
  const seasons = terminlisteSeasons(db, org, node.id, today);
  const listed = [
    ...dates.map((a) => ({ key: a.id, date: a.date, activity: a })),
    ...seasons.map((s) => ({ key: s.id, date: s.start, season: s })),
  ].sort((a, b) => a.date.localeCompare(b.date));
  const stories = articlesInSubtree(db, org, node.id)
    .slice(0, 5)
    .map((a) => toStoryView(a, db, org, now));
  const contacts = contactsFor(db, org, node.id);
  const contactEmail = contacts.find((c) => c.person.publicContact?.email);
  const venueIds = [...new Set([node, ...groups].flatMap((g) => g.venueIds ?? []))];
  const venues = venueIds.flatMap((id) => db.venues.filter((v) => v.id === id));

  // Clubs that sign members up elsewhere (BOC uses Spond) send people there.
  const joinFallback = db.club.signupUrl
    ? { href: db.club.signupUrl, label: `Meld deg inn i ${db.club.shortName}`, external: true }
    : { href: "/bli-med", label: "Slik blir du medlem" };

  const eyebrow = [parent && parent.kind !== "club" ? `${org.levelLabel(node)} i ${parent.name}` : org.levelLabel(node), node.ageLabel].filter(Boolean).join(" · ");
  const facts: HeroFact[] = [
    /* Who the groups are for says more than how many take new riders today:
       «4 grupper for voksne», «2 grupper for barn og ungdom». A group is for
       children and youth when its age range ends by YOUTH_MAX_AGE, as on
       /barn-og-ungdom; for adults when it starts at 17; and for both when it
       starts young and runs on, like BMX Gruppe 3 from 11. A discipline with
       only one kind keeps a plain count. */
    ...(audiences.length > 1
      ? audiences.map((a) => ({ value: groupCount(org, node.id, a.groups.length), label: a.label }))
      : [{ value: groupCount(org, node.id, groups.length), label: `i ${node.name}` }]),
    ...(node.ageLabel ? [{ value: node.ageLabel, label: "Alder" }] : []),
    /* Landevei names its two meeting places with their times: the adult
       groups ride from Bekkestua torg on weekdays and from Kaffebrenneriet
       on Saturdays. Other disciplines name their venues. */
    ...(node.id === "b-landevei"
      ? [
          { value: "Bekkestua torg", label: "Tirsdag og torsdag kl. 17.30" },
          { value: "Kaffebrenneriet Sandvika", label: "Lørdag kl. 10.00" },
        ]
      : venues.length
      ? [{
          value: venues[0].name.replace(" kunstgress", ""),
          label:
            venues.length > 1
                ? `og ${venues.length - 1} ${venues.length === 2 ? "sted" : "steder"} til`
                : "Treningssted",
        }]
      : []),
  ];

  return (
    <>
      <NodeHero
        breadcrumb={org.lineage(node.id).map((n) => ({ label: n.name, href: org.href(n.id) }))}
        eyebrow={eyebrow}
        title={node.name}
        description={node.description ?? node.summary}
        photo={heroPhotoFor(db, org, node.id)}
        // A discipline is a choice between groups, so its first action is to see them.
        primaryHref="#grupper"
        primaryLabel={`Se gruppene i ${node.name}`}
        joinHref={node.joinGroup?.url ?? "#bli-med"}
        next={dates[0]}
        facts={facts}
      />

      <Section labelledBy="grupper" rule="top" className="py-16 lg:py-24">
        <div className="page">
          <SectionHeader
            id="grupper"
            eyebrow="Lag og grupper"
            title={`${groupCount(org, node.id, groups.length)} i ${node.name}.`}
          />
          <GroupCarousel
            label={`Lag og grupper i ${node.name}`}
            className="mt-8"
            items={children.map((c) => {
              const leaf = org.isLeaf(c.id);
              return {
                id: c.id,
                name: c.name,
                href: org.href(c.id),
                eyebrow: leaf ? c.ageLabel : [groupCount(org, c.id, org.groups(c.id).length), c.ageLabel].filter(Boolean).join(" · "),
                text: c.summary,
                photo: heroPhotoFor(db, org, c.id),
              };
            })}
          />
        </div>
      </Section>

      {node.externalLinks?.length ? (
        <SplitSection id="lenker" eyebrow="Mer om tilbudet" title="Nyttige lenker">
          <div className="grid gap-3 sm:grid-cols-2">
            {node.externalLinks.map((link) => (
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
      ) : null}

      <SplitSection
        id="neste"
        eyebrow="Datoer"
        title="Terminliste"
        link={{ href: `/aktiviteter?gruppe=${node.id}#treningstider`, label: "Treningstider for gruppene" }}
      >
        {listed.length ? (
          listed.map((item) =>
            "activity" in item ? (
              <ActivityRow key={item.key} activity={item.activity} today={today} leading="date" />
            ) : (
              <SeasonRow key={item.key} season={item.season} today={today} />
            ),
          )
        ) : (
          <EmptyState>Ingen datoer er publisert for {node.name} ennå.</EmptyState>
        )}
      </SplitSection>

      <SplitSection id="nyheter" eyebrow="Nyheter" title={`Siste fra ${node.name}`} link={{ href: "/nyheter", label: "Alle nyheter" }}>
        {stories.length ? <StoryAccordion stories={stories} /> : <EmptyState>Ingen innlegg fra {node.name} ennå.</EmptyState>}
      </SplitSection>

      <JoinBand
        title={`Bli med i ${node.name}`}
        text={node.joinInfo ?? sport?.joinInfo}
        photo={heroPhotoFor(db, org, sport?.id ?? node.id)}
        action={
          node.joinGroup
            ? { href: node.joinGroup.url, label: node.joinGroup.label, external: true }
            : contactEmail?.person.publicContact?.email
            ? {
                href: `mailto:${contactEmail.person.publicContact.email}?subject=${encodeURIComponent(`Prøvetrening ${node.name}`)}`,
                label: `Send e-post til ${contactEmail.person.firstName}`,
              }
            : joinFallback
        }
        options={groups.map((g) => ({ id: g.id, name: g.name, href: org.href(g.id) }))}
        footnote={
          node.joinGroup && (
            <>
              Medlemskap kan komme senere.{" "}
              <Link href="/bli-med" className="link text-white">
                Slik blir du medlem
              </Link>
            </>
          )
        }
      />

      {contacts.length > 0 && (
        <SplitSection id="kontakt" eyebrow="Kontakt" title="Hvem du kan spørre">
          <ContactGrid>
            {contacts.slice(0, 6).map((c) => (
              <ContactPerson
                key={`${c.person.id}-${c.membership.nodeId}`}
                name={fullName(c.person)}
                title={membershipTitle(c.membership.role, c.membership.title)}
                note={org.get(c.membership.nodeId)?.name}
                phone={c.person.publicContact?.phone}
                email={c.person.publicContact?.email}
                className="py-5"
              />
            ))}
          </ContactGrid>
        </SplitSection>
      )}
    </>
  );
}
