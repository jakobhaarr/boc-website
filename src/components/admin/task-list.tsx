"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { createTask, delegateTask, deleteTask, setTaskStatus, updateTask, type TaskResult } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";
import { TASK_DESCRIPTION_MAX, TASK_STATUS_LABEL, TASK_TITLE_MAX } from "@/lib/club-tasks";
import { formatDateFull } from "@/lib/dates";
import type { ClubTask } from "@/lib/types";

export type TaskRow = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: ClubTask["status"];
  assigneeUserId: string;
  assigneeName: string;
  createdBy: string;
  /** Given to the one looking. */
  mine: boolean;
  doneBy: string;
  doneOn: string;
};
/** Someone a task can be given to, with their access in a few words («Klubbadministrator», «Lagadministrator · Zwift»). */
type Person = { id: string; name: string; detail: string };
const label = (p: Person) => (p.detail ? `${p.name} (${p.detail})` : p.name);

/** The task list: the form for a new task (club administrators), the open tasks, and the done ones below. */
export function TaskList({ rows, people, admin, today }: { rows: TaskRow[]; people: Person[]; admin: boolean; today: string }) {
  const open = rows.filter((r) => r.status !== "done");
  const done = rows.filter((r) => r.status === "done");
  const [creating, setCreating] = useState(false);
  return (
    <div className="grid max-w-3xl gap-6">
      {admin && (
        <div>
          {creating ? (
            <Panel title="Ny oppgave">
              <div className="p-4 sm:p-5">
                <TaskForm people={people} submitLabel="Lag oppgave" onSubmit={createTask} onDone={() => setCreating(false)} onCancel={() => setCreating(false)} />
              </div>
            </Panel>
          ) : (
            <Button onClick={() => setCreating(true)} className="max-sm:w-full">
              <Plus aria-hidden />
              Ny oppgave
            </Button>
          )}
        </div>
      )}
      <Panel title={`${admin ? "Åpne oppgaver" : "Dine oppgaver"} (${open.length})`}>
        {open.length === 0 ? (
          <p className="px-4 py-6 t-small text-ink-3 sm:px-5">{admin ? "Ingen åpne oppgaver. Lag en med «Ny oppgave»." : "Du har ingen åpne oppgaver."}</p>
        ) : (
          <ul className="divide-y divide-line">
            {open.map((r) => (
              <TaskItem key={r.id} row={r} people={people} admin={admin} today={today} />
            ))}
          </ul>
        )}
      </Panel>
      {done.length > 0 && (
        <Panel title={`Ferdige (${done.length})`}>
          <ul className="divide-y divide-line">
            {done.map((r) => (
              <TaskItem key={r.id} row={r} people={people} admin={admin} today={today} />
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

function TaskItem({ row: r, people, admin, today }: { row: TaskRow; people: Person[]; admin: boolean; today: string }) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const canWork = admin || r.mine;
  const overdue = r.status !== "done" && r.dueDate && r.dueDate < today;
  const run = (fn: () => Promise<TaskResult>) =>
    start(async () => {
      setError(undefined);
      const res = await fn();
      if (!res.ok) return setError(res.error);
      announceChange();
    });

  if (editing)
    return (
      <li className="p-4 sm:p-5">
        <TaskForm initial={r} people={people} submitLabel="Lagre" onSubmit={(input) => updateTask(r.id, input)} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      </li>
    );
  const selectId = `task-${r.id}`;
  // A deactivated person who still has the task stays in the list, so it is not lost.
  const assigneeKnown = !r.assigneeUserId || people.some((p) => p.id === r.assigneeUserId);
  return (
    <li className="grid gap-3 px-4 py-4 sm:px-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className={r.status === "done" ? "t-label font-semibold text-ink-3 line-through" : "t-label font-semibold"}>{r.title}</p>
          {r.status === "doing" && <Status tone="club">Pågår</Status>}
          {overdue && <Status tone="danger">Over fristen</Status>}
          {r.mine && admin && <Status tone="neutral">Din</Status>}
        </div>
        {r.description && <p className="mt-1 max-w-[70ch] whitespace-pre-line t-small text-ink-2">{r.description}</p>}
        <p className="mt-1 t-small text-ink-3">
          {r.assigneeName ? `Gitt til ${r.assigneeName}` : "Ingen har den ennå"}
          {r.dueDate ? ` · frist ${formatDateFull(r.dueDate)}` : ""}
          {admin ? ` · laget av ${r.createdBy}` : ""}
          {r.status === "done" && r.doneOn ? ` · ferdig ${formatDateFull(r.doneOn)}${r.doneBy ? ` av ${r.doneBy}` : ""}` : ""}
        </p>
      </div>
      {canWork && (
        <div className="grid items-start gap-3 sm:grid-cols-2">
          <Field label="Status" htmlFor={`${selectId}-s`}>
            <Select id={`${selectId}-s`} value={r.status} disabled={pending} onChange={(e) => run(() => setTaskStatus(r.id, e.target.value as ClubTask["status"]))}>
              {(Object.keys(TASK_STATUS_LABEL) as ClubTask["status"][]).map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABEL[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Gitt til" htmlFor={`${selectId}-a`}>
            <Select id={`${selectId}-a`} value={r.assigneeUserId} disabled={pending} onChange={(e) => run(() => delegateTask(r.id, e.target.value))}>
              {(admin || !r.assigneeUserId) && <option value="">Ingen</option>}
              {!assigneeKnown && <option value={r.assigneeUserId}>{r.assigneeName} (ikke aktiv)</option>}
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {label(p)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      {admin && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => setEditing(true)} className="max-sm:w-full">
            <Pencil aria-hidden />
            Rediger
          </Button>
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => confirm("Slette oppgaven?") && run(() => deleteTask(r.id))} className="max-sm:w-full">
            <Trash2 aria-hidden />
            Slett
          </Button>
        </div>
      )}
    </li>
  );
}

function TaskForm({ initial, people, submitLabel, onSubmit, onDone, onCancel }: { initial?: TaskRow; people: Person[]; submitLabel: string; onSubmit: (input: { title: string; description: string; dueDate: string; assigneeUserId: string }) => Promise<TaskResult>; onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [assigneeUserId, setAssignee] = useState(initial?.assigneeUserId ?? "");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const id = `taskform-${initial?.id ?? "new"}`;
  const keepsOld = !!initial?.assigneeUserId && !people.some((p) => p.id === initial.assigneeUserId);
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(undefined);
          const res = await onSubmit({ title, description, dueDate, assigneeUserId });
          if (!res.ok) return setError(res.error);
          announceChange();
          onDone();
        });
      }}
    >
      <Field label="Oppgave" htmlFor={`${id}-t`}>
        <Input id={`${id}-t`} value={title} maxLength={TASK_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} />
      </Field>
      <Field label="Beskrivelse" htmlFor={`${id}-d`} optional>
        <Textarea id={`${id}-d`} rows={4} maxLength={TASK_DESCRIPTION_MAX} value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid items-start gap-4 sm:grid-cols-2">
        <Field label="Frist" htmlFor={`${id}-f`} optional>
          <Input id={`${id}-f`} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Gi til" htmlFor={`${id}-a`} optional hint="Bare aktiverte brukere med tilgang kan få en oppgave.">
          <Select id={`${id}-a`} value={assigneeUserId} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Ingen ennå</option>
            {keepsOld && <option value={initial!.assigneeUserId}>{initial!.assigneeName} (ikke aktiv)</option>}
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {label(p)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending || !title.trim()} className="max-sm:w-full">
          {pending ? "Lagrer …" : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} className="max-sm:w-full">
          Avbryt
        </Button>
      </div>
    </form>
  );
}
