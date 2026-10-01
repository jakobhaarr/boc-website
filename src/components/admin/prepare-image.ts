/**
 * Scales a picture down to at most `max` px on its long side and re-encodes it
 * as JPEG in the browser. The upload stays small, and re-drawing the picture
 * drops the file's metadata (camera, time, GPS position) before it leaves the
 * device. Portraits use 800 px; photos shown large (a group, a venue) 1800 px.
 */
export async function prepareImage(file: File, max: number): Promise<{ blob: Blob; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Kunne ikke lese bildet."))), "image/jpeg", 0.85));
  return { blob, width, height };
}
