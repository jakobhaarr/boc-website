import { Download } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/guides";
import { Breadcrumb, TextLink } from "@/components/ui/primitives";
import { loadSite } from "@/lib/data/queries";

export const metadata: Metadata = {
  title: "Presentasjoner",
  description: "BOCs presentasjoner og håndbøker samlet: Zwift, brukeropplevelse og design, designsystemet og merkevaren.",
};

/**
 * Everything the club has made to be shown or read through, in one place, linked
 * once from the footer: the decks (components/deck), the brand guidelines and the
 * design system's reference, and the bylaws and annual meetings, which keep their
 * own pages (Om klubben) and are only linked here. BOC's own material, so other clubs
 * have no such page. A new deck or guide is one more entry here.
 */
const ITEMS: { kind: string; title: string; text: string; links: { href: string; label: string; /** A PDF in public/pdf, where it already is: opened as a download, not as a page. */ pdf?: boolean }[] }[] = [
  {
    kind: "Presentasjon",
    title: "Zwift med BOC, sesongen 2025/26",
    text: "Opplegget for mandags- og onsdagsøktene, de seks stegene for å melde seg på, og sesongen i tall.",
    links: [{ href: "/presentasjon/zwift-2025-26", label: "Åpne presentasjonen" }],
  },
  {
    kind: "Presentasjon",
    title: "Brukeropplevelse og design",
    text: "Hvordan nettsiden og administrasjonen er tenkt: problemene, menneskene, et mykere førstevalg, bilder og samtykke, og samspillet med Spond.",
    links: [
      { href: "/user-experience", label: "Åpne presentasjonen" },
      { href: "/user-experience/dokument", label: "Les som dokument" },
      { href: "/pdf/boc-brukeropplevelse-presentasjon.pdf", label: "Presentasjonen som PDF (8,4 MB)", pdf: true },
      { href: "/pdf/boc-brukeropplevelse-dokument.pdf", label: "Dokumentet som PDF (0,7 MB)", pdf: true },
    ],
  },
  {
    kind: "Håndbok",
    title: "Merkevare",
    text: "Logo, farger, skrift, bilder og mønster, med eksempler på bruk i sosiale medier, på trykk og på drakten.",
    links: [{ href: "/brand", label: "Se merkevaren" }],
  },
  {
    kind: "Presentasjon",
    title: "Designsystemet",
    text: "Prinsipper, farger, skrift, grid, skråvinkelen, komponenter, bevegelse og personvern: hva nettsiden er bygget av.",
    links: [
      { href: "/presentasjon/designsystem", label: "Åpne presentasjonen" },
      { href: "/design-system", label: "Se referansen" },
    ],
  },
  {
    kind: "Dokument",
    title: "Vedtekter",
    text: "Lov for Bærum og Omegn Cykleklubb, sist revidert på årsmøtet 11. mars 2026.",
    links: [{ href: "/vedtekter", label: "Les vedtektene" }],
  },
  {
    kind: "Dokument",
    title: "Årsmøter",
    text: "Sakspapirer og protokoller fra årsmøtene, med det som ble vedtatt og hvem som ble valgt til styret.",
    links: [{ href: "/%C3%A5rsm%C3%B8ter", label: "Se årsmøtene" }],
  },
];

export default async function PresentationsPage() {
  const { db } = await loadSite();
  const { club } = db;
  if (club.id !== "boc") notFound();

  return (
    <Section className="pb-20 lg:pb-28">
      <div className="page pt-6 lg:pt-10">
        <Breadcrumb items={[{ label: club.name, href: "/" }, { label: "Presentasjoner" }]} />
        <div className="mt-8 max-w-[62ch]">
          <p className="t-eyebrow">Om klubben</p>
          <h1 className="mt-3 t-h1">Presentasjoner</h1>
          <p className="mt-4 t-body text-ink-2">Presentasjonene, håndbøkene og referansene vi har laget, og klubbens vedtekter og årsmøtepapirer, samlet på ett sted.</p>
        </div>
        <ul className="mt-10 grid gap-[var(--grid-gap)] md:grid-cols-2">
          {ITEMS.map((item) => (
            <li key={item.title} className="flex flex-col rounded-lg bg-surface p-6 shadow-card ring-1 ring-line lg:p-8">
              <p className="t-eyebrow">{item.kind}</p>
              <h2 className="mt-2 font-display text-[1.5rem] leading-tight font-medium tracking-[-0.012em]">{item.title}</h2>
              <p className="mt-3 max-w-[52ch] t-small text-ink-2">{item.text}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-7">
                {item.links.map((l) =>
                  l.pdf ? (
                    <a key={l.href} href={l.href} download className="inline-flex items-center gap-1.5 t-small font-medium text-club hover:text-club-hover">
                      <Download aria-hidden className="size-3.5" />
                      {l.label}
                    </a>
                  ) : (
                    <TextLink key={l.href} href={l.href} className="t-small">
                      {l.label}
                    </TextLink>
                  ),
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
