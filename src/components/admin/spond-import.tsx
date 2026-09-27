"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { importSpondMembers, previewSpondImport, type SpondPreviewRow } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Select } from "@/components/ui/field";
import { Status } from "@/components/ui/primitives";

const CONSENT = { granted: "Ja", declined: "Nei", unknown: "Ikke oppgitt" } as const;
const MATCH = {
  new: { label: "Ny", tone: "success" },
  existing: { label: "Finnes, legges til i gruppa", tone: "neutral" },
  member: { label: "Allerede i gruppa", tone: "neutral" },
} as const;

/** Upload, preview, confirm. See /admin/personer/import. */
export function SpondImport({ groups, initialGroupId }: { groups: { id: string; label: string }[]; initialGroupId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [groupId, setGroupId] = useState(initialGroupId);
  const [rows, setRows] = useState<SpondPreviewRow[] | null>(null);
  const [ignored, setIgnored] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const preview = (form: FormData) =>
    start(async () => {
      setError(null);
      setResult(null);
      form.set("nodeId", groupId);
      const res = await previewSpondImport(form);
      if (!res.ok) {
        setRows(null);
        return setError(res.error);
      }
      setRows(res.rows);
      setIgnored(res.ignored);
    });

  const toImport = rows?.filter((r) => r.match !== "member") ?? [];
  const confirm = () =>
    start(async () => {
      const res = await importSpondMembers({
        nodeId: groupId,
        members: toImport.map(({ firstName, lastName, birthYear, photoConsent }) => ({ firstName, lastName, birthYear, photoConsent })),
        visible,
      });
      if (!res.ok) return setError(res.error);
      setResult(`${res.added} nye personer lagt inn, ${res.joined} eksisterende lagt til i gruppa.`);
      setRows(null);
      announceChange();
      router.refresh();
    });

  const count = (m: SpondPreviewRow["match"]) => rows?.filter((r) => r.match === m).length ?? 0;

  return (
    <div className="grid gap-6">
      <Panel id="fil" title="1. Velg gruppe og fil">
        <form action={preview} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:p-5">
          <Field label="Gruppe" htmlFor="import-gruppe">
            <Select
              id="import-gruppe"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setRows(null);
              }}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Eksport fra Spond" htmlFor="import-fil" hint="Medlemmer › Eksporter i Spond-gruppa.">
            <input
              id="import-fil"
              name="file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              required
              className="t-small text-ink-2 file:mr-3 file:rounded-[var(--radius-button)] file:border-0 file:bg-sunken file:px-3 file:py-2 file:t-small file:font-medium file:text-ink"
            />
          </Field>
          <Button type="submit" variant="secondary" disabled={pending}>
            Les fila
          </Button>
        </form>
        {error && (
          <p role="alert" className="px-4 pb-4 t-small text-danger sm:px-5">
            {error}
          </p>
        )}
      </Panel>

      {result && (
        <p role="status" className="rounded-lg bg-success-surface px-4 py-3 t-small text-success">
          {result}
        </p>
      )}

      {rows && (
        <Panel id="forhandsvisning" title={`2. Sjekk før du importerer: ${rows.length} medlemmer i fila`}>
          <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-line px-4 py-3 t-small text-ink-2 sm:px-5">
            <span>{count("new")} nye</span>
            <span>{count("existing")} finnes i registeret og legges til i gruppa</span>
            <span>{count("member")} er allerede i gruppa</span>
          </div>
          <div className="max-h-[28rem] overflow-auto">
            <table className="w-full t-small">
              <thead className="sticky top-0 bg-surface text-left text-ink-3">
                <tr>
                  <th className="px-4 py-2 font-medium sm:px-5">Navn</th>
                  <th className="px-2 py-2 font-medium">Født</th>
                  <th className="px-2 py-2 font-medium">Fotosamtykke</th>
                  <th className="px-4 py-2 font-medium sm:px-5">Import</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-t border-line">
                    <td className="px-4 py-2 text-ink sm:px-5">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-2 py-2 tnum text-ink-2">{r.birthYear ?? "–"}</td>
                    <td className="px-2 py-2 text-ink-2">{CONSENT[r.photoConsent]}</td>
                    <td className="px-4 py-2 sm:px-5">
                      <Status tone={MATCH[r.match].tone}>{MATCH[r.match].label}</Status>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-4 border-t border-line p-4 sm:p-5">
            {ignored.length > 0 && <p className="t-small text-ink-3">Ikke lest inn: {ignored.join(", ")}.</p>}
            <Checkbox
              checked={visible}
              onChange={(e) => setVisible(e.target.checked)}
              label="Nye personer kan vises på nettsiden"
              description="Uten dette merkes de «Ikke publiser» og vises ikke offentlig før du endrer det på personen."
            />
            <Button onClick={confirm} disabled={pending || toImport.length === 0} className="justify-self-start">
              Importer {toImport.length} {toImport.length === 1 ? "person" : "personer"}
            </Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
