"use client";

import { History } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { restoreGroupVersion, updateGroup } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { SaveBar } from "@/components/admin/save-bar";
import { Field, Input, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import {
  ABOUT_FIELDS,
  FIRST_TRAINING_FIELDS,
  checkText,
  type FirstTrainingKey,
  type GroupEdit,
  type TextField,
} from "@/lib/group-fields";
import { ftpText, longRideText, REFERENCE_WEIGHT_KG, type PaceGuide } from "@/lib/rider-fit";

export interface HistoryRow {
  id: string;
  who: string;
  when: string;
  summary: string;
  fields: string[];
}

interface Values {
  summary: string;
  description: string;
  joinInfo: string;
  firstTraining: Record<FirstTrainingKey, string>;
}

/** The guide's numbers as text, so a field can be empty (an open end) while being typed. */
interface GuideForm {
  longRide: [string, string];
  ftp: [string, string];
  soloSpeed: [string, string];
}

const toForm = (g: PaceGuide): GuideForm => ({
  longRide: g.longRide.map((n) => String(n)) as [string, string],
  ftp: g.ftp.map((n) => (n === null ? "" : String(n))) as [string, string],
  soloSpeed: g.soloSpeed.map((n) => (n === null ? "" : String(n))) as [string, string],
});
const num = (s: string) => (s.trim() === "" ? null : Number(s.replace(",", ".")));
const fromForm = (f: GuideForm): PaceGuide => ({
  longRide: [num(f.longRide[0]) ?? NaN, num(f.longRide[1]) ?? NaN],
  ftp: [num(f.ftp[0]), num(f.ftp[1])],
  soloSpeed: [num(f.soloSpeed[0]), num(f.soloSpeed[1])],
});

type Tab = "om" | "forste" | "fart" | "historikk";

/**
 * One group's editor, built for a phone: one column, big controls, tabs that
 * scroll sideways and a save bar that stays above the tab bar. Everything is
 * saved together and goes live at once (updateGroup); the bar says what the
 * save does and the last save links straight to the page.
 *
 * Only what changed is sent. Each text shows its limit and where it appears
 * on the public site, and the first-training fields show what the page says
 * if the group leaves one empty (the level above's answer).
 */
export function GroupEditor({
  group,
  values,
  inherited,
  guide,
  history,
}: {
  group: { id: string; name: string; href: string };
  values: Values;
  inherited: Partial<Record<FirstTrainingKey, { value: string; from: string }>>;
  guide: PaceGuide | null;
  history: HistoryRow[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>("om");
  // The last saved state: what "changed" is measured against.
  const [saved, setSaved] = useState(values);
  const [savedGuide, setSavedGuide] = useState<GuideForm | null>(guide ? toForm(guide) : null);
  const [draft, setDraft] = useState(values);
  const [guideDraft, setGuideDraft] = useState<GuideForm | null>(guide ? toForm(guide) : null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "om", label: "Om gruppa" },
    { id: "forste", label: "Første trening" },
    ...(guideDraft ? [{ id: "fart" as const, label: "Fart og FTP" }] : []),
    { id: "historikk", label: "Historikk" },
  ];

  /* ── What changed ─────────────────────────────────────────────────── */
  const edit = useMemo(() => {
    const out: GroupEdit = {};
    for (const f of ABOUT_FIELDS) if (draft[f.key] !== saved[f.key]) out[f.key] = draft[f.key];
    const ft = FIRST_TRAINING_FIELDS.filter((f) => draft.firstTraining[f.key] !== saved.firstTraining[f.key]);
    if (ft.length) out.firstTraining = Object.fromEntries(FIRST_TRAINING_FIELDS.map((f) => [f.key, draft.firstTraining[f.key]]));
    if (guideDraft && savedGuide && JSON.stringify(guideDraft) !== JSON.stringify(savedGuide)) out.paceGuide = fromForm(guideDraft);
    return out;
  }, [draft, saved, guideDraft, savedGuide]);
  const dirty = Object.keys(edit).length > 0;

  // Leaving with unsaved changes asks first.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    start(async () => {
      setError(null);
      setDone(null);
      const res = await updateGroup(group.id, edit);
      if (!res.ok) return setError(res.error);
      setSaved(draft);
      setSavedGuide(guideDraft);
      setDone("Lagret. Endringen er synlig på nettsiden nå.");
      announceChange();
      router.refresh();
    });

  const discard = () => {
    setDraft(saved);
    setGuideDraft(savedGuide);
    setError(null);
  };

  const restore = (id: string) =>
    start(async () => {
      setError(null);
      const res = await restoreGroupVersion(id);
      if (!res.ok) return setError(res.error);
      setDone("Tidligere versjon er gjenopprettet.");
      announceChange();
      // The editor starts over from the restored values.
      window.location.reload();
    });

  return (
    <div>
      <div role="tablist" aria-label="Deler av gruppen" className="-mx-4 flex gap-1 overflow-x-auto border-b border-line px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative shrink-0 px-3 py-3 t-label whitespace-nowrap transition-colors",
              tab === t.id ? "text-ink after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:bg-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid max-w-[44rem] gap-5 pb-6">
        {tab === "om" && (
          <>
            {ABOUT_FIELDS.map((f) => (
              <TextControl key={f.key} def={f} value={draft[f.key]} onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))} optional={f.key === "joinInfo"} />
            ))}
          </>
        )}

        {tab === "forste" && (
          <>
            <p className="t-small text-ink-2">
              Dette er det nye medlemmer vil vite før de kommer første gang. La et felt stå tomt hvis det ikke gjelder, eller hvis svaret fra nivået over er riktig for dere.
            </p>
            {FIRST_TRAINING_FIELDS.map((f) => (
              <TextControl
                key={f.key}
                def={f}
                value={draft.firstTraining[f.key]}
                onChange={(v) => setDraft((d) => ({ ...d, firstTraining: { ...d.firstTraining, [f.key]: v } }))}
                optional
                inherited={inherited[f.key]}
              />
            ))}
          </>
        )}

        {tab === "fart" && guideDraft && <PaceGuideForm value={guideDraft} onChange={setGuideDraft} />}

        {tab === "historikk" && <HistoryList rows={history} onRestore={restore} pending={pending} />}
      </div>

      <SaveBar dirty={dirty} pending={pending} error={error} done={done} onSave={save} onDiscard={discard} href={group.href} />
    </div>
  );
}

