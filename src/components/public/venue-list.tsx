"use client";

import { ArrowUpRight, MapPin } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord } from "@/lib/types";
import { appleMapUrl, mapUrl } from "@/lib/views";
import { Photo } from "./photo";

export interface VenueItem {
  id: string;
  name: string;
  area: string;
  surface: string;
  note?: string;
  mapQuery: string;
  /** A place on the internet (the Zwift app): nothing to open in a map. */
  online?: boolean;
  photo?: PhotoRecord;
}

/**
 * «Hvor vi trener»: the arenas, each one something to press. A press asks which
 * map to open the address in (Apple Maps or Google Maps), since the right one is
 * the one on the person's phone. An arena on the internet is shown but not
 * pressable. The first rows are the arenas that have a photograph.
 */
export function VenueList({ venues }: { venues: VenueItem[] }) {
  const [open, setOpen] = useState<VenueItem | null>(null);
  const withPhoto = venues.filter((v) => v.photo);

  const press = (v: VenueItem) => (v.online ? undefined : () => setOpen(v));

  return (
    <>
      {withPhoto.length > 0 && (
        <ul className="mt-10 grid gap-[var(--grid-gap)] sm:grid-cols-2 lg:grid-cols-4">
          {withPhoto.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={press(v)}
                disabled={v.online}
                aria-haspopup={v.online ? undefined : "dialog"}
                className={cn("group block w-full text-left", v.online && "cursor-default")}
              >
                <Photo photo={v.photo!} ratio={4 / 3} sizes="(min-width: 1024px) 304px, (min-width: 640px) 50vw, 100vw" className="rounded-lg" />
                <span className="mt-3 flex items-center gap-1.5 t-label font-semibold text-ink group-enabled:group-hover:text-club">
                  {v.name}
                  {!v.online && <MapPin aria-hidden className="size-3.5 text-ink-3" />}
                </span>
                <span className="block t-small text-ink-3">{v.area}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <ul className="mt-10">
        {venues.map((v) => {
          const inner = (
            <>
              <span className="col-span-4 md:col-span-4 lg:col-span-3">
                <span className="block t-label font-semibold text-ink">{v.name}</span>
                <span className="block t-small text-ink-3">{v.area}</span>
              </span>
              <span className="col-span-4 t-small text-ink-2 md:col-span-4 lg:col-span-3">{v.surface}</span>
              <span className="col-span-4 t-small text-ink-2 md:col-span-4 lg:col-span-3">{v.note}</span>
              {!v.online && (
                <span className="col-span-4 inline-flex items-center gap-1 t-small font-medium text-club md:col-span-4 lg:col-span-3 lg:justify-end">
                  Åpne i kart <ArrowUpRight aria-hidden className="size-3.5" />
                </span>
              )}
            </>
          );
          return (
            <li key={v.id} className="border-t border-guide">
              {v.online ? (
                <div className="grid-page gap-y-1 py-5">{inner}</div>
              ) : (
                <button type="button" onClick={press(v)} aria-haspopup="dialog" className="grid-page w-full gap-y-1 py-5 text-left transition-colors hover:bg-sunken">
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <Dialog open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} description={open ? `${open.area}. Velg hvilket kart du vil åpne stedet i.` : undefined} size="sm">
        {open && (
          <div className="grid gap-3">
            <a href={appleMapUrl(open.mapQuery)} target="_blank" rel="noreferrer noopener" onClick={() => setOpen(null)} className={cn(buttonClass({ size: "lg", block: true }), "justify-between")} data-autofocus>
              Åpne i Apple Maps
              <ArrowUpRight aria-hidden />
            </a>
            <a href={mapUrl(open.mapQuery)} target="_blank" rel="noreferrer noopener" onClick={() => setOpen(null)} className={cn(buttonClass({ size: "lg", block: true, variant: "secondary" }), "justify-between")}>
              Åpne i Google Maps
              <ArrowUpRight aria-hidden />
            </a>
          </div>
        )}
      </Dialog>
    </>
  );
}
