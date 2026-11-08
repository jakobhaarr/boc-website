"use client";

import { Check } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { mergePeopleAction } from "@/app/actions";
import type { PersonRowView } from "@/components/admin/people-table";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { formatDateFull } from "@/lib/dates";
import type { MergeField, MergePicks } from "@/lib/merge-people";

const FIELDS: { id: MergeField; label: string }[] = [
  { id: "birth", label: "Fødselsdato eller fødselsår" },
  { id: "email", label: "E-post" },
  { id: "strava", label: "Strava" },
  { id: "portrait", label: "Portrett" },
];

/** The value of a property as a plain key (to tell equal values from different ones) and as text. */
function valueOf(r: PersonRowView, f: MergeField): { key: string; text: string; src?: string } | undefined {
  const v = r.merge[f];
  if (!v) return undefined;
  if (f === "portrait") return { key: (v as { id: string }).id, text: "Portrett", src: (v as { src: string }).src };
  const s = v as string;
  return { key: s, text: f === "birth" ? (s.length === 4 ? `Født ${s}` : `Født ${formatDateFull(s)}`) : s };
}

const where = (r: PersonRowView) => r.memberships.map((m) => `${m.node} (${m.role})`).join(", ") || "Ingen grupper";

/** The record that holds most is the natural one to keep: one with an account, then a birth year, then the most groups. */
const bestToKeep = (list: PersonRowView[]) =>
  [...list].sort((a, b) => Number(b.hasUser) - Number(a.hasUser) || Number(!!b.birthYear) - Number(!!a.birthYear) || b.memberships.length - a.memberships.length)[0]?.id ?? "";

/** What each property is set to unless the administrator chooses: the kept record's own value, else the first that has one. */
function defaultPicks(list: PersonRowView[], keepId: string): Record<MergeField, string> {
  const keep = list.find((r) => r.id === keepId);
  const pick = (f: MergeField) => (keep && valueOf(keep, f) ? keep.id : (list.find((r) => valueOf(r, f))?.id ?? keepId));
  return { birth: pick("birth"), email: pick("email"), strava: pick("strava"), portrait: pick("portrait") };
}

/**
 * Merging duplicate people, set out like HubSpot's merge: pick the record to keep, then, for each property where more than one
 * record has a value, pick which value stays; a property only one of them has is filled in from that one, whichever is kept.
 * A preview shows the result before anything is done. The server checks all of it again (`mergePeople`).
 */
