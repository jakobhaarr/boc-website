"use client";

import { ArrowUpRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { addGroupQuote, choosePortrait, editGroupQuote, removeGroupQuote, removeMemberStory, removePortrait, saveMemberStory, setPortrait, setPortraitStyle, setQuoteFront } from "@/app/actions";
import { Panel } from "@/components/admin/bits";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, Input, Select, Textarea } from "@/components/ui/field";
import { PhotoLibraryPicker } from "@/components/admin/photo-library-picker";
import { prepareImage } from "@/components/admin/prepare-image";
import type { LibraryPhoto } from "@/lib/photo-library";
import { Avatar, Status } from "@/components/ui/primitives";

interface QuoteRow {
  personId: string;
  name: string;
  lastName: string;
  /** A parent added for this quote alone, whose name can be changed here. */
  quoteOnly: boolean;
  /** The portrait on file, shown here whether or not the site may show it. */
  portrait?: { src: string; focal?: { x: number; y: number }; cardStyle?: "natural" | "studio" | "color" };
  photoConsent: "granted" | "declined" | "unknown";
  detail?: string;
  relation?: string;
  quote: string;
  example: boolean;
  front?: "requested" | "approved";
  firstName: string;
  strava: string;
  /** The page with more behind the quote, when it has been written. */
  story?: { href: string; title: string; lead: string; text: string };
}

