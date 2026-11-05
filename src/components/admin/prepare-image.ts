import { censorCanvas, type CensorRegion } from "@/components/admin/censor-image";

/** Largest upload sizes for admins other than the club administrator (checked again on the server, see actions.ts). */
export const UPLOAD_BYTES = { standard: 400_000, large: 800_000 } as const;

/**
 * Scales a picture down to at most `max` px on its long side and re-encodes it
 * in the browser so the file fits within `budget` bytes. The upload stays small,
 * and re-drawing the picture drops the file's metadata (camera, time, GPS
 * position) before it leaves the device. Portraits use 1200 px; photos shown
 * large (a group, a venue) 1800 px.
 *
 * The picture is written as WebP, stepping the quality down until it fits, and
 * then the size down by about 15 % a round, with a floor of 640 px. A browser
 * that cannot write WebP (Safari) gets JPEG instead. A picture with transparent
 * parts (a person cut out from the background) stays WebP, or PNG where WebP
 * is not possible, since JPEG would turn the transparent parts black; PNG
 * cannot be squeezed, so it is only scaled down.
 */
export async function prepareImage(
  file: File,
  max: number,
  regions: CensorRegion[] = [],
  budget: number = UPLOAD_BYTES.large,
): Promise<{ blob: Blob; width: number; height: number; ext: "jpg" | "webp" | "png"; transparent: boolean; background: "white" | "transparent" | "other" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  let width = Math.round(bitmap.width * scale);
  let height = Math.round(bitmap.height * scale);
  const encode = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kunne ikke lese bildet."))), type, quality));
  const draw = (w: number, h: number) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
    // Marked faces are covered on the pixels here, before the file can leave the device.
    censorCanvas(canvas, regions);
    return canvas;
  };
  try {
    let canvas = draw(width, height);
    const transparent = hasTransparency(canvas);
    const background = plainBackground(canvas);
    let best: { blob: Blob; ext: "jpg" | "webp" | "png" } | null = null;
    for (let round = 0; round < 8; round++) {
      for (const quality of [0.85, 0.75, 0.65, 0.55, 0.45]) {
        let blob = await encode(canvas, "image/webp", quality);
        let ext: "jpg" | "webp" | "png" = "webp";
        if (blob.type !== "image/webp") {
          // No WebP in this browser.
          if (transparent) {
            blob = await encode(canvas, "image/png");
            ext = "png";
          } else {
            blob = await encode(canvas, "image/jpeg", quality);
            ext = "jpg";
          }
        }
        best = { blob, ext };
        if (blob.size <= budget || ext === "png") break;
      }
      if (best!.blob.size <= budget || Math.max(width, height) <= 640) break;
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
      canvas = draw(width, height);
    }
    return { blob: best!.blob, width, height, ext: best!.ext, transparent, background };
  } finally {
    bitmap.close();
  }
}

/** Whether any visible part of the picture is see-through, judged on a small copy of it. */
function hasTransparency(canvas: HTMLCanvasElement): boolean {
  const probe = document.createElement("canvas");
  probe.width = 64;
  probe.height = 64;
  const ctx = probe.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, 64, 64);
  const { data } = ctx.getImageData(0, 0, 64, 64);
  for (let i = 3; i < data.length; i += 4) if (data[i] < 250) return true;
  return false;
}

/**
 * Whether the picture stands on a plain white or see-through background, judged on a small copy of it. A portrait is cut
 * off at the shoulders, so the bottom edge is the person; the check is the top edge and the two sides of the upper
 * three quarters. At least 94 % of those pixels must be see-through (alpha under 40) or near white (every channel 240 or
 * more, opaque). «transparent» when most of them are see-through, otherwise «white»; undefined when the edges are anything else.
 */
function plainBackground(canvas: HTMLCanvasElement): "white" | "transparent" | "other" {
  const size = 64;
  const probe = document.createElement("canvas");
  probe.width = size;
  probe.height = size;
  const ctx = probe.getContext("2d")!;
  ctx.drawImage(canvas, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);
  let total = 0;
  let clear = 0;
  let white = 0;
  const look = (x: number, y: number) => {
    const i = (y * size + x) * 4;
    total++;
    if (data[i + 3] < 40) clear++;
    else if (data[i + 3] >= 250 && data[i] >= 240 && data[i + 1] >= 240 && data[i + 2] >= 240) white++;
  };
  for (let x = 0; x < size; x++) look(x, 0);
  for (let y = 0; y < Math.floor(size * 0.75); y++) {
    look(0, y);
    look(size - 1, y);
  }
  if ((clear + white) / total < 0.94) return "other";
  return clear > total / 2 ? "transparent" : "white";
}
