"use client";

import { Code2, Heading2, ImagePlus, Images, MousePointerClick, Plus, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { HtmlEmbed } from "@/components/public/html-embed";
import { Button, buttonClass } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import {
  BUTTON_LABEL_MAX,
  BUTTON_URL_HELP,
  HEADING_MAX,
  HTML_HEIGHT,
  HTML_MAX,
  MAX_BUTTONS,
  MAX_HTML_BLOCKS,
  clampHtmlHeight,
  normaliseButtonUrl,
  personNameIn,
  validateButton,
  validateHtml,
} from "@/lib/article-cta";

/**
 * The body of a news post as a list of blocks: paragraphs, call-to-action buttons, pictures placed in the text, and (for
 * club administrators) HTML. Click inside a paragraph and a «+» appears beside it; it adds a button, a picture or HTML
 * right after that paragraph, with a new paragraph below to keep writing in. Used by the composer (a new post) and the
 * article editor (an existing one).
 */
export type LayoutItem = { id: string } & (
  | { type: "text"; text: string }
  /** A subheading in the text: one line of plain text (no names, as in a button). */
  | { type: "heading"; text: string }
  | { type: "button"; label: string; url: string }
  | { type: "html"; code: string; height: number }
  /** A picture from the post's own pictures, by its draft key, or one taken from the library, by id. */
  | { type: "photo"; photoKey?: string; photoId?: string }
);

export const newId = () => Math.random().toString(36).slice(2, 10);
export const emptyText = (text = ""): LayoutItem => ({ id: newId(), type: "text", text });

/** A picture the writer can place in the text: a draft upload (by key) or a library picture (by id). */
export interface PlaceablePicture {
  key?: string;
  id?: string;
  src: string;
  alt: string;
}

const sameRef = (a: PlaceablePicture, i: { photoKey?: string; photoId?: string }) => (a.key && a.key === i.photoKey) || (a.id && a.id === i.photoId);

/** The first thing wrong with the blocks, in admin's words, or null. */
export function layoutProblem(items: LayoutItem[], people: { firstName: string; lastName: string }[]): string | null {
  let buttons = 0;
  let htmls = 0;
  for (const it of items) {
    if (it.type === "heading") {
      const n = personNameIn(it.text, people);
      if (n) return `Mellomtittelen kan ikke inneholde navnet ${n}.`;
    }
    if (it.type === "button") {
      buttons++;
      const p = validateButton(it.label, it.url);
      if (p) return p;
      const n = personNameIn(it.label, people);
      if (n) return `Knappeteksten kan ikke inneholde navnet ${n}.`;
    }
    if (it.type === "html") {
      htmls++;
      const p = validateHtml(it.code);
      if (p) return p;
      const n = personNameIn(it.code, people);
      if (n) return `HTML-koden kan ikke inneholde navnet ${n}.`;
    }
  }
  if (buttons > MAX_BUTTONS) return `Et innlegg kan ha opptil ${MAX_BUTTONS} knapper.`;
  if (htmls > MAX_HTML_BLOCKS) return `Et innlegg kan ha opptil ${MAX_HTML_BLOCKS} HTML-blokker.`;
  return null;
}

export function BodyEditor({
  items,
  onChange,
  canHtml,
  pictures,
  canAddPictures = true,
  onUpload,
  onLibrary,
  people,
  placeholder = "Hva skjedde? Noen setninger holder.",
}: {
  items: LayoutItem[];
  onChange: (items: LayoutItem[]) => void;
  /** Only club administrators may add HTML (checked again on the server). */
  canHtml: boolean;
  /** The post's pictures now, to place in the text. */
  pictures: PlaceablePicture[];
  /** False where new pictures are added another way (the article editor takes pictures from the library only). */
  canAddPictures?: boolean;
  /** Takes files from the picker and returns the draft keys of the pictures made of them. */
  onUpload?: (files: FileList) => Promise<string[]>;
  /** Opens the library; calls back with the ids picked. */
  onLibrary?: (then: (ids: string[]) => void) => void;
  /** People who must not be named in a button or in code (full names). */
  people: { firstName: string; lastName: string }[];
  placeholder?: string;
}) {
  const [pickerAfter, setPickerAfter] = useState<string | null>(null);
  const buttons = items.filter((i) => i.type === "button").length;
  const htmls = items.filter((i) => i.type === "html").length;

  const update = (id: string, patch: Partial<LayoutItem>) => onChange(items.map((i) => (i.id === id ? ({ ...i, ...patch } as LayoutItem) : i)));
  const remove = (id: string) => {
    const next = items.filter((i) => i.id !== id);
    // Two paragraphs side by side are joined into one place: there is always a paragraph to write in.
    onChange(next.length ? next : [emptyText()]);
  };
  /** Adds a block after `afterId` and, if a block is not followed by a paragraph, a new paragraph under it. */
  const insertAfter = (afterId: string, item: LayoutItem) => {
    const at = items.findIndex((i) => i.id === afterId);
    const next = [...items.slice(0, at + 1), item];
    const rest = items.slice(at + 1);
    if (rest[0]?.type !== "text") next.push(emptyText());
    onChange([...next, ...rest]);
  };

  const placedPictures = new Set(items.flatMap((i) => (i.type === "photo" ? [i.photoKey ?? i.photoId ?? ""] : [])));
  const available = pictures.filter((p) => !placedPictures.has(p.key ?? p.id ?? ""));

  return (
    <div className="grid gap-1">
      {items.map((item, index) => {
        if (item.type === "text") {
          return (
            <TextRow
              key={item.id}
              item={item}
              placeholder={index === 0 ? placeholder : "Fortsett å skrive …"}
              onText={(text) => update(item.id, { text })}
              plus={
                <PlusMenu
                  canButton={buttons < MAX_BUTTONS}
                  canHtml={canHtml && htmls < MAX_HTML_BLOCKS}
                  canPicture={canAddPictures || pictures.length > 0}
                  onHeading={() => insertAfter(item.id, { id: newId(), type: "heading", text: "" })}
                  onButton={() => insertAfter(item.id, { id: newId(), type: "button", label: "", url: "" })}
                  onPicture={() => setPickerAfter(item.id)}
                  onHtml={() => insertAfter(item.id, { id: newId(), type: "html", code: "", height: HTML_HEIGHT.default })}
                  limitNote={buttons >= MAX_BUTTONS ? `Opptil ${MAX_BUTTONS} knapper per innlegg.` : undefined}
                />
              }
              onRemove={items.length > 1 || item.text ? () => remove(item.id) : undefined}
            />
          );
        }
        if (item.type === "heading") return <HeadingRow key={item.id} item={item} people={people} onChange={(patch) => update(item.id, patch)} onRemove={() => remove(item.id)} />;
        if (item.type === "button") return <ButtonRow key={item.id} item={item} people={people} onChange={(patch) => update(item.id, patch)} onRemove={() => remove(item.id)} />;
        if (item.type === "html") return <HtmlRow key={item.id} item={item} people={people} onChange={(patch) => update(item.id, patch)} onRemove={() => remove(item.id)} />;
        const picture = pictures.find((p) => sameRef(p, item));
        return <PhotoRow key={item.id} picture={picture} onRemove={() => remove(item.id)} />;
      })}

      <Dialog
        open={pickerAfter !== null}
        onClose={() => setPickerAfter(null)}
        title="Bilde i teksten"
        description="Bildet står der du la inn pluss-knappen. Hovedbildet er det første bildet som ikke står i teksten."
        footer={
          <Button variant="secondary" onClick={() => setPickerAfter(null)}>
            Lukk
          </Button>
        }
      >
        <div className="grid gap-4">
          {available.length > 0 ? (
            <ul className="grid grid-cols-3 gap-2">
              {available.map((p) => (
                <li key={p.key ?? p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (pickerAfter) insertAfter(pickerAfter, { id: newId(), type: "photo", photoKey: p.key, photoId: p.id });
                      setPickerAfter(null);
                    }}
                    className="block w-full overflow-hidden rounded-sm ring-1 ring-line transition-shadow hover:ring-2 hover:ring-[var(--club-link)] focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.src} alt={p.alt} className="aspect-square w-full bg-sunken object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-small text-ink-3">
              {pictures.length ? "Alle bildene står allerede i teksten." : "Innlegget har ingen bilder ennå. Last opp et nytt, eller bruk et fra biblioteket."}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {canAddPictures && onUpload && (
              <label className={cn(buttonClass({ variant: "secondary" }), "cursor-pointer focus-within:ring-2 focus-within:ring-focus")}>
                <ImagePlus aria-hidden />
                Last opp nytt bilde
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const files = e.target.files;
                    const after = pickerAfter;
                    e.target.value = "";
                    if (!files?.length || !after) return;
                    setPickerAfter(null);
                    const keys = await onUpload(files);
                    if (keys[0]) insertAfter(after, { id: newId(), type: "photo", photoKey: keys[0] });
                  }}
                />
              </label>
            )}
            {onLibrary && (
              <Button
                variant="secondary"
                onClick={() => {
                  const after = pickerAfter;
                  setPickerAfter(null);
                  onLibrary((ids) => {
                    if (after && ids[0]) insertAfter(after, { id: newId(), type: "photo", photoId: ids[0] });
                  });
                }}
              >
                <Images aria-hidden />
                Fra bildebiblioteket
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}

/** One paragraph. Clicking into it shows the «+» beside it. */
function TextRow({
  item,
  placeholder,
  onText,
  onRemove,
  plus,
}: {
  item: Extract<LayoutItem, { type: "text" }>;
  placeholder: string;
  onText: (text: string) => void;
  onRemove?: () => void;
  plus: ReactNode;
}) {
  const id = useId();
  return (
    <div className="group relative">
      <label htmlFor={id} className="sr-only">
        Avsnitt
      </label>
      <textarea
        id={id}
        rows={1}
        value={item.text}
        onChange={(e) => onText(e.target.value)}
        placeholder={placeholder}
        className="peer block min-h-12 w-full resize-none bg-transparent py-2 pr-12 text-[17px] leading-relaxed [field-sizing:content] placeholder:text-ink-3 focus:outline-none"
      />
      <div className="absolute top-2 right-0">{plus}</div>
      {onRemove && !item.text && (
        <button type="button" onClick={onRemove} className="sr-only focus:not-sr-only focus:mb-1 focus:inline-flex focus:items-center focus:gap-1 focus:t-small focus:text-ink-2">
          <Trash2 aria-hidden className="size-3.5" />
          Fjern tomt avsnitt
        </button>
      )}
    </div>
  );
}

/**
 * The «+» with its menu: a button, a picture or HTML. It is a round button shown while the paragraph around it has focus
 * (always, but dimmed, on a phone where there is no hover); the menu closes when focus leaves it or a choice is made.
 */
export function PlusMenu({
  canButton,
  canHtml,
  canPicture,
  onButton,
  onPicture,
  onHtml,
  onHeading,
  limitNote,
  always,
}: {
  canButton: boolean;
  canHtml: boolean;
  canPicture: boolean;
  onButton: () => void;
  onPicture: () => void;
  onHtml: () => void;
  onHeading: () => void;
  limitNote?: string;
  /** Shown all the time, not only while the paragraph has focus (the article editor). */ always?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  // Closes on a click or a tab outside it, and on Escape. Not on «blur»: Safari does not give a clicked button focus, so the
  // menu would close on the press, before the choice is made.
  useEffect(() => {
    if (!open) return;
    const outside = (e: Event) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const choose = (fn: () => void) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Legg til knapp, bilde eller HTML etter dette avsnittet"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex size-9 items-center justify-center rounded-full bg-sunken text-ink ring-1 ring-line transition-[opacity,background-color] hover:bg-line/70 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-focus",
          open || always ? "opacity-100" : "opacity-0 group-focus-within:opacity-100 max-lg:opacity-60",
        )}
      >
        {open ? <X aria-hidden className="size-4" /> : <Plus aria-hidden className="size-4" />}
      </button>
      {open && (
        <div className="absolute top-11 right-0 z-20 w-64 rounded-lg bg-surface p-1.5 shadow-lg ring-1 ring-line">
          <InsertMenu
            canButton={canButton}
            canHtml={canHtml}
            canPicture={canPicture}
            onButton={choose(onButton)}
            onPicture={choose(onPicture)}
            onHtml={choose(onHtml)}
            onHeading={choose(onHeading)}
            limitNote={limitNote}
          />
        </div>
      )}
    </div>
  );
}

function InsertMenu({
  canButton,
  canHtml,
  canPicture,
  onButton,
  onPicture,
  onHtml,
  onHeading,
  limitNote,
}: {
  canButton: boolean;
  canHtml: boolean;
  canPicture: boolean;
  onButton: () => void;
  onPicture: () => void;
  onHtml: () => void;
  onHeading: () => void;
  limitNote?: string;
}) {
  const item =
    "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-sunken focus-visible:bg-sunken disabled:opacity-45 disabled:hover:bg-transparent";
  return (
    <div role="menu" aria-label="Legg til etter avsnittet" className="grid">
      <button type="button" role="menuitem" disabled={!canButton} onClick={onButton} className={item}>
        <MousePointerClick aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-2" />
        <span>
          <span className="block t-label font-medium">Knapp</span>
          <span className="block t-small text-ink-3">{limitNote ?? "En knapp med tekst og lenke"}</span>
        </span>
      </button>
      <button type="button" role="menuitem" onClick={onHeading} className={item}>
        <Heading2 aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-2" />
        <span>
          <span className="block t-label font-medium">Mellomtittel</span>
          <span className="block t-small text-ink-3">En overskrift midt i teksten</span>
        </span>
      </button>
      <button type="button" role="menuitem" disabled={!canPicture} onClick={onPicture} className={item}>
        <ImagePlus aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-2" />
        <span>
          <span className="block t-label font-medium">Bilde</span>
          <span className="block t-small text-ink-3">Last opp eget eller bruk fra bildebiblioteket</span>
        </span>
      </button>
      {canHtml && (
        <button type="button" role="menuitem" onClick={onHtml} className={item}>
          <Code2 aria-hidden className="mt-0.5 size-4 shrink-0 text-ink-2" />
          <span>
            <span className="block t-label font-medium">HTML-kode</span>
            <span className="block t-small text-ink-3">Avansert. Bare klubbadministrator</span>
          </span>
        </button>
      )}
    </div>
  );
}

const card = "relative my-2 rounded-lg bg-sunken/70 p-4 ring-1 ring-line";

function RowHeader({ icon, title, onRemove }: { icon: ReactNode; title: string; onRemove: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <p className="inline-flex items-center gap-2 t-meta font-semibold text-ink-2">
        {icon}
        {title}
      </p>
      <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
        <Trash2 aria-hidden className="size-3.5" />
        Fjern
      </button>
    </div>
  );
}

/** A call-to-action button: its text (a short limit, so it fits one line on a phone) and where it leads, with a preview as it will look. */
export function ButtonRow({
  item,
  people,
  onChange,
  onRemove,
}: {
  item: Extract<LayoutItem, { type: "button" }>;
  people: { firstName: string; lastName: string }[];
  onChange: (patch: Partial<LayoutItem>) => void;
  onRemove: () => void;
}) {
  const labelId = useId();
  const urlId = useId();
  const [touched, setTouched] = useState({ label: false, url: false });
  const left = BUTTON_LABEL_MAX - item.label.length;
  const name = personNameIn(item.label, people);
  const labelError = name ? `Knappeteksten kan ikke inneholde navnet ${name}.` : touched.label && !item.label.trim() ? "Knappen trenger en tekst." : null;
  const urlError = touched.url && item.url.trim() && !normaliseButtonUrl(item.url) ? BUTTON_URL_HELP : touched.url && !item.url.trim() ? "Knappen trenger en lenke." : null;
  const ready = !validateButton(item.label, item.url) && !name;
  return (
    <div className={card}>
      <RowHeader icon={<MousePointerClick aria-hidden className="size-4" />} title="Knapp" onRemove={onRemove} />
      <div className="grid gap-3">
        <div className="grid gap-1">
          <label htmlFor={labelId} className="t-small font-medium text-ink">
            Knappetekst
          </label>
          <input
            id={labelId}
            value={item.label}
            maxLength={BUTTON_LABEL_MAX}
            onChange={(e) => onChange({ label: e.target.value.replace(/\n/g, " ") })}
            onBlur={() => setTouched((t) => ({ ...t, label: true }))}
            placeholder="For eksempel Meld deg på"
            aria-invalid={!!labelError}
            className="h-10 w-full rounded-md bg-surface px-3 text-base ring-1 ring-line-strong focus:outline-none focus:ring-2 focus:ring-focus aria-[invalid=true]:ring-danger sm:text-sm"
          />
          <p className={cn("t-small tnum", left <= 5 ? "text-warning" : "text-ink-3")}>
            {item.label.length} av {BUTTON_LABEL_MAX} tegn
          </p>
          {labelError && (
            <p role="alert" className="t-small text-danger">
              {labelError}
            </p>
          )}
        </div>
        <div className="grid gap-1">
          <label htmlFor={urlId} className="t-small font-medium text-ink">
            Lenke
          </label>
          <input
            id={urlId}
            value={item.url}
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            onChange={(e) => onChange({ url: e.target.value })}
            onBlur={() => setTouched((t) => ({ ...t, url: true }))}
            placeholder="https://"
            aria-invalid={!!urlError}
            className="h-10 w-full rounded-md bg-surface px-3 text-base ring-1 ring-line-strong focus:outline-none focus:ring-2 focus:ring-focus aria-[invalid=true]:ring-danger sm:text-sm"
          />
          {urlError && (
            <p role="alert" className="t-small text-danger">
              {urlError}
            </p>
          )}
        </div>
        <div>
          <p className="mb-1.5 t-small text-ink-3">Slik ser knappen ut</p>
          <span aria-hidden className={cn(buttonClass({ variant: "accent", size: "lg" }), "pointer-events-none max-w-full")}>
            {item.label.trim() || "Knappetekst"}
          </span>
          {!ready && item.label.trim() && item.url.trim() && <span className="sr-only">Knappen er ikke ferdig utfylt</span>}
        </div>
      </div>
    </div>
  );
}

/** HTML for advanced users (club administrators): shown in a sandboxed frame, with a preview of it as visitors will see it. */
export function HtmlRow({
  item,
  people,
  onChange,
  onRemove,
}: {
  item: Extract<LayoutItem, { type: "html" }>;
  people: { firstName: string; lastName: string }[];
  onChange: (patch: Partial<LayoutItem>) => void;
  onRemove: () => void;
}) {
  const codeId = useId();
  const heightId = useId();
  const name = personNameIn(item.code, people);
  const problem = item.code.length > HTML_MAX ? validateHtml(item.code) : null;
  return (
    <div className={card}>
      <RowHeader icon={<Code2 aria-hidden className="size-4" />} title="HTML-kode" onRemove={onRemove} />
      <div className="grid gap-3">
        <p className="rounded-md bg-warning-surface px-3 py-2 t-small text-ink">
          Avansert. Koden vises i en skjermet ramme og kan ikke endre resten av siden. Legg ikke inn navn på personer eller bilder av personer: koden kan ikke anonymiseres
          automatisk.
        </p>
        <div className="grid gap-1">
          <label htmlFor={codeId} className="t-small font-medium text-ink">
            Kode
          </label>
          <textarea
            id={codeId}
            rows={6}
            value={item.code}
            onChange={(e) => onChange({ code: e.target.value })}
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="<iframe …></iframe>"
            className="w-full rounded-md bg-surface px-3 py-2.5 font-mono text-[13px] leading-relaxed ring-1 ring-line-strong focus:outline-none focus:ring-2 focus:ring-focus"
          />
          <p className={cn("t-small tnum", item.code.length > HTML_MAX * 0.9 ? "text-warning" : "text-ink-3")}>
            {item.code.length.toLocaleString("nb-NO")} av {HTML_MAX.toLocaleString("nb-NO")} tegn
          </p>
          {(name || problem) && (
            <p role="alert" className="t-small text-danger">
              {name ? `HTML-koden kan ikke inneholde navnet ${name}.` : problem}
            </p>
          )}
        </div>
        <div className="grid gap-1">
          <label htmlFor={heightId} className="t-small font-medium text-ink">
            Høyde i piksler
          </label>
          <input
            id={heightId}
            type="number"
            inputMode="numeric"
            min={HTML_HEIGHT.min}
            max={HTML_HEIGHT.max}
            value={item.height}
            onChange={(e) => onChange({ height: Number(e.target.value) })}
            onBlur={() => onChange({ height: clampHtmlHeight(item.height) })}
            className="h-10 w-32 rounded-md bg-surface px-3 text-base ring-1 ring-line-strong focus:outline-none focus:ring-2 focus:ring-focus sm:text-sm"
          />
          <p className="t-small text-ink-3">
            Mellom {HTML_HEIGHT.min} og {HTML_HEIGHT.max}.
          </p>
        </div>
        {item.code.trim() && !name && !problem && (
          <div>
            <p className="mb-1.5 t-small text-ink-3">Forhåndsvisning</p>
            <HtmlEmbed code={item.code} height={clampHtmlHeight(item.height)} />
          </div>
        )}
      </div>
    </div>
  );
}

/** A picture placed in the text, shown small with a way to take it out again (it then goes back to the gallery). */
export function PhotoRow({ picture, onRemove }: { picture?: PlaceablePicture; onRemove: () => void }) {
  return (
    <div className={cn(card, "flex items-center gap-3")}>
      {picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={picture.src} alt={picture.alt} className="size-16 shrink-0 rounded-sm bg-sunken object-cover" />
      ) : (
        <span className="flex size-16 shrink-0 items-center justify-center rounded-sm bg-sunken text-ink-3">
          <ImagePlus aria-hidden className="size-5" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="t-label font-medium">Bilde i teksten</p>
        <p className="t-small text-ink-3">{picture ? "Står her i teksten på nettsiden." : "Bildet er fjernet fra innlegget."}</p>
      </div>
      <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 t-small font-medium text-ink-2 hover:text-ink">
        <Trash2 aria-hidden className="size-3.5" />
        Fjern
      </button>
    </div>
  );
}

/** A subheading: one line, at most HEADING_MAX characters, with a counter. */
export function HeadingRow({
  item,
  people,
  onChange,
  onRemove,
}: {
  item: Extract<LayoutItem, { type: "heading" }>;
  people: { firstName: string; lastName: string }[];
  onChange: (patch: Partial<LayoutItem>) => void;
  onRemove: () => void;
}) {
  const id = useId();
  const name = personNameIn(item.text, people);
  return (
    <div className={card}>
      <RowHeader icon={<Heading2 aria-hidden className="size-4" />} title="Mellomtittel" onRemove={onRemove} />
      <label htmlFor={id} className="sr-only">
        Mellomtittel
      </label>
      <input
        id={id}
        value={item.text}
        maxLength={HEADING_MAX}
        onChange={(e) => onChange({ text: e.target.value.replace(/\n/g, " ") })}
        placeholder="Mellomtittel"
        aria-invalid={!!name}
        className="h-11 w-full rounded-md bg-surface px-3 font-display text-lg font-semibold ring-1 ring-line-strong focus:outline-none focus:ring-2 focus:ring-focus aria-[invalid=true]:ring-danger"
      />
      <p className={cn("mt-1 t-small tnum", HEADING_MAX - item.text.length <= 20 ? "text-warning" : "text-ink-3")}>
        {item.text.length} av {HEADING_MAX} tegn
      </p>
      {name && (
        <p role="alert" className="mt-1 t-small text-danger">
          Mellomtittelen kan ikke inneholde navnet {name}.
        </p>
      )}
    </div>
  );
}
