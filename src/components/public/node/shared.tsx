import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { ActivityDate } from "@/components/public/activity";
import { HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { TextLink } from "@/components/ui/primitives";
import { formatSpan, type TerminlisteSeason } from "@/lib/club-year";
import { cn } from "@/lib/cn";
import { formatDayMonthShort } from "@/lib/dates";
import type { Org } from "@/lib/org";
import type { OrgNode } from "@/lib/types";
import type { ActivityView } from "@/lib/views";

/* ─── Group rows ──────────────────────────────────────────────────────── */

export function GroupRow({ node, href, nested }: { node: OrgNode; href: string; nested?: boolean }) {
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        href={href}
        className={cn(
          "group -mx-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-lg py-3.5 transition-colors duration-150 hover:bg-sunken",
          nested ? "pr-3 pl-7" : "px-3",
        )}
      >
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[16px] font-semibold text-ink transition-colors group-hover:text-club">{node.name}</span>
            {node.ageLabel && <span className="t-small text-ink-3">{node.ageLabel}</span>}
          </span>
          {node.summary && <span className="mt-0.5 block t-small text-ink-2">{node.summary}</span>}
        </span>
        <span className="flex items-center gap-3">
          <ArrowRight aria-hidden className="size-4 text-ink-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-ink" />
        </span>
      </Link>
    </li>
  );
}

/**
 * Children of a node as rows. Intermediate levels (e.g. "Senior" under
 * Landevei) become a small heading with their groups indented beneath —
 * the hierarchy stays readable without looking like folders.
 */
export function GroupTree({ org, nodeId }: { org: Org; nodeId: string }) {
  const children = org.children(nodeId);
  return (
    <ul className="border-t border-line">
      {children.map((c) =>
        org.isLeaf(c.id) ? (
          <GroupRow key={c.id} node={c} href={org.href(c.id)} />
        ) : (
          <li key={c.id} className="border-b border-line">
            <Link href={org.href(c.id)} className="group flex items-baseline gap-2 pt-4 pb-1">
              <span className="t-label font-semibold text-ink-2 transition-colors group-hover:text-ink">{c.name}</span>
              {c.ageLabel && <span className="t-small text-ink-3">{c.ageLabel}</span>}
            </Link>
            <ul className="mb-2 ml-1 border-l border-line">
              {org.groups(c.id).map((g) => (
                <GroupRow key={g.id} node={g} href={org.href(g.id)} nested />
              ))}
            </ul>
          </li>
        ),
      )}
    </ul>
  );
}

/* ─── Results ─────────────────────────────────────────────────────────── */

const OUTCOME = {
  win: { label: "Seier", className: "text-success" },
  draw: { label: "Uavgjort", className: "text-ink-3" },
  loss: { label: "Tap", className: "text-danger" },
};

export function ResultsList({ results }: { results: ActivityView[] }) {
  return (
    <ul className="border-t border-line">
      {results.map((r) =>
        r.result ? (
          <li key={r.id} className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-start gap-x-4 border-b border-line py-3.5">
            <span className="pt-0.5 t-small text-ink-3 tnum">{formatDayMonthShort(r.date)}</span>
            <span className="min-w-0">
              <span className="block text-[15px] leading-snug font-semibold text-ink">{r.title}</span>
              <span className="block truncate t-small text-ink-3">{[r.subtitle, r.place?.name].filter(Boolean).join(" · ")}</span>
              {r.people.map((p) => (
                <span key={p.label} className="mt-1 block t-small text-ink-2">
                  {p.label}: {p.text}
                </span>
              ))}
            </span>
            <span className="text-right">
              <span className="block font-display text-[1.375rem] leading-none font-semibold tnum text-ink">{r.result.label}</span>
              <span className={cn("mt-1 block t-meta", OUTCOME[r.result.outcome].className)}>{OUTCOME[r.result.outcome].label}</span>
            </span>
          </li>
        ) : null,
      )}
    </ul>
  );
}

/* ─── Split section ───────────────────────────────────────────────────── */

/**
 * The standard content row on hierarchy pages: heading in the first guide
 * cell (sticky on desktop), content across the other three. Both edges sit
 * on guide lines at every breakpoint.
 */
export function SplitSection({
  id,
  eyebrow,
  title,
  titleMuted,
  link,
  extra,
  tone,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  titleMuted?: string;
  link?: { href: string; label: string };
  extra?: React.ReactNode;
  tone?: "default" | "sunken";
  children: React.ReactNode;
}) {
  return (
    <Section labelledBy={id} tone={tone} rule="top" className="py-16 lg:py-24">
      <div className="page grid-page gap-y-8">
        <div className="col-span-4 md:col-span-8 lg:col-span-3">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            {eyebrow && <p className="t-eyebrow">{eyebrow}</p>}
            <h2 id={id} className="mt-3 scroll-mt-28 t-h2">
              {title}
              {titleMuted && <span className="text-ink-3"> {titleMuted}</span>}
            </h2>
            {(link || extra) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 lg:flex-col lg:items-start">
                {link && (
                  <TextLink href={link.href} className="t-small">
                    {link.label}
                  </TextLink>
                )}
                {extra}
              </div>
            )}
          </div>
        </div>
        <div className="col-span-4 md:col-span-8 lg:col-span-9 lg:col-start-4">{children}</div>
      </div>
    </Section>
  );
}

/** Contacts in guide cells: three across the nine-column content area. */
export function ContactGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid border-t border-line md:grid-cols-2 md:gap-x-[var(--grid-gap)] lg:grid-cols-3 [&>*]:border-b [&>*]:border-line">{children}</div>;
}

/* ─── Aside heading ───────────────────────────────────────────────────── */

export function AsideHeading({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="border-b border-line pb-3 t-label font-semibold text-ink">
      {children}
    </h2>
  );
}

/**
 * A season in a terminliste (OrgNode.seasonsInTerminliste): when it starts,
 * its span and rhythm, and a link to the group that runs it.
 */
export function SeasonRow({ season, today }: { season: TerminlisteSeason; today: string }) {
  const ongoing = season.start <= today;
  return (
    <Link
      href={season.href}
      className="group -mx-3 grid grid-cols-[3rem_minmax(0,1fr)_1.25rem] items-start gap-x-3 rounded-lg border-b border-line px-3 py-3.5 transition-colors hover:bg-sunken sm:gap-x-5"
    >
      <ActivityDate date={season.start} today={today} />
      <div className="min-w-0">
        <div className="mb-0.5 t-meta font-semibold text-club">Sesong</div>
        <div className="text-[15px] leading-snug font-semibold text-ink">{season.title}</div>
        <div className="mt-0.5 t-small text-ink-3">
          {formatSpan(season.start, season.end)} · {season.detail}
        </div>
        {ongoing && <div className="mt-0.5 t-small font-medium text-success">Pågår nå</div>}
      </div>
      <HoverArrow className="mt-1 text-ink-3" />
    </Link>
  );
}
