import Link from "next/link";
import { AutoplayVideo } from "@/components/public/autoplay-video";
import { FactStrip, type HeroFact } from "@/components/public/node/hero";
import { ButtonLink, ExternalButton, HoverArrow } from "@/components/ui/button";
import { cn } from "@/lib/cn";

/**
 * A film edge to edge under the header, like the photograph on the front page:
 * the name and the actions on a dark wash to the left, the facts along the foot.
 * Below lg the film stands over the text, which then sits on the header's
 * colour. `zoomLeft` enlarges the film about its lower left corner from lg, to
 * move what is in the middle of the frame to the right of the text.
 */
export function VideoHero({
  label,
  video,
  eyebrow,
  title,
  lead,
  primary,
  secondary,
  facts,
  zoomLeft,
}: {
  label: string;
  video: { src: string; poster: string; label: string };
  eyebrow: string;
  title: string;
  lead: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
  facts: HeroFact[];
  zoomLeft?: boolean;
}) {
  const yellow = "!bg-club-surface !text-on-club hover:!bg-[var(--club-primary-hover)]";
  return (
    <section aria-label={label} className="relative bg-[var(--header-bg,#0d1a2b)] text-white">
      <div className="relative mx-auto max-w-[1728px]">
        <div className="relative isolate overflow-hidden lg:h-[calc(100svh-var(--header-h))] lg:max-h-[50rem] lg:min-h-[36rem]">
          <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[16/9] lg:absolute lg:inset-0 lg:-z-20 lg:aspect-auto">
            <AutoplayVideo src={video.src} poster={video.poster} label={video.label} className={zoomLeft ? "absolute inset-0 lg:origin-bottom-left lg:scale-[1.25]" : "absolute inset-0"} />
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 hidden lg:block"
            style={{ background: "linear-gradient(to right, rgb(0 0 0 / 0.82), rgb(0 0 0 / 0.6) 30%, rgb(0 0 0 / 0.2) 52%, transparent 68%), linear-gradient(to top, rgb(0 0 0 / 0.5), transparent 30%)" }}
          />
          <div className="page grid-page lg:h-full">
            <div className="col-span-full flex flex-col justify-center pt-8 pb-10 lg:col-span-6 lg:pt-10 lg:pb-28">
              <p className="t-eyebrow !text-white/75">{eyebrow}</p>
              <h1 className="mt-3 t-display text-white lg:!text-[3.25rem]">{title}</h1>
              <p className="mt-5 max-w-[42ch] t-body-lg text-white/85">{lead}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-7">
                {/^https?:/.test(primary.href) ? (
                  <ExternalButton href={primary.href} size="lg" arrow className={cn(yellow, "max-sm:h-[3.25rem] max-sm:w-full max-sm:text-[16px]")}>
                    {primary.label}
                  </ExternalButton>
                ) : (
                  <ButtonLink href={primary.href} size="lg" arrow className={cn(yellow, "max-sm:h-[3.25rem] max-sm:w-full max-sm:text-[16px]")}>
                    {primary.label}
                  </ButtonLink>
                )}
                {secondary && (
                  <Link href={secondary.href} className="inline-flex items-center t-small font-medium text-white hover:text-white/80 max-sm:h-[3.25rem] max-sm:w-full max-sm:justify-center max-sm:rounded-[var(--radius-button)] max-sm:text-[16px] max-sm:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.45)]">
                    {secondary.label}
                    <HoverArrow />
                  </Link>
                )}
              </div>
            </div>
          </div>
          <FactStrip overlay facts={facts} />
        </div>
      </div>
    </section>
  );
}