export function MergeDialog({ open, onClose, people, onMerged }: { open: boolean; onClose: () => void; people: PersonRowView[]; onMerged: () => void }) {
  const [keepId, setKeepId] = useState("");
  const [picks, setPicks] = useState<Record<MergeField, string>>({ birth: "", email: "", strava: "", portrait: "" });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const idsKey = people.map((p) => p.id).join(",");

  useEffect(() => {
    if (!open) return;
    const best = bestToKeep(people);
    setKeepId(best);
    setPicks(defaultPicks(people, best));
    setError(null);
    setDone(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idsKey]);

  const keepRecord = (id: string) => {
    setKeepId(id);
    setPicks(defaultPicks(people, id));
  };

  const sameNames = people.length > 1 && people.every((r) => r.name.trim().toLocaleLowerCase("nb") === people[0].name.trim().toLocaleLowerCase("nb"));
  const block =
    people.length < 2
      ? "Velg minst to personer."
      : !sameNames
        ? "Personene har ikke samme navn. Bare duplikater med samme navn kan slås sammen."
        : people.filter((r) => r.hasUser).length > 1
          ? "Mer enn én av dem har en egen bruker. Slå sammen brukerne først, under Brukere."
          : "";

  // Per property: the different values, each with the records that hold it. Only these need a choice.
  const choices = useMemo(
    () =>
      FIELDS.map((f) => {
        const groups = new Map<string, { value: NonNullable<ReturnType<typeof valueOf>>; from: PersonRowView[] }>();
        for (const r of people) {
          const v = valueOf(r, f.id);
          if (!v) continue;
          const g = groups.get(v.key);
          if (g) g.from.push(r);
          else groups.set(v.key, { value: v, from: [r] });
        }
        return { ...f, options: [...groups.values()] };
      }),
    [people],
  );
  const yearsDiffer = (choices.find((c) => c.id === "birth")?.options.length ?? 0) > 1;

  const chosenValue = (f: MergeField) => {
    const c = choices.find((x) => x.id === f)!;
    return c.options.find((o) => o.from.some((r) => r.id === picks[f]))?.value ?? c.options[0]?.value;
  };
  const allGroups = [...new Set(people.flatMap((r) => r.memberships.map((m) => `${m.node} (${m.role})`)))];
  const keep = people.find((r) => r.id === keepId);

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await mergePeopleAction(
        people.map((p) => p.id),
        keepId,
        picks as MergePicks,
      );
      if (!res.ok) return setError(res.error);
      setDone(true);
      announceChange();
      onMerged();
    });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={done ? "Ferdig" : `Slå sammen ${people.length} personer til én`}
      description={
        done ? undefined : "Velg hvilken som beholdes og hvilke verdier som skal stå igjen. Grupper samles, og bilder, omtaler og sitater flyttes over. Dette kan ikke angres."
      }
      footer={
        done ? (
          <Button onClick={onClose}>Lukk</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={pending}>
              Avbryt
            </Button>
            <Button onClick={submit} disabled={pending || !!block || !keepId}>
              {pending ? "Slår sammen …" : "Slå sammen"}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <p className="t-small text-ink">Slått sammen til én person ({people.length} ble til 1).</p>
      ) : (
        <div className="grid gap-6">
          <fieldset className="grid gap-2">
            <legend className="mb-1 t-small font-semibold text-ink">1. Velg personen du beholder</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {people.map((r) => (
                <label
                  key={r.id}
                  className={cn("flex cursor-pointer items-start gap-3 rounded-md p-3 ring-1 ring-line", keepId === r.id && "bg-club-tint ring-2 ring-[var(--club-link)]")}
                >
                  <input type="radio" name="merge-keep" checked={keepId === r.id} onChange={() => keepRecord(r.id)} className="mt-1 accent-[var(--action)]" />
                  <span className="min-w-0 t-small">
                    <span className="block font-medium text-ink">{r.name}</span>
                    <span className="block text-ink-2">{where(r)}</span>
                    <span className="block text-ink-3">
                      {r.email ?? "Ingen e-post"} · {r.account}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4">
            <p className="t-small font-semibold text-ink">2. Velg verdiene som står igjen</p>
            {choices.map((c) =>
              c.options.length > 1 ? (
                <fieldset key={c.id} className="grid gap-2">
                  <legend className="mb-1 t-small text-ink-2">{c.label}: flere verdier. Velg én.</legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {c.options.map((o) => {
                      const selected = o.from.some((r) => r.id === picks[c.id]);
                      return (
                        <label
                          key={o.value.key}
                          className={cn("flex cursor-pointer items-center gap-3 rounded-md p-3 ring-1 ring-line", selected && "bg-club-tint ring-2 ring-[var(--club-link)]")}
                        >
                          <input
                            type="radio"
                            name={`merge-${c.id}`}
                            checked={selected}
                            onChange={() => setPicks((p) => ({ ...p, [c.id]: o.from[0].id }))}
                            className="accent-[var(--action)]"
                          />
                          <span className="min-w-0 t-small">
                            {o.value.src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={o.value.src} alt="" className="mb-1 size-12 rounded-md object-cover" />
                            ) : (
                              <span className="block break-all font-medium text-ink">{o.value.text}</span>
                            )}
                            <span className="block text-ink-3">Fra posten i {o.from.map(where).join(" og ")}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ) : null,
            )}
            {choices.every((c) => c.options.length < 2) && <p className="t-small text-ink-3">Ingen verdier er i konflikt. Det som bare én av dem har, fylles inn automatisk.</p>}
            {choices.some((c) => c.options.length >= 1 && c.options.length < 2 && people.some((r) => !valueOf(r, c.id))) && choices.some((c) => c.options.length > 1) && (
              <p className="t-small text-ink-3">Det som bare én av dem har, fylles inn automatisk, også fra den du ikke beholder.</p>
            )}
            {yearsDiffer && (
              <p role="note" className="rounded-md bg-warning-surface px-3 py-2.5 t-small text-ink">
                De har ulikt fødselsår eller fødselsdato. Sjekk at det er samme person før du slår dem sammen. Far og sønn kan ha samme navn.
              </p>
            )}
          </div>

          <section aria-label="Slik blir personen" className="rounded-lg border border-line bg-sunken p-4">
            <p className="t-meta text-ink-3">3. Slik blir personen</p>
            <p className="mt-1 t-h4">{keep?.name}</p>
            <dl className="mt-3 grid gap-2 t-small sm:grid-cols-[8rem_1fr]">
              {FIELDS.map((f) => {
                const v = chosenValue(f.id);
                return (
                  <div key={f.id} className="contents">
                    <dt className="text-ink-3">{f.label}</dt>
                    <dd className="min-w-0 break-all text-ink">
                      {v ? (
                        v.src ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.src} alt="" className="size-10 rounded-md object-cover" />
                        ) : (
                          v.text
                        )
                      ) : (
                        <span className="text-ink-3">Mangler</span>
                      )}
                    </dd>
                  </div>
                );
              })}
              <dt className="text-ink-3">Grupper</dt>
              <dd className="text-ink">{allGroups.join(", ") || "Ingen"}</dd>
              <dt className="text-ink-3">Konto</dt>
              <dd className="text-ink">{people.find((r) => r.hasUser)?.account ?? keep?.account}</dd>
            </dl>
            <p className="mt-3 flex items-center gap-1.5 t-small text-ink-3">
              <Check aria-hidden className="size-3.5" />
              Strengeste personvernvalg og samtykke beholdes.
            </p>
          </section>

          {block && (
            <p role="alert" className="t-small text-danger">
              {block}
            </p>
          )}
          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
