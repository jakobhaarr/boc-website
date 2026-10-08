"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { Inlines } from "./rich-text";
import { srcFor } from "./photo";

/**
 * A picture shown large over the page: a dark, blurred backdrop, the picture
 * whole (never cropped) and the next and previous ones a key press, a swipe or a
 * button away. Esc, the cross or a click beside the picture closes it, and focus
 * goes back to the picture that was opened. Redactions (anonymised faces) are
 * drawn over the picture here as they are everywhere else.
 */
export function Lightbox({ photos, index, onClose, onIndex }: { photos: PhotoRecord[]; index: number; onClose: () => void; onIndex: (i: number) => void }) {
  const dialog = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const photo = photos[index];
  const go = useCallback((to: number) => onIndex((to + photos.length) % photos.length), [onIndex, photos.length]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  // The neighbours are fetched ahead, so paging is quick.
  useEffect(() => {
    for (const j of [index + 1, index - 1]) {
      const p = photos[(j + photos.length) % photos.length];
      if (p) new Image().src = srcFor(p.src, 1920);
    }
  }, [index, photos]);

  if (!photo) return null;
  const swipe = (e: React.TouchEvent) => {
    const from = touch.current;
    touch.current = null;
    const end = e.changedTouches[0];
    if (!from || !end) return;
    const dx = end.clientX - from.x;
    if (Math.abs(dx) >= 50 && Math.abs(dx) > Math.abs(end.clientY - from.y) * 1.5) go(index + (dx < 0 ? 1 : -1));
  };

  const arrow = "absolute top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/65 max-sm:size-10";
  return (
    <div
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-label={`Bilde ${index + 1} av ${photos.length}`}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/70 backdrop-blur-xl outline-none anim-fade"
      onClick={onClose}
      onTouchStart={(e) => (touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={swipe}
    >
      <button type="button" onClick={onClose} aria-label="Lukk" className="absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur transition-colors hover:bg-black/65">
        <X aria-hidden className="size-5" />
      </button>
      {photos.length > 1 && (
        <>
          <button type="button" onClick={(e) => (e.stopPropagation(), go(index - 1))} aria-label="Forrige bilde" className={cn(arrow, "left-3 sm:left-6")}>
            <ChevronLeft aria-hidden className="size-6" />
          </button>
          <button type="button" onClick={(e) => (e.stopPropagation(), go(index + 1))} aria-label="Neste bilde" className={cn(arrow, "right-3 sm:right-6")}>
            <ChevronRight aria-hidden className="size-6" />
          </button>
        </>
      )}
      <figure className="flex max-h-full max-w-full flex-col items-center px-4 py-16 sm:px-20" onClick={(e) => e.stopPropagation()}>
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={photo.id}
            src={srcFor(photo.src, 1920)}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            className="block h-auto max-h-[calc(100svh-9rem)] w-auto max-w-full rounded-md object-contain shadow-2xl"
          />
          {photo.redactions.map((r, i) => (
            <span key={i} aria-hidden className="redaction" style={{ position: "absolute", left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }} />
          ))}
        </div>
        <figcaption className="mt-3 text-center t-small text-white/80">
          {photo.caption ? <Inlines content={photo.caption} /> : null}
          <span className={cn("tnum text-white/60", photo.caption && "ml-3")}>
            {index + 1} / {photos.length}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}

/** Wraps a picture so that pressing it opens the lightbox on that picture. The state of which one is open lives with the gallery. */
export function LightboxTrigger({ onOpen, label, className, children }: { onOpen: () => void; label: string; className?: string; children: ReactNode }) {
  return (
    <button type="button" onClick={onOpen} aria-label={label} aria-haspopup="dialog" className={cn("block w-full cursor-zoom-in text-left", className)}>
      {children}
    </button>
  );
}

/** Which picture is open, if any, for a gallery with a lightbox. */
export function useLightbox() {
  const [open, setOpen] = useState<number | null>(null);
  return { open, show: (i: number) => setOpen(i), close: () => setOpen(null), setIndex: (i: number) => setOpen(i) };
}