/* ── One text field: label, where it shows, a counter and any inherited answer ── */

function TextControl({
  def,
  value,
  onChange,
  optional,
  inherited,
}: {
  def: TextField;
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
  inherited?: { value: string; from: string };
}) {
  const id = useId();
  const error = value ? checkText(def.label, value, def.max) : null;
  const left = def.max - value.length;
  return (
    <Field
      label={def.label}
      htmlFor={id}
      optional={optional}
      error={error ?? undefined}
      hint={
        <>
          {def.shownAt}
          {inherited && !value && (
            <span className="mt-1 block">
              Nå står det: «{inherited.value}» (fra {inherited.from}).
            </span>
          )}
          <span className={cn("mt-1 block tnum", left < 0 ? "text-danger" : left < 20 ? "text-warning" : "")}>{left} tegn igjen</span>
        </>
      }
    >
      {def.rows <= 1 ? (
        <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      ) : (
        <Textarea
          id={id}
          value={value}
          rows={def.rows}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
        />
      )}
    </Field>
  );
}

/* ── Pace and FTP ─────────────────────────────────────────────────────── */

function PaceGuideForm({ value, onChange }: { value: GuideForm; onChange: (v: GuideForm) => void }) {
  const set = (key: keyof GuideForm, i: 0 | 1, v: string) => onChange({ ...value, [key]: i === 0 ? [v, value[key][1]] : [value[key][0], v] });
  const guide = fromForm(value);
  const ok = !Number.isNaN(guide.longRide[0]) && !Number.isNaN(guide.longRide[1]);
  return (
    <>
      <p className="t-small text-ink-2">
        Tallene brukes i gruppefinderen: farten vises på resultatet, og FTP og vekt avgjør hvilken gruppe en rytter anbefales. Svar ut fra hva gruppa faktisk gjør.
      </p>
      <Pair
        title="Fart på langtur i gruppa"
        hint="Snittfart på søndagens langtur, i km/t."
        unit="km/t"
        value={value.longRide}
        onChange={(i, v) => set("longRide", i, v)}
        labels={["Fra", "Til"]}
      />
      <Pair
        title={`FTP i gruppa, for en mann på ${REFERENCE_WEIGHT_KG} kg`}
        hint="Typisk FTP i watt. La «Fra» stå tomt for «opp til», og «Til» tomt for «over»."
        unit="watt"
        value={value.ftp}
        onChange={(i, v) => set("ftp", i, v)}
        labels={["Fra", "Til"]}
      />
      <Pair
        title="Fart alene som passer til gruppa"
        hint="Fart på rolig langtur alene, i km/t. Lavere enn gruppefarten, siden man ligger i le i en gruppe. Brukes i den enkle velgeren."
        unit="km/t"
        value={value.soloSpeed}
        onChange={(i, v) => set("soloSpeed", i, v)}
        labels={["Fra", "Til"]}
      />
      {ok && (
        <div className="rounded-lg bg-sunken px-4 py-3 shadow-[inset_0_0_0_1px_var(--border)]">
          <p className="t-meta text-ink-3">Slik står det på siden</p>
          <p className="mt-1 t-small text-ink">
            Langtur søndag: {longRideText(guide.longRide)}
            {ftpText(guide.ftp) && ` · Gruppas FTP ved ${REFERENCE_WEIGHT_KG} kg: ${ftpText(guide.ftp)}`}
          </p>
        </div>
      )}
    </>
  );
}

