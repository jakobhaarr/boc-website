import type { ReactNode } from "react";
import { GlossaryText } from "@/components/public/glossary";
import { Photo } from "@/components/public/photo";
import { ButtonLink, ExternalButton } from "@/components/ui/button";
import { Section } from "@/components/ui/guides";
import { Breadcrumb } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";

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
  facts,
  leadWith = "primary",
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
  facts: HeroFact[];
  /**
   * Which of the two actions is the button. A group page leads with joining («Før første trening»), since that is the
   * question a newcomer has; the page's next step (its activities) becomes a quiet link beside it.
   */
  leadWith?: "primary" | "join";
}) {
  const overlayTitle = !!photo && !titleLogo;
  const about = description ? (
    <div className="space-y-3 t-body text-ink-2 lg:t-body-lg lg:text-white/95">
      {description.split(/\n\s*\n/).map((part) => (
        <p key={part}>
          <GlossaryText text={part.trim()} />
        </p>
      ))}
    </div>
  ) : null;
  const primaryAction = leadWith === "join" ? { href: joinHref, label: joinLabel } : { href: primaryHref, label: primaryLabel };
  const otherAction = leadWith === "join" ? { href: primaryHref, label: primaryLabel } : { href: joinHref, label: joinLabel };
  const heading = (
    <>
      <p className="t-eyebrow">{eyebrow}</p>
      <h1 className="mt-3 t-display">
        {titleLogo ? (
          <>
            <span className="sr-only">{title}</span>
            {/* Decorative: the h1's accessible name comes from the sr-only text above. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={titleLogo.src} width={titleLogo.width} height={titleLogo.height} alt="" className="h-[0.78em] w-auto" />
          </>
        ) : (
          <>
            {title}
            {titleMuted && <span className="opacity-60"> {titleMuted}</span>}
          </>
        )}
      </h1>
    </>
  );
  /* The one main action is the club's yellow, as on the front page. */
  const yellow = overlayTitle ? "!bg-club-surface !text-on-club hover:!bg-[var(--club-primary-hover)]" : "";
  const linkOnPhoto = overlayTitle ? "lg:!text-white lg:hover:!text-white/80" : "";
  const actions = (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6", overlayTitle ? "mt-6 lg:mt-4" : "mt-6")}>
      {/* A join link out of the site (a Spond group) opens in a new tab. */}
      {/^https?:/.test(primaryAction.href) ? (
        <ExternalButton href={primaryAction.href} size="lg" arrow className={yellow}>
          {primaryAction.label}
        </ExternalButton>
      ) : (
        <ButtonLink href={primaryAction.href} size="lg" arrow className={yellow}>
          {primaryAction.label}
        </ButtonLink>
      )}
      {/^https?:/.test(otherAction.href) ? (
        <ExternalButton href={otherAction.href} variant="link" size="md" arrow className={linkOnPhoto}>
          {otherAction.label}
        </ExternalButton>
      ) : (
        <ButtonLink href={otherAction.href} variant="link" size="md" arrow className={linkOnPhoto}>
          {otherAction.label}
        </ButtonLink>
      )}
    </div>
  );
  return (
    <>
      <Section className="pb-12 lg:pb-16">
        <div className="page pt-6 lg:pt-10">
          <Breadcrumb items={breadcrumb} />
          {/* The photo runs the width of the page, so the text below can sit in two columns of its own:
              what the group is on the left, who to ask and what to do next on the right. From lg the
              title stays above the photo so the group is named on the first screen; the times, the contact
              and the buttons lie on the photo's lower edge (from lg). */}
          <div className="mt-6 flex flex-col gap-y-6 lg:mt-10 lg:gap-y-8">
            {!overlayTitle && <div>{heading}</div>}

            {photo && (
              <div className="relative flex flex-col">
                {/* The name sits on the photo's upper edge from lg, so the breadcrumb and the title do not
                    use up the first screen; below lg it stands over the photo. */}
                {overlayTitle && (
                  <div className="max-lg:order-first max-lg:mb-6 lg:absolute lg:inset-x-0 lg:top-0 lg:z-10 lg:p-8 lg:text-white lg:[&_.t-eyebrow]:text-white/85">{heading}</div>
                )}
                <Photo
                  photo={photo}
                  ratio={4 / 3}
                  mdRatio={16 / 9}
                  priority
                  sizes="(min-width: 1280px) 1240px, 100vw"
                  className="rounded-lg md:rounded-xl lg:aspect-[9/4]"
                />
                {overlayTitle && (
                  <>
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 hidden rounded-xl lg:block"
                      style={{ background: "linear-gradient(to right, rgb(0 0 0 / 0.88), rgb(0 0 0 / 0.72) 30%, rgb(0 0 0 / 0.38) 54%, transparent 76%), linear-gradient(to bottom, rgb(0 0 0 / 0.5), transparent 34%, transparent 72%, rgb(0 0 0 / 0.4))" }}
                    />
                    {/* From lg what the group is, and what to do next, lie on the photo's left, a little below the middle; below lg they follow it. */}
                    <div className="max-lg:mt-6 lg:absolute lg:bottom-[16%] lg:left-0 lg:max-w-[32rem] lg:p-8 lg:text-white">
                      {about}
                      {actions}
                    </div>
                  </>
                )}
              </div>
            )}

            {!overlayTitle && (about || actions) && (
              <div className="max-w-[52ch]">
                {about}
                {actions}
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
 * Key facts in one ruled row. Each fact fills one guide cell and every cell
 * stretches to the tallest, so values and labels share baselines.
 */
export function FactStrip({ facts, overlay = false }: { facts: HeroFact[]; overlay?: boolean }) {
  if (!facts.length) return null;
  /* With fewer than four facts the cells share the row, so it is never half empty. */
  const count = Math.min(facts.length, 4);
  const wide = count === 1 ? "lg:col-span-12" : count === 2 ? "lg:col-span-6" : count === 3 ? "lg:col-span-4" : "lg:col-span-3";
  const factsList = (
    <dl className={cn("page grid-page items-stretch", overlay && "relative z-10")}>
      {facts.slice(0, 4).map((f) => (
        <div key={f.label} className={cn("col-span-2 flex flex-col-reverse justify-end gap-2 py-6 md:col-span-4 lg:py-8", wide)}>
          <dt className={cn("t-small", overlay ? "text-white/70" : "text-ink-3")}>{f.label}</dt>
          <dd className={cn("font-display text-[1.5rem] leading-[1.05] font-medium tracking-[-0.03em] lg:text-[1.875rem]", overlay ? "text-white" : "text-ink")}>
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
              <dd className="font-display text-[1.5rem] leading-[1.05] font-medium tracking-[-0.03em] text-white lg:text-[1.875rem]">{f.value}</dd>
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
