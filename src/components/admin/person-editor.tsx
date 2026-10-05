"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { erasePersonAction, removePersonMembership, setPersonMembership, updatePerson } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { DangerZone } from "@/components/admin/danger-zone";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { MEMBERSHIP_ROLES } from "@/lib/person-edit";
import type { MembershipRole } from "@/lib/types";

interface MembershipRow {
  nodeId: string;
  role: MembershipRole;
  title: string;
  path: string;
  /** The user runs this group and may change the membership. */
  editable: boolean;
}

/**
 * A person's name, contact details and groups, for the admins of those groups,
 * and erasing them from the register, for club administrators. Each part saves
 * on its own, so a mistake in one never holds up another.
 */
export function PersonEditor({
  person,
  memberships,
  groups,
  erase,
}: {
  person: { id: string; name: string; firstName: string; lastName: string; email: string; phone: string; consentEmail: string };
  memberships: MembershipRow[];
  groups: { id: string; label: string }[];
  erase?: { blocked?: string; articles: number; photos: number; activities: number };
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ firstName: person.firstName, lastName: person.lastName, email: person.email, phone: person.phone, consentEmail: person.consentEmail });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const ids = { first: useId(), last: useId(), email: useId(), phone: useId(), consent: useId() };
  const dirty = JSON.stringify(form) !== JSON.stringify({ firstName: person.firstName, lastName: person.lastName, email: person.email, phone: person.phone, consentEmail: person.consentEmail });

  const saveBasics = () =>
    start(async () => {
      setError(null);
      setSaved(false);
      const res = await updatePerson(person.id, form);
      if (!res.ok) return setError(res.error);
      setSaved(true);
      announceChange();
      router.refresh();
    });

  return (
    <div className="grid max-w-[44rem] gap-6">
      <Panel id="navn" title="Navn og kontakt">
        <div className="grid gap-4 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fornavn" htmlFor={ids.first}>
              <Input id={ids.first} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
            </Field>
            <Field label="Etternavn" htmlFor={ids.last}>
              <Input id={ids.last} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
            </Field>
          </div>
          <Field label="E-post" htmlFor={ids.email} optional hint="Vises på nettsiden bare for personer i roller som trener, lagleder og kontaktperson.">
            <Input id={ids.email} type="email" inputMode="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </Field>
          <Field label="Telefon" htmlFor={ids.phone} optional>
            <Input id={ids.phone} type="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
          </Field>
          <Field label="E-post for samtykke til bilder" htmlFor={ids.consent} optional hint="Vises aldri. Brukes bare når noen laster opp et bilde med personen, og personen skal be om samtykke. For et barn: en forelders adresse.">
            <Input id={ids.consent} type="email" inputMode="email" value={form.consentEmail} onChange={(e) => setForm((f) => ({ ...f, consentEmail: e.target.value }))} />
          </Field>
          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <Button onClick={saveBasics} disabled={!dirty || pending}>
              {pending ? "Lagrer …" : "Lagre"}
            </Button>
            {saved && !dirty && <span className="t-small text-success">Lagret.</span>}
          </div>
          <p className="t-meta text-ink-3">Navn i innlegg som allerede er publisert endres ikke. Teksten står som den ble skrevet.</p>
        </div>
      </Panel>

      <Panel id="grupper" title="Grupper og roller">
        <ul className="divide-y divide-line">
          {memberships.map((m) => (
            <MembershipEditor key={`${m.nodeId}-${m.role}`} personId={person.id} row={m} groups={groups} />
          ))}
          {memberships.length === 0 && <li className="px-4 py-4 t-small text-ink-3 sm:px-5">Personen er ikke i noen gruppe.</li>}
        </ul>
        {groups.length > 0 && <AddMembership personId={person.id} groups={groups} />}
      </Panel>

      {erase && (
        <DangerZone
          title="Slett fra registeret"
          action="Slett personen for godt"
          blocked={erase.blocked ? [erase.blocked] : undefined}
          undo="Dette kan ikke angres, og ingen kopi beholdes. Skal personen bare ut av en gruppe, bruker du «Ta ut» over."
          confirmName={person.name}
          what={
            <>
              <p>Personen anonymiseres først, så fjernes den fra registeret:</p>
              <ul className="mt-2 list-disc pl-5">
                <li>Navnet i publiserte innlegg ({erase.articles}) og aktiviteter ({erase.activities}) byttes til nøytral omtale.</li>
                <li>Bilder av personen ({erase.photos}) skjules.</li>
                <li>Sitater fra personen, og en eventuell brukerkonto uten tilganger, fjernes.</li>
              </ul>
            </>
          }
          onDelete={async (typed) => {
            const res = await erasePersonAction(person.id, typed);
            if (res.ok) {
              announceChange();
              window.location.href = "/admin/personer";
            }
            return res;
          }}
        />
      )}
    </div>
  );
}

