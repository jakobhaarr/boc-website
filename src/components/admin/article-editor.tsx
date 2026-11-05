"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { chooseArticlePhoto, deleteArticle, removeArticlePhoto, restoreArticleVersion, setArticlePhoto, updateArticle } from "@/app/actions";
import { DangerZone } from "@/components/admin/danger-zone";
import { HistoryList, type HistoryRow } from "@/components/admin/group-editor";
import { ButtonRow, HtmlRow, PhotoRow, PlusMenu, newId } from "@/components/admin/body-editor";
import { PhotoField } from "@/components/admin/photo-field";
import { PhotoLibraryPicker } from "@/components/admin/photo-library-picker";
import { SaveBar } from "@/components/admin/save-bar";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { HTML_HEIGHT, MAX_BUTTONS, MAX_HTML_BLOCKS, clampHtmlHeight, personNameIn } from "@/lib/article-cta";
import { LEAD_MAX, MAX_ADDED, PARAGRAPH_MAX, TITLE_MAX, type ArticleEdit, type ArticleInsert, type BlockRow } from "@/lib/article-edit";
import { checkText } from "@/lib/group-fields";
import type { PhotographerOption } from "@/lib/photo-meta";

interface ArticleView {
  id: string;
  href?: string;
  title: string;
  lead: string;
  rows: BlockRow[];
  authorUserId: string;
  /** The main picture now, if it has one. */
  hero?: { id: string; src: string; alt: string };
}

type Tab = "innlegg" | "historikk";

/** A block added in the text, with what is needed to show it (a picture's thumbnail). */
type DraftInsert = { id: string; afterIndex: number } & ({ t: "button"; label: string; url: string } | { t: "html"; code: string; height: number } | { t: "photo"; photoId: string; src: string; alt: string });

interface Draft {
  title: string;
  lead: string;
  texts: Record<number, string>;
  added: string[];
  /** The button and HTML blocks the article has, by index; null once removed. */
  buttons: Record<number, { label: string; url: string } | null>;
  htmls: Record<number, { code: string; height: number } | null>;
  inserts: DraftInsert[];
  author: string;
  node: string;
}

/**
 * Edit an article on a phone: headline, lead, then the text one block at a
 * time, the main picture (one from the library, or none) and who is named as
 * author. Photos in the text, galleries, lists, quotes and paragraphs with
 * links stay as they are and show as fixed rows, so editing never loses them. Only changed text is sent, and it goes live at once; the
 * history tab puts an earlier version back.
 */
