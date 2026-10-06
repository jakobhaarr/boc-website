"use client";

import { Check, Copy, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { grantAccess, inviteUser, removeUserRole, resendInvitation, setUserActive, updateUser, type UserResult } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Avatar, Status } from "@/components/ui/primitives";
import { permissionLabel } from "@/lib/access";
import type { AccessPreset, Permission, RoleKind } from "@/lib/types";
import { AreaSelect, PermissionPicker, type AreaOption } from "./access-picker";
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
  roles: {
    role: RoleKind;
    /** «Lagleder», «Trener», the old role's name, or what it lets the person do. */
    label: string;
    nodeId: string;
    nodeName: string;
    can: Permission[];
    preset?: AccessPreset;
    /** The one looking may change this: it is inside their own area and holds nothing beyond what they hold. */
    editable: boolean;
  }[];
}

/**
 * The list of everyone who can sign in, with what each may do. A club
 * administrator invites, changes roles, and deactivates here; the rules
 * (never without an administrator, never locking yourself out) live in
 * lib/user-admin.ts and are enforced by the server actions.
 */
export function UserManager({ users, areas, rootId, siteName, fullAdmin }: { users: UserRow[]; areas: AreaOption[]; rootId: string; siteName: string; fullAdmin: boolean }) {
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
                      {r.nodeId === rootId ? r.label : `${r.label} · ${r.nodeName}`}
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

      <InviteDialog open={inviting} onClose={() => setInviting(false)} areas={areas} rootId={rootId} siteName={siteName} />
      {managed && <ManageDialog key={managed.id} user={managed} onClose={() => setManaging(null)} areas={areas} rootId={rootId} fullAdmin={fullAdmin} />}
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

/** Area and permissions together: the area first, and only then what the person may do there. */
function AccessFields({
  areas,
  rootId,
  nodeId,
  can,
  onNode,
  onCan,
  idPrefix,
}: {
  areas: AreaOption[];
  rootId: string;
  nodeId: string;
  can: Permission[];
  onNode: (nodeId: string) => void;
  onCan: (can: Permission[], preset?: AccessPreset) => void;
  idPrefix: string;
}) {
  const area = areas.find((a) => a.id === nodeId);
  return (
    <div className="grid gap-5">
      <AreaSelect
        areas={areas}
        value={nodeId}
        idPrefix={idPrefix}
        onChange={(id) => {
          onNode(id);
          // What was ticked may not be possible or allowed in the new area.
          const next = areas.find((a) => a.id === id);
          onCan(can.filter((p) => next?.allowed.includes(p)), undefined);
        }}
      />
      {area && <PermissionPicker key={nodeId} isRoot={area.id === rootId} allowed={area.allowed} value={can} onChange={onCan} idPrefix={idPrefix} />}
    </div>
  );
}

function InviteDialog({ open, onClose, areas, rootId, siteName }: { open: boolean; onClose: () => void; areas: AreaOption[]; rootId: string; siteName: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [nodeId, setNodeId] = useState("");
  const [can, setCan] = useState<Permission[]>([]);
  const [preset, setPreset] = useState<AccessPreset>();
  const [done, setDone] = useState<{ name: string; email: string; emailed: boolean }>();
  const [copied, setCopied] = useState(false);
  const { error, setError, pending, run } = useUserAction();

  const close = () => {
    onClose();
    setName("");
    setEmail("");
    setNodeId("");
    setCan([]);
    setPreset(undefined);
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
              disabled={pending || !name.trim() || !email.trim() || !nodeId}
              onClick={() => run(() => inviteUser({ name, email, nodeId, can, preset }), (res) => setDone({ name: name.trim(), email: email.trim(), emailed: !!res.emailed }))}
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
        <div className="grid gap-5">
          <Field label="Navn" htmlFor="invite-name">
            <Input id="invite-name" data-autofocus autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="E-postadresse" htmlFor="invite-email" hint="Koden for å logge inn sendes hit.">
            <Input id="invite-email" type="email" inputMode="email" autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <AccessFields
            areas={areas}
            rootId={rootId}
            nodeId={nodeId}
            can={can}
            onNode={setNodeId}
            onCan={(next, p) => {
              setCan(next);
              setPreset(p);
            }}
            idPrefix="invite"
          />
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

function ManageDialog({ user, onClose, areas, rootId, fullAdmin }: { user: UserRow; onClose: () => void; areas: AreaOption[]; rootId: string; fullAdmin: boolean }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [nodeId, setNodeId] = useState("");
  const [can, setCan] = useState<Permission[]>([]);
  const [preset, setPreset] = useState<AccessPreset>();
  const [editing, setEditing] = useState<string | null>(null);
  const [editCan, setEditCan] = useState<Permission[]>([]);
  const [editPreset, setEditPreset] = useState<AccessPreset>();
  const [sent, setSent] = useState(false);
  const { error, pending, run } = useUserAction();
  const changed = name.trim() !== user.name || email.trim().toLowerCase() !== user.email.toLowerCase();
  // Areas where this person has nothing yet: one assignment per area, and an existing one is changed with «Endre».
  const free = areas.filter((a) => !user.roles.some((r) => r.nodeId === a.id));

  return (
    <Dialog open onClose={onClose} title={user.name} description={user.email} size="md">
      <div className="grid gap-6">
        {fullAdmin && (
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
        )}

        <section className={fullAdmin ? "grid gap-3 border-t border-line pt-5" : "grid gap-3"} aria-labelledby="manage-roles">
          <h3 id="manage-roles" className="t-label font-semibold">
            Tilgang
          </h3>
          {user.roles.length === 0 ? (
            <p className="t-small text-ink-3">Ingen tilgang.</p>
          ) : (
            <ul className="divide-y divide-line rounded-md border border-line">
              {user.roles.map((r) => (
                <li key={`${r.role}-${r.nodeId}`} className="grid gap-3 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <RoleChip role={r.role}>{r.nodeId === rootId ? r.label : `${r.label} · ${r.nodeName}`}</RoleChip>
                    {r.editable ? (
                      <span className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={pending}
                          onClick={() => {
                            setEditing(editing === r.nodeId ? null : r.nodeId);
                            setEditCan(r.can);
                            setEditPreset(r.preset);
                          }}
                        >
                          {editing === r.nodeId ? "Lukk" : "Endre"}
                        </Button>
                        <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(() => removeUserRole(user.id, { role: r.role, nodeId: r.nodeId }))}>
                          Fjern
                        </Button>
                      </span>
                    ) : (
                      <span className="t-small text-ink-3">Utenfor ditt område</span>
                    )}
                  </div>
                  <p className="t-small text-ink-2">{r.can.length ? `Kan: ${r.can.map((p) => permissionLabel(p).toLowerCase()).join(", ")}.` : "Kan bare se innholdet her."}</p>
                  {editing === r.nodeId && (
                    <div className="grid gap-4 rounded-md bg-sunken p-4">
                      <PermissionPicker
                        isRoot={r.nodeId === rootId}
                        allowed={areas.find((a) => a.id === r.nodeId)?.allowed ?? []}
                        value={editCan}
                        onChange={(next, p) => {
                          setEditCan(next);
                          setEditPreset(p);
                        }}
                        idPrefix={`edit-${r.nodeId}`}
                      />
                      <div>
                        <Button size="sm" disabled={pending} onClick={() => run(() => grantAccess(user.id, { nodeId: r.nodeId, can: editCan, preset: editPreset }), () => setEditing(null))}>
                          Lagre
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          {free.length > 0 && (
            <>
              <p className="pt-1 t-small font-medium text-ink">Gi tilgang til et nytt område</p>
              <AccessFields
                areas={free}
                rootId={rootId}
                nodeId={nodeId}
                can={can}
                onNode={setNodeId}
                onCan={(next, p) => {
                  setCan(next);
                  setPreset(p);
                }}
                idPrefix="manage"
              />
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pending || !nodeId}
                  onClick={() =>
                    run(() => grantAccess(user.id, { nodeId, can, preset }), () => {
                      setNodeId("");
                      setCan([]);
                      setPreset(undefined);
                    })
                  }
                >
                  Gi tilgang
                </Button>
              </div>
            </>
          )}
        </section>

        <section className="grid gap-3 border-t border-line pt-5" aria-labelledby="manage-active">
          <h3 id="manage-active" className="t-label font-semibold">
            Innlogging
          </h3>
          <p className="t-small text-ink-2">
            {user.active
              ? fullAdmin
                ? "Brukeren kan logge inn. Deaktiverer du, stoppes tilgangen med en gang, og alt brukeren har skrevet blir liggende."
                : "Brukeren kan logge inn."
              : "Brukeren kan ikke logge inn akkurat nå. Bare en klubbadministrator kan aktivere brukeren igjen."}
          </p>
          <div className="flex flex-wrap gap-2">
            {user.active && (
              <Button variant="secondary" size="sm" disabled={pending} onClick={() => run(() => resendInvitation(user.id), () => setSent(true))}>
                {sent ? "Invitasjon sendt" : "Send invitasjon på nytt"}
              </Button>
            )}
            {fullAdmin && (
              <Button variant={user.active ? "danger" : "secondary"} size="sm" disabled={pending} onClick={() => run(() => setUserActive(user.id, !user.active))}>
                {user.active ? "Deaktiver bruker" : "Aktiver bruker"}
              </Button>
            )}
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