function MembershipEditor({ personId, row, groups }: { personId: string; row: MembershipRow; groups: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [role, setRole] = useState<MembershipRole>(row.role);
  const [title, setTitle] = useState(row.title);
  const [error, setError] = useState<string | null>(null);
  const dirty = role !== row.role || title !== row.title;
  const roleId = useId();
  const titleId = useId();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) return setError(res.error);
      announceChange();
      router.refresh();
    });

  return (
    <li className="grid gap-3 px-4 py-4 sm:px-5">
      <p className="t-label font-semibold">{row.path}</p>
      {row.editable ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Rolle" htmlFor={roleId}>
              <Select id={roleId} value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
                {MEMBERSHIP_ROLES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Tittel på siden" htmlFor={titleId} optional hint="For eksempel «Road Captain». Står tittelen tom, brukes rollen.">
              <Input id={titleId} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
          </div>
          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={!dirty || pending} onClick={() => run(() => setPersonMembership(personId, { nodeId: row.nodeId, role, title, replaces: { nodeId: row.nodeId, role: row.role } }))}>
              Lagre
            </Button>
            <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => removePersonMembership(personId, row.nodeId, row.role))}>
              <Trash2 aria-hidden />
              Ta ut av gruppen
            </Button>
          </div>
        </>
      ) : (
        <p className="t-small text-ink-3">
          {MEMBERSHIP_ROLES.find((r) => r.id === row.role)?.label}
          {row.title ? ` (${row.title})` : ""}. Du styrer ikke denne gruppen, så den kan bare endres av de som gjør det.
        </p>
      )}
    </li>
  );
}

function AddMembership({ personId, groups }: { personId: string; groups: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [nodeId, setNodeId] = useState("");
  const [role, setRole] = useState<MembershipRole>("athlete");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const gId = useId();
  const rId = useId();

  return (
    <div className="grid gap-3 border-t border-line px-4 py-4 sm:px-5">
      <p className="t-label font-semibold">Legg til i en gruppe</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Gruppe" htmlFor={gId}>
          <Select id={gId} value={nodeId} onChange={(e) => setNodeId(e.target.value)}>
            <option value="">Velg gruppe</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Rolle" htmlFor={rId}>
          <Select id={rId} value={role} onChange={(e) => setRole(e.target.value as MembershipRole)}>
            {MEMBERSHIP_ROLES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Tittel på siden" htmlFor={`${rId}-t`} optional>
        <Input id={`${rId}-t`} value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <Button
        size="sm"
        className="self-start"
        disabled={!nodeId || pending}
        onClick={() =>
          start(async () => {
            setError(null);
            const res = await setPersonMembership(personId, { nodeId, role, title });
            if (!res.ok) return setError(res.error);
            setNodeId("");
            setTitle("");
            announceChange();
            router.refresh();
          })
        }
      >
        <Plus aria-hidden />
        Legg til
      </Button>
    </div>
  );
}
