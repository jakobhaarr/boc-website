"use client";

import { UserRound } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { changeGroupLeader, removePersonMembership } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";

export type LeaderPerson = { id: string; name: string };

const initials = (name: string) => {
  const p = name.trim().split(/\s+/);
  return `${p[0]?.[0] ?? ""}${p.length > 1 ? p[p.length - 1][0] : ""}`.toUpperCase();
};

/**
 * The group's team leader (Lagleder): who it is now, and a way to choose or change it from the members. It is saved at once
 * (`changeGroupLeader`), not with the text below, and the person is shown as the group's contact on its public page. A group
 * may have more than one; «Bytt» replaces that one, «Legg til» adds another.
 */
export function GroupLeader({ groupId, groupName, leaders, people }: { groupId: string; groupName: string; leaders: LeaderPerson[]; people: LeaderPerson[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  // Which leader is being replaced (null: adding one), and whether the picker is open.
  const [picking, setPicking] = useState<{ replace: string | null } | null>(null);
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("nb");
    const taken = new Set(leaders.map((l) => l.id));
    return (q ? people.filter((p) => p.name.toLocaleLowerCase("nb").includes(q)) : people).filter((p) => !taken.has(p.id)).slice(0, 40);
  }, [people, query, leaders]);

  const choose = (personId: string) =>
    start(async () => {
      setError("");
      const res = await changeGroupLeader(groupId, personId, picking?.replace ?? undefined);
      if (!res.ok) return setError(res.error);
      announceChange();
      setPicking(null);
      window.location.reload();
    });
  const remove = (personId: string) =>
    start(async () => {
      setError("");
      const res = await removePersonMembership(personId, groupId, "teamManager");
      if (!res.ok) return setError(res.error);
      announceChange();
      window.location.reload();
    });

  return (
    <div>
      <p className="t-label text-ink">Lagleder</p>
      <p className="mt-1 t-small text-ink-3">Vises som kontaktperson på gruppens side. Endringen lagres med en gang.</p>
      {leaders.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-line-strong bg-surface px-4 py-4">
          <p className="t-small text-ink-2">Gruppen har ingen lagleder.</p>
          <Button
            size="sm"
            className="mt-3 max-sm:w-full"
            onClick={() => {
              setQuery("");
              setError("");
              setPicking({ replace: null });
            }}
          >
            Velg lagleder
          </Button>
        </div>
      ) : (
        <ul className="mt-3 grid gap-2">
          {leaders.map((l) => (
            <li key={l.id} className="flex flex-col gap-3 rounded-md border border-line bg-surface px-4 py-3 sm:flex-row sm:items-center">
              <span className="flex min-w-0 flex-1 items-center gap-3">
                <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-full bg-club-tint font-display text-[0.9rem] font-semibold text-club">
                  {initials(l.name) || <UserRound className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate t-label font-semibold">{l.name}</span>
                  <span className="block t-small text-ink-3">Lagleder</span>
                </span>
              </span>
              <span className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => {
                    setQuery("");
                    setError("");
                    setPicking({ replace: l.id });
                  }}
                  className="max-sm:w-full"
                >
                  Bytt
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => confirm(`Ta ${l.name} ut som lagleder? Personen blir værende i gruppen.`) && remove(l.id)}
                  className="max-sm:w-full"
                >
                  Fjern
                </Button>
              </span>
            </li>
          ))}
          <li>
            <button
              type="button"
              className="t-small font-medium text-club underline-offset-4 hover:underline"
              onClick={() => {
                setQuery("");
                setError("");
                setPicking({ replace: null });
              }}
            >
              Legg til en lagleder til
            </button>
          </li>
        </ul>
      )}
      {error && !picking && (
        <p role="alert" className="mt-2 t-small text-danger">
          {error}
        </p>
      )}

      <Dialog
        open={picking !== null}
        onClose={() => setPicking(null)}
        title={picking?.replace ? `Bytt lagleder i ${groupName}` : `Velg lagleder i ${groupName}`}
        description="Søk blant medlemmene. Personen blir lagleder på gruppens side, og beholder det den ellers gjør i klubben."
      >
        <div className="grid gap-3">
          <Field label="Søk" htmlFor="leader-q" error={error || undefined}>
            <Input id="leader-q" data-autofocus placeholder="Navn" value={query} onChange={(e) => setQuery(e.target.value)} />
          </Field>
          <ul className="max-h-[50dvh] divide-y divide-line overflow-y-auto rounded-md border border-line">
            {matches.length === 0 && <li className="px-3 py-3 t-small text-ink-3">Ingen treff.</li>}
            {matches.map((p) => (
              <li key={p.id} className="flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="t-small text-ink">{p.name}</span>
                <Button size="sm" variant="secondary" disabled={pending} onClick={() => choose(p.id)} className="max-sm:w-full">
                  Sett som lagleder
                </Button>
              </li>
            ))}
          </ul>
          {people.length > matches.length && !query && <p className="t-small text-ink-3">Viser de første {matches.length}. Søk for å finne flere.</p>}
        </div>
      </Dialog>
    </div>
  );
}
