/**
 * Pictures uploaded to Supabase Storage (lib/data/supabase.ts) are fetched
 * from Supabase once per size by Next's image optimiser (next.config.ts allows
 * that one host) and then served from the site's own cache, scaled to the
 * width asked for. Without this every page view would download the whole file
 * from Supabase, which counts as egress on its free plan (5 GB a month).
 *
 * UPLOAD_HOST is set in next.config.ts from SUPABASE_URL. Without it (local
 * development, or a build without Supabase) an address is used as it is.
 */

/** Widths the optimiser accepts (Next's default imageSizes and deviceSizes). */
export const OPTIMISER_WIDTHS = [32, 48, 64, 96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, 3840];

/** Whether `src` is a picture in this site's Supabase bucket, which the optimiser may fetch. */
export function isUploadedPicture(src: string): boolean {
  const host = process.env.UPLOAD_HOST;
  if (!host || !src.startsWith("https://")) return false;
  try {
    const url = new URL(src);
    return url.host === host && url.pathname.startsWith("/storage/v1/object/public/");
  } catch {
    return false;
  }
}

/** The address for an uploaded picture at `width` px (snapped to a width the optimiser knows); other addresses are returned unchanged. */
export function uploadedAt(src: string, width: number): string {
  if (!isUploadedPicture(src)) return src;
  const w = OPTIMISER_WIDTHS.find((x) => x >= width) ?? OPTIMISER_WIDTHS[OPTIMISER_WIDTHS.length - 1];
  return `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75`;
}
