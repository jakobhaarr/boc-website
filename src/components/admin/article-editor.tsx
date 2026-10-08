"use client";

import { ImageIcon, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { deleteArticle, restoreArticleVersion, updateArticle } from "@/app/actions";
import { DangerZone } from "@/components/admin/danger-zone";
import { HistoryList, type HistoryRow } from "@/components/admin/group-editor";
import { PhotoLibraryPicker } from "@/components/admin/photo-library-picker";
import { SaveBar } from "@/components/admin/save-bar";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { LEAD_MAX, MAX_ADDED, PARAGRAPH_MAX, TITLE_MAX, type ArticleEdit, type BlockRow } from "@/lib/article-edit";
import { checkText } from "@/lib/group-fields";

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
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [tab, setTab] = useState<Tab>("innlegg");
  const initialTexts = useMemo(() => Object.fromEntries(article.rows.flatMap((r) => (r.editable ? [[r.index, r.text]] : []))) as Record<number, string>, [article.rows]);

  const [saved, setSaved] = useState({ title: article.title, lead: article.lead, texts: initialTexts, added: [] as string[], author: article.authorUserId, node: nodeId, hero: article.hero?.id ?? "" });
  const [picking, setPicking] = useState(false);
  // What the main picture looks like now: the stored one, or one just chosen from the library.
  const [heroView, setHeroView] = useState<{ src: string; alt: string } | undefined>(article.hero && { src: article.hero.src, alt: article.hero.alt });
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
      const edit: ArticleEdit = {
        title: draft.title,
        lead: draft.lead,
        texts,
        added: draft.added,
        authorUserId: canChangeAuthor && draft.author !== saved.author ? draft.author : undefined,
        nodeId: canChangeAuthor && draft.node !== saved.node ? draft.node : undefined,
        heroPhotoId: draft.hero !== saved.hero ? draft.hero : undefined,
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

            <div className="grid gap-3">
              <p className="t-label text-ink">Bilde</p>
              {heroView && draft.hero ? (
                // A plain img: the source may be a data address.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={heroView.src} alt={heroView.alt} className="aspect-[3/2] w-full max-w-[26rem] rounded-lg object-cover ring-1 ring-line" />
              ) : (
                <p className="rounded-md border border-dashed border-line-strong bg-sunken/60 px-3 py-6 t-small text-ink-3">{draft.hero ? "Bildet vises etter at du har lagret." : "Innlegget har ikke noe hovedbilde."}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPicking(true)}>
                  <ImageIcon aria-hidden />
                  {draft.hero ? "Bytt bilde" : "Velg bilde"}
                </Button>
                {draft.hero && (
                  <Button variant="ghost" size="sm" onClick={() => setDraft((d) => ({ ...d, hero: "" }))}>
                    Fjern bildet
                  </Button>
                )}
              </div>
              <p className="t-small text-ink-3">Velg fra bildebiblioteket: bildene er allerede kontrollert og har samtykke. Et nytt bilde lastes opp under Bilder eller i et nytt innlegg.</p>
            </div>

            <div className="grid gap-4">
              <p className="t-label text-ink">Tekst</p>
              {article.rows.map((r) =>
                r.editable ? (
                  <TextBlock
                    key={r.index}
                    kind={r.kind}
                    value={draft.texts[r.index] ?? ""}
                    original={initialTexts[r.index]}
                    onChange={(v) => setText(r.index, v)}
                  />
                ) : (
                  <p key={r.index} className="rounded-md border border-dashed border-line-strong bg-sunken/60 px-3 py-2.5 t-small text-ink-3">
                    {r.label}. Beholdes som den er.
                  </p>
                ),
              )}
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
              <p className="t-small text-ink-3">Bilder inne i teksten og adressen til innlegget endres ikke her.</p>
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
          setHeroView(article.hero && { src: article.hero.src, alt: article.hero.alt });
          setError(null);
        }}
        href={article.href}
      />
      <PhotoLibraryPicker
        open={picking}
        onClose={() => setPicking(false)}
        title="Velg bilde til innlegget"
        exclude={draft.hero ? [draft.hero] : []}
        onPick={(photos) => {
          const p = photos[0];
          setPicking(false);
          if (!p) return;
          setDraft((d) => ({ ...d, hero: p.id }));
          setHeroView({ src: p.src, alt: p.alt });
        }}
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
