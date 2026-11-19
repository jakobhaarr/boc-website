"use client";

import { useState, useTransition } from "react";
import { addExternal } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";

/**
 * Who wrote the text, beside the photographer's picker: the person publishing (the default) or an external, someone outside the
 * register such as a parent or a guest writer. An unknown writer is added on the spot, as a photographer is; the same list of
 * externals serves both, and a club administrator looks it over afterwards.
 */
export function AuthorPicker({
  id,
  externals,
  value,
  onChange,
  authorName,
}: {
  id: string;
  externals: { id: string; name: string }[];
  /** The chosen external's id, or an empty string for the one publishing. */
  value: string;
  onChange: (externalId: string) => void;
  /** The name of the one publishing. */
  authorName: string;
}) {
  const [added, setAdded] = useState<{ id: string; name: string }[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const all = [...externals, ...added.filter((a) => !externals.some((e) => e.id === a.id))].sort((a, b) => a.name.localeCompare(b.name, "nb"));

  const add = () =>
    start(async () => {
      setError(undefined);
      const res = await addExternal(name);
      if (!res.ok) return setError(res.error);
      setAdded((a) => [...a, { id: res.id, name: name.trim().replace(/\s+/g, " ") }]);
      onChange(res.id);
      setAdding(false);
      setName("");
    });

  return (
    <div className="grid gap-2">
      <Field label="Hvem har skrevet teksten?" htmlFor={id} hint="Står som forfatter på innlegget. Du står fortsatt som den som publiserte det.">
        <Select
          id={id}
          value={adding ? "__new__" : value}
          onChange={(e) => {
            if (e.target.value === "__new__") {
              setAdding(true);
              onChange("");
            } else {
              setAdding(false);
              onChange(e.target.value);
            }
          }}
        >
          <option value="">Meg selv ({authorName})</option>
          {all.length > 0 && (
            <optgroup label="Eksterne">
              {all.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </optgroup>
          )}
          <option value="__new__">+ Ny ekstern forfatter …</option>
        </Select>
      </Field>
      {adding && (
        <div className="grid gap-2 rounded-md border border-line bg-sunken p-3">
          <Field label="Forfatterens navn" htmlFor={`${id}-new`} error={error}>
            <Input
              id={`${id}-new`}
              data-autofocus
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), name.trim() && add())}
            />
          </Field>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={pending || name.trim().length < 2} onClick={add}>
              {pending ? "Legger til …" : "Legg til"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => (setAdding(false), setName(""), setError(undefined))}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
