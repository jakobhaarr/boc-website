"use client";

import { ShieldAlert } from "lucide-react";
import { useId } from "react";
import { Checkbox, Field, Select } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { applicablePermissions, PERMISSION_GROUPS, PERMISSIONS, presetMatching, PRESETS } from "@/lib/access";
import type { AccessPreset, Permission } from "@/lib/types";

export interface AreaOption {
  id: string;
  label: string;
  /** What the person inviting may give here: what they hold there themselves. */
  allowed: Permission[];
}

/**
 * Where the person gets access. Reading what is in the area follows from being
 * invited there, so it is not a choice; what they may do is chosen below.
 */
export function AreaSelect({ areas, value, onChange, idPrefix }: { areas: AreaOption[]; value: string; onChange: (id: string) => void; idPrefix: string }) {
  return (
    <Field label="Hvor skal personen få tilgang?" htmlFor={`${idPrefix}-area`} hint="Personen kan se alt som hører til her, og alt under. Hva personen kan gjøre, velger du under.">
      <Select id={`${idPrefix}-area`} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Velg klubben, en gren eller en gruppe</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

/**
 * «Hva skal personen kunne gjøre?»: one tick per action the admin has. A quick
 * pick (Forelder, Trener, Lagleder, Styremedlem) ticks a sensible set to start
 * from; every tick can be changed afterwards, and nothing is ticked until the
 * inviter chooses. Only what the inviter holds themselves can be ticked.
 */
export function PermissionPicker({
  isRoot,
  allowed,
  value,
  onChange,
  idPrefix,
}: {
  isRoot: boolean;
  allowed: Permission[];
  value: Permission[];
  onChange: (value: Permission[], preset?: AccessPreset) => void;
  idPrefix: string;
}) {
  const legend = useId();
  const offered = applicablePermissions(isRoot);
  const may = new Set(allowed);
  const give = offered.filter((p) => may.has(p));
  const allOn = give.length > 0 && give.every((p) => value.includes(p));
  const preset = presetMatching(value);
  const pick = (id: AccessPreset) => {
    const wanted = PRESETS.find((p) => p.id === id)!.can.filter((p) => offered.includes(p));
    const got = wanted.filter((p) => may.has(p));
    onChange(got, got.length === wanted.length ? id : undefined);
  };
  const toggle = (id: Permission) => {
    const next = value.includes(id) ? value.filter((p) => p !== id) : [...value, id];
    onChange(next, presetMatching(next));
  };
  const selected = PERMISSIONS.filter((p) => value.includes(p.id));

  return (
    <fieldset aria-labelledby={legend} className="grid gap-4">
      <legend id={legend} className="t-label font-semibold">
        Hva skal personen kunne gjøre?
      </legend>

      <div className="grid gap-2">
        <p className="t-small text-ink-3">Velg et utgangspunkt, og juster etterpå.</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={preset === p.id}
              onClick={() => pick(p.id)}
              title={p.hint}
              className={cn(
                "inline-flex h-9 items-center rounded-md border px-3 t-small font-medium transition-colors",
                preset === p.id ? "border-inverse bg-inverse text-ink-inverse" : "border-line-strong bg-surface text-ink hover:border-ink-3",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset && <p className="t-small text-ink-2">{PRESETS.find((p) => p.id === preset)!.hint}</p>}
      </div>

      <button
        type="button"
        onClick={() => onChange(allOn ? [] : give, allOn ? undefined : presetMatching(give))}
        className="justify-self-start t-small font-medium text-club underline-offset-4 hover:underline"
      >
        {allOn ? "Fjern alle valg" : "Velg alle"}
      </button>

      <div className="grid gap-5">
        {PERMISSION_GROUPS.map((g) => {
          const items = PERMISSIONS.filter((p) => p.group === g.id && offered.includes(p.id));
          if (!items.length) return null;
          return (
            <div key={g.id} className="grid gap-3">
              <p className="t-meta font-semibold tracking-[0.06em] text-ink-3 uppercase">{g.label}</p>
              {items.map((p) => {
                const enabled = may.has(p.id);
                return (
                  <div key={p.id} className={cn(p.sensitive && "rounded-md bg-warning-surface px-3 py-2.5")}>
                    <Checkbox
                      id={`${idPrefix}-${p.id}`}
                      checked={value.includes(p.id)}
                      disabled={!enabled}
                      onChange={() => toggle(p.id)}
                      label={p.label}
                      description={enabled ? p.hint : `${p.hint} Du har ikke denne tilgangen selv, så du kan ikke gi den.`}
                      className={cn(!enabled && "cursor-not-allowed opacity-60")}
                    />
                    {p.sensitive && value.includes(p.id) && (
                      <p className="mt-2 flex gap-2 t-small text-ink">
                        <ShieldAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warning" />
                        Gjelder bare for de du er sikker på. Personen kan gi andre tilgang, men aldri mer enn hen selv har.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <p aria-live="polite" className="t-small text-ink-2">
        {selected.length === 0
          ? "Uten valg kan personen bare se innholdet i området."
          : `Personen kan se området og: ${selected.map((p) => p.label.charAt(0).toLowerCase() + p.label.slice(1)).join(", ")}.`}
      </p>
    </fieldset>
  );
}
