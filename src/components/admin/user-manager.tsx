"use client";

import { Check, Copy, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addUserRole, inviteUser, removeUserRole, resendInvitation, setUserActive, updateUser, type UserResult } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/field";
import { Avatar, Status } from "@/components/ui/primitives";
import type { RoleKind } from "@/lib/types";
import { Panel } from "./bits";
import { RoleChip } from "./role-chip";

export interface UserRow {
  id: string;
  name: string;
  email: string;
  active: boolean;
  isSelf: boolean;
  /** The picture they set themselves, or their linked person's portrait. */
  photo?: { src: string; focal?: { x: number; y: number } };
  roles: { role: RoleKind; roleLabel: string; nodeId: string; nodeName: string }[];
}

interface RoleOption {
  role: RoleKind;
  label: string;
  explainer: string;
}

interface NodeOption {
  id: string;
  label: string;
}

/**
 * The list of everyone who can sign in, with what each may do. A club
 * administrator invites, changes roles, and deactivates here; the rules
 * (never without an administrator, never locking yourself out) live in
 * lib/user-admin.ts and are enforced by the server actions.
 */
export function UserManager({ users, roles, nodes, rootId, siteName }: { users: UserRow[]; roles: RoleOption[]; nodes: NodeOption[]; rootId: string; siteName: string }) {
  const [managing, setManaging] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const managed = users.find((u) => u.id === managing);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setInviting(true)}>
          <UserPlus aria-hidden />
          Inviter bruker
        </Button>
      </div>

      <Panel>
        <ul className="divide-y divide-line">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={u.name} size={36} photo={u.photo} />
                <div className="min-w-0">
                  <p className="truncate t-label font-semibold">
                    {u.name}
                    {u.isSelf && <span className="ml-2 font-normal text-ink-3">Du</span>}
                  </p>
                  <p className="truncate t-small text-ink-3">{u.email}</p>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {u.roles.length ? (
                  u.roles.map((r) => (
                    <RoleChip key={`${r.role}-${r.nodeId}`} role={r.role}>
                      {r.role === "clubAdmin" ? r.roleLabel : `${r.roleLabel} · ${r.nodeName}`}
                    </RoleChip>
                  ))
                ) : (
                  <span className="t-small text-ink-3">Ingen tilgang</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-3 sm:justify-end">
                {u.active ? <Status tone="success">Kan logge inn</Status> : <Status>Kan ikke logge inn</Status>}
                <Button variant="secondary" size="sm" onClick={() => setManaging(u.id)}>
                  Administrer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <InviteDialog open={inviting} onClose={() => setInviting(false)} roles={roles} nodes={nodes} rootId={rootId} siteName={siteName} />
      {managed && <ManageDialog key={managed.id} user={managed} onClose={() => setManaging(null)} roles={roles} nodes={nodes} rootId={rootId} />}
    </div>
  );
}

/** Runs a user action, reports its error, and refreshes the page when it went through. */
function useUserAction() {
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (action: () => Promise<UserResult>, then?: (res: Extract<UserResult, { ok: true }>) => void) =>
    start(async () => {
      setError(undefined);
      const res = await action();
      if (!res.ok) return setError(res.error);
      announceChange();
      router.refresh();
      then?.(res);
    });
  return { error, setError, pending, run };
}

