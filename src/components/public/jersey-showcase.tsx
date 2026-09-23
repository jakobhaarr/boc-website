import Image from "next/image";

export interface JerseyPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Short name under the garment, e.g. "Race" or "Fritid". */
  label: string;
}

/**
 * The club kit as garments, not a photograph of them: two cut-outs on a
 * diagonal wash of the club's own colours (`--club-secondary` to the header's
 * dark, with a soft glow of `--club-primary` behind), tilted slightly toward
 * each other and lifted off the ground with a drop shadow. Built for BOC's
 * transparent product renders; a club without cut-outs keeps the plain photo
 * in `kit.photoId` instead (see the front page).
 */
export function JerseyShowcase({ jerseys }: { jerseys: JerseyPhoto[] }) {
  return (
    <div className="relative isolate flex min-h-[20rem] items-end justify-center gap-6 overflow-hidden rounded-lg bg-[linear-gradient(135deg,var(--club-secondary)_0%,var(--header-bg,#0b1315)_100%)] px-6 pt-10 pb-8 sm:min-h-[24rem] sm:gap-10 md:min-h-[28rem] md:rounded-xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-80 mix-blend-soft-light [background:radial-gradient(52%_50%_at_50%_34%,var(--club-primary)_0%,transparent_72%)]"
      />
      {/* The site's own diagonal hairlines (see SlantGuides), faint, so the
          band reads as part of the design system rather than a sticker. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08] [background-image:repeating-linear-gradient(-21.25deg,#fff_0_1px,transparent_1px_56px)]"
      />
      {jerseys.map((j, i) => (
        <figure key={j.alt} className={i % 2 === 0 ? "-rotate-[4deg]" : "rotate-[4deg]"}>
          <Image
            src={j.src}
            width={j.width}
            height={j.height}
            alt={j.alt}
            className="h-56 w-auto drop-shadow-[0_20px_30px_rgb(0_0_0/0.5)] sm:h-72 md:h-80"
          />
          <figcaption className="mt-3 text-center t-meta text-white/75">{j.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
