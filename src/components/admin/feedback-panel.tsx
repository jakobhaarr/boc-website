"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { addFeedback, deleteFeedback, updateFeedback } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { MAX_FEEDBACK, TOPIC_LABEL } from "@/lib/leader-tasks";
import type { Feedback } from "@/lib/types";

export type FeedbackRow = Pick<Feedback, "id" | "topic" | "message"> & { when: string; edited: boolean };

const TOPICS = Object.entries(TOPIC_LABEL) as [Feedback["topic"], string][];

/** The form for one piece of feedback, new or being changed. */
function FeedbackForm({ initial, submitLabel, onDone, onCancel }: { initial?: { topic: Feedback["topic"]; message: string }; submitLabel: string; onDone: (input: { topic: string; message: string }) => Promise<{ ok: true } | { ok: false; error: string }>; onCancel?: () => void }) {
  const [topic, setTopic] = useState<string>(initial?.topic ?? "other");
  const [message, setMessage] = useState(initial?.message ?? "");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const id = `fb-${initial ? "edit" : "new"}-${initial?.message.length ?? 0}`;
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(undefined);
          const res = await onDone({ topic, message });
          if (!res.ok) return setError(res.error);
          if (!initial) setMessage("");
        });
      }}
    >
      <Field label="Gjelder" htmlFor={`${id}-topic`}>
        <Select id={`${id}-topic`} value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tilbakemelding" htmlFor={`${id}-message`} error={error} hint="Hva gikk bra, hva var uklart, hva manglet?">
        <Textarea id={`${id}-message`} rows={5} maxLength={MAX_FEEDBACK} value={message} onChange={(e) => { setMessage(e.target.value); setError(undefined); }} aria-invalid={error ? true : undefined} />
      </Field>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending || !message.trim()} className="max-sm:w-full">
          {pending ? "Lagrer …" : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="max-sm:w-full">
            Avbryt
          </Button>
        )}
      </div>
    </form>
  );
}

function Entry({ row }: { row: FeedbackRow }) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string>();
  if (editing)
    return (
      <li className="px-4 py-4 sm:px-5">
        <FeedbackForm
          initial={{ topic: row.topic, message: row.message }}
          submitLabel="Lagre endringene"
          onCancel={() => setEditing(false)}
          onDone={async (input) => {
            const res = await updateFeedback(row.id, input);
            if (res.ok) setEditing(false);
            return res;
          }}
        />
      </li>
    );
  return (
    <li className="px-4 py-4 sm:px-5">
      <p className="t-meta text-ink-3">
        {TOPIC_LABEL[row.topic]} · {row.when}
        {row.edited && " · endret"}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap t-small text-ink">{row.message}</p>
      {error && <p role="alert" className="mt-2 t-small text-danger">{error}</p>}
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)} className="max-sm:w-full">
          <Pencil aria-hidden /> Endre
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={pending}
          className="max-sm:w-full"
          onClick={() => {
            if (!window.confirm("Slette tilbakemeldingen?")) return;
            start(async () => {
              const res = await deleteFeedback(row.id);
              if (!res.ok) setError(res.error);
            });
          }}
        >
          <Trash2 aria-hidden /> Slett
        </Button>
      </div>
    </li>
  );
}

/** The user's own feedback: a form for a new one, and what they have sent, each to change or delete. */
export function FeedbackPanel({ rows }: { rows: FeedbackRow[] }) {
  return (
    <div className="grid gap-6">
      <Panel title="Ny tilbakemelding">
        <div className="px-4 py-4 sm:px-5">
          <FeedbackForm submitLabel="Send tilbakemelding" onDone={(input) => addFeedback(input)} />
        </div>
      </Panel>
      <Panel title={`Dine tilbakemeldinger (${rows.length})`}>
        {rows.length === 0 ? (
          <p className="px-4 py-5 t-small text-ink-2 sm:px-5">Du har ikke sendt noen ennå. Du kan sende så mange du vil, og endre eller slette dem etterpå.</p>
        ) : (
          <ul className="divide-y divide-line">
            {rows.map((row) => (
              <Entry key={row.id} row={row} />
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
