"use client";

import { Lightbox, LightboxTrigger, useLightbox } from "@/components/public/lightbox";
import { Photo } from "@/components/public/photo";
import type { Photo as PhotoRecord } from "@/lib/types";

/** The pictures from an event in columns, each uncropped; pressing one opens it large in the lightbox. */
export function PhotoGallery({ photos }: { photos: PhotoRecord[] }) {
  const box = useLightbox();
  return (
    <>
      <ul className="columns-2 gap-3 sm:gap-4 lg:columns-3">
        {photos.map((p, i) => (
          <li key={p.id} className="mb-3 break-inside-avoid sm:mb-4">
            <LightboxTrigger onOpen={() => box.show(i)} label={`Åpne bilde ${i + 1} av ${photos.length} i stor visning`}>
              <Photo photo={p} sizes="(min-width: 1024px) 33vw, 50vw" className="rounded-lg" />
            </LightboxTrigger>
          </li>
        ))}
      </ul>
      {box.open !== null && <Lightbox photos={photos} index={box.open} onClose={box.close} onIndex={box.setIndex} />}
    </>
  );
}
