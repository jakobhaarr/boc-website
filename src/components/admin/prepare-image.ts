import { censorCanvas, type CensorRegion } from "@/components/admin/censor-image";

/**
 * Scales a picture down to at most `max` px on its long side and re-encodes it
 * as JPEG in the browser. The upload stays small, and re-drawing the picture
 * drops the file's metadata (camera, time, GPS position) before it leaves the
 * device. Portraits use 800 px; photos shown large (a group, a venue) 1800 px.
 * A picture with transparent parts (a person cut out from the background) is
 * kept as WebP, or PNG where the browser cannot write WebP, since JPEG would
 * turn the transparent parts black.
 */
export async function prepareImage(file: File, max: number, regions: CensorRegion[] = []): Promise<{ blob: Blob; width: number; height: number; ext: "jpg" | "webp" | "png" }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  // Marked faces are covered on the pixels here, before the file can leave the device.
  censorCanvas(canvas, regions);
  const encode = (type: string, quality?: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kunne ikke lese bildet."))), type, quality));
  if (hasTransparency(canvas)) {
    const webp = await encode("image/webp", 0.9);
    if (webp.type === "image/webp") return { blob: webp, width, height, ext: "webp" };
    return { blob: await encode("image/png"), width, height, ext: "png" };
  }
  return { blob: await encode("image/jpeg", 0.85), width, height, ext: "jpg" };
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
