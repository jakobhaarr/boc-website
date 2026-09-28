import type { ReactNode } from "react";
import { GlossaryText } from "@/components/public/glossary";
import { GroupLead } from "@/components/public/people";
import { Photo } from "@/components/public/photo";
import { ButtonLink, ExternalButton, HoverArrow } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { formatDayMonthShort, formatTime, formatWeekday } from "@/lib/dates";
import type { NextTraining } from "@/lib/first-training";
import type { Photo as PhotoRecord } from "@/lib/types";
import type { ActivityView } from "@/lib/views";

export interface HeroFact {
  value: ReactNode;
  label: string;
}

/**
 * Hero shared by every page in the hierarchy (sport, section, group), so
 * the pages read as one family: breadcrumb, statement, the two actions and
 * a photo. Text and photo each take half the grid (two guide cells); the
 * fact strip below sits one fact per guide cell, like Stripe's logo row.
 *
 * Two actions: the primary is the page's next step — a group's activities, a
 * discipline's groups — and the secondary is always how you join.
 */
export function NodeHero({
  breadcrumb,
  eyebrow,
  title,
  titleMuted,
  titleLogo,
  description,
  photo,
  primaryHref,
  primaryLabel,
  joinHref,
  joinLabel = "Bli med",
  next,
  nextTraining,
  nextTrainingHref = "#forste-trening",
  facts,
  presenter,
}: {
  breadcrumb: { label: string; href?: string }[];
  eyebrow: ReactNode;
  title: string;
  titleMuted?: string;
  /**
   * Shows this logo in place of the title text (a group's own wordmark,
   * e.g. Zwift's), while `title` stays the h1's accessible name for a
   * screen reader and a search engine. Pick the variant that reads against
   * this page's own background (OrgNode.pageTone), not the visitor's own
   * light/dark preference: a page painted dark by the club (`.page-dark`)
   * stays that colour regardless of the site-wide toggle.
   */
  titleLogo?: { src: string; width: number; height: number };
  description?: string;
  photo?: PhotoRecord;
  primaryHref: string;
  primaryLabel: string;
  joinHref: string;
  /** The secondary action's label; «Bli med» unless the page has a better next step. */
  joinLabel?: string;
  next?: ActivityView;
  /**
   * The next ordinary session (lib/first-training.ts). When there is one it
   * leads the card as «Neste trening», and `next` — a race, a camp — follows
   * it as a smaller line, so a newcomer's next chance to ride is not
   * Mallorca.
   */
  nextTraining?: NextTraining;
  nextTrainingHref?: string;
  facts: HeroFact[];
  /** The person who presents the group — its lagleder — with a way to reach them. */
  presenter?: { name: string; title: string; photo?: PhotoRecord; phone?: string; email?: string; href: string };
}) {
  return (
    <>
      <Section className="pb-12 lg:pb-16">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={breadcrumb} />
          <div className="mt-6 grid-page items-center gap-y-8 lg:mt-10">
            <div className="col-span-4 md:col-span-8 lg:col-span-6 lg:pr-[var(--grid-gap)]">
              <p className="t-eyebrow">{eyebrow}</p>
              <h1 className="mt-3 t-display">
                {titleLogo ? (
                  <>
                    <span className="sr-only">{title}</span>
                    {/* Decorative: the h1's accessible name comes from the sr-only text above. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={titleLogo.src} width={titleLogo.width} height={titleLogo.height} alt="" className="h-[0.6em] w-auto" />
                  </>
                ) : (
                  <>
                    {title}
                    {titleMuted && <span className="text-ink-3"> {titleMuted}</span>}
                  </>
                )}
              </h1>
              {/* A blank line in the description starts a new paragraph, so a long
                  one can be written as a few short ones. */}
              {description && (
                <div className="mt-5 max-w-[52ch] space-y-3 t-body-lg text-ink-2">
                  {description.split(/\n\s*\n/).map((part) => (
                    <p key={part}>
                      <GlossaryText text={part.trim()} />
                    </p>
                  ))}
                </div>
              )}
              {/* The group has a face: whoever leads it, under what it says about itself. */}
              {presenter && (
                <GroupLead
                  name={presenter.name}
                  title={presenter.title}
                  photo={presenter.photo}
                  phone={presenter.phone}
                  email={presenter.email}
                  contactsHref={presenter.href}
                  className="mt-7 max-w-[34rem]"
                />
              )}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ButtonLink href={primaryHref} size="lg" brand arrow>
                  {primaryLabel}
                </ButtonLink>
                {/* Second of a pair: the cut mirrors the first button's, so the
                    gap between them reads as one parallel channel. */}
                {/* A join link out of the site (a Spond group) opens in a new tab. */}
                {/^https?:/.test(joinHref) ? (
                  <ExternalButton href={joinHref} variant="secondary" size="lg" brand slant="both">
                    {joinLabel}
                  </ExternalButton>
                ) : (
                  <ButtonLink href={joinHref} variant="secondary" size="lg" brand slant="both">
                    {joinLabel}
                  </ButtonLink>
                )}
              </div>
            </div>

            {photo && (
              <div className="relative col-span-4 max-md:order-first md:col-span-8 lg:col-span-6 lg:col-start-7">
                <Photo
                  photo={photo}
                  ratio={4 / 3}
                  mdRatio={16 / 9}
                  priority
                  sizes="(min-width: 1024px) 640px, 100vw"
                  className="rounded-lg md:rounded-xl lg:aspect-[4/3]"
                />
                {nextTraining ? (
                  <NextTrainingUp training={nextTraining} href={nextTrainingHref} then={next} />
                ) : (
                  next && <NextUp activity={next} />
                )}
              </div>
            )}
          </div>
        </div>
      </Section>
      <FactStrip facts={facts} />
    </>
  );
}

/**
 * Floating card on the hero photo, for a group with ordinary sessions: the
 * next one, and under it the next special activity, if any, as a line of its
 * own. The same frame as NextUp, so the page looks as it did.
 */
function NextTrainingUp({ training: t, href, then }: { training: NextTraining; href: string; then?: ActivityView }) {
  return (
    <div className="absolute bottom-4 left-4 w-[min(18rem,calc(100%-2rem))] rounded-lg bg-surface/95 p-4 shadow-float ring-1 ring-black/5 backdrop-blur-sm max-sm:hidden">
      <a href={href} className="group block">
        <span className="flex items-center justify-between t-meta">
          <span className="flex items-center gap-1.5 font-semibold text-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Neste trening
          </span>
          <span className="text-ink-3">
            <span className="capitalize">{formatWeekday(t.date)}</span> {formatDayMonthShort(t.date)}
          </span>
        </span>
        <span className="mt-2.5 block text-[15px] leading-snug font-semibold text-ink">{t.title}</span>
        <span className="mt-0.5 block truncate t-small text-ink-3">
          <span className="tnum">
            {t.startApprox ? "ca. " : ""}
            {formatTime(t.start)}
          </span>
          {t.place ? ` · ${t.place}` : ""}
        </span>
        <span className="mt-3 flex items-center border-t border-line pt-2.5 t-small font-medium text-club">
          Slik blir du med første gang
          <HoverArrow />
        </span>
      </a>
      {then && (
        <a href="#neste" className="mt-2.5 block truncate t-meta text-ink-3 hover:text-ink">
          Neste aktivitet: <span className="text-ink-2">{then.title}</span>, {formatDayMonthShort(then.date)}
        </a>
      )}
    </div>
  );
}

/** Floating card on the hero photo: the very next thing that happens. */
function NextUp({ activity: a }: { activity: ActivityView }) {
  return (
    <a
      href="#neste"
      className="group absolute bottom-4 left-4 w-[min(18rem,calc(100%-2rem))] rounded-lg bg-surface/95 p-4 shadow-float ring-1 ring-black/5 backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 max-sm:hidden"
    >
      <span className="flex items-center justify-between t-meta">
        <span className="flex items-center gap-1.5 font-semibold text-ink">
          <span aria-hidden className={cn("size-1.5 rounded-full", a.cancelled ? "bg-danger" : "bg-success")} />
          Neste aktivitet
        </span>
        <span className="text-ink-3 capitalize">{formatWeekday(a.date)}</span>
      </span>
      <span className="mt-2.5 block text-[15px] leading-snug font-semibold text-ink">{a.title}</span>
      <span className="mt-0.5 block truncate t-small text-ink-3">
        <span className="tnum">{formatTime(a.start)}</span>
        {a.place ? ` · ${a.place.name}` : ""}
      </span>
      <span className="mt-3 flex items-center border-t border-line pt-2.5 t-small font-medium text-club">
        Se hva som skjer
        <HoverArrow />
      </span>
    </a>
  );
}

/**
 * Key facts in one ruled row. Each fact fills one guide cell and every cell
 * stretches to the tallest, so values and labels share baselines.
 */
export function FactStrip({ facts, overlay = false }: { facts: HeroFact[]; overlay?: boolean }) {
  if (!facts.length) return null;
  const factsList = (
    <dl className={cn("page grid-page items-stretch", overlay && "relative z-10")}>
      {facts.slice(0, 4).map((f) => (
        <div key={f.label} className="col-span-2 flex flex-col-reverse justify-end gap-2 py-6 md:col-span-4 lg:col-span-3 lg:py-8">
          <dt className={cn("t-small", overlay ? "text-white/70" : "text-ink-3")}>{f.label}</dt>
          <dd className={cn("font-display text-[1.5rem] leading-[1.05] font-medium tracking-[-0.03em] tnum lg:text-[1.875rem]", overlay ? "text-white" : "text-ink")}>
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
  if (overlay) {
    return (
      <div className="relative z-20 border-t border-white/15 lg:absolute lg:inset-x-0 lg:bottom-0 lg:bg-black/60">
        <dl className="mx-auto grid w-full max-w-[calc(var(--page-max)+var(--page-gutter)*2)] grid-cols-2 px-[var(--page-gutter)] lg:grid-cols-4">
          {facts.slice(0, 4).map((f, index) => (
            <div
              key={f.label}
              // The slanted guides further down the page are phased to pass through the slashes of the
              // last row — the only row from lg, the lower of two below it, where the page carries on.
              data-slant-anchor={index === Math.min(facts.length, 4) - 1 ? "" : undefined}
              className={cn(
                "relative flex flex-col-reverse justify-end gap-2 px-4 py-6 md:px-6 lg:px-8 lg:py-8",
                // Two by two below lg: a rule between the rows, so the slants never have to cross one.
                index >= 2 && "max-lg:border-t max-lg:border-white/15",
                index % 2 === 0 && "max-lg:pl-0",
              )}
            >
              {/* From lg the four figures stand in one row framed by slants,
                  like the wordmark's stripes. Two by two there is no frame to
                  draw — the outer edges are the page's — so only the gap
                  between the columns is cut, the same slant in both rows. */}
              <span
                aria-hidden
                className={cn("pointer-events-none absolute inset-y-0 left-0 w-px bg-white/15", index % 2 === 0 && "max-lg:hidden")}
                style={{ transform: "skewX(-21.25deg)" }}
              />
              {index === Math.min(facts.length, 4) - 1 && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-px bg-white/15 max-lg:hidden"
                  style={{ transform: "skewX(-21.25deg)" }}
                />
              )}
              <dt className="t-small text-white/70">{f.label}</dt>
              <dd className="font-display text-[1.5rem] leading-[1.05] font-medium tracking-[-0.03em] text-white tnum lg:text-[1.875rem]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  return (
    <Section rule="both">
      {factsList}
    </Section>
  );
}
