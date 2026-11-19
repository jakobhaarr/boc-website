import { isPreview, previewMayPersist } from "./env";
import { resolvePointId, STRATEGY } from "./strategy-2027-2030";

/**
 * Comments and replies on the strategy page (/strategi/2027-2030, text in lib/strategy-2027-2030.ts).
 *
 * Who may write: anyone with the link, signing with one of STRATEGY.names. The name is a signature the person picks, not a
 * sign-in, so nothing here lets anyone edit or delete a comment (there is no such action at all).
 *
 * Storage: the table strategy_comments in the club's Supabase (docs/strategy-comments.sql), over the same REST API and
 * service-role key as lib/data/supabase.ts. One row per comment, so two people writing at once both get their row, and a
 * comment survives restarts and deploys. Without Supabase, and on a preview (lib/env.ts), comments are kept in this
 * server's memory instead: that is the test data, and the real table stays empty until the participants get the link.
 *
 * Double posts: the browser makes the comment's id (a UUID) when the person starts to publish and keeps it until the
 * server has said yes. A second tap, or a new try after an answer that never arrived, sends the same id; the insert
 * ignores an id that is already there and the stored comment is returned.
 */

export interface StrategyComment {
  id: string;
  pointId: string;
  /** The comment this one answers. Replies always hang on a top-level comment on the same point. */
  parentId: string | null;
  author: string;
  body: string;
  /** ISO timestamp set by the server. */
  createdAt: string;
}

export interface StrategyCommentInput {
  id: string;
  pointId: string;
  parentId?: string | null;
  author: string;
  body: string;
}

export const BODY_MAX = 4000;
/** A guard against a flood: the page is open to anyone with the link. */
export const MAX_COMMENTS = 3000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Plain text: control characters out (line breaks kept), no runs of blank lines, trimmed. */
export function cleanBody(raw: string): string {
  return String(raw ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export type Checked = { ok: true; value: Omit<StrategyComment, "createdAt"> } | { ok: false; error: string };

/**
 * Checks what the browser sent. `parentOf` finds a stored comment by id (or null). Pure apart from that lookup, so it is
 * tested on its own (lib/__tests__/strategy-comments.test.ts).
 */
export function checkComment(input: StrategyCommentInput, parentOf: (id: string) => StrategyComment | null): Checked {
  if (!input || typeof input !== "object") return { ok: false, error: "Innlegget mangler." };
  const id = String(input.id ?? "");
  if (!UUID.test(id)) return { ok: false, error: "Innlegget mangler en gyldig ID. Last inn siden på nytt og prøv igjen." };
  const author = String(input.author ?? "");
  if (!(STRATEGY.names as readonly string[]).includes(author)) return { ok: false, error: "Velg hvem du kommenterer som." };
  const pointId = resolvePointId(String(input.pointId ?? ""));
  if (!pointId) return { ok: false, error: "Fant ikke punktet du kommenterer. Last inn siden på nytt." };
  const body = cleanBody(input.body);
  if (!body) return { ok: false, error: "Skriv noe før du publiserer." };
  if (body.length > BODY_MAX) return { ok: false, error: `Innlegget er for langt (${body.length} tegn). Største lengde er ${BODY_MAX} tegn.` };

  let parentId: string | null = null;
  if (input.parentId) {
    const parent = parentOf(String(input.parentId));
    if (!parent) return { ok: false, error: "Fant ikke kommentaren du svarer på. Last inn siden på nytt." };
    // A reply to a reply goes under the same top-level comment: one level of replies.
    const root = parent.parentId ? parentOf(parent.parentId) : parent;
    if (!root || resolvePointId(root.pointId) !== pointId) return { ok: false, error: "Svaret hører ikke til dette punktet." };
    parentId = root.id;
  }
  return { ok: true, value: { id, pointId, parentId, author, body } };
}

/* ─── Storage ──────────────────────────────────────────────────────────── */

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usesSupabase = () => !!(url && key) && (!isPreview() || previewMayPersist());
const table = () => `${url}/rest/v1/strategy_comments`;
const headers = () => ({ apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json" });

interface Row {
  id: string;
  point_id: string;
  parent_id: string | null;
  author: string;
  body: string;
  created_at: string;
}

const fromRow = (r: Row): StrategyComment => ({
  id: r.id,
  // A point whose id was changed later (formerIds) shows its old comments under the new id.
  pointId: resolvePointId(r.point_id) ?? r.point_id,
  parentId: r.parent_id,
  author: r.author,
  body: r.body,
  createdAt: new Date(r.created_at).toISOString(),
});

/** The in-memory copy for development and previews, kept on globalThis so a hot reload does not empty it. */
const memory = (): StrategyComment[] => {
  const g = globalThis as unknown as { __strategyComments?: StrategyComment[] };
  return (g.__strategyComments ??= []);
};

export async function listComments(): Promise<StrategyComment[]> {
  if (!usesSupabase()) return [...memory()];
  const res = await fetch(`${table()}?doc_id=eq.${encodeURIComponent(STRATEGY.docId)}&select=id,point_id,parent_id,author,body,created_at&order=created_at.asc,id.asc`, {
    headers: headers(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Supabase: kunne ikke lese kommentarene (${res.status})`);
  return ((await res.json()) as Row[]).map(fromRow);
}

/** Saves a checked comment once. Returns the stored one, which is the earlier copy when the id was already saved. */
export async function insertComment(c: Omit<StrategyComment, "createdAt">): Promise<StrategyComment> {
  if (!usesSupabase()) {
    const list = memory();
    const found = list.find((x) => x.id === c.id);
    if (found) return found;
    const saved = { ...c, createdAt: new Date().toISOString() };
    list.push(saved);
    return saved;
  }
  const res = await fetch(`${table()}?on_conflict=id`, {
    method: "POST",
    headers: { ...headers(), Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({ id: c.id, doc_id: STRATEGY.docId, point_id: c.pointId, parent_id: c.parentId, author: c.author, body: c.body }),
  });
  if (!res.ok) throw new Error(`Supabase: kunne ikke lagre kommentaren (${res.status})`);
  const back = await fetch(`${table()}?id=eq.${c.id}&select=id,point_id,parent_id,author,body,created_at`, { headers: headers(), cache: "no-store" });
  if (!back.ok) throw new Error(`Supabase: kunne ikke lese kommentaren (${back.status})`);
  const rows = (await back.json()) as Row[];
  if (!rows[0]) throw new Error("Supabase: kommentaren ble ikke lagret");
  return fromRow(rows[0]);
}
