import { ArrowUpRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Grasrotandelen } from "@/components/public/grasrotandelen";
import { BoardMember, ContactPerson } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { Sponsors } from "@/components/public/sponsors";
import { HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, TextLink } from "@/components/ui/primitives";
import { fullName, membershipTitle, photoById } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { ageBands } from "@/lib/finder";
import { mapUrl } from "@/lib/views";

export const metadata: Metadata = { title: "Om klubben" };

export default async function AboutPage() {
  const { db, org, singleSport } = await loadSite();
  const { club } = db;
  const photo = photoById(db, "ph-huddle");
  const groups = org.nodes.filter((n) => n.kind !== "club" && org.isLeaf(n.id));
  const venues = db.venues.filter((v) => v.id !== "klubbhuset");
  const leadership = db.people.flatMap((p) =>
    p.memberships.filter((m) => m.role === "sectionLead").map((m) => ({ person: p, membership: m, node: org.get(m.nodeId) })),
  );
  const boardChair = db.people.flatMap((p) =>
    p.memberships.filter((m) => m.nodeId === org.root.id && m.role === "boardChair").map((m) => ({ person: p, membership: m })),
  )[0];

  /**
   * A club with one sport presents its branches here instead of a list of
   * one sport, and counts groups where a multi-sport club counts sports.
   */
  const sportBranches = singleSport ? org.children(org.sports()[0].id).filter((c) => !org.isLeaf(c.id)) : [];
  const branches = sportBranches.length ? sportBranches : org.sports();
  const sectionLabel = singleSport ? "Disipliner" : "Idretter";
  const NUMBER = ["Ingen", "Én", "To", "Tre", "Fire", "Fem", "Seks"];
  const sectionHeading = singleSport
    ? `${NUMBER[branches.length] ?? branches.length} disipliner, ${groups.length} grupper.`
    : `${NUMBER[branches.length] ?? branches.length} idretter under samme tak.`;

  const facts: [string, string][] = [
    ["Stiftet", String(club.founded)],
    [sectionLabel, String(branches.length)],
    ["Lag og grupper", String(groups.length)],
    ["Anlegg", String(venues.length)],
  ];

  return (
    <>
      <Section className="pb-14 lg:pb-20">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Om klubben" }]} />
          <div className="mt-8 grid-page gap-y-10 lg:mt-12">
            <div className="col-span-4 md:col-span-8 lg:col-span-9">
              <p className="t-eyebrow">Om klubben</p>
              <h1 className="mt-3 t-h1">
                {club.identity.aboutHeadline} <span className="text-ink-3">{club.identity.aboutMuted}</span>
              </h1>
            </div>
            <dl className="col-span-4 grid grid-cols-2 gap-y-6 self-end md:col-span-8 md:grid-cols-4 lg:col-span-3 lg:col-start-10 lg:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="border-l border-guide pl-4">
                  <dd className="font-display text-[2rem] leading-none font-medium tracking-[-0.035em] tnum">{v}</dd>
                  <dt className="mt-1.5 t-small text-ink-3">{k}</dt>
                </div>
              ))}
            </dl>
          </div>
          {photo && (
            <div className="mt-12 lg:mt-16">
              <Photo photo={photo} ratio={4 / 3} mdRatio={21 / 9} priority sizes="(min-width: 1360px) 1280px, 100vw" className="rounded-lg md:rounded-xl" />
            </div>
          )}
        </div>
      </Section>

      <Section labelledBy="idretter" rule="top" className="py-20 lg:py-28">
        <div className="page">
          <p className="t-eyebrow">{sectionLabel}</p>
          <h2 id="idretter" className="mt-3 t-h2">
            {sectionHeading}
          </h2>
          <ul className="mt-10">
            {branches.map((s) => {
              const lead = leadership.find((l) => l.membership.nodeId === s.id);
              return (
                <li key={s.id} className="border-t border-guide">
                  <Link href={org.href(s.id)} className="group grid-page gap-y-3 py-7 transition-colors">
                    <span className="col-span-4 md:col-span-4 lg:col-span-3">
                      <span className="block t-h3 transition-colors group-hover:text-club">{s.name}</span>
                      <span className="block t-small text-ink-3">{ageBands(org.groups(s.id))}</span>
                    </span>
                    <span className="col-span-4 t-body text-ink-2 md:col-span-4 lg:col-span-6">{s.description}</span>
                    <span className="col-span-4 flex items-start justify-between gap-4 md:col-span-8 lg:col-span-3 lg:flex-col lg:items-end">
                      {lead && <span className="t-small text-ink-3">{fullName(lead.person)}, {membershipTitle(lead.membership.role, lead.membership.title).toLowerCase()}</span>}
                      <span className="inline-flex items-center t-small font-medium text-club">
                        Til {s.name.toLowerCase()}
                        <HoverArrow />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      <Section labelledBy="ledelse" tone="sunken" rule="top" className="py-20 lg:py-28">
        <div className="page grid-page gap-y-8">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Styre og administrasjon</p>
            <h2 id="ledelse" className="mt-3 t-h2">
              Hvem gjør hva
            </h2>
            <p className="mt-4 t-small text-ink-2">Trenere og lagledere står på siden til hver gruppe.</p>
            <TextLink href="/styret" className="mt-4 t-small">
              Se hele styret
            </TextLink>
          </div>
          <div className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4">
            {boardChair && (
              <BoardMember
                name={fullName(boardChair.person)}
                title={membershipTitle(boardChair.membership.role, boardChair.membership.title)}
                phone={boardChair.person.publicContact?.phone}
                email={boardChair.person.publicContact?.email}
                className="max-w-xs"
              />
            )}
            <div className="mt-6 grid grid-cols-[minmax(0,1fr)] md:grid-cols-3 md:gap-x-[var(--grid-gap)]">
              {leadership.map((l) => (
                <div key={`${l.person.id}-${l.membership.nodeId}`} className="border-t border-guide">
                  <ContactPerson
                    name={fullName(l.person)}
                    title={membershipTitle(l.membership.role, l.membership.title)}
                    phone={l.person.publicContact?.phone}
                    email={l.person.publicContact?.email}
                    className="pt-5"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section labelledBy="anlegg" rule="top" className="py-20 lg:py-28">
        <div className="page">
          <p className="t-eyebrow">Anlegg</p>
          <h2 id="anlegg" className="mt-3 t-h2">
            Hvor vi trener
          </h2>
          <ul className="mt-10">
            {venues.map((v) => (
              <li key={v.id} className="grid-page gap-y-1 border-t border-guide py-5">
                <span className="col-span-4 md:col-span-4 lg:col-span-3">
                  <span className="block t-label font-semibold text-ink">{v.name}</span>
                  <span className="block t-small text-ink-3">{v.area}</span>
                </span>
                <span className="col-span-4 t-small text-ink-2 md:col-span-4 lg:col-span-3">{v.surface}</span>
                <span className="col-span-4 t-small text-ink-2 md:col-span-4 lg:col-span-3">{v.note}</span>
                <a
                  href={mapUrl(v.mapQuery)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="col-span-4 inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover md:col-span-4 lg:col-span-3 lg:justify-end"
                >
                  Veibeskrivelse <ArrowUpRight aria-hidden className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {club.grasrotandelenOrgNumber && (
        <Section id="grasrotandelen" labelledBy="grasrot-tittel" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
          <div className="page grid-page gap-y-10">
            <div className="col-span-4 md:col-span-8 lg:col-span-3">
              <p className="t-eyebrow">Støtt klubben</p>
              <h2 id="grasrot-tittel" className="mt-3 t-h2">
                Grasrotandelen
              </h2>
              <p className="mt-4 max-w-[36ch] t-small text-ink-2">
                Spiller du hos Norsk Tipping, kan du gi en andel av innsatsen til klubben – uten at det koster deg noe. Pengene går rett til
                aktivitet for barn og ungdom.
              </p>
              <p className="mt-3 t-small text-ink-3">
                Organisasjonsnummer <span className="tnum text-ink">{club.orgNumber}</span>
              </p>
            </div>
            <div className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4">
              <Grasrotandelen orgNumber={club.grasrotandelenOrgNumber} clubName={club.name} />
            </div>
          </div>
        </Section>
      )}

      <Section id="personvern" labelledBy="personvern-tittel" tone="sunken" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
        <div className="page grid-page gap-y-10">
          <div className="col-span-4 md:col-span-8 lg:col-span-3">
            <p className="t-eyebrow">Personvern</p>
            <h2 id="personvern-tittel" className="mt-3 t-h2">
              Bilder og navn på nettsiden
            </h2>
          </div>
          <div className="col-span-4 grid gap-y-8 md:col-span-8 md:grid-cols-3 md:gap-x-[var(--grid-gap)] lg:col-span-9 lg:col-start-4">
            {[
              [
                "Hvem som vises",
                "Lag og grupper publiserer kampreferater og bilder. Personer i bilder og tekst kobles til klubbens register, slik at klubben alltid vet hvor hver enkelt er publisert.",
              ],
              [
                "Samtykke",
                "Foresatte registrerer samtykke til bilder. Personer som ikke skal publiseres kan ikke merkes, og laglederne får en påminnelse når samtykke mangler.",
              ],
              [
                "Be om å bli fjernet",
                `Du kan når som helst be om at du eller barnet ditt ikke lenger skal kunne kjennes igjen. Klubben fjerner navn og dekker til personen i alle bilder, også i gamle saker. Skriv til ${club.email}.`,
              ],
            ].map(([title, text]) => (
              <div key={title} className="border-t border-guide pt-5">
                <h3 className="t-h3">{title}</h3>
                <p className="mt-2 t-small text-ink-2">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section rule="top">
        <div className="page">
          <Sponsors sponsors={club.sponsors} />
        </div>
      </Section>
    </>
  );
}
