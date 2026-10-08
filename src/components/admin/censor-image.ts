/**
 * Covering up people in a picture. Done on the uploader's device, on the
 * pixels themselves, before the file is sent: what leaves the device already
 * has the people gone, so there is no original on the server to uncover them
 * from (unlike a box drawn over the picture on the page). Each marked area is
 * replaced by a mosaic of at most four blocks along its long side, which is
 * too coarse to recognise anyone from.
 */

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

/** The picture at `src` with `regions` covered up, as a JPEG data address. */
export async function censorDataUrl(src: string, regions: CensorRegion[]): Promise<string> {
  const img = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")!.drawImage(img, 0, 0);
  censorCanvas(canvas, regions);
  return canvas.toDataURL("image/jpeg", 0.82);
}
