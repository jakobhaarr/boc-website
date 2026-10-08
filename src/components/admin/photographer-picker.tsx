"use client";

import { useState, useTransition } from "react";
import { addExternal } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { choiceKey, type PhotographerOption } from "@/lib/photo-meta";

/**
 * Who took the picture: required for every upload, and never guessed. The list
 * is the uploader, the group's adult members, the externals and the club. An
 * unknown photographer is added on the spot, so an upload is never held up; a
 * club administrator looks over the externals afterwards. Anyone who does not
 * want a name on the picture is credited as the club («BOC»).
 */
export function PhotographerPicker({
  id,
  options,
  value,
  onChange,
  clubName,
}: {
  id: string;
  options: PhotographerOption[];
  /** `choiceKey` of the chosen photographer, or an empty string while none is chosen. */
  value: string;
  onChange: (key: string) => void;
  clubName: string;
}) {
  const [added, setAdded] = useState<PhotographerOption[]>([]);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();

  const all = [...options.filter((o) => o.group !== "club"), ...added.filter((a) => !options.some((o) => choiceKey(o) === choiceKey(a))), ...options.filter((o) => o.group === "club")];
  const of = (group: PhotographerOption["group"]) => all.filter((o) => o.group === group);

  const add = () =>
    start(async () => {
      setError(undefined);
      const res = await addExternal(name);
      if (!res.ok) return setError(res.error);
      const option: PhotographerOption = { group: "externals", kind: "external", refId: res.id, name: name.trim().replace(/\s+/g, " ") };
      setAdded((a) => [...a, option]);
      onChange(choiceKey(option));
      setAdding(false);
      setName("");
    });

  return (
    <div className="grid gap-2">
      <Field label="Hvem tok bildet?" htmlFor={id} hint={`Står som «Foto: …» under bildet. Vil ikke fotografen krediteres, for eksempel en forelder, velg ${clubName}.`}>
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
          <option value="">Velg fotograf</option>
          {of("me").map((o) => (
            <option key={choiceKey(o)} value={choiceKey(o)}>
              Meg selv ({o.name})
            </option>
          ))}
          {of("members").length > 0 && (
            <optgroup label="I gruppen">
              {of("members").map((o) => (
                <option key={choiceKey(o)} value={choiceKey(o)}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          )}
          {of("others").length > 0 && (
            <optgroup label="Andre i klubben">
              {of("others").map((o) => (
                <option key={choiceKey(o)} value={choiceKey(o)}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          )}
          {of("externals").length > 0 && (
            <optgroup label="Eksterne">
              {of("externals").map((o) => (
                <option key={choiceKey(o)} value={choiceKey(o)}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          )}
          {of("club").map((o) => (
            <option key={choiceKey(o)} value={choiceKey(o)}>
              {o.name} (ingen kreditering)
            </option>
          ))}
          <option value="__new__">+ Ny ekstern fotograf …</option>
        </Select>
      </Field>
      {adding && (
        <div className="grid gap-2 rounded-md border border-line bg-sunken p-3">
          <Field label="Fotografens navn" htmlFor={`${id}-new`} error={error}>
            <Input id={`${id}-new`} data-autofocus value={name} maxLength={80} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), name.trim() && add())} />
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
