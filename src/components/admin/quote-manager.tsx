"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addGroupQuote, editGroupQuote, removeGroupQuote, setQuoteFront } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";

interface QuoteRow {
  personId: string;
  name: string;
  detail?: string;
  relation?: string;
  quote: string;
  example: boolean;
  front?: "requested" | "approved";
}

/** The quotes on one group's page, and a form to add one. See /admin/sitater. */
export function QuoteManager({
  group,
  quotes,
  members,
  clubAdmin,
}: {
  group: { id: string; name: string; href: string };
  quotes: QuoteRow[];
  members: { id: string; name: string; birthYear?: number }[];
  /** The club administrator approves quotes for the front page; a group admin can only ask. */
  clubAdmin: boolean;
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
  const [front, setFront] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

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
        front,
      });
      if (!res.ok) return setError(res.error);
      setQuote("");
      setPersonId("");
      setFirstName("");
      setLastName("");
      setConsent(false);
      setFront(false);
      done();
    });

  const remove = (id: string) =>
    start(async () => {
      await removeGroupQuote(group.id, id);
      done();
    });

  const setFrontState = (id: string, state: "none" | "requested" | "approved") =>
    start(async () => {
      setError(null);
      const res = await setQuoteFront(group.id, id, state);
      if (!res.ok) return setError(res.error);
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
              <li key={q.personId} className="border-t border-line px-4 py-4 first:border-t-0 sm:px-5">
                {editing === q.personId ? (
                  <QuoteEditor
                    row={q}
                    groupId={group.id}
                    onDone={(saved) => {
                      setEditing(null);
                      if (saved) done();
                    }}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="t-body text-ink">«{q.quote}»</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 t-small text-ink-3">
                        <span className="font-medium text-ink-2">{q.name}</span>
                        {q.detail && <span>{q.detail}</span>}
                        {q.example && <Status tone="warning">Eksempel</Status>}
                        {q.front === "approved" && <Status tone="success">På forsiden</Status>}
                        {q.front === "requested" && <Status tone="warning">Venter på godkjenning for forsiden</Status>}
                      </p>
                      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 t-small">
                        {q.front === "requested" && clubAdmin && (
                          <button type="button" disabled={pending} onClick={() => setFrontState(q.personId, "approved")} className="font-medium text-club hover:text-club-hover">
                            Godkjenn for forsiden
                          </button>
                        )}
                        {!q.front && (
                          <button type="button" disabled={pending} onClick={() => setFrontState(q.personId, clubAdmin ? "approved" : "requested")} className="font-medium text-club hover:text-club-hover">
                            {clubAdmin ? "Vis på forsiden" : "Foreslå for forsiden"}
                          </button>
                        )}
                        {q.front && (
                          <button type="button" disabled={pending} onClick={() => setFrontState(q.personId, "none")} className="text-ink-3 underline underline-offset-2 hover:text-ink">
                            {q.front === "requested" ? "Trekk tilbake forslaget" : "Ta av forsiden"}
                          </button>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => setEditing(q.personId)}>
                        Rediger
                      </Button>
                      <Button variant="ghost" size="sm" disabled={pending} onClick={() => remove(q.personId)}>
                        Fjern
                      </Button>
                    </div>
                  </div>
                )}
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

          <Checkbox
            checked={front}
            onChange={(e) => setFront(e.target.checked)}
            label={clubAdmin ? "Vis også på forsiden" : "Foreslå for forsiden"}
            description={clubAdmin ? "Under «Fra medlemmene» på forsiden." : "Klubbadministrator må godkjenne før sitatet står på forsiden. Gruppesiden vises uansett med en gang."}
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

/** A quote opened for editing in its place in the list. */
function QuoteEditor({ row, groupId, onDone }: { row: QuoteRow; groupId: string; onDone: (saved: boolean) => void }) {
  const [quote, setQuote] = useState(row.quote);
  const [relation, setRelation] = useState(row.relation ?? "");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = quote.trim() !== row.quote;

  const save = () =>
    start(async () => {
      setError(null);
      const res = await editGroupQuote({ nodeId: groupId, personId: row.personId, quote, relation: row.relation !== undefined ? relation : undefined, consent });
      if (!res.ok) return setError(res.error);
      onDone(true);
    });

  const id = `rediger-${row.personId}`;
  return (
    <div className="grid gap-3">
      <p className="t-small font-medium text-ink-2">{row.name}</p>
      <Field label="Sitat" htmlFor={id} hint={`${quote.length}/280 tegn.`}>
        <Textarea id={id} value={quote} maxLength={280} autoFocus onChange={(e) => setQuote(e.target.value)} />
      </Field>
      {row.relation !== undefined && (
        <Field label="Vises som" htmlFor={`${id}-relasjon`}>
          <Input id={`${id}-relasjon`} value={relation} onChange={(e) => setRelation(e.target.value)} />
        </Field>
      )}
      {changed && (
        <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label="Personen har godkjent den nye teksten" />
      )}
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending || !quote.trim() || (changed && !consent)}>
          Lagre
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDone(false)} disabled={pending}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}
