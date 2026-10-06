"use client";

import { Check, Lock, Search, ShieldAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import type { PrivacyStatus } from "@/lib/types";

export interface TaggablePerson {
  id: string;
  name: string;
  status: PrivacyStatus;
  role?: string;
  /** Photo consent on file. A member without it can be ticked, but must then be taken out or covered up. */
  consent?: "granted" | "declined" | "unknown";
}

/**
 * Who is in the picture, asked every time: tick the group's members (or all of
 * them with one press), or say explicitly that nobody who can be recognised is
 * in it. Leaving it blank is not an answer, and the upload cannot be sent
 * until one is given. A club administrator checks the answer afterwards; it
 * never stops an upload. Anonymised members cannot be ticked. A member marked
 * «Ikke publiser» can be, but is then treated as without consent: covered up
 * in the picture (a mosaic) or taken out, never shown. «Velg alle» leaves out
 * everyone who could not be shown as they are.
 */
export function PeopleTagger({
  idPrefix,
  people,
  tagged,
  noPeople,
  onChange,
  allowRestricted = true,
}: {
  idPrefix: string;
  people: TaggablePerson[];
  tagged: string[];
  noPeople: boolean;
  onChange: (tagged: string[], noPeople: boolean) => void;
  /**
   * Whether «Ikke publiser» members can be ticked (to be covered up in the
   * picture). Where there is no covering step, such as correcting a picture
   * already on the site, they stay locked.
   */
  allowRestricted?: boolean;
}) {
  const [query, setQuery] = useState("");
  const selectable = useMemo(() => people.filter((p) => p.status === "visible" && (p.consent === undefined || p.consent === "granted")), [people]);
  const shown = people.filter((p) => !query || p.name.toLocaleLowerCase("nb").includes(query.toLocaleLowerCase("nb")));
  const allOn = selectable.length > 0 && selectable.every((p) => tagged.includes(p.id));
  const unanswered = tagged.length === 0 && !noPeople;

  const toggle = (id: string) => onChange(tagged.includes(id) ? tagged.filter((x) => x !== id) : [...tagged, id], false);

  return (
    <fieldset className="grid gap-3">
      <legend className="t-label font-semibold">Hvem er med på bildet?</legend>
      <p className="t-small text-ink-3">Velg medlemmene som kan kjennes igjen, eller si at ingen kan det. Merking gjør at klubben senere kan fjerne en person fra bildene. Medlemmer uten samtykke har et skjold. De må tas ut av bildet eller sladdes. En klubbadministrator ser over svaret, men det stopper ikke opplastingen.</p>

      <label className={cn("flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition-colors", noPeople ? "border-ink bg-sunken" : "border-line-strong hover:border-ink-3")}>
        <input type="checkbox" className="mt-0.5 size-[18px] shrink-0 cursor-pointer accent-[var(--action)]" checked={noPeople} onChange={(e) => onChange([], e.target.checked)} />
        <span className="t-small text-ink">Ingen identifiserbare personer på bildet</span>
      </label>

      {people.length === 0 ? (
        <p className="t-small text-ink-3">Ingen medlemmer er registrert i denne gruppa. Er det personer på bildet, legg dem til under Medlemmer først.</p>
      ) : (
        <div className={cn("grid gap-3", noPeople && "pointer-events-none opacity-45")} aria-disabled={noPeople}>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(allOn ? [] : selectable.map((p) => p.id), false)}
              className="inline-flex h-9 items-center rounded-md px-3 text-[13px] font-medium text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] transition-colors hover:bg-sunken"
            >
              {allOn ? "Fjern alle" : `Velg alle med samtykke (${selectable.length})`}
            </button>
            <span className="t-small text-ink-3" aria-live="polite">
              {tagged.length === 0 ? "Ingen valgt" : `${tagged.length} valgt`}
            </span>
          </div>
          {people.length > 14 && (
            <div className="relative">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
              <label htmlFor={`${idPrefix}-search`} className="sr-only">
                Søk etter medlem
              </label>
              <input
                id={`${idPrefix}-search`}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Søk blant ${people.length} medlemmer`}
                className="h-10 w-full rounded-md border border-line-strong bg-surface pr-3 pl-9 text-base focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none sm:text-sm"
              />
            </div>
          )}
          <ul className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
            {shown.map((p) => {
              // Anonymised members are gone for good. «Ikke publiser» can be ticked, but must be covered up.
              const blocked = p.status === "anonymised" || (p.status === "restricted" && !allowRestricted);
              const mustCover = p.status === "restricted" || (p.consent !== undefined && p.consent !== "granted");
              const on = tagged.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    aria-pressed={on}
                    disabled={blocked || noPeople}
                    onClick={() => toggle(p.id)}
                    title={blocked ? (p.status === "anonymised" ? "Anonymisert" : "Skal ikke publiseres") : p.status === "restricted" ? "Ikke publiser: må sladdes i bildet" : p.role}
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 t-small transition-colors duration-150",
                      blocked && "cursor-not-allowed border-line text-ink-3",
                      !blocked && on && "border-inverse bg-inverse text-ink-inverse",
                      !blocked && !on && "border-line-strong bg-surface text-ink hover:border-ink-3",
                    )}
                  >
                    {blocked ? <Lock aria-hidden className="size-3.5" /> : on ? <Check aria-hidden className="size-3.5" /> : null}
                    {p.name}
                    {!blocked && mustCover && <ShieldAlert aria-label={p.status === "restricted" ? "Ikke publiser, må sladdes" : "Mangler samtykke til bilder"} className={cn("size-3.5", on ? "text-ink-inverse" : "text-warning")} />}
                  </button>
                </li>
              );
            })}
          </ul>
          {people.some((p) => p.status === "anonymised" || (p.status === "restricted" && !allowRestricted)) && (
            <p className="flex gap-1.5 t-small text-ink-3">
              <Lock aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Låste medlemmer kan ikke merkes eller vises offentlig.
            </p>
          )}
          {allowRestricted && people.some((p) => p.status === "restricted") && (
            <p className="flex gap-1.5 t-small text-ink-3">
              <ShieldAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
              Medlemmer med «Ikke publiser» kan merkes, men må sladdes i bildet.
            </p>
          )}
        </div>
      )}
      {unanswered && <p className="t-small font-medium text-warning">Velg minst ett medlem, eller «Ingen identifiserbare personer på bildet».</p>}
    </fieldset>
  );
}
