"use client";

import { Check, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getPhotoLibrary } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import type { LibraryPhoto } from "@/lib/photo-library";

/**
 * A thumbnail address: the bundled photos go through the image optimiser, uploads are used as they are. It asks for the
 * width and quality the rest of the site already uses (640, 75), which are allowed by the production build and are most
 * likely cached already; a thumbnail at its own width (384, quality 70) was refused or came back broken in production.
 */
const thumb = (src: string) => (src.startsWith("/_next/static/") ? `/_next/image?url=${encodeURIComponent(src)}&w=640&q=75` : src);

/**
 * The club's picture library: every picture in the project, to use again
 * instead of uploading it twice. Searched by what the picture shows (its text)
 * and filtered by group. `multiple` lets several be ticked at once (a post);
 * otherwise a click picks one. `personId` puts the pictures of that person first.
 *
 * A picture is used by reference, so what happens to it later (a redaction when
 * someone is anonymised, a withdrawal) reaches every place it is used.
 */
export function PhotoLibraryPicker({
  open,
  onClose,
  onPick,
  title = "Velg fra bildebiblioteket",
  multiple = false,
  personId,
  exclude = [],
}: {
  open: boolean;
  onClose: () => void;
  onPick: (photos: LibraryPhoto[]) => void;
  title?: string;
  multiple?: boolean;
  personId?: string;
  /** Pictures already chosen, so they are not offered twice. */
  exclude?: string[];
}) {
  const [photos, setPhotos] = useState<LibraryPhoto[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("");
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setChosen([]);
    setError(null);
    getPhotoLibrary(personId).then(setPhotos, () => setError("Kunne ikke hente bildene."));
  }, [open, personId]);

  const groups = useMemo(() => {
    const seen = new Map<string, string>();
    for (const p of photos ?? []) if (p.groupName) seen.set(p.groupId, p.groupName);
    return [...seen].sort((a, b) => a[1].localeCompare(b[1], "nb"));
  }, [photos]);

  const shown = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("nb");
    return (photos ?? []).filter(
      (p) => !exclude.includes(p.id) && (!group || p.groupId === group) && (!q || `${p.alt} ${p.groupName} ${p.credit ?? ""}`.toLocaleLowerCase("nb").includes(q)),
    );
  }, [photos, query, group, exclude]);

  const toggle = (p: LibraryPhoto) => {
    if (!multiple) return onPick([p]);
    setChosen((c) => (c.includes(p.id) ? c.filter((x) => x !== p.id) : [...c, p.id]));
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="Alle bildene på nettsiden. Å bruke et bilde på nytt tar ikke en kopi: endres bildet, for eksempel når noen anonymiseres, endres det overalt."
      size="lg"
      footer={
        multiple ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Avbryt
            </Button>
            <Button
              disabled={chosen.length === 0}
              onClick={() => onPick((photos ?? []).filter((p) => chosen.includes(p.id)))}
            >
              {chosen.length === 0 ? "Velg bilder" : chosen.length === 1 ? "Bruk 1 bilde" : `Bruk ${chosen.length} bilder`}
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={onClose}>
            Avbryt
          </Button>
        )
      }
    >
      <div className="grid gap-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[12rem] flex-1">
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
            <label htmlFor="bibliotek-sok" className="sr-only">
              Søk i bildene
            </label>
            <input
              id="bibliotek-sok"
              type="search"
              data-autofocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Søk, for eksempel «Zwift» eller «Mallorca»"
              className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-base focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none sm:text-sm"
            />
          </div>
          <label className="sr-only" htmlFor="bibliotek-gruppe">
            Gruppe
          </label>
          <select
            id="bibliotek-gruppe"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="h-10 rounded-md border border-line-strong bg-surface px-3 text-base focus:border-focus focus:outline-none sm:text-sm"
          >
            <option value="">Alle grupper</option>
            {groups.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="t-small text-danger">
            {error}
          </p>
        )}
        {!photos && !error && <p className="t-small text-ink-3">Henter bildene …</p>}
        {photos && shown.length === 0 && <p className="t-small text-ink-3">Ingen bilder passer.</p>}

        <ul className="grid max-h-[26rem] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
          {shown.map((p) => {
            const on = chosen.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p)}
                  aria-pressed={multiple ? on : undefined}
                  title={p.alt}
                  className={cn(
                    "group relative block w-full overflow-hidden rounded-md bg-sunken text-left ring-1 transition-shadow",
                    on ? "ring-2 ring-[var(--action)]" : "ring-line hover:ring-ink-3",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(p.src)} alt={p.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                  {on && (
                    <span className="absolute top-1.5 right-1.5 flex size-6 items-center justify-center rounded-full bg-[var(--action)] text-white">
                      <Check aria-hidden className="size-4" />
                    </span>
                  )}
                  <span className="block truncate px-2 py-1.5 t-meta text-ink-2">
                    {p.groupName || "Klubben"}
                    {p.ofPerson ? " · med personen" : ""}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </Dialog>
  );
}