function Pair({
  title,
  hint,
  unit,
  value,
  onChange,
  labels,
}: {
  title: string;
  hint: string;
  unit: string;
  value: [string, string];
  onChange: (i: 0 | 1, v: string) => void;
  labels: [string, string];
}) {
  const id = useId();
  return (
    <fieldset className="grid gap-1.5">
      <legend className="t-label text-ink">{title}</legend>
      <div className="mt-1.5 grid grid-cols-2 gap-3">
        {([0, 1] as const).map((i) => (
          <div key={i} className="relative">
            <label htmlFor={`${id}-${i}`} className="sr-only">
              {title}, {labels[i].toLowerCase()}
            </label>
            <Input id={`${id}-${i}`} inputMode="decimal" value={value[i]} onChange={(e) => onChange(i, e.target.value)} placeholder={labels[i]} className="pr-14 tnum" />
            <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 t-meta text-ink-3">
              {unit}
            </span>
          </div>
        ))}
      </div>
      <p className="t-small text-ink-3">{hint}</p>
    </fieldset>
  );
}

/* ── History ──────────────────────────────────────────────────────────── */

export function HistoryList({ rows, onRestore, pending }: { rows: HistoryRow[]; onRestore: (id: string) => void; pending: boolean }) {
  const [confirm, setConfirm] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (!rows.length)
    return (
      <p className="rounded-lg border border-dashed border-line-strong px-4 py-6 text-center t-small text-ink-3">
        Ingen endringer er gjort i admin ennå. Når noen endrer noe, står det her, og du kan gå tilbake til forrige versjon.
      </p>
    );
  return (
    <Panel title="Siste endringer">
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5">
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 t-label font-semibold">
                <History aria-hidden className="size-4 text-ink-3" />
                {r.who}
              </span>
              <span className="mt-0.5 block t-small text-ink-2">{r.summary}</span>
              <span className="mt-0.5 block t-meta text-ink-3">{r.when}</span>
            </span>
            {confirm === r.id ? (
              <span className="flex items-center gap-2">
                <Button size="sm" disabled={pending} onClick={() => onRestore(r.id)}>
                  Ja, gå tilbake
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirm(null)}>
                  Avbryt
                </Button>
              </span>
            ) : (
              <Button size="sm" variant="secondary" disabled={pending} onClick={() => setConfirm(r.id)}>
                Gå tilbake til før denne
              </Button>
            )}
          </li>
        ))}
      </ul>
    </Panel>
  );
}
