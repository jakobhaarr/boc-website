/**
 * Covering up people in a picture. Done on the uploader's device, on the
 * pixels themselves, before the file is sent: what leaves the device already
 * has the people gone, so there is no original on the server to uncover them
 * from (unlike a box drawn over the picture on the page). Each marked area is
 * replaced by a mosaic of at most four blocks along its long side, which is
 * too coarse to recognise anyone from.
 */

import { MAX_UPLOAD_BYTES } from "@/lib/upload-limits";

/** A marked area, as fractions of the picture's width and height (0 to 1), so it holds at any size. */
export interface CensorRegion {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Blocks along the long side of a marked area. */
const BLOCKS = 4;

export function censorCanvas(canvas: HTMLCanvasElement, regions: CensorRegion[]) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  for (const r of regions) {
    const x = Math.max(0, Math.floor(r.x * canvas.width));
    const y = Math.max(0, Math.floor(r.y * canvas.height));
    const w = Math.min(canvas.width - x, Math.ceil(r.w * canvas.width));
    const h = Math.min(canvas.height - y, Math.ceil(r.h * canvas.height));
    if (w < 1 || h < 1) continue;
    const cell = Math.max(w, h) / BLOCKS;
    const small = document.createElement("canvas");
    small.width = Math.max(1, Math.round(w / cell));
    small.height = Math.max(1, Math.round(h / cell));
    const sctx = small.getContext("2d")!;
    sctx.drawImage(canvas, x, y, w, h, 0, 0, small.width, small.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(small, 0, 0, small.width, small.height, x, y, w, h);
    ctx.imageSmoothingEnabled = true;
  }
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // a demo photo from another site must stay readable on the canvas
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Kunne ikke lese bildet."));
    img.src = src;
  });

/** The size of a data address's file, in bytes (base64 is four characters to three bytes). */
const dataUrlBytes = (url: string) => Math.floor(((url.length - url.indexOf(",") - 1) * 3) / 4);

/**
 * The picture at `src` with `regions` covered up, as a JPEG data address of at most `budget` bytes (the cover-up is drawn
 * on the pixels, then the picture is saved again, so it is squeezed again to fit: quality down, then size down by 15 % a
 * round, with a floor of 480 px).
 */
export async function censorDataUrl(src: string, regions: CensorRegion[], budget: number = MAX_UPLOAD_BYTES): Promise<string> {
  const img = await loadImage(src);
  let width = img.naturalWidth;
  let height = img.naturalHeight;
  for (let round = 0; round < 12; round++) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
    censorCanvas(canvas, regions);
    for (const quality of [0.82, 0.72, 0.62, 0.52, 0.42]) {
      const url = canvas.toDataURL("image/jpeg", quality);
      if (dataUrlBytes(url) <= budget) return url;
    }
    if (Math.max(width, height) <= 480) break;
    width = Math.round(width * 0.85);
    height = Math.round(height * 0.85);
  }
  throw new Error(`Bildet ble ikke lite nok (høyst ${Math.round(budget / 1000)} kB).`);
}