export function ArticleEditor({
  article,
  authors,
  canChangeAuthor,
  canDelete,
  deleteBlock,
  nodeId,
  nodes,
  history,
  editedLine,
  photo,
  canHtml = false,
  people = [],
}: {
  article: ArticleView;
  authors: { id: string; name: string; detail: string }[];
  canChangeAuthor: boolean;
  canDelete: boolean;
  /** The group the article is published for, and the groups the user may move it to. */
  nodeId: string;
  nodes: { id: string; label: string }[];
  /** Why the article cannot be deleted now, if so. */
  deleteBlock?: string;
  history: HistoryRow[];
  editedLine?: string;
  /** Who may be named as photographer, and the members who can be ticked as in a new picture. */
  photo: { photographers: PhotographerOption[]; clubName: string; members: { id: string; name: string; consent: "granted" | "declined" | "unknown"; other?: boolean }[] };
  /** Club administrators may add and change HTML (checked again on the server). */
  canHtml?: boolean;
  /** Registered people whose full names must not stand in a button or in code. */
  people?: { firstName: string; lastName: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>("innlegg");
  const initialTexts = useMemo(() => Object.fromEntries(article.rows.flatMap((r) => (r.editable && (r.kind === "paragraph" || r.kind === "heading") ? [[r.index, r.text]] : []))) as Record<number, string>, [article.rows]);
  const initialButtons = useMemo(() => Object.fromEntries(article.rows.flatMap((r) => (r.editable && r.kind === "button" ? [[r.index, { label: r.label, url: r.url }]] : []))) as Record<number, { label: string; url: string } | null>, [article.rows]);
  const initialHtmls = useMemo(() => Object.fromEntries(article.rows.flatMap((r) => (r.editable && r.kind === "html" ? [[r.index, { code: r.code, height: r.height }]] : []))) as Record<number, { code: string; height: number } | null>, [article.rows]);

  const [saved, setSaved] = useState<Draft>({ title: article.title, lead: article.lead, texts: initialTexts, added: [] as string[], buttons: initialButtons, htmls: initialHtmls, inserts: [], author: article.authorUserId, node: nodeId });
  const [libraryAfter, setLibraryAfter] = useState<number | null>(null);
  const [draft, setDraft] = useState(saved);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
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
      const texts: Record<number, string> = {};
      for (const [k, v] of Object.entries(draft.texts)) if (v !== saved.texts[Number(k)]) texts[Number(k)] = v;
      // Only what was changed is sent: buttons and HTML are left out while they are as they were.
      const buttons: NonNullable<ArticleEdit["buttons"]> = {};
      for (const [k, v] of Object.entries(draft.buttons)) if (JSON.stringify(v) !== JSON.stringify(saved.buttons[Number(k)])) buttons[Number(k)] = v;
      const htmls: NonNullable<ArticleEdit["htmls"]> = {};
      for (const [k, v] of Object.entries(draft.htmls)) if (JSON.stringify(v) !== JSON.stringify(saved.htmls[Number(k)])) htmls[Number(k)] = v;
      const inserts: ArticleInsert[] = draft.inserts.map((i) => (i.t === "button" ? { afterIndex: i.afterIndex, t: "button", label: i.label, url: i.url } : i.t === "html" ? { afterIndex: i.afterIndex, t: "html", code: i.code, height: i.height } : { afterIndex: i.afterIndex, t: "photo", photoId: i.photoId }));
      const edit: ArticleEdit = {
        title: draft.title,
        lead: draft.lead,
        texts,
        added: draft.added,
        buttons,
        htmls,
        inserts,
        authorUserId: canChangeAuthor && draft.author !== saved.author ? draft.author : undefined,
        nodeId: canChangeAuthor && draft.node !== saved.node ? draft.node : undefined,
      };
      const res = await updateArticle(article.id, edit);
      if (!res.ok) return setError(res.error);
      setDone(res.changed ? "Lagret. Endringen er synlig på nettsiden nå." : "Ingen endringer å lagre.");
      announceChange();
      // Start over from what is stored: removed and added paragraphs get new positions.
      window.location.reload();
    });

  const restore = (id: string) =>
    start(async () => {
      setError(null);
      const res = await restoreArticleVersion(id);
      if (!res.ok) return setError(res.error);
      announceChange();
      window.location.reload();
    });

  const setText = (index: number, value: string) => setDraft((d) => ({ ...d, texts: { ...d.texts, [index]: value } }));
  const titleError = draft.title ? checkText("Overskrift", draft.title, TITLE_MAX) : null;
  const leadError = draft.lead ? checkText("Ingress", draft.lead, LEAD_MAX) : null;
  const buttonCount = Object.values(draft.buttons).filter(Boolean).length + draft.inserts.filter((i) => i.t === "button").length;
  const htmlCount = Object.values(draft.htmls).filter(Boolean).length + draft.inserts.filter((i) => i.t === "html").length;
  const updateInsert = (id: string, patch: Record<string, unknown>) => setDraft((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === id ? ({ ...i, ...patch } as DraftInsert) : i)) }));
  const removeInsert = (id: string) => setDraft((d) => ({ ...d, inserts: d.inserts.filter((i) => i.id !== id) }));
  /** What was added after the block at `index` (-1: before the first), shown in order as editable rows. */
  const inserted = (index: number) =>
    draft.inserts
      .filter((i) => i.afterIndex === index)
      .map((i) =>
        i.t === "button" ? (
          <ButtonRow key={i.id} item={{ id: i.id, type: "button", label: i.label, url: i.url }} people={people} onChange={(patch) => updateInsert(i.id, patch)} onRemove={() => removeInsert(i.id)} />
        ) : i.t === "html" ? (
          <HtmlRow key={i.id} item={{ id: i.id, type: "html", code: i.code, height: i.height }} people={people} onChange={(patch) => updateInsert(i.id, patch)} onRemove={() => removeInsert(i.id)} />
        ) : (
          <PhotoRow key={i.id} picture={{ id: i.photoId, src: i.src, alt: i.alt }} onRemove={() => removeInsert(i.id)} />
        ),
      );
  const titleId = useId();
  const leadId = useId();
  const authorId = useId();
  const nodeFieldId = useId();

  return (
    <div>
      <div role="tablist" aria-label="Deler av innlegget" className="-mx-4 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {(
          [
            ["innlegg", "Innlegget"],
            ["historikk", "Historikk"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn("relative shrink-0 px-3 py-3 t-label whitespace-nowrap transition-colors", tab === id ? "text-ink after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:bg-ink" : "text-ink-3 hover:text-ink")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid max-w-[44rem] gap-5 pb-6">
        {tab === "innlegg" && (
          <>
            {editedLine && <p className="t-meta text-ink-3">{editedLine}</p>}
            <Field label="Overskrift" htmlFor={titleId} error={titleError ?? undefined} hint={<Count left={TITLE_MAX - draft.title.length} />}>
              <Input id={titleId} value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} aria-invalid={!!titleError} />
            </Field>
            <Field label="Ingress" htmlFor={leadId} optional error={leadError ?? undefined} hint={<>Kort innledning under overskriften. <Count left={LEAD_MAX - draft.lead.length} /></>}>
              <Textarea id={leadId} rows={3} value={draft.lead} onChange={(e) => setDraft((d) => ({ ...d, lead: e.target.value }))} aria-invalid={!!leadError} />
            </Field>

            {/* The main picture: uploaded (with who took it, who is in it and their consent), or taken from the library. These act at once, as on a group's page. */}
            <PhotoField
              label="Bilde"
              current={article.hero && { src: article.hero.src, alt: article.hero.alt }}
              photographers={photo.photographers}
              clubName={photo.clubName}
              people={photo.members.map((m) => ({ ...m, status: "visible" as const }))}
              showsPeople
              onUpload={(f) => {
                f.set("articleId", article.id);
                return setArticlePhoto(f);
              }}
              onRemove={() => removeArticlePhoto(article.id)}
              onChoose={(photoId) => chooseArticlePhoto(article.id, photoId)}
            />

            <div className="grid gap-4">
              <p className="t-label text-ink">Tekst</p>
              {inserted(-1)}
              {article.rows.map((r) => {
                if (!r.editable) {
                  return (
                    <div key={r.index} className="grid gap-2">
                      <p className="rounded-md border border-dashed border-line-strong bg-sunken/60 px-3 py-2.5 t-small text-ink-3">{r.label}. Beholdes som den er.</p>
                      {inserted(r.index)}
                    </div>
                  );
                }
                if (r.kind === "button") {
                  const v = draft.buttons[r.index];
                  return (
                    <div key={r.index} className="grid gap-2">
                      {v ? (
                        <ButtonRow item={{ id: `b${r.index}`, type: "button", ...v }} people={people} onChange={(patch) => setDraft((d) => ({ ...d, buttons: { ...d.buttons, [r.index]: { ...v, ...(patch as { label?: string; url?: string }) } } }))} onRemove={() => setDraft((d) => ({ ...d, buttons: { ...d.buttons, [r.index]: null } }))} />
                      ) : (
                        <RemovedRow what="Knappen" onUndo={() => setDraft((d) => ({ ...d, buttons: { ...d.buttons, [r.index]: initialButtons[r.index] } }))} />
                      )}
                      {inserted(r.index)}
                    </div>
                  );
                }
                if (r.kind === "html") {
                  const v = draft.htmls[r.index];
                  return (
                    <div key={r.index} className="grid gap-2">
                      {v ? (
                        canHtml ? (
                          <HtmlRow item={{ id: `h${r.index}`, type: "html", ...v }} people={people} onChange={(patch) => setDraft((d) => ({ ...d, htmls: { ...d.htmls, [r.index]: { ...v, ...(patch as { code?: string; height?: number }) } } }))} onRemove={() => setDraft((d) => ({ ...d, htmls: { ...d.htmls, [r.index]: null } }))} />
                        ) : (
                          <p className="rounded-md border border-dashed border-line-strong bg-sunken/60 px-3 py-2.5 t-small text-ink-3">HTML-kode. Bare klubbadministrator kan endre den. Beholdes som den er.</p>
                        )
                      ) : (
                        <RemovedRow what="HTML-blokken" onUndo={() => setDraft((d) => ({ ...d, htmls: { ...d.htmls, [r.index]: initialHtmls[r.index] } }))} />
                      )}
                      {inserted(r.index)}
                    </div>
                  );
                }
                return (
                  <div key={r.index} className="grid gap-2">
                    <TextBlock kind={r.kind} value={draft.texts[r.index] ?? ""} original={initialTexts[r.index]} onChange={(v) => setText(r.index, v)} />
                    {r.kind === "paragraph" && draft.texts[r.index]?.trim() && (
                      <div className="flex justify-end">
                        <PlusMenu
                          always
                          canButton={buttonCount < MAX_BUTTONS}
                          canHtml={canHtml && htmlCount < MAX_HTML_BLOCKS}
                          canPicture
                          onButton={() => setDraft((d) => ({ ...d, inserts: [...d.inserts, { id: newId(), afterIndex: r.index, t: "button", label: "", url: "" }] }))}
                          onHtml={() => setDraft((d) => ({ ...d, inserts: [...d.inserts, { id: newId(), afterIndex: r.index, t: "html", code: "", height: HTML_HEIGHT.default }] }))}
                          onPicture={() => setLibraryAfter(r.index)}
                          limitNote={buttonCount >= MAX_BUTTONS ? `Opptil ${MAX_BUTTONS} knapper per innlegg.` : undefined}
                        />
                      </div>
                    )}
                    {inserted(r.index)}
                  </div>
                );
              })}
              {draft.added.map((text, i) => (
                <TextBlock
                  key={`ny-${i}`}
                  kind="paragraph"
                  value={text}
                  isNew
                  onChange={(v) => setDraft((d) => ({ ...d, added: d.added.map((x, j) => (j === i ? v : x)) }))}
                  onRemove={() => setDraft((d) => ({ ...d, added: d.added.filter((_, j) => j !== i) }))}
                />
              ))}
              {draft.added.length < MAX_ADDED && (
                <Button variant="secondary" onClick={() => setDraft((d) => ({ ...d, added: [...d.added, ""] }))} className="self-start">
                  <Plus aria-hidden />
                  Legg til avsnitt
                </Button>
              )}
              <p className="t-small text-ink-3">Bilder som allerede står i teksten og adressen til innlegget endres ikke her. Trykk på pluss-knappen under et avsnitt for å legge til en knapp, et bilde fra biblioteket{canHtml ? " eller HTML" : ""}.</p>
              <PhotoLibraryPicker
                open={libraryAfter !== null}
                onClose={() => setLibraryAfter(null)}
                onPick={(picked) => {
                  const after = libraryAfter;
                  setLibraryAfter(null);
                  const first = picked[0];
                  if (after === null || !first) return;
                  setDraft((d) => ({ ...d, inserts: [...d.inserts, { id: newId(), afterIndex: after, t: "photo", photoId: first.id, src: first.src, alt: first.alt }] }));
                }}
              />
            </div>

            {canChangeAuthor && nodes.length > 1 && (
              <Field label="Avsender (gruppe)" htmlFor={nodeFieldId} hint="Gruppen innlegget står på. Du kan flytte det til en gruppe du selv styrer. Adressen til innlegget endres ikke.">
                <Select id={nodeFieldId} value={draft.node} onChange={(e) => setDraft((d) => ({ ...d, node: e.target.value }))}>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {canChangeAuthor ? (
              <Field label="Forfatter" htmlFor={authorId} hint="Navnet som står under overskriften på nettsiden.">
                <Select id={authorId} value={draft.author} onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}>
                  {authors.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                      {a.detail ? ` (${a.detail})` : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            {canDelete && (
              <DangerZone
                className="mt-4"
                title="Slett innlegget"
                action="Slett innlegget"
                blocked={deleteBlock ? [deleteBlock] : undefined}
                undo="Du finner innlegget under «Slettet» i 30 dager og kan gjenopprette det. Etter det er det borte for godt."
                what={<p>Innlegget fjernes fra nettsiden med en gang. Bildene beholdes. Hvis det er på forsiden eller lenket til fra et sitat, fjernes det der også.</p>}
                onDelete={async () => {
                  const res = await deleteArticle(article.id);
                  if (res.ok) {
                    announceChange();
                    window.location.href = "/admin/innhold?status=slettet";
                  }
                  return res;
                }}
              />
            )}
          </>
        )}

        {tab === "historikk" && <HistoryList rows={history} onRestore={restore} pending={pending} />}
      </div>

      <SaveBar
        dirty={dirty}
        pending={pending}
        error={error}
        done={done}
        onSave={save}
        onDiscard={() => {
          setDraft(saved);
          setError(null);
        }}
        href={article.href}
      />
    </div>
  );
}

const Count = ({ left }: { left: number }) => <span className={cn("block tnum", left < 0 ? "text-danger" : left < 20 ? "text-warning" : "")}>{left} tegn igjen</span>;

/** One paragraph or subheading. Emptying it removes it, and says so before saving. */
function TextBlock({
  kind,
  value,
  original,
  onChange,
  onRemove,
  isNew,
}: {
  kind: "paragraph" | "heading";
  value: string;
  original?: string;
  onChange: (v: string) => void;
  onRemove?: () => void;
  isNew?: boolean;
}) {
  const id = useId();
  const removed = !isNew && !value.trim();
  const error = value ? checkText("Teksten", value, PARAGRAPH_MAX) : null;
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="t-meta font-semibold text-ink-3">
          {kind === "heading" ? "Mellomtittel" : isNew ? "Nytt avsnitt" : "Avsnitt"}
        </label>
        {onRemove ? (
          <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
            <Trash2 aria-hidden className="size-3.5" />
            Fjern
          </button>
        ) : removed ? (
          <button type="button" onClick={() => onChange(original ?? "")} className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
            <RotateCcw aria-hidden className="size-3.5" />
            Angre fjerning
          </button>
        ) : (
          <button type="button" onClick={() => onChange("")} className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
            <Trash2 aria-hidden className="size-3.5" />
            Fjern
          </button>
        )}
      </div>
      {removed ? (
        <p className="rounded-md border border-dashed border-danger/40 bg-danger-surface px-3 py-2.5 t-small text-danger">Avsnittet fjernes når du lagrer.</p>
      ) : (
        <Textarea id={id} rows={kind === "heading" ? 1 : 5} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} />
      )}
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** A removed button or HTML block: says so before saving and offers to take it back. */
function RemovedRow({ what, onUndo }: { what: string; onUndo: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-danger/40 bg-danger-surface px-3 py-2.5 t-small text-danger">
      <span>{what} fjernes når du lagrer.</span>
      <button type="button" onClick={onUndo} className="inline-flex items-center gap-1 font-medium hover:underline">
        <RotateCcw aria-hidden className="size-3.5" />
        Angre fjerning
      </button>
    </div>
  );
}
