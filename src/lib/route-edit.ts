import { checkText } from "./group-fields";
import type { Db, RouteStop } from "./types";

/**
 * A recommended tour (RecommendedRoute) as an admin edits it, and what the server accepts. Distance and
 * climbing are typed in by hand: nothing is read from Strava (the site never talks to it); the link only
 * sends people there.
 */
export interface RouteEdit {
  /** The branch the tour belongs to (Landevei, Terreng). */
  nodeId: string;
  name: string;
  /** The route on Strava. */
  stravaUrl: string;
  /** Kilometres, one decimal. */
  distanceKm: number;
  /** Metres of climbing, whole. */
  elevationM: number;
  mallorca: boolean;
  description: string;
  /** Recommended stops; `where` is coordinates («59.9123, 10.5123») or an address, as typed. */
  stops: { kind: RouteStop["kind"]; name: string; where: string }[];
}

export const STOP_KINDS: { id: RouteStop["kind"]; label: string }[] = [
  { id: "bolle", label: "Bollestopp" },
  { id: "kaffe", label: "Kaffe" },
  { id: "toalett", label: "Toalett" },
];

export const MAX_STOPS = 8;

/**
 * What someone typed for where a stop is: two numbers (latitude, longitude) with a point or a comma as the decimal
 * mark, separated by a comma, a semicolon or a space, are coordinates; anything else is an address.
 */
export function parseWhere(text: string): { lat: number; lon: number } | { address: string } | null {
  const t = text.trim();
  if (!t) return null;
  const m = /^(-?\d{1,3}(?:[.,]\d+)?)\s*[;, ]\s*(-?\d{1,3}(?:[.,]\d+)?)$/.exec(t);
  if (!m) return { address: t };
  const lat = Number(m[1].replace(",", "."));
  const lon = Number(m[2].replace(",", "."));
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/** The stops as they are stored, from what was typed; null when one is not valid (validateRouteEdit says which). */
export function stopsOf(edit: RouteEdit): RouteStop[] | null {
  const out: RouteStop[] = [];
  for (const s of edit.stops) {
    const where = parseWhere(s.where);
    if (!where) return null;
    out.push({ kind: s.kind, name: s.name.trim(), ...("address" in where ? { address: where.address } : { lat: Math.round(where.lat * 1e6) / 1e6, lon: Math.round(where.lon * 1e6) / 1e6 }) });
  }
  return out;
}

/** The Strava hosts a route link can have: the site itself, and the short links its app and share button make. */
const STRAVA_HOST = /^(?:[a-z0-9-]+\.)?strava\.com$|^strava\.app\.link$/i;

/** Whether the text is an https link to Strava. */
export function isStravaUrl(text: string): boolean {
  try {
    const url = new URL(text.trim());
    return url.protocol === "https:" && STRAVA_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

/** What is wrong with the edit, in a sentence for the person editing, or null. `branchIds` are the branches they may use. */
export function validateRouteEdit(edit: RouteEdit, db: Pick<Db, "nodes">, branchIds: string[]): string | null {
  if (!edit.name.trim()) return "Gi turen et navn.";
  if (!branchIds.includes(edit.nodeId) || !db.nodes.some((n) => n.id === edit.nodeId)) return "Velg en gren du har tilgang til.";
  if (!isStravaUrl(edit.stravaUrl)) return "Lenken må være en https-lenke til Strava (strava.com eller en delt strava.app.link).";
  if (!Number.isFinite(edit.distanceKm) || edit.distanceKm <= 0 || edit.distanceKm > 1000) return "Skriv lengden i kilometer, mellom 1 og 1000.";
  if (!Number.isFinite(edit.elevationM) || edit.elevationM < 0 || edit.elevationM > 20000) return "Skriv høydemeter som et helt tall, mellom 0 og 20 000.";
  if (edit.stops.length > MAX_STOPS) return `En tur kan ha opptil ${MAX_STOPS} stoppesteder.`;
  for (const [i, stop] of edit.stops.entries()) {
    const label = `Stopp ${i + 1}`;
    if (!STOP_KINDS.some((k) => k.id === stop.kind)) return `${label}: velg hva slags stopp det er.`;
    if (!stop.name.trim()) return `${label}: gi stedet et navn.`;
    if (!stop.where.trim()) return `${label}: skriv koordinater eller adresse.`;
    const where = parseWhere(stop.where);
    if (!where) return `${label}: koordinatene er utenfor kartet. Skriv breddegrad og lengdegrad, for eksempel 59.9123, 10.5123.`;
    const problem = checkText(`${label}, navn`, stop.name, 60) ?? checkText(`${label}, sted`, stop.where, 120);
    if (problem) return problem;
  }
  return checkText("Navn", edit.name, 80) ?? checkText("Beskrivelse", edit.description, 500);
}
