import Link from "next/link";
import { cn } from "@/lib/cn";
import type { StoryView } from "@/lib/views";
import { Photo } from "./photo";

type Variant = "standard" | "wide" | "row" | "compact";

/**
 * Story previews. Titles carry a stretched link so the whole preview is
 * clickable, while the kicker remains its own link to the group page.
 * Stories without photos degrade to a ruled text layout, not an empty box.
 */
export function StoryCard({
  story,
  variant = "standard",
  sizes,
  ratio = 3 / 2,
  headingLevel = 3,
  className,
}: {
  story: StoryView;
  variant?: Variant;
  sizes?: string;
  ratio?: number;
  headingLevel?: 2 | 3 | 4;
  className?: string;
}) {
  const H = `h${headingLevel}` as "h2" | "h3" | "h4";

  const kicker = (
    <Link href={story.kickerHref} className="relative z-10 t-meta font-semibold text-club hover:text-club-hover">
      {story.kicker}
    </Link>
  );
  const titleLink = (
    <Link href={story.href} className="decoration-club/35 decoration-2 underline-offset-[5px] after:absolute after:inset-0 group-hover:underline">
      {story.title}
    </Link>
  );

  if (variant === "row") {
    return (
      <article
        className={cn(
          "group relative -mx-3 grid grid-cols-[minmax(0,1fr)_5.5rem] gap-4 border-b border-line px-3 py-4 transition-colors duration-150 last:border-b-0 hover:bg-sunken sm:grid-cols-[minmax(0,1fr)_7rem]",
          className,
        )}
      >
        <div className="min-w-0">
          {kicker}
          <H className="mt-1 text-[16px] leading-snug font-semibold tracking-[-0.012em] text-pretty">{titleLink}</H>
          <p className="mt-1.5 t-meta text-ink-3">{story.date}</p>
        </div>
        {story.photo ? <Photo photo={story.photo} ratio={4 / 3} sizes="112px" className="self-start rounded-md" /> : <span aria-hidden />}
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn("group relative border-b border-line py-3.5", className)}>
        {kicker}
        <H className="mt-0.5 text-[15px] leading-snug font-semibold text-pretty">{titleLink}</H>
        <p className="mt-1 t-meta text-ink-3">{story.date}</p>
      </article>
    );
  }

  if (variant === "wide" && story.photo) {
    return (
      <article className={cn("group relative grid items-start gap-x-[var(--grid-gap)] gap-y-4 sm:grid-cols-2", className)}>
        <Photo photo={story.photo} ratio={3 / 2} sizes={sizes ?? "(min-width: 640px) 50vw, 100vw"} className="hover-zoom rounded-lg" />
        <div>
          {kicker}
          <H className="mt-1.5 font-display text-[1.5rem] leading-[1.12] font-medium tracking-[-0.022em] text-balance">{titleLink}</H>
          {story.lead && <p className="mt-2.5 t-small text-ink-2">{story.lead}</p>}
          <p className="mt-3 t-meta text-ink-3">
            {story.date} · {story.author}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group relative", className)}>
      {story.photo && <Photo photo={story.photo} ratio={ratio} sizes={sizes} className="hover-zoom rounded-lg" />}
      <div className={cn(story.photo ? "mt-4" : "border-t border-line pt-4")}>
        {kicker}
        <H className="mt-1.5 font-display text-[1.375rem] leading-[1.14] font-medium tracking-[-0.02em] text-balance">{titleLink}</H>
        {story.lead && <p className="mt-2 line-clamp-3 t-small text-ink-2">{story.lead}</p>}
        <p className="mt-2.5 t-meta text-ink-3">{story.date}</p>
      </div>
    </article>
  );
}
