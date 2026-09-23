import { ActivityRow } from "@/components/public/activity";
import { GroupCarousel } from "@/components/public/group-carousel";
import { JoinBand } from "@/components/public/join-band";
import { ContactPerson } from "@/components/public/people";
import { SqueezeGallery } from "@/components/public/squeeze-gallery";
import { StoryAccordion } from "@/components/public/story-accordion";
import { Section } from "@/components/ui/guides";
import { EmptyState, SectionHeader } from "@/components/ui/primitives";
import { inSubtree } from "@/lib/activities";
import { articlesInSubtree, fullName, heroPhotoFor, membershipTitle, photoById } from "@/lib/content";
import type { Site } from "@/lib/data/queries";
import { ageBands } from "@/lib/finder";
import { terminliste } from "@/lib/timetable";
import type { OrgNode } from "@/lib/types";
import { toActivityView, toStoryView } from "@/lib/views";
import { NodeHero, type HeroFact } from "./hero";
import { groupCount } from "./section-page";
import { ContactGrid, SplitSection } from "./shared";

const COACH_ROLES = new Set(["headCoach", "teamManager"]);

/**
 * Sport landing page. Built to answer "what options exist for me here?":
 * branches you can point through, then what's coming up, how to start,
 * recent stories and who to contact.
 */
