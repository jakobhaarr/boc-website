import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { isUploadedPicture, uploadedAt } from "@/lib/photo-src";
import type { Photo as PhotoRecord } from "@/lib/types";

/* Widths the image optimiser accepts (Next's default deviceSizes), for the bundled photos. */
const STATIC_WIDTHS = [640, 828, 1200, 1920];
/* Widths asked of the image CDN for the club's stock photos. */
const CDN_WIDTHS = [160, 320, 480, 720, 960, 1280, 1680, 2200];

/** A photo built into the site (a static import): served through Next's image optimiser, which scales and recompresses it. */
const bundled = (src: string) => src.startsWith("/_next/static/");

/** The stock-photo CDN, the bundled photos and the club's Supabase uploads can be resized on request; data addresses are served as they are. */
const resizable = (src: string) => src.startsWith("https://images.unsplash.com/") || bundled(src) || isUploadedPicture(src);

const widthsOf = (src: string) => (bundled(src) || isUploadedPicture(src) ? STATIC_WIDTHS : CDN_WIDTHS);

/** The address of a photo at about `w` px wide, for the sources the site can resize; the original otherwise. */
export function srcFor(src: string, w: number) {
  if (bundled(src)) {
    // Snap to a width the optimiser knows, so a request is never refused.
    const width = STATIC_WIDTHS.find((x) => x >= w) ?? STATIC_WIDTHS[STATIC_WIDTHS.length - 1];
    return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
  }
  if (isUploadedPicture(src)) return uploadedAt(src, w);
  return src.startsWith("https://images.unsplash.com/") ? `${src}?w=${w}&q=72&auto=format&fit=max` : src;
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
  // A frame that is tall at every width takes the photo's tall framing, if it has one.
  const tall = photo.tall && frameRatio < 1 && (mdRatio ?? frameRatio) < 1 ? photo.tall : undefined;
  const focal = tall?.focal ?? photo.focal;
  const zoom = tall ? (tall.zoom ?? 1) : (photo.zoom ?? 1);
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
        style={
          {
            "--ar": ar,
            "--fx": focal.x / 100,
            "--fy": focal.y / 100,
            "--zoom": zoom,
            ...(!tall && photo.lgFocal && { "--fx-lg": photo.lgFocal.x / 100, "--fy-lg": photo.lgFocal.y / 100 }),
            ...(!tall && photo.mdFocal && { "--fx-md": photo.mdFocal.x / 100, "--fy-md": photo.mdFocal.y / 100 }),
            ...(!tall && photo.mdZoom && { "--zoom-md": photo.mdZoom }),
          } as CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={srcFor(photo.src, 1200)}
          srcSet={!resizable(photo.src) ? undefined : widthsOf(photo.src).map((w) => `${srcFor(photo.src, w)} ${w}w`).join(", ")}
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
