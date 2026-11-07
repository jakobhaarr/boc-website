"use client";

import { ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "zwift-vinterbanner-lukket";

/**
 * Winter notice on the road groups (1 November to 1 March, decided by the page
 * that renders it): Zwift is the club's winter offer. Can be dismissed; the
 * choice is kept in this browser for the season (the key carries the year of
 * the season's start, so next winter it shows again).
 */
export function ZwiftBanner({ href, season }: { href: string; season: string }) {
  const key = `${STORAGE_KEY}-${season}`;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(localStorage.getItem(key) !== "1");
    } catch {
      setOpen(true);
    }
  }, [key]);

  if (!open) return null;

  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* private window or blocked storage: the banner simply comes back on the next visit */
    }
  };

  return (
    <aside aria-label="Vintertilbud" className="border-b border-line bg-sunken">
      <div className="page flex items-start gap-3 py-3 lg:items-center">
        <p className="t-small flex-1 text-ink">
          <span className="font-semibold">Vinteren er Zwift-tid.</span> Fra november til mars trener landeveisgruppene innendørs på Zwift.{" "}
          <Link href={href} className="inline-flex items-center gap-1 font-medium text-club hover:text-club-hover">
            Se Zwift-tilbudet
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </p>
        <button type="button" onClick={close} aria-label="Lukk" className="-m-2 grid size-10 shrink-0 place-items-center rounded-full text-ink-2 hover:text-ink">
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </aside>
  );
}
