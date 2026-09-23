import { ChevronDown } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PrivacyStatusBadge } from "@/components/admin/bits";
import { ActivityDate, ActivityLine, ActivityRow } from "@/components/public/activity";
import { ActivityExplorer } from "@/components/public/activity-explorer";
import { ClubCrest } from "@/components/public/crest";
import { ContactPerson, TrainingSchedule } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { Sponsors } from "@/components/public/sponsors";
import { StoryCard } from "@/components/public/story";
import { Button, ButtonLink, HoverArrow } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { GuideLines } from "@/components/ui/guides";
import { Avatar, Breadcrumb, chipClass, SectionHeader, Status, StatusDot, TextLink, ToggleChip } from "@/components/ui/primitives";
import { upcoming } from "@/lib/activities";
import { photoById, publishedArticles } from "@/lib/content";
import { loadSite } from "@/lib/data/queries";
import { ageBands, buildExplorer } from "@/lib/finder";
import { expandRegion } from "@/lib/privacy";
import { themeStyle } from "@/lib/theme";
import { sessionsFor, toActivityView, toStoryView } from "@/lib/views";

export const metadata: Metadata = { title: "Designsystem", robots: { index: false } };

const NAV = [
  ["prinsipper", "Prinsipper"],
  ["grid", "Grid"],
  ["typografi", "Typografi"],
  ["farger", "Farger"],
  ["radius", "Radius"],
  ["flater", "Flater og lag"],
  ["knapper", "Knapper og lenker"],
  ["navigasjon", "Navigasjon"],
  ["skjema", "Skjema og filtre"],
  ["status", "Status"],
  ["media", "Bilder og media"],
  ["aktiviteter", "Aktiviteter"],
  ["historier", "Redaksjonelt"],
  ["personer", "Personer"],
  ["bevegelse", "Bevegelse"],
] as const;

function DocSection({ id, title, description, children }: { id: string; title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-20 border-t border-guide pt-12 pb-16 first:border-t-0 first:pt-0">
      <SectionHeader id={`${id}-t`} title={title} description={description} />
      <div className="mt-8 space-y-6">{children}</div>
    </section>
  );
}

function Specimen({ label, children, className }: { label?: string; children: ReactNode; className?: string }) {
  return (
    <div className="overflow-hidden rounded-lg bg-surface ring-1 ring-line">
      {label && <p className="border-b border-line bg-sunken/60 px-5 py-2.5 t-meta text-ink-3">{label}</p>}
      <div className={className ?? "p-5 sm:p-6"}>{children}</div>
    </div>
  );
}

function Swatch({ name, token, dark }: { name: string; token: string; dark?: boolean }) {
  return (
    <div>
      <div className={`h-16 rounded-md ring-1 ring-inset ${dark ? "ring-white/10" : "ring-black/8"}`} style={{ background: `var(${token})` }} />
      <p className="mt-2 t-label">{name}</p>
      <p className="t-meta text-ink-3">{token}</p>
    </div>
  );
}