export function SportPage({ node, site }: { node: OrgNode; site: Site }) {
  const { db, org, today, now } = site;
  const children = org.children(node.id);
  const groups = org.groups(node.id);
  const minAge = Math.min(...groups.map((g) => g.ageRange?.[0] ?? 99));
  const branchLabel = node.levelLabels?.discipline ?? "Gren";
  const hasBranches = children.some((c) => !org.isLeaf(c.id));
  const subtree = org.subtree(node.id);
  const sportName = node.name.toLowerCase();

  const dates = terminliste(inSubtree(db.activities, org, node.id), today)
    .slice(0, 7)
    .map((a) => toActivityView(a, db, org));
  const stories = articlesInSubtree(db, org, node.id)
    .slice(0, 5)
    .map((a) => toStoryView(a, db, org, now));

  const leads = db.people.flatMap((p) =>
    p.memberships.filter((m) => m.nodeId === node.id && m.role === "sectionLead").map((m) => ({ person: p, membership: m })),
  );
  const coaches = db.people
    .flatMap((p) =>
      p.memberships
        .filter((m) => subtree.has(m.nodeId) && m.nodeId !== node.id && COACH_ROLES.has(m.role))
        .slice(0, 1)
        .map((m) => ({ person: p, membership: m })),
    )
    .slice(0, 5);
  const leadEmail = leads.find((l) => l.person.publicContact?.email);

  // Clubs that sign members up elsewhere (BOC uses Spond) send people there.
  const joinFallback = db.club.signupUrl
    ? { href: db.club.signupUrl, label: `Meld deg inn i ${db.club.shortName}`, external: true }
    : { href: "/bli-med", label: "Slik blir du medlem" };

  const [season, seasonNote] = (node.season ?? "").split(",").map((s) => s.trim());
  const facts: HeroFact[] = [
    { value: groupCount(org, node.id, groups.length), label: `i ${sportName}` },
    { value: `${minAge} år`, label: "Yngste gruppe" },
    ...(season ? [{ value: season, label: seasonNote ?? "Sesong" }] : []),
  ];

  const steps = [
    {
      title: "Finn riktig gruppe",
      text: hasBranches
        ? `Gruppene er delt etter ${branchLabel.toLowerCase()} og alder. Er du usikker, spør lederen for ${sportName}.`
        : "Gruppene er delt etter alder og hvor mye du vil trene. Er du usikker, ta kontakt.",
    },
    { title: "Prøv en økt", text: node.joinInfo ?? "Ta kontakt med treneren for gruppen, så avtaler dere en prøvetrening." },
    {
      title: "Meld deg inn",
      text: `Vil du fortsette, melder du deg inn i klubben. Kontingenten er ${db.club.membership.adult} kr for voksne og ${db.club.membership.youth} kr for barn og ungdom.`,
    },
  ];

  const identity = photoById(db, node.identityPhotoId);

  return (
    <>
      <NodeHero
        breadcrumb={[{ label: db.club.name, href: "/" }, { label: node.name }]}
        eyebrow={ageBands(groups)}
        title={node.name}
        description={node.description}
        photo={heroPhotoFor(db, org, node.id)}
        primaryHref={`/aktiviteter?gruppe=${node.id}`}
        primaryLabel={`Se aktiviteter i ${sportName}`}
        joinHref="#bli-med"
        next={dates[0]}
        facts={facts}
      />

      {/* Options */}
      <Section id="grupper" labelledBy="grupper-tittel" rule="top" className="scroll-mt-[var(--header-h)] py-16 lg:py-24">
        <div className="page">
          <SectionHeader
            id="grupper-tittel"
            eyebrow="Grupper"
            title={hasBranches ? `Velg ${branchLabel.toLowerCase()}.` : "Finn riktig gruppe."}
            titleMuted={`${groupCount(org, node.id, groups.length)} fra ${minAge} år.`}
          />
          <div className="mt-10">
            {hasBranches && children.length >= 2 && children.length <= 3 ? (
              <SqueezeGallery
                items={children.map((c) => {
                  const leaf = org.isLeaf(c.id);
                  const inner = org.groups(c.id);
                  return {
                    id: c.id,
                    name: c.name,
                    href: org.href(c.id),
                    meta: leaf ? c.ageLabel : `${groupCount(org, c.id, inner.length)} · ${ageBands(inner)}`,
                    description: c.description ?? c.summary,
                    photo: heroPhotoFor(db, org, c.id),
                    groups: leaf ? [] : inner.map((g) => ({ id: g.id, name: g.name, href: org.href(g.id) })),
                  };
                })}
              />
            ) : (
              <GroupCarousel
                label={`Grupper i ${sportName}`}
                items={children.map((c) => ({
                  id: c.id,
                  name: c.name,
                  href: org.href(c.id),
                  eyebrow: c.ageLabel,
                  text: c.summary,
                  photo: heroPhotoFor(db, org, c.id),
                }))}
              />
            )}
          </div>
        </div>
      </Section>

      <SplitSection
        id="neste"
        eyebrow="Datoer"
        title="Terminliste"
        link={{ href: `/aktiviteter?gruppe=${node.id}`, label: "Treningstider og terminliste" }}
      >
        {dates.length ? (
          dates.map((a) => <ActivityRow key={a.id} activity={a} today={today} leading="date" />)
        ) : (
          <EmptyState>Ingen datoer er publisert i {sportName} ennå.</EmptyState>
        )}
      </SplitSection>

      <JoinBand
        title={`Bli med på ${sportName}`}
        text={node.joinInfo}
        photo={identity && !identity.withdrawn ? identity : heroPhotoFor(db, org, node.id)}
        action={
          leadEmail?.person.publicContact?.email
            ? { href: `mailto:${leadEmail.person.publicContact.email}?subject=${encodeURIComponent(`Bli med på ${sportName}`)}`, label: `Send e-post til ${leadEmail.person.firstName}` }
            : joinFallback
        }
        options={groups.slice(0, 8).map((g) => ({ id: g.id, name: g.name, href: org.href(g.id) }))}
      />

      {/* How to start */}
      <Section labelledBy="start" tone="sunken" rule="top" className="py-16 lg:py-24">
        <div className="page grid-page gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Kom i gang</p>
            <h2 id="start" className="mt-3 t-h2">
              Slik begynner du
            </h2>
          </div>
          <ol className="col-span-4 grid gap-y-10 md:col-span-8 md:grid-cols-3 md:gap-x-[var(--grid-gap)] lg:col-span-9 lg:col-start-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t border-guide pt-5">
                <span className="font-display text-[2.75rem] leading-none font-medium tracking-[-0.04em] text-club tnum">{i + 1}</span>
                <h3 className="mt-5 t-h3">{s.title}</h3>
                <p className="mt-2 t-small text-ink-2">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </Section>

      <SplitSection id="historier" eyebrow="Nyheter" title={`Siste fra ${sportName}`} link={{ href: `/nyheter?idrett=${node.slug}`, label: "Alle nyheter" }}>
        {stories.length ? <StoryAccordion stories={stories} /> : <EmptyState>Ingen innlegg fra {sportName} ennå.</EmptyState>}
      </SplitSection>

      <SplitSection id="kontakt" eyebrow="Kontakt" title="Hvem du kan spørre" titleMuted="Telefon og e-post til trenerne står på siden til hver gruppe.">
        <ContactGrid>
          {leads.map((c) => (
            <ContactPerson
              key={c.person.id}
              name={fullName(c.person)}
              title={membershipTitle(c.membership.role, c.membership.title)}
              phone={c.person.publicContact?.phone}
              email={c.person.publicContact?.email}
              className="py-5"
            />
          ))}
          {coaches.map((c) => (
            <ContactPerson
              key={c.person.id}
              name={fullName(c.person)}
              title={membershipTitle(c.membership.role, c.membership.title)}
              note={org.get(c.membership.nodeId)?.name}
              className="py-5"
            />
          ))}
        </ContactGrid>
      </SplitSection>
    </>
  );
}
