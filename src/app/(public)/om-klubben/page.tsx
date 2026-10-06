import type { Metadata } from "next";
import Link from "next/link";
import { GlossaryText } from "@/components/public/glossary";
import pedalposten from "@/components/assets/pedalposten-web.jpg";
import siljePhoto from "@/components/assets/silje-34.png";
import { AnonymiseExplainer } from "@/components/public/anonymise-explainer";
import { Grasrotandelen } from "@/components/public/grasrotandelen";
import { VenueList } from "@/components/public/venue-list";
import { PrivacyContactForm } from "@/components/public/privacy-contact-form";
import { ContactPerson } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { StravaLink } from "@/components/public/strava-link";
import { Sponsors } from "@/components/public/sponsors";
import { HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, TextLink } from "@/components/ui/primitives";
import { fullName, membershipTitle, photoById, portraitOf, yearsInDecades } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { formatSpan, nextEdition } from "@/lib/club-year";
import { ageBands } from "@/lib/finder";

export const metadata: Metadata = { title: "Om klubben" };

export default async function AboutPage() {
  const { db, org, singleSport, today } = await loadSite();
  const { club } = db;
  const photo = photoById(db, "ph-huddle");
  const groups = org.nodes.filter((n) => n.kind !== "club" && org.isLeaf(n.id));
  const venues = db.venues.filter((v) => v.id !== "klubbhuset");
  /* The rides the club arranges itself, once each: Styrkeprøven's two routes are one ride. */
  const ownRides = db.races
    .filter((r) => r.ownEvent)
    .filter((r, i, all) => all.findIndex((o) => (o.slug ?? o.id) === (r.slug ?? r.id)) === i)
    .map((race) => ({ race, ...nextEdition(race, today) }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const leadership = db.people.flatMap((p) =>
    p.memberships.filter((m) => m.role === "sectionLead").map((m) => ({ person: p, membership: m, node: org.get(m.nodeId) })),
  );
  /* «Hvem gjør hva»: the four the club answers for, in this order — the
     chair, the deputy, and whoever leads the election and control committees
     (their titles carry the role after a comma, see /styret). */
  const atClub = (match: (m: { role: string; title?: string }) => boolean) =>
    db.people.flatMap((p) => p.memberships.filter((m) => m.nodeId === org.root.id && match(m)).map((m) => ({ person: p, membership: m })))[0];
  const officers = [
    { who: atClub((m) => m.role === "boardChair"), title: "Styreleder" },
    { who: atClub((m) => m.title === "Nestleder"), title: "Nestleder" },
    { who: atClub((m) => m.title === "Valgkomité, leder"), title: "Leder av valgkomiteen" },
    { who: atClub((m) => m.title === "Kontrollutvalget, leder"), title: "Leder av kontrollutvalget" },
  ].filter((o): o is { who: NonNullable<typeof o.who>; title: string } => !!o.who);

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

  const history = club.history;
  const historyMuted =
    history?.headlineMuted && history.since
      ? history.headlineMuted.replace("{år}", yearsInDecades(history.since, today))
      : history?.headlineMuted;

  const facts: [string, string][] = [
    ["Etablert", String(club.founded)],
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
              {club.stravaClubUrl && <StravaLink url={club.stravaClubUrl} className="mt-6">{`Bli med i ${club.shortName} på Strava`}</StravaLink>}
            </div>
            <dl className="col-span-4 grid grid-cols-2 gap-y-6 self-end md:col-span-8 md:grid-cols-4 lg:col-span-3 lg:col-start-10 lg:grid-cols-2">
              {facts.map(([k, v]) => (
                <div key={k} className="border-l border-guide pl-4">
                  <dd className="font-display text-[2rem] leading-none font-medium tracking-[-0.022em] tnum">{v}</dd>
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

      {club.history && (
        <Section id="historie" labelledBy="historie-tittel" tone="sunken" rule="top" className="scroll-mt-[var(--header-h)] py-20 lg:py-28">
          <div className="page">
            <div className="grid-page gap-y-6">
              <div className="col-span-4 md:col-span-8 lg:col-span-9">
                <p className="t-eyebrow">Historie</p>
                <h2 id="historie-tittel" className="mt-3 t-h2">
                  {club.history.headline} {historyMuted && <span className="text-ink-3">{historyMuted}</span>}
                </h2>
              </div>
            </div>
            <div className="mt-10 grid-page gap-y-10 lg:mt-14">
              <div className="col-span-4 space-y-4 t-body text-ink-2 md:col-span-8 lg:col-span-6">
                {club.history.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="col-span-4 md:col-span-8 lg:col-span-5 lg:col-start-8">
              <ol>
                {club.history.milestones.map((m) => (
                  <li key={`${m.year}-${m.text}`} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-4 border-t border-guide py-4 last:border-b">
                    <span className="font-display text-[1.25rem] leading-tight font-medium tracking-[-0.012em] text-club tnum">{m.year}</span>
                    <span className="t-small text-ink-2">{m.text}</span>
                  </li>
                ))}
              </ol>
            {/* An old issue of the club's paper, laid at an angle on a second sheet, as if on a table. */}
            {club.id === "boc" && (
              <figure className="mt-12 w-full pb-6 pl-2" style={{ maxWidth: "19rem" }}>
                <div className="relative">
                  <div aria-hidden className="absolute inset-0 rotate-[3deg] rounded-[3px] bg-surface shadow-card ring-1 ring-line" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pedalposten.src}
                    width={pedalposten.width}
                    height={pedalposten.height}
                    alt="Forsiden av Pedalposten, nr. 2 1981, 8. årgang: «Organ for Bærum og omegn Cykleklubb», med en syklist på bane"
                    loading="lazy"
                    className="relative block h-auto w-full -rotate-[3deg] rounded-[3px] shadow-float ring-1 ring-black/10"
                  />
                </div>
                <figcaption className="mt-5 t-meta text-ink-3">Pedalposten, nr. 2 1981, klubbens organ i 8. årgang.</figcaption>
              </figure>
            )}
              </div>
            </div>
          </div>
        </Section>
      )}

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
                    <span className="col-span-4 t-body text-ink-2 md:col-span-4 lg:col-span-6">{s.description && <GlossaryText text={s.description} />}</span>
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
            <div className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2 md:gap-x-[var(--grid-gap)] xl:grid-cols-4">
              {officers.map(({ who, title }) => (
                <div key={`${who.person.id}-${title}`} className="border-t border-guide">
                  <ContactPerson
                    name={fullName(who.person)}
                    photo={portraitOf(db, who.person)}
                    title={title}
                    phone={who.person.publicContact?.phone}
                    email={who.person.publicContact?.email}
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
          <VenueList venues={venues.map((v) => ({ id: v.id, name: v.name, area: v.area, surface: v.surface, note: v.note, mapQuery: v.mapQuery, online: v.online, photo: (({ p }) => (p && !p.withdrawn ? p : undefined))({ p: photoById(db, v.photoId) }) }))} />
        </div>
      </Section>

      {ownRides.length > 0 && (
        <Section labelledBy="ritt" tone="sunken" rule="top" className="py-20 lg:py-28">
          <div className="page">
            <p className="t-eyebrow">Ritt vi arrangerer</p>
            <h2 id="ritt" className="mt-3 t-h2">
              Klubbens egne ritt
            </h2>
            <ul className="mt-10 grid gap-[var(--grid-gap)] md:grid-cols-3">
              {ownRides.map(({ race, start, end }) => (
                <li key={race.id}>
                  <Link href={race.page?.href ?? "/sykkelritt"} className="group flex h-full flex-col rounded-lg bg-surface p-6 shadow-card ring-1 ring-line transition-shadow hover:shadow-raised">
                    <span className="t-eyebrow">{race.info?.facts.find((f) => f.label.startsWith("Neste utgave"))?.value ?? `${formatSpan(start, end)} ${start.slice(0, 4)}`}</span>
                    <span className="mt-2 font-display text-[1.5rem] leading-tight font-medium tracking-[-0.012em] text-ink">{race.slug === "styrkeproven" ? "Styrkeprøven" : race.name}</span>
                    <span className="mt-2 t-small text-ink-3">{race.slug === "styrkeproven" ? "Trondheim–Oslo og Lillehammer–Oslo" : race.place}</span>
                    <span className="mt-5 inline-flex items-center gap-1 t-small font-medium text-club">
                      Les mer
                      <HoverArrow />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}

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
              <Grasrotandelen orgNumber={club.grasrotandelenOrgNumber} clubName={club.name} stats={club.grasrotandelenStats} />
            </div>
          </div>
        </Section>
      )}

      {/* The club's information pages (Club.pages), one card each: what it is, and a way in. */}
      {club.pages && club.pages.length > 0 && (
        <Section labelledBy="info-tittel" rule="top" className="py-20 lg:py-28">
          <div className="page grid-page gap-y-10">
            <div className="col-span-4 md:col-span-8 lg:col-span-3">
              <p className="t-eyebrow">For medlemmer</p>
              <h2 id="info-tittel" className="mt-3 t-h2">
                Ordninger og rutiner
              </h2>
            </div>
            <div className="col-span-4 grid gap-y-8 md:col-span-8 md:grid-cols-2 md:gap-x-[var(--grid-gap)] lg:col-span-9 lg:col-start-4">
              {club.pages.map((p) => (
                <div key={p.slug} id={p.slug} className="scroll-mt-[var(--header-h)] border-t border-guide pt-5">
                  <h3 className="t-h3">{p.navLabel}</h3>
                  <p className="mt-2 max-w-[48ch] t-small text-ink-2">{p.teaser}</p>
                  <TextLink href={`/klubben/${p.slug}`} className="mt-3 t-small">
                    {`Les om ${p.navLabel.toLowerCase()}`}
                  </TextLink>
                </div>
              ))}
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
                "Du kan når som helst be om at du eller barnet ditt ikke lenger skal kunne kjennes igjen. Klubben fjerner navn og dekker til personen i alle bilder, også i gamle saker. Bruk skjemaet under.",
              ],
            ].map(([title, text]) => (
              <div key={title} className="border-t border-guide pt-5">
                <h3 className="t-h3">{title}</h3>
                <p className="mt-2 t-small text-ink-2">{text}</p>
              </div>
            ))}
            <div className="md:col-span-3">
              <h3 className="t-h3">Slik anonymiserer vi i etterkant</h3>
              <p className="mt-2 max-w-[60ch] t-small text-ink-2">Prøv selv: bytt mellom før og etter, og se hva som skjer med bilder, artikler og lister.</p>
              <div className="mt-4">
                <AnonymiseExplainer photoSrc={siljePhoto.src} />
              </div>
            </div>
            <div className="md:col-span-3">
              <h3 className="t-h3">Be om innsyn, sletting eller anonymisering</h3>
              <p className="mt-2 max-w-[60ch] t-small text-ink-2">
                Si hvem du tar kontakt på vegne av og hva du ber om. Du kan også skrive til{" "}
                <a href={`mailto:${club.email}`} className="link text-ink">
                  {club.email}
                </a>
                .
              </p>
              <div className="mt-4">
                <PrivacyContactForm />
              </div>
            </div>
            <p className="md:col-span-3">
              <TextLink href="/personvern">Les hele personvernerklæringen</TextLink>
            </p>
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