export default async function DesignSystemPage() {
  const { db, org, today, now } = await loadSite();

  const activities = upcoming(db.activities, today);
  const training = activities.find((a) => a.nodeId === "j16-2" && a.kind === "training" && a.status === "scheduled");
  const cancelled = activities.find((a) => a.status === "cancelled");
  const match = db.activities.find((a) => a.id === "act-lyn");
  const views = [training, match, cancelled].filter((a) => !!a).map((a) => toActivityView(a, db, org));
  const stories = publishedArticles(db)
    .filter((a) => a.heroPhotoId)
    .slice(0, 3)
    .map((a) => toStoryView(a, db, org, now));
  const textStory = publishedArticles(db).find((a) => !a.heroPhotoId);
  const hero = photoById(db, db.club.heroPhotoId);
  const cropPhoto = photoById(db, "ph-mtb-group");
  const redactPhoto = photoById(db, "ph-lyn-3");
  const region = redactPhoto?.people[0]?.region;
  const sports = org.sports().map((s) => ({ node: s, photo: photoById(db, s.identityPhotoId), ages: ageBands(org.groups(s.id)) }));

  const scale = [
    ["Display", "t-display", "Schibsted Grotesk 500 · 60/60 · mobil 34/35 · −3,2 %", "Idrett for hele Oslo."],
    ["H1", "t-h1", "Schibsted Grotesk 500 · 48/50 · mobil 32/34 · −3 %", "Alt som skjer i klubben"],
    ["H2", "t-h2", "Schibsted Grotesk 500 · 36/39 · mobil 26/29 · −2,4 %", "Fra lag og grupper"],
    ["H3", "t-h3", "Inter 600 · 20/26 · mobil 18/23", "Trenere og lagledere"],
    ["Body large", "t-body-lg", "Inter 400 · 19/30 · mobil 17/27", "J16-2 trener tirsdag og torsdag på Voldsløkka."],
    ["Body", "t-body", "Inter 400 · 16/26", "Oppmøte ved klubbhuset kl. 11.15 for felles transport."],
    ["Small", "t-small", "Inter 400 · 14/21", "Bane 2 er stengt for vedlikehold av kunstgresset."],
    ["Label", "t-label", "Inter 500 · 13/18", "Faste treninger"],
    ["Metadata", "t-meta", "Inter 500 · 12/17 · tabulære tall", "13. sep · 18.00–19.30"],
    ["Eyebrow", "t-eyebrow", "Inter 600 · 14/18 · klubbfarge", "Finn din aktivitet"],
    ["Overline", "t-overline", "Inter 600 · 11/14 · versaler · +8 %", "Idretter"],
  ] as const;

  const navItem = "inline-flex h-9 items-center gap-1 rounded-md px-3.5 text-[14px] font-medium tracking-[-0.006em]";

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-40 border-b border-line bg-surface">
        <div className="page flex h-14 items-center gap-3">
          <ClubCrest letters={db.club.shortName} className="h-7 w-auto" />
          <span className="t-label font-semibold">Designsystem</span>
          <span className="hidden t-small text-ink-3 sm:inline">· utviklerreferanse, ikke en del av klubbens nettside</span>
          <nav className="ml-auto flex gap-1">
            <Link href="/" className="rounded-md px-2.5 py-1.5 t-small text-ink-2 hover:bg-sunken hover:text-ink">
              Nettside
            </Link>
            <Link href="/admin" className="rounded-md px-2.5 py-1.5 t-small text-ink-2 hover:bg-sunken hover:text-ink">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <div className="page pt-10 pb-24">
        <div className="grid-page gap-y-10">
          <nav aria-label="Innhold" className="col-span-4 md:col-span-8 lg:col-span-2">
            <ul className="scroll-x -mx-[var(--page-gutter)] flex gap-1 px-[var(--page-gutter)] lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:px-0">
              {NAV.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="block rounded-md px-2.5 py-1.5 t-small whitespace-nowrap text-ink-2 hover:bg-sunken hover:text-ink">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <main className="col-span-4 md:col-span-8 lg:col-span-10">
            <DocSection
              id="prinsipper"
              title="Prinsipper"
              description="Stripe-inspirert system under, redaksjonelt sportsuttrykk over. Klubben eier fargene; plattformen eier resten."
            >
              <Specimen>
                <ol className="grid gap-x-8 gap-y-5 t-small md:grid-cols-2">
                  {[
                    ["Gridet er synlig", "Tynne guidelinjer gir struktur også i luften mellom innholdet. Innhold starter og slutter på linjene."],
                    ["Lag, ikke bokser", "Flater skilles med toner, hårlinjer og forsiktige skygger. Kort brukes bare for objekter."],
                    ["Fotografi først", "Ett stort, godt bilde fremfor mange små. Mennesker i bevegelse, steder og vær."],
                    ["Informasjon er innholdet", "Tider, steder, resultater og navn. Ingen pyntetekst, ingen oppdiktede tall."],
                    ["Identitet med disiplin", "Skråformen markerer klubb og fremdrift. Grid, arbeidskontroller og sekundærvalg er rette, så signalet ikke blir dekor."],
                    ["Bevegelse med mening", "Kort og rask: 140–360 ms. Pilen som vokser, menyer som faller på plass. Respekterer redusert bevegelse."],
                    ["Personvern er en del av designet", "Maskering i bilder er et synlig, gjenkjennelig systemelement."],
                  ].map(([t, d], i) => (
                    <li key={t} className="flex gap-4 border-t border-line pt-4">
                      <span className="font-display text-2xl leading-none font-medium text-club tnum">{i + 1}</span>
                      <span>
                        <span className="block t-label font-semibold">{t}</span>
                        <span className="mt-1 block text-ink-2">{d}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </Specimen>
            </DocSection>

            <DocSection
              id="grid"
              title="Grid"
              description={
                <>
                  12 kolonner på desktop, 8 på nettbrett, 4 på mobil. Maks innholdsbredde 1280 px, marger 40/32/20 px og gap 32/24/16 px. Guidelinjene ligger midt
                  i gapene, så innhold aldri berører en linje. Offentlige seksjoner får dem gjennom <code className="rounded-xs bg-sunken px-1 t-small">&lt;Section&gt;</code>,
                  og linjene fortsetter fra seksjon til seksjon.
                </>
              }
            >
              <Specimen label="Kolonner og guidelinjer på alle kolonnegrenser — variant «all»" className="p-0">
                <div className="bg-sunken px-6 py-8 sm:px-10">
                  <div className="relative">
                    <GuideLines variant="all" />
                    <div className="relative grid-page">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div
                          key={i}
                          className={`flex h-36 items-start justify-center rounded-xs bg-club-tint pt-2 t-meta text-club ${i >= 8 ? "hidden lg:flex" : i >= 4 ? "hidden md:flex" : ""}`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Specimen>

              <Specimen label="Seksjonsgrid — variant «columns»: linje hver tredje kolonne, horisontal regel ved seksjonsskifte" className="p-0">
                <div className="relative px-6 sm:px-10">
                  <GuideLines variant="columns" />
                  <div className="relative grid-page py-10">
                    {hero && (
                      <div className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4 lg:row-start-1">
                        <Photo photo={hero} ratio={16 / 9} sizes="600px" className="rounded-lg" />
                      </div>
                    )}
                    <div className="relative z-10 col-span-4 -mt-10 md:col-span-6 lg:col-span-6 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:-mb-6 lg:self-end">
                      <div className="mx-2 rounded-lg bg-surface p-5 shadow-float ring-1 ring-line lg:mx-0">
                        <p className="t-eyebrow">Hero-komposisjon</p>
                        <p className="mt-2 font-display text-[1.75rem] leading-[1.05] font-medium tracking-[-0.03em]">
                          Bilde på kolonne 4–12. <span className="text-ink-3">Tekstflate på 1–6, lagt over bildet.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rule-t relative bg-sunken px-6 sm:px-10">
                  <GuideLines variant="columns" />
                  <div className="relative grid-page py-6">
                    {["Celle 1 · kol. 1–3", "Celle 2 · kol. 4–6", "Celle 3 · kol. 7–9", "Celle 4 · kol. 10–12"].map((c, i) => (
                      <p key={c} className={`col-span-4 t-small text-ink-2 md:col-span-4 lg:col-span-3 ${i === 1 ? "max-md:hidden" : i > 1 ? "max-lg:hidden" : ""}`}>
                        {c}
                      </p>
                    ))}
                  </div>
                </div>
              </Specimen>

              <Specimen label="Presise delelinjer inne i flater: utforskeren deler seg på linje 4">
                <pre className="scroll-x rounded-md bg-inverse p-4 t-small text-ink-inverse">
                  <code>{`<Section guides="columns" tone="sunken" rule="top">
  <div className="page grid-page">…</div>
</Section>

/* kolonneskille i en flate som spenner 12 kolonner, lagt nøyaktig på guidelinje 4 */
grid-template-columns: calc((100% - 11 * gap) * 0.25 + 2.5 * gap) 1fr;`}</code>
                </pre>
              </Specimen>
            </DocSection>

            <DocSection
              id="typografi"
              title="Typografi"
              description="Schibsted Grotesk i medium vekt og tett sporing for store overskrifter, Inter for alt annet. Overskrifter kan fortsette i en roligere tone."
            >
              <Specimen className="divide-y divide-line">
                {scale.map(([name, cls, spec, sample]) => (
                  <div key={name} className="grid gap-2 px-5 py-5 sm:px-6 md:grid-cols-[11rem_minmax(0,1fr)] md:gap-6">
                    <div>
                      <p className="t-label font-semibold">{name}</p>
                      <p className="t-meta text-ink-3">{spec}</p>
                    </div>
                    <p className={`${cls} min-w-0 break-words`}>{sample}</p>
                  </div>
                ))}
              </Specimen>
              <Specimen label="Totonet overskrift">
                <p className="t-eyebrow">Finn din aktivitet</p>
                <p className="mt-3 t-h1">
                  26 lag og grupper. <span className="text-ink-3">Velg idrett og alder, så ser du hvilke grupper som passer.</span>
                </p>
              </Specimen>
            </DocSection>

            <DocSection id="farger" title="Farger" description="Kjølige, presise nøytraler fra plattformen. Klubbens fem farger skrives inn som CSS-variabler fra klubbens tema.">
              <Specimen label="Plattform — nøytrale">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                  <Swatch name="Background" token="--background" />
                  <Swatch name="Sunken" token="--surface-sunken" />
                  <Swatch name="Muted" token="--surface-muted" />
                  <Swatch name="Inverse" token="--surface-inverse" dark />
                  <Swatch name="Border" token="--border" />
                  <Swatch name="Guide" token="--guide-strong" />
                  <Swatch name="Text primary" token="--text-primary" dark />
                  <Swatch name="Text secondary" token="--text-secondary" dark />
                  <Swatch name="Text muted" token="--text-muted" />
                  <Swatch name="Success" token="--success" dark />
                  <Swatch name="Danger" token="--danger" dark />
                  <Swatch name="Focus" token="--focus" dark />
                </div>
              </Specimen>
              <Specimen label={`Klubb — ${db.club.name}`}>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                  <Swatch name="Primary" token="--club-primary" dark />
                  <Swatch name="Primary hover" token="--club-primary-hover" dark />
                  <Swatch name="On primary" token="--club-on-primary" />
                  <Swatch name="Secondary" token="--club-secondary" dark />
                  <Swatch name="Accent" token="--club-accent" />
                  <Swatch name="Tint" token="--club-tint" />
                </div>
              </Specimen>
              <Specimen label="Samme komponenter, andre klubber">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {db.themes.map((t) => (
                    <div key={t.id} style={themeStyle(t)} className="overflow-hidden rounded-lg bg-bg ring-1 ring-line">
                      <div className="flex items-center gap-2 border-b border-line bg-surface px-3 py-2.5">
                        <ClubCrest letters={t.id === "osk" ? "OSK" : t.label.slice(0, 3).toUpperCase()} className="h-6 w-auto" />
                        <span className="t-label">{t.label}</span>
                      </div>
                      <div className="space-y-3 p-3">
                        <p className="t-eyebrow">Fotball · J16-2</p>
                        <p className="font-display text-lg leading-tight font-medium tracking-[-0.02em]">Seier i siste runde</p>
                        <div className="flex items-center gap-3">
                          <Button size="sm" arrow>
                            Bli medlem
                          </Button>
                          <StatusDot tone="success">Prøv gratis</StatusDot>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Specimen>
            </DocSection>

            <DocSection
              id="radius"
              title="Radius"
              description="Form følger rolle: handlinger og informasjonsgrid er rette, mens badges og løftede innholdsflater kan være mykere. Store redaksjonelle bilder som går kant i kant har rette hjørner."
            >
              <Specimen>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ["rounded-xs", "2 px", "Miniatyrer, tagger"],
                    ["rounded-sm", "3 px", "Status"],
                    ["rounded-md", "5 px", "Kontroller, chips, hover"],
                    ["rounded-[var(--radius-button)]", "0 px", "Knapper og arbeidskontroller"],
                    ["rounded-lg", "8 px", "Flater, historiebilder"],
                    ["rounded-xl", "12 px", "Hero, utforsker, feature"],
                  ].map(([cls, value, use]) => (
                    <div key={cls}>
                      <div className={`h-20 bg-sunken ring-1 ring-line-strong ${cls}`} />
                      <p className="mt-2 t-label">{value}</p>
                      <p className="t-meta text-ink-3">{use}</p>
                    </div>
                  ))}
                </div>
              </Specimen>
            </DocSection>

            <DocSection id="flater" title="Flater og lag" description="Dybde bygges med tonale bånd, hårlinjer og tre nivåer av skygge — aldri glass eller gradienter.">
              <Specimen className="bg-sunken p-6 sm:p-8">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["Flate", "Hårlinje, ingen skygge. Lister og tabeller.", "bg-surface ring-1 ring-line"],
                    ["Kort", "shadow-card. Aktivitetsflater, artikkelbokser.", "bg-surface shadow-card ring-1 ring-line"],
                    ["Løftet", "shadow-raised. Utforskeren.", "bg-surface shadow-raised ring-1 ring-line"],
                    ["Flytende", "shadow-float. Hero-tekst, «I dag»-brikken.", "bg-surface shadow-float ring-1 ring-line"],
                    ["Innfelt", "Sunken med innvendig linje. Tomme tilstander, segmentkontroll.", "bg-sunken shadow-[inset_0_0_0_1px_var(--border)]"],
                    ["Mørk", "Klubbens sekundærfarge. Bunntekst.", "on-inverse bg-club-2 text-on-club-2"],
                  ].map(([t, d, cls]) => (
                    <div key={t} className={`rounded-lg p-5 ${cls}`}>
                      <p className="t-label font-semibold">{t}</p>
                      <p className="mt-1 t-small opacity-75">{d}</p>
                    </div>
                  ))}
                </div>
              </Specimen>
            </DocSection>

            <DocSection
              id="knapper"
              title="Knapper og lenker"
              description="Skråformen betyr klubbidentitet og fremdrift, og reserveres for én viktig offentlig CTA per flate. Sekundærvalg, filtre, arbeidsflyt og farehandlinger er rette. Alle knapper har 0 px radius; badges og chips beholder sin egen mykere form."
            >
              <Specimen>
                <div className="flex flex-wrap items-center gap-3">
                  <Button brand arrow>Merkevare-CTA</Button>
                  <Button arrow>Primær kontroll</Button>
                  <Button variant="secondary" arrow>
                    Sekundær
                  </Button>
                  <Button variant="ghost">Diskré</Button>
                  <Button variant="danger">Anonymiser permanent</Button>
                  <Button disabled>Deaktivert</Button>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-x-7 gap-y-3">
                  <ButtonLink href="/#finn-aktivitet" size="lg" brand arrow>
                    Finn din aktivitet
                  </ButtonLink>
                  <TextLink href="/#finn-aktivitet" className="t-small">
                    Se hva som skjer denne uken
                  </TextLink>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button size="sm" arrow>
                    Liten · 32
                  </Button>
                  <Button arrow>Middels · 40</Button>
                  <Button size="lg" arrow>
                    Stor · 48
                  </Button>
                </div>
                <div className="theme-admin mt-6 flex flex-wrap items-center gap-3 rounded-md bg-bg p-4">
                  <span className="t-meta text-ink-3">Admin · rette arbeidskontroller og blekkfarge</span>
                  <Button>Publiser</Button>
                  <Button variant="secondary">Forhåndsvis</Button>
                </div>
              </Specimen>
            </DocSection>

            <DocSection id="navigasjon" title="Navigasjon" description="Identitet til venstre, fire destinasjoner i midten, én handling til høyre. Idretter åpner et avrundet panel med hele strukturen.">
              <Specimen label="Menypunkter — hvile, hover, valgt">
                <div className="flex flex-wrap items-center gap-1">
                  <span className={`${navItem} text-ink-2`}>Aktiviteter</span>
                  <span className={`${navItem} bg-sunken text-ink`}>
                    Idretter
                    <ChevronDown aria-hidden className="size-3.5 rotate-180 text-ink-3" />
                  </span>
                  <span className={`${navItem} text-ink-2`}>Nyheter</span>
                  <span className={`${navItem} text-ink-2`}>Om klubben</span>
                  <span className="ml-auto">
                    <Button size="sm" brand arrow>
                      Bli medlem
                    </Button>
                  </span>
                </div>
              </Specimen>
              <Specimen label="Idrettsmeny" className="bg-sunken p-4 sm:p-8">
                <div className="overflow-hidden rounded-xl bg-surface shadow-popover ring-1 ring-line">
                  <div className="grid md:grid-cols-3 md:divide-x md:divide-line">
                    {sports.map(({ node, photo, ages }) => (
                      <div key={node.id} className="border-b border-line p-5 last:border-b-0 md:border-b-0">
                        <div className="flex items-center gap-3.5">
                          {photo && <Photo photo={photo} ratio={1} sizes="56px" className="size-14 shrink-0 rounded-md" />}
                          <span>
                            <span className="flex items-center text-[16px] font-semibold tracking-[-0.012em]">
                              {node.name}
                              <HoverArrow />
                            </span>
                            <span className="block t-small text-ink-3">{ages}</span>
                          </span>
                        </div>
                        <ul className="mt-4 grid grid-cols-2 gap-x-1">
                          {org
                            .children(node.id)
                            .slice(0, 4)
                            .map((c) => (
                              <li key={c.id} className="truncate rounded-md px-2 py-1.5 t-small text-ink-2 first:bg-sunken first:text-ink">
                                {c.name}
                              </li>
                            ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between border-t border-line bg-sunken px-5 py-3 t-small">
                    <span className="text-ink-2">Usikker på hva som passer?</span>
                    <span className="inline-flex items-center font-medium text-club">
                      Finn din aktivitet
                      <HoverArrow />
                    </span>
                  </div>
                </div>
              </Specimen>
              <Specimen label="Brødsmuler og seksjonshode">
                <Breadcrumb items={org.lineage("j16-2").map((n) => ({ label: n.name, href: org.href(n.id) }))} />
                <div className="mt-8">
                  <SectionHeader eyebrow="Dette skjer" title="Neste aktiviteter" href="/aktiviteter" linkLabel="Alle aktiviteter" />
                </div>
              </Specimen>
            </DocSection>

            <DocSection id="skjema" title="Skjema og filtre">
              <Specimen>
                <div className="grid gap-5 md:grid-cols-2">
                  <Field label="E-postadresse" htmlFor="ds-email" hint="Vi sender en engangskode.">
                    <Input id="ds-email" placeholder="navn@eksempel.no" />
                  </Field>
                  <Field label="Lag" htmlFor="ds-select">
                    <Select id="ds-select" defaultValue="j16-2">
                      <option value="j16-1">J16-1</option>
                      <option value="j16-2">J16-2</option>
                    </Select>
                  </Field>
                  <Field label="Bildetekst" htmlFor="ds-text" optional>
                    <Textarea id="ds-text" rows={3} placeholder="Hva skjer på bildet?" />
                  </Field>
                  <Field label="Navn" htmlFor="ds-error" error="Gi gruppen et navn.">
                    <Input id="ds-error" aria-invalid />
                  </Field>
                </div>
                <div className="mt-6">
                  <Checkbox label="Foreslå for klubbens forside" description="En klubbadministrator bestemmer hva som vises på forsiden." defaultChecked />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-1.5">
                  <span className={chipClass(true)}>Fotball</span>
                  <span className={chipClass(false)}>Sykkel</span>
                  <span className={chipClass(false)}>Langrenn</span>
                  <span className="w-4" />
                  <ToggleChip selected>Treninger</ToggleChip>
                  <ToggleChip selected={false}>Dugnad</ToggleChip>
                  <span className="w-4" />
                  <span className="inline-flex rounded-[5.5px] bg-sunken p-1 shadow-[inset_0_0_0_1px_var(--border)]">
                    <span className="flex h-8 items-center rounded-[3.5px] bg-surface px-3 text-[13px] font-medium shadow-[0_1px_2px_rgb(13_26_43/0.12),0_0_0_1px_var(--border)]">
                      Alle aldre
                    </span>
                    <span className="flex h-8 items-center px-3 text-[13px] font-medium text-ink-3">Barn</span>
                    <span className="flex h-8 items-center px-3 text-[13px] font-medium text-ink-3">Ungdom</span>
                  </span>
                </div>
              </Specimen>
            </DocSection>

            <DocSection id="status" title="Status">
              <Specimen>
                <div className="flex flex-wrap items-center gap-2">
                  <Status tone="neutral">Nøytral</Status>
                  <Status tone="success">Aktiv</Status>
                  <Status tone="warning">Til godkjenning</Status>
                  <Status tone="danger">Avlyst</Status>
                  <Status tone="club">På forsiden</Status>
                  <Status tone="ink">Personvernredigert</Status>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-5">
                  <StatusDot tone="success">Publisert</StatusDot>
                  <StatusDot tone="neutral">Utkast</StatusDot>
                  <StatusDot tone="danger">Avlyst</StatusDot>
                  <PrivacyStatusBadge status="visible" />
                  <PrivacyStatusBadge status="restricted" />
                  <PrivacyStatusBadge status="anonymised" />
                </div>
              </Specimen>
            </DocSection>

            <DocSection
              id="media"
              title="Bilder og media"
              description="Rammen bestemmer formatet, fokuspunktet bestemmer utsnittet. Maskering ligger i bildets egne koordinater og følger med ved enhver beskjæring."
            >
              {hero && cropPhoto && (
                <Specimen label="Behandlinger">
                  <div className="grid gap-5 sm:grid-cols-3">
                    <figure>
                      <Photo photo={hero} ratio={4 / 5} sizes="300px" className="rounded-xl" />
                      <figcaption className="mt-2 t-meta text-ink-3">Feature · 24 px · hero og utforsker</figcaption>
                    </figure>
                    <figure>
                      <Photo photo={cropPhoto} ratio={4 / 5} sizes="300px" className="rounded-lg" />
                      <figcaption className="mt-2 t-meta text-ink-3">Historie · 16 px</figcaption>
                    </figure>
                    <figure>
                      <Photo photo={photoById(db, "ph-id-langrenn") ?? cropPhoto} ratio={4 / 5} sizes="300px" />
                      <figcaption className="mt-2 t-meta text-ink-3">Redaksjonell · kant i kant, rette hjørner</figcaption>
                    </figure>
                  </div>
                </Specimen>
              )}
              {hero && (
                <Specimen label="Lag over bilde — tekstflate og informasjonsbrikke" className="bg-sunken p-4 sm:p-8">
                  <div className="relative">
                    <Photo photo={hero} ratio={16 / 9} sizes="800px" className="rounded-xl" />
                    <div className="absolute top-4 right-4 hidden w-56 rounded-lg bg-surface p-3.5 shadow-float ring-1 ring-black/5 sm:block">
                      <p className="flex items-center gap-1.5 t-meta font-semibold">
                        <span aria-hidden className="size-1.5 rounded-full bg-success" />I dag
                      </p>
                      <p className="mt-2 t-small">
                        <span className="font-semibold tnum">18.00</span> J16-2 · Voldsløkka
                      </p>
                    </div>
                    <div className="absolute bottom-4 left-4 max-w-sm rounded-lg bg-surface p-4 shadow-float ring-1 ring-line sm:bottom-6 sm:left-6 sm:p-5">
                      <p className="t-eyebrow">Oslo Sportsklubb</p>
                      <p className="mt-1.5 font-display text-xl leading-tight font-medium tracking-[-0.02em]">
                        Idrett for hele Oslo. <span className="text-ink-3">Fotball, sykkel og langrenn.</span>
                      </p>
                    </div>
                  </div>
                </Specimen>
              )}
              {redactPhoto && region && (
                <Specimen label="Personvernmaskering — full kropp, utover konturen">
                  <div className="grid grid-cols-2 gap-3">
                    <figure>
                      <Photo photo={redactPhoto} ratio={4 / 3} sizes="400px" className="rounded-lg">
                        <span
                          aria-hidden
                          className="absolute border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
                          style={{ left: `${region.x}%`, top: `${region.y}%`, width: `${region.w}%`, height: `${region.h}%` }}
                        />
                      </Photo>
                      <figcaption className="mt-2 t-meta text-ink-3">Merket område</figcaption>
                    </figure>
                    <figure>
                      <Photo photo={{ ...redactPhoto, redactions: [expandRegion(region)] }} ratio={4 / 3} sizes="400px" className="rounded-lg" />
                      <figcaption className="mt-2 t-meta text-ink-3">Publisert etter anonymisering</figcaption>
                    </figure>
                  </div>
                </Specimen>
              )}
            </DocSection>

            <DocSection id="aktiviteter" title="Aktiviteter">
              <Specimen label="Finn din aktivitet — idrett, gren og alder, gruppe" className="bg-sunken p-3 sm:p-6">
                <ActivityExplorer sports={buildExplorer(db, org, today)} initialSportId="sykkel" />
              </Specimen>
              <Specimen label="ActivityRow — trening, kamp med resultat, avlyst (klikk for detaljer)" className="px-5 pb-2 sm:px-6">
                {views.map((v) => (
                  <ActivityRow key={v.id} activity={v} />
                ))}
              </Specimen>
              <div className="grid gap-6 md:grid-cols-2">
                <Specimen label="ActivityLine og ActivityDate">
                  <ul className="border-t border-line">
                    {views.slice(0, 2).map((v) => (
                      <ActivityLine key={v.id} activity={v} />
                    ))}
                  </ul>
                  <div className="mt-5 flex gap-4">
                    {views.slice(0, 3).map((v) => (
                      <ActivityDate key={v.id} date={v.date} today={today} className="w-14 rounded-md bg-sunken py-2 shadow-[inset_0_0_0_1px_var(--border)]" />
                    ))}
                  </div>
                </Specimen>
                <Specimen label="TrainingSchedule">
                  <TrainingSchedule sessions={sessionsFor(db, org, "j16-2", today)} empty="Ingen faste treninger." />
                </Specimen>
              </div>
            </DocSection>

            <DocSection id="historier" title="Redaksjonelt">
              <Specimen label="standard — liggende og stående utsnitt">
                <div className="grid gap-6 md:grid-cols-3">
                  {stories.map((s, i) => (
                    <StoryCard key={s.id} story={s} ratio={i === 0 ? 4 / 5 : 3 / 2} sizes="300px" />
                  ))}
                </div>
              </Specimen>
              {stories[0] && (
                <Specimen label="wide">
                  <StoryCard story={stories[0]} variant="wide" />
                </Specimen>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <Specimen label="row" className="px-5 sm:px-6">
                  {stories.slice(0, 2).map((s) => (
                    <StoryCard key={s.id} story={s} variant="row" />
                  ))}
                </Specimen>
                <Specimen label="compact og uten bilde" className="px-5 sm:px-6">
                  {stories.slice(1, 2).map((s) => (
                    <StoryCard key={s.id} story={s} variant="compact" />
                  ))}
                  {textStory && <StoryCard story={toStoryView(textStory, db, org, now)} className="py-4" />}
                </Specimen>
              </div>
              <Specimen label="Samarbeidspartnere" className="px-5 sm:px-6">
                <Sponsors sponsors={db.club.sponsors} />
              </Specimen>
            </DocSection>

            <DocSection id="personer" title="Personer">
              <Specimen>
                <div className="flex flex-wrap items-end gap-3">
                  {([24, 32, 40, 48, 64] as const).map((s) => (
                    <Avatar key={s} name="Marte Solberg" size={s} />
                  ))}
                  <Avatar name="Nora Hansen" size={40} tone="muted" />
                  <Avatar name="Kari Lunde" size={40} tone="club" />
                </div>
                <div className="mt-4 grid divide-y divide-line border-y border-line md:grid-cols-2 md:divide-x md:divide-y-0">
                  <ContactPerson name="Kristin Bråten" title="Hovedtrener" phone="917 34 562" email="kristin.braten@oslosportsklubb.no" />
                  <ContactPerson name="Marte Solberg" title="Lagleder" phone="995 20 418" className="md:pl-5" />
                </div>
              </Specimen>
            </DocSection>

            <DocSection id="bevegelse" title="Bevegelse">
              <Specimen>
                <dl className="grid gap-x-8 gap-y-3 t-small md:grid-cols-2">
                  {[
                    ["--dur-fast · 140 ms", "Hover, farge, pil, knappetrykk"],
                    ["--dur-base · 200 ms", "Detaljer som åpnes, dialoger"],
                    ["Meny · 180 ms", "Faller 6 px ned og skaleres fra 98 %"],
                    ["--dur-slow · 360 ms", "Filterresultater og innhold som kommer inn"],
                    ["--ease-out", "cubic-bezier(0.22, 0.8, 0.24, 1)"],
                    ["Redusert bevegelse", "Alle animasjoner og overganger slås av"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-line pb-2">
                      <dt className="font-medium tnum">{k}</dt>
                      <dd className="text-right text-ink-2">{v}</dd>
                    </div>
                  ))}
                </dl>
              </Specimen>
            </DocSection>
          </main>
        </div>
      </div>
    </div>
  );
}
