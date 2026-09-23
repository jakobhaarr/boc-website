"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Phases the slanted guide lines (.guides::before in globals.css) so that
 * each one passes through a slash in the hero's fact strip, however far down
 * the page its section sits. CSS draws the lines and knows their spacing; it
 * cannot know where a section is relative to the strip, so this writes that
 * distance to every guide layer as --slant-y.
 *
 * The anchor is the middle of the strip's last cell ([data-slant-anchor]),
 * where the slashes of its row cross their own centre. A page without a strip anchors
 * at the top of the document, which keeps the lines continuous from one
 * section into the next. Heights change as filters open and close, so the
 * layers are placed again whenever the page resizes.
 */
export function SlantGuides() {
  const pathname = usePathname();

  useEffect(() => {
    let frame = 0;
    const place = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const anchor = document.querySelector("[data-slant-anchor]")?.getBoundingClientRect();
        const anchorY = anchor ? anchor.top + anchor.height / 2 + window.scrollY : 0;
        for (const layer of document.querySelectorAll<HTMLElement>(".guides")) {
          const top = layer.getBoundingClientRect().top + window.scrollY;
          layer.style.setProperty("--slant-y", `${anchorY - top}px`);
        }
      });
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
