"use client";

import { ArrowUpRight, Coffee, Croissant, Images, MapPin, Mountain, Timer, Toilet } from "lucide-react";
import { useMemo, useState } from "react";
import { Lightbox, LightboxTrigger, useLightbox } from "@/components/public/lightbox";
import { Photo } from "@/components/public/photo";
import { ExternalButton } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { chipClass, ToggleChip } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { Photo as PhotoRecord, RouteStop } from "@/lib/types";

export interface RouteView {
  id: string;
  name: string;
  stravaUrl: string;
  distanceKm: number;
  elevationM: number;
  mallorca: boolean;
  description?: string;
  stops: RouteStop[];
  photos: PhotoRecord[];
}

/** The ranges people choose by. `max` is exclusive: «50 til 100» takes 50 and not 100. */
const DISTANCE = [
  { id: "alle", label: "Alle", min: 0, max: Infinity },
  { id: "kort", label: "Under 50 km", min: 0, max: 50 },
  { id: "midt", label: "50 til 100 km", min: 50, max: 100 },
  { id: "lang", label: "Over 100 km", min: 100, max: Infinity },
] as const;

const CLIMB = [
  { id: "alle", label: "Alle", min: 0, max: Infinity },
  { id: "flatt", label: "Under 500 m", min: 0, max: 500 },
  { id: "midt", label: "500 til 1 000 m", min: 500, max: 1000 },
  { id: "bratt", label: "Over 1 000 m", min: 1000, max: Infinity },
] as const;

const SORTS = [
  { id: "navn", label: "Navn", cmp: (a: RouteView, b: RouteView) => a.name.localeCompare(b.name, "nb") },
  { id: "kort", label: "Kortest først", cmp: (a: RouteView, b: RouteView) => a.distanceKm - b.distanceKm },
  { id: "lang", label: "Lengst først", cmp: (a: RouteView, b: RouteView) => b.distanceKm - a.distanceKm },
  { id: "flatt", label: "Minst høydemeter først", cmp: (a: RouteView, b: RouteView) => a.elevationM - b.elevationM },
  { id: "bratt", label: "Mest høydemeter først", cmp: (a: RouteView, b: RouteView) => b.elevationM - a.elevationM },
] as const;

/** The speeds the time estimate can be read at, in km/h, and the one it starts on (about the pace of the club's road groups). */
const SPEED = { min: 20, max: 45, start: 28 };

/**
 * The time a tour takes at an average speed: the length divided by the speed, rounded to whole minutes. It counts
 * neither stops nor climbing, so it is a guide to compare tours by, not a promise.
 */
