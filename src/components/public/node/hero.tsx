import type { ReactNode } from "react";
import { Portrait } from "@/components/public/people";
import { AutoplayVideo } from "@/components/public/autoplay-video";
import { GlossaryText } from "@/components/public/glossary";
import { Lagoon } from "@/components/public/lagoon";
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
  lagoon,
  primaryHref,
  primaryLabel,
  joinHref,
  joinLabel = "Bli med",
  facts,
  leadWith = "primary",
  presenter,
  video,
}: {
  breadcrumb: { label: string; href?: string }[];
  eyebrow: ReactNode;
  title: string;
  titleMuted?: string;
  /**
   * Shows this logo in place of the title text (a group's own wordmark,
   * e.g. Zwift's), while `title` stays the h1's accessible name for a
   * screen reader and a search engine. It stands in the hero's dark column, so
   * pick the white variant, which reads against that regardless of the visitor's
   * own light/dark preference.
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
   * Which of the two actions is the button. A group page leads with joining («Bli med på trening»), since that is the
   * question a newcomer has; the page's next step (its activities) becomes a quiet link beside it.
   */
  leadWith?: "primary" | "join";
  /** An animated Lagoon gradient in place of a photo, for pages that have none of their own (the ride pages). */
  lagoon?: boolean;
  /** A looping clip in the photo's place (the Mallorca page). */
  video?: { src: string; poster: string; label: string };
  /** Whoever leads the group, as a quiet line under the buttons: who to look for, and a number for the day itself. */
  presenter?: { name: string; title: string; photo?: PhotoRecord; phone?: string; href?: string };
}) {
  const hasMedia = !!(photo || video || lagoon);
  const overlayTitle = hasMedia;
  const about = description ? (
    <div className="space-y-3 t-body text-ink-2 lg:text-white/90">
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
      {/* In the dark column the name stays on one line: from lg its size is fitted to the column's width (cqw, the column is
          a size container), at most the usual display size, by the number of characters at about 0.56 em each. */}
      <h1
        className={cn("mt-3 t-display", overlayTitle && "lg:whitespace-nowrap lg:![font-size:var(--fit)]")}
        style={overlayTitle ? ({ "--fit": `min(3.25rem, ${(100 / (Math.max(title.length + (titleMuted ? titleMuted.length + 1 : 0), 6) * 0.56)).toFixed(2)}cqw)` } as React.CSSProperties) : undefined}
      >
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
  const lead = presenter ? (
    <div className="mt-8 flex items-center gap-3 border-t border-line pt-5 lg:border-white/15">
      <Portrait name={presenter.name} photo={presenter.photo} size={48} />
      <p className="min-w-0 text-[15px] leading-snug text-ink-2 lg:text-white/80">
        <span className="block">
          <span className="font-semibold text-ink lg:text-white">{presenter.name}</span>, {presenter.title}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-4">
          {presenter.phone && (
            <a href={`tel:${presenter.phone.replace(/\s/g, "")}`} className="font-medium text-ink tnum hover:text-club lg:text-white lg:hover:text-white/80">
              {presenter.phone}
            </a>
          )}
          {presenter.href && (
            <a href={presenter.href} className="font-medium text-club hover:text-club-hover lg:!text-white/80 lg:hover:!text-white">
              Alle kontakter
            </a>
          )}
        </span>
      </p>
    </div>
  ) : null;
  return (
    <>
      <Section className="pb-10 lg:pb-6">
        <div className="page pt-6">
          <Breadcrumb items={breadcrumb} />
          {/* From lg the hero is one rounded block in two columns: the text on dark to the left, the photo, the wider
              of the two, to the right, so the name, the description and the buttons are on the first screen and
              the photo stays clean. Below lg the name stands over the photo and the rest follows it. A page whose
              title is a logo (Zwift) has the logo in the dark column in the name's place. */}
          <div className="mt-6 flex flex-col gap-y-6 lg:gap-y-8">
            {!overlayTitle && <div>{heading}</div>}

            {hasMedia && (
              <div
                className={cn(
                  "relative flex flex-col",
                  overlayTitle && "lg:grid lg:grid-cols-[4.5fr_7.5fr] lg:overflow-hidden lg:rounded-xl lg:bg-[var(--hero-card,var(--header-bg,#0d1a2b))]",
                )}
              >
                {overlayTitle && (
                  <div className="max-lg:contents lg:relative lg:z-[2] lg:flex lg:flex-col lg:justify-center lg:p-10 lg:[container-type:inline-size] lg:text-white lg:[&_.t-eyebrow]:text-white/75">
                    <div className="max-lg:order-first max-lg:mb-6">{heading}</div>
                    <div className="max-lg:order-1 max-lg:mt-6 lg:mt-6">
                      {about}
                      {actions}
                      {lead}
                    </div>
                  </div>
                )}
                {video ? (
                  <div className={cn("relative overflow-hidden rounded-lg bg-inverse aspect-[4/3] md:aspect-[16/9] md:rounded-xl", overlayTitle && "lg:aspect-auto lg:min-h-[26rem] lg:rounded-none")}>
                    <AutoplayVideo src={video.src} poster={video.poster} label={video.label} className="absolute inset-0" />
                  </div>
                ) : !photo ? (
                  <Lagoon className={cn("aspect-[4/3] rounded-lg md:aspect-[16/9] md:rounded-xl", overlayTitle && "lg:aspect-auto lg:min-h-[26rem] lg:rounded-none")} />
                ) : (
                  photo && (
                    /* In the two-column hero the frame fills a wrapper that the grid stretches to the height of the text, and sits
                       in it with inset-0. A stretched grid item has no height of its own that the browser's container units can
                       read (Safari reads 0, and the photo sat too high with an empty band under it); an absolutely placed frame has. */
                    <div className={cn(overlayTitle && "lg:relative lg:min-h-[26rem]")}>
                      <Photo
                        photo={photo}
                        ratio={4 / 3}
                        mdRatio={16 / 9}
                        priority
                        sizes="(min-width: 1280px) 720px, 100vw"
                        className={cn("rounded-lg md:rounded-xl", overlayTitle ? "lg:absolute lg:inset-0 lg:aspect-auto lg:rounded-none" : "lg:aspect-[9/4]")}
                      />
                    </div>
                  )
                )}
                {/* The dark part leans into the photo at the angle of the page's guides and the wordmark's stripes (-21.25 degrees),
                    so the edge runs parallel to the slants behind the page. Skewed about its middle, so it holds at any height. */}
                {overlayTitle && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-[-12rem] z-[1] hidden w-[calc(37.5%+12rem+6.5rem)] bg-[var(--hero-card,var(--header-bg,#0d1a2b))] lg:block"
                    style={{ transform: "skewX(-21.25deg)" }}
                  />
                )}
              </div>
            )}

            {!overlayTitle && (about || actions) && (
              <div className="max-w-[52ch]">
                {about}
                {actions}
                {lead}
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
          <dd className={cn("font-display text-[1.5rem] leading-[1.05] font-medium tracking-[-0.019em] lg:text-[1.875rem]", overlay ? "text-white" : "text-ink")}>
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
              <dd className="font-display text-[1.5rem] leading-[1.05] font-medium tracking-[-0.019em] text-white lg:text-[1.875rem]">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }
  return (
    <Section rule="bottom">
      {factsList}
    </Section>
  );
}