function RoleFields({
  roles,
  nodes,
  rootId,
  role,
  nodeId,
  onRole,
  onNode,
  idPrefix,
}: {
  roles: RoleOption[];
  nodes: NodeOption[];
  rootId: string;
  role: RoleKind;
  nodeId: string;
  onRole: (role: RoleKind) => void;
  onNode: (nodeId: string) => void;
  idPrefix: string;
}) {
  const explainer = roles.find((r) => r.role === role)?.explainer;
  return (
    <div className="grid gap-3">
      <Field label="Rolle" htmlFor={`${idPrefix}-role`} hint={explainer}>
        <Select
          id={`${idPrefix}-role`}
          value={role}
          onChange={(e) => {
            const next = e.target.value as RoleKind;
            onRole(next);
            onNode(next === "clubAdmin" ? rootId : nodeId === rootId ? "" : nodeId);
          }}
        >
          {roles.map((r) => (
            <option key={r.role} value={r.role}>
              {r.label}
            </option>
          ))}
        </Select>
      </Field>
      {role !== "clubAdmin" && (
        <Field label="Gjelder for" htmlFor={`${idPrefix}-node`} hint="Rollen gjelder også alt under dette nivået.">
          <Select id={`${idPrefix}-node`} value={nodeId} onChange={(e) => onNode(e.target.value)}>
            <option value="">Velg idrett, gren eller gruppe</option>
            {nodes.map((n) => (
              <option key={n.id} value={n.id}>
                {n.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </div>
  );
}

function InviteDialog({ open, onClose, roles, nodes, rootId, siteName }: { open: boolean; onClose: () => void; roles: RoleOption[]; nodes: NodeOption[]; rootId: string; siteName: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleKind>("groupAdmin");
  const [nodeId, setNodeId] = useState("");
  const [done, setDone] = useState<{ name: string; email: string; emailed: boolean }>();
  const [copied, setCopied] = useState(false);
  const { error, setError, pending, run } = useUserAction();

  const close = () => {
    onClose();
    setName("");
    setEmail("");
    setRole("groupAdmin");
    setNodeId("");
    setDone(undefined);
    setCopied(false);
    setError(undefined);
  };

  const message = done
    ? `Hei ${done.name.split(" ")[0]}! Du har fått tilgang til administrasjonen til ${siteName}. Gå til ${typeof window === "undefined" ? "" : window.location.origin}/admin, skriv inn ${done.email}, og skriv inn koden du får på e-post. Du trenger ikke passord.`
    : "";

  return (
    <Dialog
      open={open}
      onClose={close}
      title={done ? "Brukeren er invitert" : "Inviter bruker"}
      description={
        done
          ? done.emailed
            ? `Vi har sendt en invitasjon til ${done.email}. Beskjeden under kan du bruke hvis den ikke kommer fram.`
            : "Nettsiden fikk ikke sendt en e-post, så gi beskjed til personen selv med teksten under."
          : "Personen får en e-post med en lenke til innloggingen, og logger inn med e-postadressen sin og en kode."
      }
      footer={
        done ? (
          <>
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  setCopied(true);
                } catch {
                  setError("Kunne ikke kopiere. Marker teksten og kopier selv.");
                }
              }}
            >
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? "Kopiert" : "Kopier beskjeden"}
            </Button>
            <Button onClick={close}>Ferdig</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={close} disabled={pending}>
              Avbryt
            </Button>
            <Button
              disabled={pending || !name.trim() || !email.trim() || (role !== "clubAdmin" && !nodeId)}
              onClick={() => run(() => inviteUser({ name, email, role, nodeId: role === "clubAdmin" ? rootId : nodeId }), (res) => setDone({ name: name.trim(), email: email.trim(), emailed: !!res.emailed }))}
            >
              {pending ? "Inviterer og sender e-post …" : "Inviter"}
            </Button>
          </>
        )
      }
    >
      {done ? (
        <div className="grid gap-3">
          <p className="rounded-md border border-line bg-sunken px-3 py-3 t-small whitespace-pre-wrap text-ink">{message}</p>
          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          <Field label="Navn" htmlFor="invite-name">
            <Input id="invite-name" data-autofocus autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="E-postadresse" htmlFor="invite-email" hint="Koden for å logge inn sendes hit.">
            <Input id="invite-email" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <RoleFields roles={roles} nodes={nodes} rootId={rootId} role={role} nodeId={nodeId} onRole={setRole} onNode={setNodeId} idPrefix="invite" />
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

function ManageDialog({ user, onClose, roles, nodes, rootId }: { user: UserRow; onClose: () => void; roles: RoleOption[]; nodes: NodeOption[]; rootId: string }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState<RoleKind>("groupAdmin");
  const [nodeId, setNodeId] = useState("");
  const [sent, setSent] = useState(false);
  const { error, pending, run } = useUserAction();
  const changed = name.trim() !== user.name || email.trim().toLowerCase() !== user.email.toLowerCase();

  return (
    <Dialog open onClose={onClose} title={user.name} description={user.email} size="md">
      <div className="grid gap-6">
        <section className="grid gap-3" aria-labelledby="manage-contact">
          <h3 id="manage-contact" className="t-label font-semibold">
            Navn og e-postadresse
          </h3>
          <Field label="Navn" htmlFor="manage-name">
            <Input id="manage-name" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="E-postadresse" htmlFor="manage-email" hint={user.isSelf ? "Du kan ikke endre din egen adresse. Be en annen klubbadministrator om det." : undefined}>
            <Input id="manage-email" type="email" inputMode="email" value={email} disabled={user.isSelf} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <div>
            <Button variant="secondary" size="sm" disabled={pending || !changed} onClick={() => run(() => updateUser(user.id, { name, email }))}>
              Lagre
            </Button>
          </div>
        </section>

        <section className="grid gap-3 border-t border-line pt-5" aria-labelledby="manage-roles">
          <h3 id="manage-roles" className="t-label font-semibold">
            Tilgang
          </h3>
          {user.roles.length === 0 ? (
            <p className="t-small text-ink-3">Ingen roller.</p>
          ) : (
            <ul className="divide-y divide-line rounded-md border border-line">
              {user.roles.map((r) => (
                <li key={`${r.role}-${r.nodeId}`} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <RoleChip role={r.role}>{r.role === "clubAdmin" ? r.roleLabel : `${r.roleLabel} · ${r.nodeName}`}</RoleChip>
                  <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => removeUserRole(user.id, { role: r.role, nodeId: r.nodeId }))}>
                    Fjern
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <p className="pt-1 t-small font-medium text-ink">Legg til en rolle</p>
          <RoleFields roles={roles} nodes={nodes} rootId={rootId} role={role} nodeId={nodeId} onRole={setRole} onNode={setNodeId} idPrefix="manage" />
          <div>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending || (role !== "clubAdmin" && !nodeId)}
              onClick={() => run(() => addUserRole(user.id, { role, nodeId: role === "clubAdmin" ? rootId : nodeId }), () => setNodeId(""))}
            >
              Legg til
            </Button>
          </div>
        </section>

        <section className="grid gap-3 border-t border-line pt-5" aria-labelledby="manage-active">
          <h3 id="manage-active" className="t-label font-semibold">
            Innlogging
          </h3>
          <p className="t-small text-ink-2">
            {user.active
              ? "Brukeren kan logge inn. Deaktiverer du, stoppes tilgangen med en gang, og alt brukeren har skrevet blir liggende."
              : "Brukeren kan ikke logge inn akkurat nå. Aktiver for å gi tilgang igjen."}
          </p>
          <div className="flex flex-wrap gap-2">
            {user.active && (
              <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => resendInvitation(user.id), () => setSent(true))}>
                {sent ? "Invitasjon sendt" : "Send invitasjon på nytt"}
              </Button>
            )}
            <Button variant={user.active ? "danger" : "secondary"} size="sm" disabled={pending} onClick={() => run(() => setUserActive(user.id, !user.active))}>
              {user.active ? "Deaktiver bruker" : "Aktiver bruker"}
            </Button>
          </div>
        </section>

        {error && (
          <p role="alert" className="t-small text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