export function estimatedTime(distanceKm: number, speedKmh: number): string {
  const minutes = Math.round((distanceKm / speedKmh) * 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m} min` : m === 0 ? `${h} t` : `${h} t ${m} min`;
}

const STOP_LABEL: Record<RouteStop["kind"], string> = { bolle: "Bollestopp", kaffe: "Kaffe", toalett: "Toalett" };
const STOP_ICON = { bolle: Croissant, kaffe: Coffee, toalett: Toilet } as const;

/** A stop on a map: the coordinates, or the address as typed, opened in the map app. A link only; nothing is looked up here. */
const mapUrl = (s: RouteStop) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address ?? `${s.lat},${s.lon}`)}`;

const nb = (n: number, digits = 0) => n.toLocaleString("nb-NO", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/**
 * The recommended tours as cards, filtered by length, climbing and Mallorca. Each card has the numbers people
 * choose by, the pictures (the first on the card, the rest in the lightbox) and a button to the route on Strava.
 * The filters only hide cards; they are not written to the address, and nothing is sent anywhere.
 */
export function RouteExplorer({ routes }: { routes: RouteView[] }) {
  const [distance, setDistance] = useState<(typeof DISTANCE)[number]["id"]>("alle");
  const [climb, setClimb] = useState<(typeof CLIMB)[number]["id"]>("alle");
  const [mallorca, setMallorca] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number]["id"]>("navn");
  const [speed, setSpeed] = useState(SPEED.start);

  const shown = useMemo(() => {
    const d = DISTANCE.find((x) => x.id === distance)!;
    const c = CLIMB.find((x) => x.id === climb)!;
    const by = SORTS.find((x) => x.id === sort)!.cmp;
    return routes
      .filter((r) => r.distanceKm >= d.min && r.distanceKm < d.max && r.elevationM >= c.min && r.elevationM < c.max && (!mallorca || r.mallorca))
      .sort(by);
  }, [routes, distance, climb, mallorca, sort]);

  const filtered = distance !== "alle" || climb !== "alle" || mallorca;
  const reset = () => {
    setDistance("alle");
    setClimb("alle");
    setMallorca(false);
  };

  return (
    <div>
      <div className="grid gap-5 rounded-xl bg-surface p-5 shadow-card ring-1 ring-line sm:p-6 lg:grid-cols-[1fr_1fr_auto] lg:items-start">
        <fieldset>
          <legend className="mb-2 t-label text-ink">Lengde</legend>
          <div className="flex flex-wrap gap-2">
            {DISTANCE.map((o) => (
              <button key={o.id} type="button" aria-pressed={distance === o.id} onClick={() => setDistance(o.id)} className={chipClass(distance === o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 t-label text-ink">Høydemeter</legend>
          <div className="flex flex-wrap gap-2">
            {CLIMB.map((o) => (
              <button key={o.id} type="button" aria-pressed={climb === o.id} onClick={() => setClimb(o.id)} className={chipClass(climb === o.id)}>
                {o.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 t-label text-ink">Sted</legend>
          <ToggleChip selected={mallorca} onClick={() => setMallorca((m) => !m)}>
            Bare Mallorca
          </ToggleChip>
        </fieldset>
        <div className="lg:col-span-3">
          <label htmlFor="rute-fart" className="flex flex-wrap items-baseline justify-between gap-x-4 t-label text-ink">
            <span>
              Estimert tid ved <span className="tnum">{speed}</span> km/t
            </span>
            <span className="t-small font-normal text-ink-3">Lengde delt på snittfart, uten stopp og uten hensyn til stigning.</span>
          </label>
          <input
            id="rute-fart"
            type="range"
            min={SPEED.min}
            max={SPEED.max}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            aria-valuetext={`${speed} kilometer i timen`}
            className="mt-3 h-6 w-full cursor-pointer accent-[var(--club-link)]"
          />
          <div aria-hidden className="mt-1 flex justify-between t-meta text-ink-3">
            <span>{SPEED.min} km/t</span>
            <span>{SPEED.max} km/t</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="t-small text-ink-2">
          {shown.length === routes.length ? `${routes.length} ${routes.length === 1 ? "tur" : "turer"}` : `${shown.length} av ${routes.length} turer`}
          {filtered && (
            <button type="button" onClick={reset} className="ml-3 font-medium text-club underline underline-offset-2 hover:text-club-hover">
              Nullstill filtre
            </button>
          )}
        </p>
        <label className="flex items-center gap-2 t-small text-ink-2">
          <span>Sorter</span>
          <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="!w-auto">
            {SORTS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
          <p className="t-body text-ink-2">{routes.length === 0 ? "Ingen turer er lagt inn ennå." : "Ingen turer passer filtrene."}</p>
          {routes.length > 0 && (
            <button type="button" onClick={reset} className="mt-3 t-small font-medium text-club underline underline-offset-2 hover:text-club-hover">
              Nullstill filtre
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {shown.map((r) => (
            <li key={r.id} className="flex">
              <RouteCard route={r} speed={speed} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RouteCard({ route: r, speed }: { route: RouteView; speed: number }) {
  const box = useLightbox();
  const [main] = r.photos;
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl bg-surface shadow-card ring-1 ring-line">
      <div className="relative aspect-[3/2] overflow-hidden bg-sunken">
        {main ? (
          <LightboxTrigger onOpen={() => box.show(0)} label={`Åpne bildene fra ${r.name} i stor visning`} className="absolute inset-0 block">
            <Photo photo={main} ratio={3 / 2} sizes="(min-width: 1024px) 420px, (min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full" />
          </LightboxTrigger>
        ) : (
          <div aria-hidden className="absolute inset-0 grid place-items-center text-ink-3">
            <Mountain className="size-10" strokeWidth={1.25} />
          </div>
        )}
        {r.photos.length > 1 && (
          <span className="pointer-events-none absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[12px] font-medium text-white backdrop-blur-sm">
            <Images aria-hidden className="size-3.5" />
            {r.photos.length} bilder
          </span>
        )}
        {r.mallorca && <span className="absolute top-3 left-3 rounded-md bg-surface px-2 py-1 text-[12px] font-semibold text-ink shadow-card">Mallorca</span>}
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <h2 className="font-display text-[1.375rem] leading-[1.15] font-medium tracking-[-0.015em]">{r.name}</h2>
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          <div>
            <dd className="font-display text-[1.3rem] leading-none font-medium tracking-[-0.02em] whitespace-nowrap tnum sm:text-[1.75rem]">{nb(r.distanceKm, Number.isInteger(r.distanceKm) ? 0 : 1)} km</dd>
            <dt className="mt-1.5 t-small text-ink-3">Lengde</dt>
          </div>
          <div>
            <dd className="font-display text-[1.3rem] leading-none font-medium tracking-[-0.02em] whitespace-nowrap tnum sm:text-[1.75rem]">{nb(r.elevationM)} m</dd>
            <dt className="mt-1.5 t-small text-ink-3">Høydemeter</dt>
          </div>
          <div>
            <dd className="font-display text-[1.3rem] leading-none font-medium tracking-[-0.02em] whitespace-nowrap tnum sm:text-[1.75rem]" aria-label={`Estimert tid ved ${speed} kilometer i timen`}>
              {estimatedTime(r.distanceKm, speed)}
            </dd>
            <dt className="mt-1.5 flex items-center gap-1 t-small text-ink-3">
              <Timer aria-hidden className="size-3.5" />
              Ved {speed} km/t
            </dt>
          </div>
        </dl>
        {r.description && <p className="mt-4 t-small text-ink-2">{r.description}</p>}
        {r.stops.length > 0 && (
          <div className="mt-4 border-t border-line pt-4">
            <p className="t-label text-ink">Anbefalte stopp</p>
            <ul className="mt-2 grid gap-2">
              {r.stops.map((stop, i) => {
                const Icon = STOP_ICON[stop.kind];
                return (
                  <li key={`${stop.name}-${i}`} className="flex items-start gap-2.5 t-small">
                    <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-club" />
                    <span className="min-w-0">
                      <span className="font-medium text-ink">{stop.name}</span> <span className="text-ink-3">· {STOP_LABEL[stop.kind]}</span>
                      <a href={mapUrl(stop)} target="_blank" rel="noreferrer noopener" className="mt-0.5 flex w-fit items-center gap-1 font-medium text-club hover:text-club-hover">
                        <MapPin aria-hidden className="size-3.5" />
                        {stop.address ?? "Vis på kartet"}
                      </a>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <div className={cn("mt-auto pt-6")}>
          <ExternalButton href={r.stravaUrl} variant="secondary" size="md" arrow={false} className="w-full justify-center sm:w-auto">
            Åpne ruten i Strava
            <ArrowUpRight aria-hidden className="size-4" />
          </ExternalButton>
        </div>
      </div>
      {box.open !== null && <Lightbox photos={r.photos} index={box.open} onClose={box.close} onIndex={box.setIndex} />}
    </article>
  );
}
