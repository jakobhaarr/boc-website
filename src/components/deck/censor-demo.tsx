"use client";

import { useEffect, useRef } from "react";
import { censorCanvas, type CensorRegion } from "@/components/admin/censor-image";

/**
 * The covering-up the composer does, run on a picture on the slide: the same
 * function (censorCanvas) draws the same coarse mosaic over the same boxes, so
 * the slide shows what the upload would actually contain.
 */
export function CensorDemo({ src, regions, alt, className }: { src: string; regions: CensorRegion[]; alt: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const img = new Image();
    img.onload = () => {
      el.width = img.naturalWidth;
      el.height = img.naturalHeight;
      el.getContext("2d")!.drawImage(img, 0, 0);
      censorCanvas(el, regions);
    };
    img.src = src;
  }, [src, regions]);
  return <canvas ref={canvas} role="img" aria-label={alt} className={className} />;
}
