"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addGroupQuote, removeGroupQuote } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";

interface QuoteRow {
  personId: string;
  name: string;
  detail?: string;
  quote: string;
  example: boolean;
}

/** The quotes on one group's page, and a form to add one. See /admin/sitater. */
export function QuoteManager({
  group,
  quotes,
  members,
}: {
  group: { id: string; name: string; href: string };
  quotes: QuoteRow[];
  members: { id: string; name: string; birthYear?: number }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [who, setWho] = useState<"member" | "parent">(members.length ? "member" : "parent");
  const [personId, setPersonId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState(`Forelder i ${group.name}`);
  const [quote, setQuote] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const done = () => {
    announceChange();
    router.refresh();
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await addGroupQuote({
        nodeId: group.id,
        ...(who === "member" ? { personId } : { parent: { firstName, lastName, relation } }),
        quote,
        consent,
      });
      if (!res.ok) return setError(res.error);
      setQuote("");
      setPersonId("");
      setFirstName("");
      setLastName("");
      setConsent(false);
      done();
    });

  const remove = (id: string) =>
    start(async () => {
      await removeGroupQuote(group.id, id);
      done();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <Panel
        id="sitater-liste"
        title={`På siden til ${group.name}`}
        action={
          <a href={group.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
            Se gruppesiden
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        }
      >
        {quotes.length === 0 ? (
          <p className="px-4 py-6 t-small text-ink-3 sm:px-5">Ingen sitater ennå. Seksjonen vises ikke på gruppesiden før det finnes minst ett.</p>
        ) : (
          <ul>
            {quotes.map((q) => (
              <li key={q.personId} className="flex items-start justify-between gap-4 border-t border-line px-4 py-4 first:border-t-0 sm:px-5">
                <div className="min-w-0">
                  <p className="t-body text-ink">«{q.quote}»</p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 t-small text-ink-3">
                    <span className="font-medium text-ink-2">{q.name}</span>
                    {q.detail && <span>{q.detail}</span>}
                    {q.example && <Status tone="warning">Eksempel</Status>}
                  </p>
                </div>
                <Button variant="ghost" size="sm" disabled={pending} onClick={() => remove(q.personId)}>
                  Fjern
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel id="nytt-sitat" title="Nytt sitat">
        <div className="grid gap-4 p-4 sm:p-5">
          <fieldset className="grid gap-2">
            <legend className="mb-1 t-label text-ink">Hvem sier det?</legend>
            <label className="flex items-center gap-2 t-small text-ink">
              <input type="radio" name="who" checked={who === "member"} disabled={!members.length} onChange={() => setWho("member")} className="accent-[var(--action)]" />
              Et medlem av gruppa
            </label>
            <label className="flex items-center gap-2 t-small text-ink">
              <input type="radio" name="who" checked={who === "parent"} onChange={() => setWho("parent")} className="accent-[var(--action)]" />
              En forelder eller foresatt
            </label>
          </fieldset>

          {who === "member" ? (
            <Field label="Medlem" htmlFor="sitat-person" hint="Bare personer som kan vises på nettsiden, og som ikke har et sitat her fra før.">
              <Select id="sitat-person" value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">Velg person</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.birthYear ? ` (${m.birthYear})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fornavn" htmlFor="sitat-fornavn">
                  <Input id="sitat-fornavn" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="off" />
                </Field>
                <Field label="Etternavn" htmlFor="sitat-etternavn" optional>
                  <Input id="sitat-etternavn" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="off" />
                </Field>
              </div>
              <Field label="Vises som" htmlFor="sitat-relasjon" hint="Bare fornavnet og dette vises. Barnets navn står ikke.">
                <Input id="sitat-relasjon" value={relation} onChange={(e) => setRelation(e.target.value)} />
              </Field>
            </>
          )}

          <Field label="Sitat" htmlFor="sitat-tekst" hint={`Hvorfor de liker å sykle i ${group.name}. ${quote.length}/280 tegn.`}>
            <Textarea id="sitat-tekst" value={quote} maxLength={280} onChange={(e) => setQuote(e.target.value)} />
          </Field>

          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            label="Personen har godkjent at sitatet publiseres"
            description="Med fornavn og alder, eller med det som står under «Vises som»."
          />

          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
          <Button onClick={submit} disabled={pending || !quote.trim() || !consent || (who === "member" ? !personId : !firstName.trim())} className="justify-self-start">
            Legg til sitat
          </Button>
        </div>
      </Panel>
    </div>
  );
}
