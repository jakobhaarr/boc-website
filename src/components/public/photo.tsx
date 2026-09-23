import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";

const WIDTHS = [160, 320, 480, 720, 960, 1280, 1680, 2200];

/** Only the image CDN resizes on request; uploaded and bundled files are served as they are. */
const resizable = (src: string) => src.startsWith("https://images.unsplash.com/");

function srcFor(src: string, w: number) {
  return resizable(src) ? `${src}?w=${w}&q=72&auto=format&fit=max` : src;
}

/**
 * Photo frame used everywhere a club photo is shown.
 *
 * Cropping: the frame fixes the aspect ratio; the image is positioned inside
 * with its focal point, like object-fit: cover + object-position. It is done
 * with container units rather than object-fit so that the image keeps its
 * own coordinate space — redaction regions (percent of the original image)
 * therefore stay exactly on the right body at any crop, on any screen.
 */
export function Photo({
  photo,
  ratio,
  mdRatio,
  sizes = "100vw",
  className,
  priority,
  imgClassName,
  grade = true,
  children,
}: {
  /** Set false to skip the photo's grade, e.g. for thumbnails inside animated menus. */
  grade?: boolean;
  /** Overlays positioned in image space (percent of the original image). */
  children?: ReactNode;
  photo: PhotoRecord;
  /** width / height of the frame. Omit to show the photo uncropped. */
  ratio?: number;
  /** Frame ratio from the md breakpoint up, when it should differ. */
  mdRatio?: number;
  sizes?: string;
  className?: string;
  priority?: boolean;
  imgClassName?: string;
}) {
  const ar = photo.width / photo.height;
  const frameRatio = ratio ?? ar;
  return (
    <div
      className={cn("photo-frame aspect-[var(--r)] md:aspect-[var(--r-md)]", grade && photo.grade === "film" && "photo-film", className)}
      style={
        {
          "--r": frameRatio,
          "--r-md": mdRatio ?? frameRatio,
          backgroundColor: photo.tone,
        } as CSSProperties
      }
    >
      <div
        className="photo-canvas"
        style={{ "--ar": ar, "--fx": photo.focal.x / 100, "--fy": photo.focal.y / 100, "--zoom": photo.zoom ?? 1 } as CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcFor(photo.src, 1280)}
          srcSet={!resizable(photo.src) ? undefined : WIDTHS.map((w) => `${srcFor(photo.src, w)} ${w}w`).join(", ")}
          sizes={sizes}
          alt={photo.alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding="async"
          className={imgClassName}
        />
        {photo.redactions.map((r, i) => (
          <span
            key={i}
            aria-hidden
            className="redaction anim-redact"
            style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
          />
        ))}
        {children}
      </div>
    </div>
  );
}

export const isRedacted = (photo?: PhotoRecord) => !!photo && photo.redactions.length > 0;
