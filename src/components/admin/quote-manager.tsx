"use client";

import { ArrowUpRight, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { addGroupQuote, choosePortrait, editGroupQuote, removeGroupQuote, removeMemberStory, removePortrait, saveMemberStory, setPortrait, setPortraitStyle, setQuoteFront } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { PhotoLibraryPicker } from "@/components/admin/photo-library-picker";
import { prepareImage, UPLOAD_BYTES } from "@/components/admin/prepare-image";
import type { LibraryPhoto } from "@/lib/photo-library";
import { Avatar, Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

interface QuoteRow {
  personId: string;
  name: string;
  lastName: string;
  /** A parent added for this quote alone, whose name can be changed here. */
  quoteOnly: boolean;
  /** The portrait on file, shown here whether or not the site may show it. */
  portrait?: { src: string; focal?: { x: number; y: number }; /** More than 50 % wider than tall: suits «Naturlig» (isWidePortrait). */ wide: boolean; /** Why «Hvit studio» is not possible for this picture (studioProblem), or missing when it is. */ studioProblem?: string; /** True when this is a picture uploaded for the quote; false when it is the person's profile picture, used until one is. */ own?: boolean };
  cardStyle?: "natural" | "studio" | "color";
  photoConsent: "granted" | "declined" | "unknown";
  detail?: string;
  relation?: string;
  quote: string;
  example: boolean;
  /** The group whose page the quote stands on. */
  groupId: string;
  groupName: string;
  front?: "requested" | "approved";
  /** On the front page through the club's own list of member quotes, not through «Vis på forsiden». */
  onFront: boolean;
  firstName: string;
  strava: string;
  /** The page with more behind the quote, when it has been written. */
  story?: { href: string; title: string; lead: string; text: string };
}

/** The quotes on one group's page, and a form to add one. See /admin/sitater. */
export function QuoteManager({
  group,
  title,
  quotes,
  members,
  clubAdmin,
}: {
  /** The group the page is on. Left out when the list is every group's quotes, or the ones on the front page: a quote is then added from a group's own page. */
  group?: { id: string; name: string; href: string };
  title: string;
  quotes: QuoteRow[];
  members: { id: string; name: string; firstName: string; lastName: string; birthYear?: number; portrait?: QuoteRow["portrait"]; photoConsent: QuoteRow["photoConsent"]; cardStyle?: QuoteRow["cardStyle"] }[];
  /** The club administrator approves quotes for the front page; a group admin can only ask. */
  clubAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [who, setWho] = useState<"member" | "parent">(members.length ? "member" : "parent");
  const [personId, setPersonId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState(`Forelder i ${group?.name ?? ""}`);
  const [quote, setQuote] = useState("");
  const [consent, setConsent] = useState(false);
  const [front, setFront] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  /** Rows opened to show picture, page with more and front-page choices; closed rows show only the quote. */
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (!n.delete(key)) n.add(key);
      return n;
    });

  const done = () => {
    announceChange();
    router.refresh();
  };

  const selectedMember = members.find((m) => m.id === personId);
  /** The member as a row, for the picture control in the form (it works on a person, not on a quote). */
  const memberRow = (m: (typeof members)[number]): QuoteRow => ({
    personId: m.id,
    name: m.name,
    lastName: m.lastName,
    quoteOnly: false,
    portrait: m.portrait,
    cardStyle: m.cardStyle,
    photoConsent: m.photoConsent,
    quote: "",
    example: false,
    groupId: group?.id ?? "",
    groupName: group?.name ?? "",
    onFront: false,
    firstName: m.firstName,
    strava: "",
  });

  const submit = () =>
    start(async () => {
      if (!group) return;
      setError(null);
      const res = await addGroupQuote({
        nodeId: group.id,
        ...(who === "member" ? { personId } : { parent: { firstName, lastName, relation } }),
        quote,
        consent,
        front,
      });
      if (!res.ok) return setError(res.error);
      // The new quote opens in the list, where its picture, page and front-page choices are.
      if (who === "member") setOpen((o) => new Set(o).add(`${group.id}:${personId}`));
      setQuote("");
      setPersonId("");
      setFirstName("");
      setLastName("");
      setConsent(false);
      setFront(false);
      done();
    });

  const remove = (groupId: string, id: string) =>
    start(async () => {
      await removeGroupQuote(groupId, id);
      done();
    });

  const setFrontState = (groupId: string, id: string, state: "none" | "requested" | "approved") =>
    start(async () => {
      setError(null);
      const res = await setQuoteFront(groupId, id, state);
      if (!res.ok) return setError(res.error);
      done();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <Panel
        id="sitater-liste"
        title={title}
        action={
          group && (
          <a href={group.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
            Se gruppesiden
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
          )
        }
      >
        {quotes.length === 0 ? (
          <p className="px-4 py-6 t-small text-ink-3 sm:px-5">{group ? "Ingen sitater ennå. Seksjonen vises ikke på gruppesiden før det finnes minst ett." : "Ingen sitater her."}</p>
        ) : (
          <ul>
            {quotes.map((q, i) => (
              <li key={`${q.groupId}:${q.personId}`} className={cn("border-t border-line px-4 py-3 first:border-t-0 sm:px-5", i % 2 === 1 && "bg-sunken")}>
                {editing === `${q.groupId}:${q.personId}` ? (
                  <QuoteEditor
                    row={q}
                    groupId={q.groupId}
                    onDone={(saved) => {
                      setEditing(null);
                      if (saved) done();
                    }}
                  />
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        aria-expanded={open.has(`${q.groupId}:${q.personId}`)}
                        onClick={() => toggle(`${q.groupId}:${q.personId}`)}
                        className="flex min-w-0 flex-1 items-start gap-3 text-left"
                      >
                        <Avatar name={q.name} size={36} photo={q.portrait} className="mt-0.5 shrink-0" />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block t-body text-ink", !open.has(`${q.groupId}:${q.personId}`) && "line-clamp-2")}>«{q.quote}»</span>
                          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 t-small text-ink-3">
                            <span className="font-medium text-ink-2">{q.name}</span>
                            {q.detail && <span>{q.detail}</span>}
                            {!group && <span className="rounded-[3px] bg-sunken px-1.5 py-0.5 text-ink-2 ring-1 ring-line">{q.groupName}</span>}
                            {q.example && <Status tone="warning">Eksempel</Status>}
                            {(q.front === "approved" || (q.onFront && !q.front)) && <Status tone="success">På forsiden</Status>}
                            {q.front === "requested" && <Status tone="warning">Venter på godkjenning</Status>}
                          </span>
                        </span>
                        <ChevronDown aria-hidden className={cn("mt-1 size-4 shrink-0 text-ink-3 transition-transform", open.has(`${q.groupId}:${q.personId}`) && "rotate-180")} />
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {confirmRemove === `${q.groupId}:${q.personId}` ? (
                          <div className="grid justify-items-end gap-1.5 text-right t-small">
                            <p className="max-w-[13rem] text-ink-2">Fjerne sitatet{q.quoteOnly ? " og personen" : ""}? Det kan ikke angres.</p>
                            <div className="flex gap-1">
                              <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(q.groupId, q.personId)}>
                                Fjern
                              </Button>
                              <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmRemove(null)}>
                                Behold
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" disabled={pending} onClick={() => setEditing(`${q.groupId}:${q.personId}`)}>
                              Rediger
                            </Button>
                            <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmRemove(`${q.groupId}:${q.personId}`)}>
                              Fjern
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {open.has(`${q.groupId}:${q.personId}`) && (
                      <div className="mt-2 pl-12">
                        <PortraitControl row={q} onDone={done} />
                        <StoryControl row={q} group={{ id: q.groupId, name: q.groupName }} onDone={done} />
                        <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 t-small">
                          {q.front === "requested" && clubAdmin && (
                            <button type="button" disabled={pending} onClick={() => setFrontState(q.groupId, q.personId, "approved")} className="font-medium text-club hover:text-club-hover">
                              Godkjenn for forsiden
                            </button>
                          )}
                          {!q.front && !q.onFront && (
                            <button type="button" disabled={pending} onClick={() => setFrontState(q.groupId, q.personId, clubAdmin ? "approved" : "requested")} className="font-medium text-club hover:text-club-hover">
                              {clubAdmin ? "Vis på forsiden" : "Foreslå for forsiden"}
                            </button>
                          )}
                          {q.front && (
                            <button type="button" disabled={pending} onClick={() => setFrontState(q.groupId, q.personId, "none")} className="text-ink-3 underline underline-offset-2 hover:text-ink">
                              {q.front === "requested" ? "Trekk tilbake forslaget" : "Ta av forsiden"}
                            </button>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {group && <Panel id="nytt-sitat" title="Nytt sitat">
        <div className="grid gap-4 p-4 sm:p-5">
          <fieldset className="grid gap-2">
            <legend className="mb-1 t-label text-ink">Hvem sier det?</legend>
            <label className="flex items-center gap-2 t-small text-ink">
              <input type="radio" name="who" checked={who === "member"} disabled={!members.length} onChange={() => setWho("member")} className="accent-[var(--action)]" />
              Et medlem av gruppa
            </label>
            <label className="flex items-center gap-2 t-small text-ink">
              <input type="radio" name="who" checked={who === "parent"} onChange={() => setWho("parent")} className="accent-[var(--action)]" />
              En forelder eller foresatt
            </label>
          </fieldset>

          {who === "member" ? (
            <>
            <Field label="Medlem" htmlFor="sitat-person" hint="Bare personer som kan vises på nettsiden, og som ikke har et sitat her fra før.">
              <Select id="sitat-person" value={personId} onChange={(e) => setPersonId(e.target.value)}>
                <option value="">Velg person</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.birthYear ? ` (${m.birthYear})` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            {selectedMember && (
              <div className="grid gap-1">
                <p className="t-label text-ink">
                  Bilde <span className="font-normal text-ink-3">(valgfritt)</span>
                </p>
                <p className="t-small text-ink-3">Vises sammen med sitatet. Last opp et bilde eller bruk et fra bildebiblioteket. Personen må ha godkjent bildet.</p>
                <PortraitControl row={memberRow(selectedMember)} onDone={done} />
              </div>
            )}
            </>
          ) : (
            <>
              <p className="t-small text-ink-3">Et bilde av en forelder legges til etter at sitatet er lagt inn: åpne sitatet i listen (pilen til høyre) og velg «Last opp bilde».</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Fornavn" htmlFor="sitat-fornavn">
                  <Input id="sitat-fornavn" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="off" />
                </Field>
                <Field label="Etternavn" htmlFor="sitat-etternavn" optional>
                  <Input id="sitat-etternavn" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="off" />
                </Field>
              </div>
              <Field label="Vises som" htmlFor="sitat-relasjon" hint="Bare fornavnet og dette vises. Barnets navn står ikke.">
                <Input id="sitat-relasjon" value={relation} onChange={(e) => setRelation(e.target.value)} />
              </Field>
            </>
          )}

          <Field label="Sitat" htmlFor="sitat-tekst" hint={`Hvorfor de liker å sykle i ${group?.name}. ${quote.length}/280 tegn.`}>
            <Textarea id="sitat-tekst" value={quote} maxLength={280} onChange={(e) => setQuote(e.target.value)} />
          </Field>

          <Checkbox
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            label="Personen har godkjent at sitatet publiseres"
            description="Med fornavn og alder, eller med det som står under «Vises som»."
          />

          <Checkbox
            checked={front}
            onChange={(e) => setFront(e.target.checked)}
            label={clubAdmin ? "Vis også på forsiden" : "Foreslå for forsiden"}
            description={clubAdmin ? "Under «Fra medlemmene» på forsiden." : "Klubbadministrator må godkjenne før sitatet står på forsiden. Gruppesiden vises uansett med en gang."}
          />

          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
          <Button onClick={submit} disabled={pending || !quote.trim() || !consent || (who === "member" ? !personId : !firstName.trim())} className="justify-self-start">
            Legg til sitat
          </Button>
        </div>
      </Panel>}
    </div>
  );
}

/** A quote opened for editing in its place in the list. */
function QuoteEditor({ row, groupId, onDone }: { row: QuoteRow; groupId: string; onDone: (saved: boolean) => void }) {
  const [quote, setQuote] = useState(row.quote);
  const [relation, setRelation] = useState(row.relation ?? "");
  const [firstName, setFirstName] = useState(row.name);
  const [lastName, setLastName] = useState(row.lastName);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const changed = quote.trim() !== row.quote;
  const renamed = row.quoteOnly && (firstName.trim() !== row.name || lastName.trim() !== row.lastName);

  const save = () =>
    start(async () => {
      setError(null);
      const res = await editGroupQuote({ nodeId: groupId, personId: row.personId, quote, relation: row.relation !== undefined ? relation : undefined, ...(row.quoteOnly && { firstName, lastName }), consent });
      if (!res.ok) return setError(res.error);
      onDone(true);
    });

  const id = `rediger-${row.personId}`;
  return (
    <div className="grid gap-3">
      {row.quoteOnly ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fornavn" htmlFor={`rediger-${row.personId}-fornavn`}>
            <Input id={`rediger-${row.personId}-fornavn`} value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="off" />
          </Field>
          <Field label="Etternavn" htmlFor={`rediger-${row.personId}-etternavn`} optional hint="Vises ikke på nettsiden.">
            <Input id={`rediger-${row.personId}-etternavn`} value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="off" />
          </Field>
        </div>
      ) : (
        <p className="t-small font-medium text-ink-2">{row.name}</p>
      )}
      <Field label="Sitat" htmlFor={id} hint={`${quote.length}/280 tegn.`}>
        <Textarea id={id} value={quote} maxLength={280} autoFocus onChange={(e) => setQuote(e.target.value)} />
      </Field>
      {row.relation !== undefined && (
        <Field label="Vises som" htmlFor={`${id}-relasjon`}>
          <Input id={`${id}-relasjon`} value={relation} onChange={(e) => setRelation(e.target.value)} />
        </Field>
      )}
      {changed && (
        <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label="Personen har godkjent den nye teksten" />
      )}
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={save} disabled={pending || !quote.trim() || (changed && !consent) || (renamed && !firstName.trim())}>
          Lagre
        </Button>
        <Button size="sm" variant="ghost" onClick={() => onDone(false)} disabled={pending}>
          Avbryt
        </Button>
      </div>
    </div>
  );
}

/**
 * The picture of the person quoted: upload, replace, remove. The site shows it
 * only with photo consent, so a new picture comes with the person's yes, which
 * is then recorded as consent; without it the picture is kept here only.
 */
const STYLES: { value: "natural" | "studio" | "color"; label: string; hint: string }[] = [
  { value: "natural", label: "Naturlig", hint: "Et bilde ute eller på sykkelen. Det går over i en uskarp bakgrunn bak teksten. Bildet må være bredere enn det er høyt, med mer enn 50 %." },
  { value: "studio", label: "Hvit studio", hint: "Hode og skuldre på hvit eller gjennomsiktig bakgrunn. Hvitt kort. Bildet kan ikke være mer enn 20 % bredere enn det er høyt." },
  { value: "color", label: "Farget kort", hint: "Teksten på svart, blågrønn eller lysegrå flate etter plass i raden. For vanlige kvadratiske eller stående bilder." },
];

/** A simplified drawing of each card style, so the choice is understood without seeing it live. */
function StylePreview({ value }: { value: "natural" | "studio" | "color" }) {
  const lines = (tone: string) => (
    <span className="grid gap-1">
      <span className={cn("h-1 w-12 rounded-full", tone)} />
      <span className={cn("h-1 w-9 rounded-full", tone)} />
      <span className={cn("h-1 w-5 rounded-full opacity-60", tone)} />
    </span>
  );
  const head = (bg: string) => (
    <span className={cn("relative block h-full w-9 shrink-0 overflow-hidden rounded-sm", bg)}>
      <span className="absolute left-1/2 top-2 size-3.5 -translate-x-1/2 rounded-full bg-ink-3/70" />
      <span className="absolute -bottom-2 left-1/2 h-5 w-8 -translate-x-1/2 rounded-full bg-ink-3/70" />
    </span>
  );
  return (
    <span aria-hidden className="block h-14 w-full overflow-hidden rounded-[4px] shadow-[inset_0_0_0_1px_var(--border-strong)]">
      {value === "natural" && (
        <span className="relative flex h-full items-end bg-gradient-to-br from-success/50 via-sunken to-club/40 p-2">
          <span className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          <span className="relative">{lines("bg-white")}</span>
        </span>
      )}
      {value === "studio" && (
        <span className="flex h-full items-end justify-between gap-2 bg-white px-2 pt-2">
          <span className="self-center">{lines("bg-ink")}</span>
          {head("bg-sunken")}
        </span>
      )}
      {value === "color" && (
        <span className="flex h-full items-end justify-between gap-2 bg-ink px-2 pt-2">
          <span className="self-center">{lines("bg-white")}</span>
          {head("bg-white/15")}
        </span>
      )}
    </span>
  );
}

function PortraitControl({ row, onDone }: { row: QuoteRow; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [picked, setPicked] = useState<LibraryPhoto | null>(null);
  const [library, setLibrary] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const needsConsent = row.photoConsent !== "granted";

  const useFromLibrary = () =>
    start(async () => {
      if (!picked) return;
      setError(null);
      const res = await choosePortrait(row.personId, picked.id, consent, "quote");
      if (!res.ok) return setError(res.error);
      setPicked(null);
      setConsent(false);
      onDone();
    });

  const upload = () =>
    start(async () => {
      if (!file) return;
      setError(null);
      try {
        const { blob, width, height, ext, transparent, background } = await prepareImage(file, 1200, [], UPLOAD_BYTES.standard);
        const form = new FormData();
        form.set("personId", row.personId);
        form.set("target", "quote");
        form.set("file", new File([blob], `portrett.${ext}`, { type: blob.type }));
        form.set("width", String(width));
        form.set("height", String(height));
        if (transparent) form.set("transparent", "true");
        if (background) form.set("background", background);
        if (consent) form.set("consent", "true");
        const res = await setPortrait(form);
        if (!res.ok) return setError(res.error);
        setFile(null);
        setConsent(false);
        onDone();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Kunne ikke laste opp bildet.");
      }
    });

  // The choice shows at once; the page catches up when the change has gone through.
  const saved = row.cardStyle ?? "color";
  const [chosen, setChosen] = useState<"natural" | "studio" | "color">(saved);
  useEffect(() => setChosen(saved), [saved]);
  const style = (value: "natural" | "studio" | "color") => {
    setChosen(value);
    setError(null);
    start(async () => {
      const res = await setPortraitStyle(row.personId, value);
      if (!res.ok) {
        setChosen(saved);
        return setError(res.error);
      }
      onDone();
    });
  };

  const remove = () =>
    start(async () => {
      const res = await removePortrait(row.personId, "quote");
      if (!res.ok) return setError(res.error);
      onDone();
    });

  return (
    <div className="mt-2 grid gap-2 t-small">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button type="button" disabled={pending} onClick={() => input.current?.click()} className="font-medium text-club hover:text-club-hover">
          {row.portrait?.own ? "Bytt sitatbilde" : "Last opp eget sitatbilde"}
        </button>
        <button type="button" disabled={pending} onClick={() => setLibrary(true)} className="font-medium text-club hover:text-club-hover">
          Fra bildebiblioteket
        </button>
        {row.portrait?.own && (
          <button type="button" disabled={pending} onClick={remove} className="text-ink-3 underline underline-offset-2 hover:text-ink">
            Fjern sitatbildet
          </button>
        )}
        {row.portrait && !row.portrait.own && <span className="text-ink-3">Bruker profilbildet. Et eget sitatbilde endrer ikke profilbildet.</span>}
        {row.portrait && needsConsent && <span className="text-ink-3">Vises ikke på nettsiden før personen har samtykket til bildet.</span>}
        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          aria-label={`Velg bilde av ${row.name}`}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (f) {
              setPicked(null);
              setFile(f);
              setConsent(!needsConsent);
            }
          }}
        />
      </div>
      {row.portrait && (
        <fieldset className="grid gap-1.5">
          <legend className="mb-1 font-medium text-ink">Kortstil på forsiden og gruppesiden</legend>
          {!row.portrait.wide && <p className="mb-1 text-ink-3">Bildet er ikke mer enn 50 % bredere enn det er høyt, så «Naturlig» passer ikke.</p>}
          {row.portrait.studioProblem && <p className="mb-1 text-ink-3">«Hvit studio» er ikke mulig: {row.portrait.studioProblem}</p>}
          <div className="grid gap-2">
            {STYLES.map((o) => {
              const blocked = o.value === "studio" && !!row.portrait?.studioProblem;
              return (
              <label
                key={o.value}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2 transition-[box-shadow,background-color] duration-150",
                  blocked ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                  chosen === o.value ? "bg-club-tint shadow-[inset_0_0_0_2px_var(--club-link)]" : "bg-surface shadow-[inset_0_0_0_1px_var(--border-strong)] hover:shadow-[inset_0_0_0_1px_var(--ink)]",
                )}
              >
                <input type="radio" name={`stil-${row.personId}`} checked={chosen === o.value} disabled={blocked} onChange={() => style(o.value)} className="accent-[var(--action)]" />
                <span className="w-28 shrink-0"><StylePreview value={o.value} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{o.label}</span>
                  <span className="block text-ink-3">{o.hint}</span>
                </span>
              </label>
              );
            })}
          </div>
          {!row.portrait.wide && chosen === "natural" && (
            <p role="alert" className="rounded-md bg-warning-surface px-3 py-2 text-ink">
              Advarsel: Bildet er ikke mer enn 50 % bredere enn det er høyt. Med «Naturlig» kan det bli beskåret eller se rart ut. «Farget kort» passer for dette bildet.
            </p>
          )}
        </fieldset>
      )}
      {file && (
        <div className="grid gap-2 rounded-md bg-sunken p-3">
          <p className="text-ink-2">Nytt bilde: {file.name}</p>
          <p className="text-ink-3">Hode og skuldre. Bildet står til høyre på sitatkortet i sin egen form, smalt eller bredt, så større er bedre (vi skalerer det til 1200 piksler). Velg kortstil under når bildet er lastet opp.</p>
          {needsConsent && (
            <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label="Personen har godkjent at bildet vises sammen med sitatet" description="Uten dette lagres bildet, men vises ikke på nettsiden." />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={upload} disabled={pending}>
              Last opp
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setFile(null)} disabled={pending}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
      {picked && (
        <div className="grid gap-2 rounded-md bg-sunken p-3">
          <p className="text-ink-2">Bilde fra biblioteket: {picked.alt}</p>
          {needsConsent && (
            <Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} label="Personen har godkjent at bildet vises sammen med sitatet" description="Uten dette lagres valget, men bildet vises ikke på nettsiden." />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={useFromLibrary} disabled={pending}>
              Bruk bildet
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPicked(null)} disabled={pending}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
      <PhotoLibraryPicker
        open={library}
        onClose={() => setLibrary(false)}
        personId={row.personId}
        title={`Bilde av ${row.name}`}
        onPick={([photo]) => {
          setLibrary(false);
          setFile(null);
          setPicked(photo);
          setConsent(!needsConsent);
        }}
      />
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The page with more behind a quote: «Les Xs historie» on the quote links to it. It closes with the person's
 * Strava link (kept on the person) and the group they ride in, which the page itself adds.
 */
function StoryControl({ row, group, onDone }: { row: QuoteRow; group: { id: string; name: string }; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(row.story?.title ?? `${row.firstName} sykler ${row.relation ? "med oss" : `i ${group.name}`}`);
  const [lead, setLead] = useState(row.story?.lead ?? "");
  const [text, setText] = useState(row.story?.text ?? "");
  const [strava, setStrava] = useState(row.strava);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () =>
    start(async () => {
      setError(null);
      const res = await saveMemberStory({ personId: row.personId, nodeId: group.id, title, lead, text, strava });
      if (!res.ok) return setError(res.error);
      setOpen(false);
      onDone();
    });
  const take = () =>
    start(async () => {
      const res = await removeMemberStory(row.personId);
      if (!res.ok) return setError(res.error);
      setOpen(false);
      onDone();
    });

  return (
    <div className="mt-2 grid gap-2 t-small">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button type="button" disabled={pending} onClick={() => setOpen((o) => !o)} className="font-medium text-club hover:text-club-hover">
          {row.story ? "Rediger siden med mer" : "Lag en side med mer"}
        </button>
        {row.story && (
          <>
            <a href={row.story.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium text-club hover:text-club-hover">
              Se siden
              <ArrowUpRight aria-hidden className="size-3.5" />
            </a>
            <button type="button" disabled={pending} onClick={take} className="text-ink-3 underline underline-offset-2 hover:text-ink">
              Ta ned siden
            </button>
          </>
        )}
        {!row.story && <span className="text-ink-3">Sitatet får da en knapp «Les mer om {row.firstName}».</span>}
      </div>
      {open && (
        <div className="grid gap-3 rounded-md bg-sunken p-3">
          <Field label="Overskrift" htmlFor={`hist-tittel-${row.personId}`} hint={`Med fornavnet, for eksempel «${row.firstName} sykler hele vinteren».`}>
            <Input id={`hist-tittel-${row.personId}`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
          </Field>
          <Field label="Ingress" htmlFor={`hist-ingress-${row.personId}`} hint="En til to setninger under overskriften. Valgfri.">
            <Textarea id={`hist-ingress-${row.personId}`} rows={2} value={lead} onChange={(e) => setLead(e.target.value)} />
          </Field>
          <Field label="Teksten" htmlFor={`hist-tekst-${row.personId}`} hint="Tom linje mellom avsnittene. En linje som starter med «> » blir et fremhevet sitat.">
            <Textarea id={`hist-tekst-${row.personId}`} rows={7} value={text} onChange={(e) => setText(e.target.value)} />
          </Field>
          <Field label="Strava-lenke" htmlFor={`hist-strava-${row.personId}`} hint={`Valgfri. Siden viser «Følg ${row.firstName} på Strava». Begynner med https://www.strava.com/.`}>
            <Input id={`hist-strava-${row.personId}`} value={strava} onChange={(e) => setStrava(e.target.value)} placeholder="https://www.strava.com/athletes/…" inputMode="url" />
          </Field>
          <p className="text-ink-3">Siden lenker også til gruppa {row.relation ? "sitatet står i" : "som personen sykler i"}, med trening og tider.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={pending}>
              {row.story ? "Lagre siden" : "Publiser siden"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Avbryt
            </Button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