/** The quotes on one group's page, and a form to add one. See /admin/sitater. */
export function QuoteManager({
  group,
  quotes,
  members,
  clubAdmin,
}: {
  group: { id: string; name: string; href: string };
  quotes: QuoteRow[];
  members: { id: string; name: string; birthYear?: number }[];
  /** The club administrator approves quotes for the front page; a group admin can only ask. */
  clubAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [who, setWho] = useState<"member" | "parent">(members.length ? "member" : "parent");
  const [personId, setPersonId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [relation, setRelation] = useState(`Forelder i ${group.name}`);
  const [quote, setQuote] = useState("");
  const [consent, setConsent] = useState(false);
  const [front, setFront] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const done = () => {
    announceChange();
    router.refresh();
  };

  const submit = () =>
    start(async () => {
      setError(null);
      const res = await addGroupQuote({
        nodeId: group.id,
        ...(who === "member" ? { personId } : { parent: { firstName, lastName, relation } }),
        quote,
        consent,
        front,
      });
      if (!res.ok) return setError(res.error);
      setQuote("");
      setPersonId("");
      setFirstName("");
      setLastName("");
      setConsent(false);
      setFront(false);
      done();
    });

  const remove = (id: string) =>
    start(async () => {
      await removeGroupQuote(group.id, id);
      done();
    });

  const setFrontState = (id: string, state: "none" | "requested" | "approved") =>
    start(async () => {
      setError(null);
      const res = await setQuoteFront(group.id, id, state);
      if (!res.ok) return setError(res.error);
      done();
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <Panel
        id="sitater-liste"
        title={`På siden til ${group.name}`}
        action={
          <a href={group.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 t-small font-medium text-club hover:text-club-hover">
            Se gruppesiden
            <ArrowUpRight aria-hidden className="size-3.5" />
          </a>
        }
      >
        {quotes.length === 0 ? (
          <p className="px-4 py-6 t-small text-ink-3 sm:px-5">Ingen sitater ennå. Seksjonen vises ikke på gruppesiden før det finnes minst ett.</p>
        ) : (
          <ul>
            {quotes.map((q) => (
              <li key={q.personId} className="border-t border-line px-4 py-4 first:border-t-0 sm:px-5">
                {editing === q.personId ? (
                  <QuoteEditor
                    row={q}
                    groupId={group.id}
                    onDone={(saved) => {
                      setEditing(null);
                      if (saved) done();
                    }}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <Avatar name={q.name} size={48} photo={q.portrait} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="t-body text-ink">«{q.quote}»</p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-2 t-small text-ink-3">
                        <span className="font-medium text-ink-2">{q.name}</span>
                        {q.detail && <span>{q.detail}</span>}
                        {q.example && <Status tone="warning">Eksempel</Status>}
                        {q.front === "approved" && <Status tone="success">På forsiden</Status>}
                        {q.front === "requested" && <Status tone="warning">Venter på godkjenning for forsiden</Status>}
                      </p>
                      <PortraitControl row={q} onDone={done} />
                      <StoryControl row={q} group={group} onDone={done} />
                      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 t-small">
                        {q.front === "requested" && clubAdmin && (
                          <button type="button" disabled={pending} onClick={() => setFrontState(q.personId, "approved")} className="font-medium text-club hover:text-club-hover">
                            Godkjenn for forsiden
                          </button>
                        )}
                        {!q.front && (
                          <button type="button" disabled={pending} onClick={() => setFrontState(q.personId, clubAdmin ? "approved" : "requested")} className="font-medium text-club hover:text-club-hover">
                            {clubAdmin ? "Vis på forsiden" : "Foreslå for forsiden"}
                          </button>
                        )}
                        {q.front && (
                          <button type="button" disabled={pending} onClick={() => setFrontState(q.personId, "none")} className="text-ink-3 underline underline-offset-2 hover:text-ink">
                            {q.front === "requested" ? "Trekk tilbake forslaget" : "Ta av forsiden"}
                          </button>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      {confirmRemove === q.personId ? (
                        <div className="grid justify-items-end gap-1.5 text-right t-small">
                          <p className="max-w-[13rem] text-ink-2">Fjerne sitatet{q.quoteOnly ? " og personen" : ""}? Det kan ikke angres.</p>
                          <div className="flex gap-1">
                            <Button size="sm" variant="danger" disabled={pending} onClick={() => remove(q.personId)}>
                              Fjern
                            </Button>
                            <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmRemove(null)}>
                              Behold
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setEditing(q.personId)}>
                            Rediger
                          </Button>
                          <Button variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmRemove(q.personId)}>
                            Fjern
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel id="nytt-sitat" title="Nytt sitat">
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
          ) : (
            <>
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

          <Field label="Sitat" htmlFor="sitat-tekst" hint={`Hvorfor de liker å sykle i ${group.name}. ${quote.length}/280 tegn.`}>
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
      </Panel>
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
  { value: "natural", label: "Naturlig", hint: "Et bilde ute eller på sykkelen. Det går over i en uskarp bakgrunn bak teksten." },
  { value: "studio", label: "Hvit studio", hint: "Hode og skuldre mot hvit bakgrunn. Hvitt kort." },
  { value: "color", label: "Farget kort", hint: "Teksten på svart, blågrønn eller lysegrå flate etter plass i raden." },
];

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
      const res = await choosePortrait(row.personId, picked.id, consent);
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
        const { blob, width, height, ext } = await prepareImage(file, 1200);
        const form = new FormData();
        form.set("personId", row.personId);
        form.set("file", new File([blob], `portrett.${ext}`, { type: blob.type }));
        form.set("width", String(width));
        form.set("height", String(height));
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

  const style = (value: "natural" | "studio" | "color") =>
    start(async () => {
      setError(null);
      const res = await setPortraitStyle(row.personId, value);
      if (!res.ok) return setError(res.error);
      onDone();
    });

  const remove = () =>
    start(async () => {
      const res = await removePortrait(row.personId);
      if (!res.ok) return setError(res.error);
      onDone();
    });

  return (
    <div className="mt-2 grid gap-2 t-small">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button type="button" disabled={pending} onClick={() => input.current?.click()} className="font-medium text-club hover:text-club-hover">
          {row.portrait ? "Bytt bilde" : "Last opp bilde"}
        </button>
        <button type="button" disabled={pending} onClick={() => setLibrary(true)} className="font-medium text-club hover:text-club-hover">
          Fra bildebiblioteket
        </button>
        {row.portrait && (
          <button type="button" disabled={pending} onClick={remove} className="text-ink-3 underline underline-offset-2 hover:text-ink">
            Fjern bildet
          </button>
        )}
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
        <fieldset className="grid gap-1.5" disabled={pending}>
          <legend className="mb-1 font-medium text-ink">Kortstil på forsiden og gruppesiden</legend>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((o) => (
              <label
                key={o.value}
                className="flex max-w-[15rem] cursor-pointer items-start gap-2 rounded-md bg-surface px-3 py-2 shadow-[inset_0_0_0_1px_var(--border-strong)] has-[:checked]:shadow-[inset_0_0_0_2px_var(--ink)]"
              >
                <input type="radio" name={`stil-${row.personId}`} checked={(row.portrait?.cardStyle ?? "color") === o.value} onChange={() => style(o.value)} className="mt-1 accent-[var(--action)]" />
                <span>
                  <span className="block font-medium text-ink">{o.label}</span>
                  <span className="block text-ink-3">{o.hint}</span>
                </span>
              </label>
            ))}
          </div>
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
