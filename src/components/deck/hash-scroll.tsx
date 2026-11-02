"use client";

import { useEffect } from "react";

/**
 * Takes the phone page (the training-plan deck's page to scroll) to what the
 * address asks for. The address is the deck's: the number of a slide («#9») or
 * the slide's id («#norseman-workout-geilo»), so a link copied from the deck
 * on a computer opens on the same workout on a phone. A section or card says
 * which it is with `data-slide` (its slide's number) and `data-slug` (its id).
 * It runs on load, keeps the card in place while the page settles, and runs
 * again when the address changes.
 */
export function HashScroll() {
  useEffect(() => {
    const find = () => {
      const raw = decodeURIComponent(window.location.hash.slice(1));
      if (!raw) return null;
      const el = [...document.querySelectorAll<HTMLElement>("[data-slide], [data-slug]")].find((e) => e.dataset.slide === raw || e.dataset.slug === raw);
      // The deck has none of these (they are on the page only a phone shows), and a hidden one has no place to go to.
      return el && el.offsetParent !== null ? el : null;
    };
    const go = () => find()?.scrollIntoView();

    // The page grows as it comes alive (a note under each workout's FTP box once the stored FTP is read, the pictures),
    // which would push the card down from under the reader. Keep it in place while that happens, for two seconds,
    // and let go the moment the reader touches the page.
    let settling = true;
    const stop = () => (settling = false);
    const resize = new ResizeObserver(() => settling && go());
    resize.observe(document.body);
    const timer = window.setTimeout(stop, 2000);
    for (const e of ["wheel", "touchstart", "keydown", "mousedown"]) window.addEventListener(e, stop, { once: true, passive: true });

    go();
    const onHash = () => {
      settling = true;
      go();
      window.setTimeout(stop, 800);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      resize.disconnect();
      window.clearTimeout(timer);
      window.removeEventListener("hashchange", onHash);
      for (const e of ["wheel", "touchstart", "keydown", "mousedown"]) window.removeEventListener(e, stop);
    };
  }, []);
  return null;
}
