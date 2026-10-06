import Image from "next/image";
import { Lagoon } from "./lagoon";

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
 * slowly drifting Lagoon gradient (teal to deep blue, see `Lagoon`), tilted slightly toward
 * each other and lifted off the ground with a drop shadow. Built for BOC's
 * transparent product renders; a club without cut-outs keeps the plain photo
 * in `kit.photoId` instead (see the front page).
 */
export function JerseyShowcase({ jerseys }: { jerseys: JerseyPhoto[] }) {
  return (
    <div className="relative isolate flex min-h-[16rem] items-end justify-center gap-8 overflow-hidden rounded-lg px-4 pt-8 pb-6 sm:min-h-[24rem] sm:gap-10 sm:px-6 sm:pt-10 sm:pb-8 md:min-h-[28rem] md:rounded-xl">
      <Lagoon deep className="absolute inset-0 -z-10" />
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
            className="h-44 w-auto drop-shadow-[0_20px_30px_rgb(0_0_0/0.5)] sm:h-72 md:h-80"
          />
          <figcaption className="mt-3 text-center t-meta text-white/75">{j.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}
