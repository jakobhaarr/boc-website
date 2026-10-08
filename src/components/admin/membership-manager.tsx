"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveMembership } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Textarea } from "@/components/ui/field";
import { MAX_RATES, type MembershipEdit } from "@/lib/membership-edit";

type Rate = MembershipEdit["rates"][number];

/**
 * The club's membership rates: one list, set here and used everywhere the site names a price (Bli med, Barn og ungdom, the front
 * page). The order is the order shown; the first three are shown large on Bli med and the rest as a line under them. See /admin/medlemskap.
 */
export function MembershipManager({ initial, clubName }: { initial: MembershipEdit; clubName: string }) {
  const router = useRouter();
  const [rates, setRates] = useState<Rate[]>(initial.rates);
  const [note, setNote] = useState(initial.note);
  const [required, setRequired] = useState(initial.requiredFor ?? "");
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const set = (i: number, patch: Partial<Rate>) => setRates((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, by: -1 | 1) =>
    setRates((rs) => {
      const j = i + by;
      if (j < 0 || j >= rs.length) return rs;
      const next = [...rs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const dirty = JSON.stringify({ rates, note, requiredFor: required || undefined }) !== JSON.stringify({ rates: initial.rates, note: initial.note, requiredFor: initial.requiredFor || undefined });

  const save = () =>
    start(async () => {
      setMessage(null);
      const res = await saveMembership({ rates, note, requiredFor: required });
      if (!res.ok) return setMessage({ ok: false, text: res.error });
      setMessage({ ok: true, text: "Lagret. Prisene er oppdatert overalt på nettsiden." });
      announceChange();
      router.refresh();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
      <Panel id="priser" title="Medlemskap og priser">
        <ul className="divide-y divide-line">
          {rates.map((r, i) => (
            <li key={i} className="grid gap-3 px-4 py-4 sm:px-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
                <Field label="Navn" htmlFor={`rate-${i}-label`}>
                  <Input id={`rate-${i}-label`} value={r.label} maxLength={40} onChange={(e) => set(i, { label: e.target.value })} />
                </Field>
                <Field label="Pris (kr)" htmlFor={`rate-${i}-amount`}>
                  <Input id={`rate-${i}-amount`} inputMode="numeric" value={Number.isFinite(r.amount) ? String(r.amount) : ""} onChange={(e) => set(i, { amount: e.target.value === "" ? Number.NaN : Number(e.target.value.replace(/\D/g, "")) })} />
                </Field>
              </div>
              <Field label="Tekst under" htmlFor={`rate-${i}-hint`} optional hint="For eksempel «17–66 år».">
                <Input id={`rate-${i}-hint`} value={r.hint ?? ""} maxLength={60} onChange={(e) => set(i, { hint: e.target.value })} />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  <Checkbox checked={!!r.minor} onChange={(e) => set(i, { minor: e.target.checked })} label="Liten linje" description="Står under de store, ikke som egen rute." />
                  <Checkbox checked={!!r.children} onChange={(e) => set(i, { children: e.target.checked })} label="Vises på Barn og ungdom" />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" aria-label="Flytt opp" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUp aria-hidden />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Flytt ned" disabled={i === rates.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDown aria-hidden />
                  </Button>
                  <Button variant="ghost" size="sm" aria-label="Fjern" onClick={() => setRates((rs) => rs.filter((_, j) => j !== i))}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <div className="border-t border-line px-4 py-4 sm:px-5">
          <Button variant="secondary" size="sm" disabled={rates.length >= MAX_RATES} onClick={() => setRates((rs) => [...rs, { label: "", amount: 0 }])}>
            <Plus aria-hidden />
            Legg til medlemskap
          </Button>
        </div>
      </Panel>

      <div className="grid gap-6">
        <Panel id="tekst" title="Teksten rundt prisene">
          <div className="grid gap-4 p-4 sm:p-5">
            <Field label="Merknad" htmlFor="m-note" hint="Står under prisene: rabatter, gebyrer og det som kommer i tillegg.">
              <Textarea id="m-note" rows={4} maxLength={400} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Field label="Når trenger man medlemskap?" htmlFor="m-required" optional hint={`Hva ${clubName} krever medlemskap til, for eksempel ritt og turer.`}>
              <Textarea id="m-required" rows={3} maxLength={240} value={required} onChange={(e) => setRequired(e.target.value)} />
            </Field>
          </div>
        </Panel>
        <div className="grid gap-3 rounded-lg border border-line bg-surface p-4 sm:p-5">
          <p className="t-small text-ink-2">Prisene her brukes på Bli med, Barn og ungdom og forsiden til {clubName}. De tre første står som store ruter på Bli med.</p>
          {message && (
            <p role={message.ok ? "status" : "alert"} className={message.ok ? "t-small text-success" : "t-small text-danger"}>
              {message.text}
            </p>
          )}
          <Button disabled={pending || !dirty} onClick={save}>
            {pending ? "Lagrer …" : "Lagre prisene"}
          </Button>
        </div>
      </div>
    </div>
  );
}
