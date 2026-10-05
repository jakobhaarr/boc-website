"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addExternal, deleteExternal, updateExternal, type ExternalResult } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { Avatar, EmptyState, Status } from "@/components/ui/primitives";
import { Panel } from "./bits";

export interface ExternalRow {
  id: string;
  name: string;
  note?: string;
  /** How many pictures credit this person. */
  photos: number;
  addedBy: string;
  added: string;
}

/**
 * The externals: photographers and others the club names who are not members.
 * They are normally added when a picture is uploaded; a club administrator
 * keeps the list tidy here.
 */
export function ExternalManager({ rows }: { rows: ExternalRow[] }) {
  const [editing, setEditing] = useState<ExternalRow | "new" | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus aria-hidden />
          Legg til ekstern
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState>Ingen eksterne ennå. Når noen laster opp et bilde og oppgir en fotograf utenfor klubben, havner personen her.</EmptyState>
      ) : (
        <Panel>
          <ul className="divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={r.name} size={36} />
                  <div className="min-w-0">
                    <p className="truncate t-label font-semibold">{r.name}</p>
                    <p className="truncate t-small text-ink-3">
                      {r.note ? `${r.note} · ` : ""}Lagt til av {r.addedBy} · {r.added}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 sm:justify-end">
                  <Status tone={r.photos ? "club" : "neutral"}>{r.photos === 1 ? "1 bilde" : `${r.photos} bilder`}</Status>
                  <Button variant="secondary" size="sm" onClick={() => setEditing(r)}>
                    Rediger
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {editing && <ExternalDialog key={editing === "new" ? "new" : editing.id} external={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function ExternalDialog({ external, onClose }: { external: ExternalRow | null; onClose: () => void }) {
  const [name, setName] = useState(external?.name ?? "");
  const [note, setNote] = useState(external?.note ?? "");
  const [error, setError] = useState<string>();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (action: () => Promise<ExternalResult>) =>
    start(async () => {
      setError(undefined);
      const res = await action();
      if (!res.ok) return setError(res.error);
      announceChange();
      router.refresh();
      onClose();
    });

  return (
    <Dialog
      open
      onClose={onClose}
      size="sm"
      title={external ? external.name : "Legg til ekstern"}
      description={external ? undefined : "En person utenfor medlemsregisteret, for eksempel en fotograf."}
      footer={
        <>
          {external && (
            <Button variant="ghost" className="sm:mr-auto" disabled={pending} onClick={() => (confirmDelete ? run(() => deleteExternal(external.id)) : setConfirmDelete(true))}>
              {confirmDelete ? "Ja, slett" : "Slett"}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Avbryt
          </Button>
          <Button disabled={pending || !name.trim()} onClick={() => run(() => (external ? updateExternal(external.id, { name, note }) : addExternal(name, note)))}>
            {pending ? "Lagrer …" : "Lagre"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <Field label="Navn" htmlFor="external-name" hint="Slik det skal stå i «Foto: …».">
          <Input id="external-name" data-autofocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        </Field>
        <Field label="Merknad" htmlFor="external-note" optional hint="Bare for klubben, vises ikke på nettsiden. For eksempel «far til en av rytterne».">
          <Input id="external-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
        </Field>
        {error && (
          <p role="alert" className="t-small text-danger">
            {error}
          </p>
        )}
      </div>
    </Dialog>
  );
}
