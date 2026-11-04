"use client";

import { ImagePlus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { addFeedback } from "@/app/actions";
import { prepareImage } from "@/components/admin/prepare-image";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/field";
import { MAX_FEEDBACK, MAX_SHOT_BYTES, MAX_SHOTS, TOPIC_LABEL } from "@/lib/leader-tasks";
import type { Feedback } from "@/lib/types";

/** TEMPORARY (lib/leader-tasks.ts). */
export const TOPICS = Object.entries(TOPIC_LABEL) as [Feedback["topic"], string][];

/**
 * The form for a new piece of feedback: what it is about, the text and up to three screenshots (chosen, or pasted into
 * the text). Screenshots are scaled down to 1600 px and squeezed in the browser, which also drops their metadata.
 * `page` is the admin page the writer is on, sent along so the reader sees where the feedback was meant.
 */
export function NewFeedbackForm({ page, onSent, onCancel }: { page: string; onSent?: () => void; onCancel?: () => void }) {
  const [topic, setTopic] = useState<string>("other");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const picker = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const add = (added: File[]) => {
    const images = added.filter((f) => /^image\//.test(f.type));
    if (!images.length) return;
    setError(undefined);
    setFiles((cur) => {
      if (cur.length + images.length > MAX_SHOTS) setError(`Du kan legge ved opptil ${MAX_SHOTS} skjermbilder.`);
      return [...cur, ...images].slice(0, MAX_SHOTS);
    });
  };

  const send = () =>
    start(async () => {
      setError(undefined);
      try {
        const form = new FormData();
        form.set("topic", topic);
        form.set("message", message);
        form.set("page", page);
        for (const [i, file] of files.entries()) {
          const { blob, ext } = await prepareImage(file, 1600, [], MAX_SHOT_BYTES - 100_000);
          form.append("file", new File([blob], `skjermbilde-${i + 1}.${ext}`, { type: blob.type }));
        }
        const res = await addFeedback(form);
        if (!res.ok) return setError(res.error);
        setMessage("");
        setFiles([]);
        onSent?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kunne ikke sende tilbakemeldingen.");
      }
    });

  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        send();
      }}
    >
      <Field label="Gjelder" htmlFor="fb-new-topic">
        <Select id="fb-new-topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Tilbakemelding" htmlFor="fb-new-message" hint="Hva gikk bra, hva var uklart, hva manglet?">
        <Textarea
          id="fb-new-message"
          rows={5}
          maxLength={MAX_FEEDBACK}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setError(undefined);
          }}
          onPaste={(e) => add([...e.clipboardData.files])}
        />
      </Field>
      <div className="grid gap-2">
        <p className="t-label text-ink">
          Skjermbilder <span className="font-normal text-ink-3">(valgfritt)</span>
        </p>
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previews[i]} alt={`Skjermbilde ${i + 1}`} className="h-20 w-auto max-w-[9rem] rounded-md object-cover shadow-[inset_0_0_0_1px_var(--border-strong)]" />
                <button
                  type="button"
                  aria-label={`Fjern skjermbilde ${i + 1}`}
                  onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                  className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-ink text-surface"
                >
                  <X aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {files.length < MAX_SHOTS && (
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={() => picker.current?.click()} className="max-sm:w-full">
              <ImagePlus aria-hidden /> Legg ved skjermbilde
            </Button>
          </div>
        )}
        <input
          ref={picker}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="sr-only"
          aria-label="Velg skjermbilder"
          onChange={(e) => {
            add([...(e.target.files ?? [])]);
            e.target.value = "";
          }}
        />
        <p className="t-small text-ink-3">Opptil {MAX_SHOTS}. Du kan også lime inn et bilde i tekstfeltet.</p>
      </div>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="submit" disabled={pending || !message.trim()} className="max-sm:w-full">
          {pending ? "Sender …" : "Send tilbakemelding"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={pending} className="max-sm:w-full">
            Avbryt
          </Button>
        )}
      </div>
    </form>
  );
}
