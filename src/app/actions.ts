"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminLocked, adminToken, isAdminToken, passwordMatches } from "@/lib/admin-auth";
import { articleHref, articleSlug, fullName, membershipTitle, slugify } from "@/lib/content";
import { nowLocal } from "@/lib/dates";
import { getDb, mutate, resetDb } from "@/lib/data/store";
import { persistent, uploadPortrait } from "@/lib/data/supabase";
import { createOrg } from "@/lib/org";
import {
  canAnonymise,
  canApprove,
  canChangeAuthor,
  canChangeClubSettings,
  canEditActivities,
  isClubAdmin,
  canEditArticle,
  canFeatureOnHomepage,
  canRecordConsent,
  isAdminOf,
  publishMode,
} from "@/lib/permissions";
import { anonymisePerson } from "@/lib/privacy";
import { EDITABLE_KEYS, FIRST_TRAINING_FIELDS, ABOUT_FIELDS, validateGroupEdit, validateStructureEdit, type GroupEdit, type StructureEdit } from "@/lib/group-fields";
import { paceGuideOf } from "@/lib/rider-fit";
import { validateArticleEdit, type ArticleEdit } from "@/lib/article-edit";
import { articleDeletionBlock, deleteGroup, erasePerson, groupImpact, personDeletionBlock, restoreTrashedArticle, trashArticle } from "@/lib/deletion";
import { linkPeople } from "@/lib/link-people";
import { MEMBERSHIP_ROLES, validateMembershipTitle, validatePersonEdit, type PersonEdit } from "@/lib/person-edit";
import { neutralise, personIdsIn, plain, text } from "@/lib/rich-text";
import { CLUB_COOKIE, currentClubId, isClubId } from "@/lib/club";
import { currentUser, USER_COOKIE } from "@/lib/session";
import { parseSpondMembers, type SpondMember } from "@/lib/spond-import";
import type { Article, Block, Inline, MembershipRole, NodeKind, Person, Photo } from "@/lib/types";
import { readXlsx } from "@/lib/xlsx";

/**
 * Server actions — the only write path into the mock store. Each checks the
 * acting user's permissions on the target node before mutating.
 */

function refreshAll() {
  revalidatePath("/", "layout");
}

async function context() {
  // Every action writes or acts as an admin, so each asks for the admin password first (lib/admin-auth.ts).
  if (!(await isAdminToken((await cookies()).get(ADMIN_COOKIE)?.value))) throw new Error("Logg inn for å gjøre endringer.");
  const clubId = await currentClubId();
  const db = await getDb(clubId);
  const org = createOrg(db.nodes);
  const user = await currentUser(db);
  return { clubId, db, org, user, now: nowLocal() };
}

/* ─── Admin lock ─────────────────────────────────────────────────────────── */

/** Opens admin with the shared password (ADMIN_PASSWORD). */
export async function unlockAdmin(password: string): Promise<{ ok: boolean }> {
  if (!adminLocked()) return { ok: true };
  if (!(await passwordMatches(password))) return { ok: false };
  (await cookies()).set(ADMIN_COOKIE, await adminToken(), { path: "/", sameSite: "lax", httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30 });
  return { ok: true };
}

export async function lockAdmin() {
  (await cookies()).delete(ADMIN_COOKIE);
  refreshAll();
}

/* ─── Demo session ──────────────────────────────────────────────────────── */

export async function switchDemoUser(userId: string) {
  const { db } = await context();
  if (!db.users.some((u) => u.id === userId && u.roles.length > 0)) return;
  (await cookies()).set(USER_COOKIE, userId, { path: "/", sameSite: "lax", httpOnly: true });
  refreshAll();
}

/**
 * Demo-only: look at another club. Users belong to one club, so the user
 * cookie is cleared and the new club's default administrator takes over.
 */
export async function switchClub(clubId: string) {
  if (!isClubId(clubId)) return;
  const jar = await cookies();
  jar.set(CLUB_COOKIE, clubId, { path: "/", sameSite: "lax", httpOnly: true });
  jar.delete(USER_COOKIE);
  refreshAll();
}

export async function resetDemo() {
  await resetDb(await currentClubId());
  refreshAll();
}

/* ─── Publishing ────────────────────────────────────────────────────────── */

export interface ComposerPhoto {
  /** A downscaled data URL from the device, or a demo photo URL. */
  src: string;
  width: number;
  height: number;
  caption?: string;
}

const acceptedPhotoSrc = (src: string) => src.startsWith("data:image/") || src.startsWith("https://images.unsplash.com/");

export interface ComposerInput {
  nodeId: string;
  title: string;
  body: string;
  photos: ComposerPhoto[];
  /** People appearing in the photos. */
  taggedPersonIds: string[];
  /** People named in the text, confirmed by the author. */
  linkedPersonIds: string[];
  requestHomepage: boolean;
}

export type PublishResult =
  | { ok: true; status: "published" | "pending"; href: string; nodeName: string }
  | { ok: false; error: string };

export async function publishPost(input: ComposerInput): Promise<PublishResult> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(input.nodeId);
  const mode = node ? publishMode(user, org, node.id) : null;
  if (!node || !mode) return { ok: false, error: "Du har ikke tilgang til å publisere på denne siden." };

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { ok: false, error: "Innlegget trenger en overskrift." };
  if (!body && input.photos.length === 0) return { ok: false, error: "Skriv noen setninger eller legg til bilder." };

  const tagged = input.taggedPersonIds.map((id) => db.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  const blocked = tagged.filter((p) => p.privacy.status !== "visible");
  if (blocked.length) {
    return { ok: false, error: `${blocked.map(fullName).join(", ")} kan ikke vises offentlig. Fjern merkingen eller bildet.` };
  }

  const linked = input.linkedPersonIds
    .map((id) => db.people.find((p) => p.id === id))
    .filter((p): p is Person => !!p && p.privacy.status === "visible");

  const stamp = Date.now().toString(36);
  const articleId = `a-${stamp}`;
  const titleInlines = linkPeople(title, linked, node.id);
  const neutralTitle = plain(titleInlines.map((i) => (i.type === "mention" ? text(i.neutral) : i)));
  let slug = articleSlug(db, node.name, neutralTitle, `${slugify(node.name)}-${stamp}`);
  if (db.articles.some((a) => a.slug === slug)) slug = `${slug}-${stamp.slice(-4)}`;

  const photos: Photo[] = input.photos
    .filter((p) => acceptedPhotoSrc(p.src))
    .slice(0, 12)
    .map((p, i) => ({
    id: `${articleId}-ph${i + 1}`,
    src: p.src,
    width: p.width,
    height: p.height,
    focal: { x: 50, y: 45 },
    tone: "#8a8d86",
    alt: `Bilde fra ${node.name}`,
    caption: p.caption?.trim() ? linkPeople(p.caption.trim(), linked, node.id) : undefined,
    credit: user.name,
    nodeId: node.id,
    people: tagged.map((person) => ({ personId: person.id, region: null })),
    redactions: [],
    source: { provider: "upload" },
  }));

  const paragraphs: Block[] = body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ type: "paragraph", content: linkPeople(s.replace(/\n/g, " "), linked, node.id) }));

  const blocks: Block[] = [...paragraphs];
  if (photos.length > 1) blocks.push({ type: "gallery", photoIds: photos.slice(1).map((p) => p.id) });

  const status = mode === "direct" ? "published" : "pending";

  await mutate(clubId, (d) => {
    d.photos.push(...photos);
    d.articles.push({
      id: articleId,
      slug,
      nodeId: node.id,
      title: titleInlines,
      blocks,
      heroPhotoId: photos[0]?.id,
      status,
      authorUserId: user.id,
      createdAt: now,
      publishedAt: status === "published" ? now : undefined,
      onHomepage: false,
      homepageRequested: input.requestHomepage,
    });
    d.audit.unshift({
      id: `audit-${stamp}`,
      at: now,
      actorUserId: user.id,
      action: status === "published" ? "publish" : "submit",
      articleId,
      summary: status === "published" ? `Publiserte «${neutralTitle}» på ${node.name}` : `Sendte inn «${neutralTitle}» til godkjenning`,
    });
  });

  refreshAll();
  return {
    ok: true,
    status,
    href: status === "published" ? articleHref({ slug }) : "/admin/innhold",
    nodeName: node.name,
  };
}

/* ─── Editing articles ──────────────────────────────────────────────────── */

export type ArticleEditResult = { ok: true; changed: boolean } | { ok: false; error: string };

type ArticleCopy = Pick<Article, "title" | "lead" | "blocks" | "authorUserId">;

/** Every person mentioned anywhere in the article's text. */
function mentionedIn(a: Pick<Article, "title" | "lead" | "blocks">): string[] {
  const ids = [...personIdsIn(a.title), ...personIdsIn(a.lead)];
  for (const b of a.blocks) {
    if (b.type === "paragraph") ids.push(...personIdsIn(b.content));
    else if (b.type === "quote") ids.push(...personIdsIn(b.content), ...personIdsIn(b.attribution));
    else if (b.type === "list") for (const item of b.items) ids.push(...personIdsIn(item));
  }
  return [...new Set(ids)];
}

/**
 * Edit a published article's headline, lead, text and author, live at once
 * (the address and the photos are not touched). Text that was not changed is
 * kept exactly, mentions included. Text that was changed is linked again to
 * the people already mentioned in the article, as in publishing, so
 * anonymising someone later still rewrites it safely. A copy of the article
 * from before is kept in the log so the edit can be undone.
 */
export async function updateArticle(articleId: string, edit: ArticleEdit): Promise<ArticleEditResult> {
  const { clubId, db, org, user, now } = await context();
  const article = db.articles.find((a) => a.id === articleId);
  if (!article || !org.get(article.nodeId)) return { ok: false, error: "Fant ikke innlegget." };
  if (!canEditArticle(user, org, article)) return { ok: false, error: "Du har ikke tilgang til å redigere dette innlegget." };
  const invalid = validateArticleEdit(edit, article);
  if (invalid) return { ok: false, error: invalid };

  let authorUserId = article.authorUserId;
  if (edit.authorUserId && edit.authorUserId !== article.authorUserId) {
    if (!canChangeAuthor(user, org, article)) return { ok: false, error: "Bare de som styrer gruppen kan bytte forfatter." };
    if (!db.users.some((u) => u.id === edit.authorUserId)) return { ok: false, error: "Fant ikke forfatteren." };
    authorUserId = edit.authorUserId;
  }

  // The people the article already names, as long as they may still be shown.
  const linked = mentionedIn(article)
    .map((id) => db.people.find((p) => p.id === id))
    .filter((p): p is Person => !!p && p.privacy.status === "visible");
  const rebuild = (value: string, original: Inline[] | undefined): Inline[] => {
    const clean = value.trim().replace(/\s*\n\s*/g, " ");
    return clean === plain(original) && original ? original : linkPeople(clean, linked, article.nodeId);
  };

  const title = rebuild(edit.title, article.title);
  const lead = edit.lead.trim() ? rebuild(edit.lead, article.lead) : undefined;
  const blocks: Block[] = article.blocks.flatMap((b, i): Block[] => {
    const value = edit.texts[i];
    if (value === undefined) return [b];
    if (!value.trim()) return [];
    if (b.type === "heading") return [{ type: "heading", text: value.trim() }];
    if (b.type === "paragraph") return [{ type: "paragraph", content: rebuild(value, b.content) }];
    return [b];
  });
  for (const added of edit.added) if (added.trim()) blocks.push({ type: "paragraph", content: rebuild(added, undefined) });

  const next: ArticleCopy = { title, lead, blocks, authorUserId };
  const before: ArticleCopy = { title: article.title, lead: article.lead, blocks: article.blocks, authorUserId: article.authorUserId };
  if (JSON.stringify(next) === JSON.stringify(before)) return { ok: true, changed: false };

  const authorChanged = authorUserId !== article.authorUserId;
  const textChanged = JSON.stringify([title, lead, blocks]) !== JSON.stringify([article.title, article.lead, article.blocks]);
  await mutate(clubId, (d) => {
    const a = d.articles.find((x) => x.id === articleId)!;
    a.title = title;
    a.lead = lead;
    a.blocks = blocks;
    a.authorUserId = authorUserId;
    a.editedAt = now;
    a.editedByUserId = user.id;
    const neutralTitle = plain(title.map((i) => (i.type === "mention" ? text(i.neutral) : i)));
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "editArticle",
      articleId,
      summary: `${textChanged ? "Redigerte" : "Endret forfatter på"} «${neutralTitle}»${textChanged && authorChanged ? " og byttet forfatter" : ""}`,
      articleBefore: before,
    });
  });
  refreshAll();
  return { ok: true, changed: true };
}

/**
 * Puts an article back to how it was before an edit. People who may no longer
 * be shown (anonymised or marked «Ikke publiser» since) are rewritten to the
 * neutral wording on the way, so undoing never brings a name back.
 */
export async function restoreArticleVersion(auditId: string): Promise<ArticleEditResult> {
  const { clubId, db, org, user, now } = await context();
  const entry = db.audit.find((a) => a.id === auditId && a.action === "editArticle" && a.articleBefore && a.articleId);
  const article = entry && db.articles.find((a) => a.id === entry.articleId);
  if (!entry?.articleBefore || !article) return { ok: false, error: "Fant ikke endringen." };
  if (!canEditArticle(user, org, article)) return { ok: false, error: "Du har ikke tilgang til å redigere dette innlegget." };

  const hidden = db.people.filter((p) => p.privacy.status !== "visible").map((p) => p.id);
  const restored: ArticleCopy = structuredClone(entry.articleBefore);
  for (const id of hidden) {
    restored.title = neutralise(restored.title, id);
    if (restored.lead) restored.lead = neutralise(restored.lead, id);
    restored.blocks = restored.blocks.map((b): Block => {
      if (b.type === "paragraph") return { ...b, content: neutralise(b.content, id) };
      if (b.type === "list") return { ...b, items: b.items.map((item) => neutralise(item, id)) };
      if (b.type === "quote") return { ...b, content: neutralise(b.content, id), attribution: neutralise(b.attribution, id) };
      return b;
    });
  }
  if (!db.users.some((u) => u.id === restored.authorUserId)) restored.authorUserId = article.authorUserId;
  const current: ArticleCopy = { title: article.title, lead: article.lead, blocks: article.blocks, authorUserId: article.authorUserId };
  if (JSON.stringify(restored) === JSON.stringify(current)) return { ok: true, changed: false };

  await mutate(clubId, (d) => {
    const a = d.articles.find((x) => x.id === article.id)!;
    a.title = restored.title;
    a.lead = restored.lead;
    a.blocks = restored.blocks;
    a.authorUserId = restored.authorUserId;
    a.editedAt = now;
    a.editedByUserId = user.id;
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "editArticle",
      articleId: article.id,
      summary: `Gjenopprettet en tidligere versjon av «${plain(restored.title.map((i) => (i.type === "mention" ? text(i.neutral) : i)))}»`,
      articleBefore: current,
    });
  });
  refreshAll();
  return { ok: true, changed: true };
}

export async function reviewArticle(articleId: string, decision: "approve" | "reject") {
  const { clubId, db, org, user, now } = await context();
  const article = db.articles.find((a) => a.id === articleId);
  if (!article || !canApprove(user, org, article.nodeId)) return { ok: false };
  await mutate(clubId, (d) => {
    const a = d.articles.find((x) => x.id === articleId)!;
    a.status = decision === "approve" ? "published" : "rejected";
    a.reviewedByUserId = user.id;
    if (decision === "approve") a.publishedAt = now;
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: decision,
      articleId,
      summary: `${decision === "approve" ? "Godkjente" : "Avviste"} «${plain(a.title)}»`,
    });
  });
  refreshAll();
  return { ok: true };
}

export async function setHomepage(articleId: string, onHomepage: boolean) {
  const { clubId, db, user } = await context();
  if (!canFeatureOnHomepage(user) || !db.articles.some((a) => a.id === articleId)) return { ok: false };
  await mutate(clubId, (d) => {
    const a = d.articles.find((x) => x.id === articleId)!;
    a.onHomepage = onHomepage;
    a.homepageRequested = false;
  });
  refreshAll();
  return { ok: true };
}

/* ─── Privacy ───────────────────────────────────────────────────────────── */

export type AnonymiseResult =
  | { ok: true; photos: number; text: number; activities: number; articles: { title: string; href: string }[] }
  | { ok: false; error: string };

export async function anonymise(personId: string, confirmation: string): Promise<AnonymiseResult> {
  const { clubId, db, org, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Bare klubbadministratorer kan anonymisere personer." };
  const person = db.people.find((p) => p.id === personId);
  if (!person) return { ok: false, error: "Personen finnes ikke." };
  if (confirmation.trim().toLocaleLowerCase("nb") !== fullName(person).toLocaleLowerCase("nb")) {
    return { ok: false, error: "Navnet stemmer ikke." };
  }
  if (person.privacy.status === "anonymised") return { ok: false, error: "Personen er allerede anonymisert." };

  const report = await mutate(clubId, (d) => anonymisePerson(d, org, personId, user.id, now));
  refreshAll();
  return {
    ok: true,
    photos: report.photosRedacted.length + report.photosWithdrawn.length,
    text: report.textLocations.length,
    activities: report.activities.length,
    articles: report.articlesChanged.flatMap((id) => {
      const a = db.articles.find((x) => x.id === id && x.status === "published");
      return a ? [{ title: plain(a.title), href: articleHref(a) }] : [];
    }),
  };
}

/**
 * Photo consent for a child is given by a guardian, and registered by the
 * group's administrator after talking to them. The audit line never names the
 * person — the same rule the anonymisation log follows.
 */
export async function recordPhotoConsent(personId: string, decision: "granted" | "declined", onBehalfOf?: string) {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canRecordConsent(user, org, person)) return { ok: false as const };
  if (person.privacy.status === "anonymised") return { ok: false as const };
  const groupName = org.get(person.memberships[0]?.nodeId ?? "")?.name ?? "klubben";

  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    p.privacy.photoConsent = decision;
    p.privacy.consentUpdatedAt = now.slice(0, 10);
    p.privacy.consentBy = onBehalfOf?.trim() || user.name;
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "consent",
      personId,
      summary: `Registrerte ${decision === "granted" ? "samtykke til bilder" : "at samtykke ikke er gitt"} for en person i ${groupName}`,
    });
  });
  refreshAll();
  return { ok: true as const };
}

/* ─── Structure ─────────────────────────────────────────────────────────── */

const LEVEL_ORDER: NodeKind[] = ["club", "sport", "discipline", "ageGroup", "team"];

export type CreateNodeResult = { ok: true; id: string; href: string } | { ok: false; error: string };

/** A new node gets a public page immediately — no template setup. */
export async function createNode(input: { parentId: string; name: string; kind: NodeKind; ageLabel?: string }): Promise<CreateNodeResult> {
  const { clubId, db, org, user, now } = await context();
  const parent = org.get(input.parentId);
  if (!parent || !isAdminOf(user, org, parent.id)) return { ok: false, error: "Du har ikke tilgang til å endre denne delen av strukturen." };
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Gi gruppen et navn." };
  if (LEVEL_ORDER.indexOf(input.kind) <= LEVEL_ORDER.indexOf(parent.kind)) return { ok: false, error: "Velg et nivå under det du legger til på." };
  const slug = slugify(name);
  if (!slug || org.children(parent.id).some((c) => c.slug === slug)) return { ok: false, error: `Det finnes allerede noe som heter ${name} her.` };

  const id = `n-${Date.now().toString(36)}`;
  const last = [parent, ...org.descendants(parent.id)].reduce((max, n) => Math.max(max, n.sortOrder), parent.sortOrder);
  await mutate(clubId, (d) => {
    d.nodes.push({
      id,
      parentId: parent.id,
      kind: input.kind,
      name,
      slug,
      ageLabel: input.ageLabel?.trim() || parent.ageLabel,
      ageRange: parent.ageRange,
      venueIds: parent.venueIds,
      sortOrder: last + 0.01,
      updatedAt: now,
      updatedNote: `${org.levelLabel({ ...parent, kind: input.kind })} opprettet`,
      updatedByUserId: user.id,
    });
  });
  refreshAll();
  return { ok: true, id, href: createOrg((await getDb(clubId)).nodes).href(id) };
}

/* ─── Group editor ──────────────────────────────────────────────────────── */

export type GroupEditResult = { ok: true; changed: string[] } | { ok: false; error: string };

const EDITABLE_KINDS: NodeKind[] = ["discipline", "ageGroup", "team"];
const FIELD_LABEL: Record<string, string> = {
  ...Object.fromEntries(ABOUT_FIELDS.map((f) => [f.key, f.label.toLowerCase()])),
  firstTraining: "første trening",
  paceGuide: "fart og FTP",
  name: "navn",
  ageLabel: "aldersbeskrivelse",
  ageRange: "aldersgrenser",
};

/**
 * Edit a group's own fields: the text on its page and in the finder, «Første
 * trening» and the road groups' pace guide. Live at once, with every change
 * logged field by field (before and after) so it can be undone.
 *
 * A group admin may edit the groups they run; what decides where a group sits
 * (name, address, parent, ages) is not on this path at all. Saved through the
 * field-wise store (lib/data/overrides.ts): only what changed is kept, the
 * rest keeps following the code.
 */
export async function updateGroup(nodeId: string, edit: GroupEdit): Promise<GroupEditResult> {
  const { clubId, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node || !EDITABLE_KINDS.includes(node.kind)) return { ok: false, error: "Fant ikke gruppen." };
  if (!isAdminOf(user, org, node.id)) return { ok: false, error: "Du har ikke tilgang til å endre denne gruppen." };
  const invalid = validateGroupEdit(edit);
  if (invalid) return { ok: false, error: invalid };

  const fields: Record<string, { before: unknown; after: unknown }> = {};
  const note = (key: string, before: unknown, after: unknown) => {
    if (JSON.stringify(before ?? null) !== JSON.stringify(after ?? null)) fields[key] = { before: before ?? null, after };
  };
  for (const f of ABOUT_FIELDS) {
    if (edit[f.key] !== undefined) note(f.key, node[f.key] ?? "", edit[f.key]!.trim());
  }
  if (edit.firstTraining) {
    const next = { ...node.firstTraining };
    for (const f of FIRST_TRAINING_FIELDS) {
      const value = edit.firstTraining[f.key];
      if (value === undefined) continue;
      if (value.trim()) next[f.key] = value.trim();
      else delete next[f.key];
    }
    note("firstTraining", node.firstTraining ?? {}, next);
  }
  if (edit.paceGuide) note("paceGuide", paceGuideOf(node) ?? null, edit.paceGuide);

  const changed = Object.keys(fields);
  if (!changed.length) return { ok: true, changed };

  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    for (const key of EDITABLE_KEYS) if (fields[key]) (n as unknown as Record<string, unknown>)[key] = fields[key].after;
    n.updatedAt = now;
    n.updatedByUserId = user.id;
    n.updatedNote = "Tekster endret";
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "editGroup",
      summary: `Endret ${changed.map((k) => FIELD_LABEL[k] ?? k).join(", ")} for ${node.name}`,
      change: { nodeId: node.id, fields },
    });
  });
  refreshAll();
  return { ok: true, changed };
}

/** Puts back what an earlier edit changed. Logged as a new edit, so it can be undone too. */
export async function restoreGroupVersion(auditId: string): Promise<GroupEditResult> {
  const { clubId, db, org, user, now } = await context();
  const entry = db.audit.find((a) => a.id === auditId && a.action === "editGroup" && a.change);
  const node = entry?.change && org.get(entry.change.nodeId);
  if (!entry?.change || !node) return { ok: false, error: "Fant ikke endringen." };
  if (!isAdminOf(user, org, node.id)) return { ok: false, error: "Du har ikke tilgang til å endre denne gruppen." };

  const restored: Record<string, { before: unknown; after: unknown }> = {};
  // Name and ages are structure: undoing them needs the same access as changing them.
  const structure = ["name", "ageLabel", "ageRange"];
  const mayRestoreStructure = !!node.parentId && isAdminOf(user, org, node.parentId);
  for (const [key, { before }] of Object.entries(entry.change.fields)) {
    const isStructure = structure.includes(key);
    if (isStructure ? !mayRestoreStructure : !(EDITABLE_KEYS as readonly string[]).includes(key)) continue;
    const current = (node as unknown as Record<string, unknown>)[key] ?? (key === "paceGuide" ? paceGuideOf(node) : undefined);
    const value = before ?? (key === "firstTraining" ? {} : key === "ageRange" ? [0, 99] : "");
    if (JSON.stringify(current ?? null) !== JSON.stringify(value)) restored[key] = { before: current ?? null, after: value };
  }
  const changed = Object.keys(restored);
  if (!changed.length) return { ok: true, changed };

  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    for (const key of changed) (n as unknown as Record<string, unknown>)[key] = restored[key].after;
    n.updatedAt = now;
    n.updatedByUserId = user.id;
    n.updatedNote = "Tidligere versjon gjenopprettet";
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "editGroup",
      summary: `Gjenopprettet ${changed.map((k) => FIELD_LABEL[k] ?? k).join(", ")} for ${node.name}`,
      change: { nodeId: node.id, fields: restored },
    });
  });
  refreshAll();
  return { ok: true, changed };
}

/* ─── Deleting ──────────────────────────────────────────────────────────── */

export type DeleteResult = { ok: true } | { ok: false; error: string };

/** Deleting an article moves it to the trash for 30 days (lib/deletion.ts); whoever runs the group may do it. */
export async function deleteArticle(articleId: string): Promise<DeleteResult> {
  const { clubId, db, org, user, now } = await context();
  const article = db.articles.find((a) => a.id === articleId);
  if (!article || !org.get(article.nodeId)) return { ok: false, error: "Fant ikke innlegget." };
  if (!isAdminOf(user, org, article.nodeId)) return { ok: false, error: "Du har ikke tilgang til å slette dette innlegget." };
  const block = articleDeletionBlock(db, article);
  if (block) return { ok: false, error: block };
  const title = plain(article.title.map((i) => (i.type === "mention" ? text(i.neutral) : i)));
  await mutate(clubId, (d) => trashArticle(d, articleId, user.id, now, `Slettet «${title}»`));
  refreshAll();
  return { ok: true };
}

export async function restoreDeletedArticle(auditId: string): Promise<DeleteResult> {
  const { clubId, db, org, user, now } = await context();
  const saved = db.audit.find((a) => a.id === auditId && a.action === "deleteArticle")?.deletedArticle?.article;
  if (!saved) return { ok: false, error: "Innlegget finnes ikke lenger i papirkurven." };
  if (!isAdminOf(user, org, saved.nodeId)) return { ok: false, error: "Du har ikke tilgang til å gjenopprette dette innlegget." };
  try {
    await mutate(clubId, (d) => {
      const org2 = createOrg(d.nodes);
      const restored = restoreTrashedArticle(d, org2, auditId, user.id, now, `Gjenopprettet «${plain(saved.title.map((i) => (i.type === "mention" ? text(i.neutral) : i)))}»`);
      void restored;
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Kunne ikke gjenopprette innlegget." };
  }
  refreshAll();
  return { ok: true };
}

/** Deleting a group is for good, and for those who run the level above it (the group's own admin changes content, not structure). */
export async function deleteGroupAction(nodeId: string, confirmation: string): Promise<DeleteResult & { parentHref?: string }> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node?.parentId) return { ok: false, error: "Fant ikke gruppen." };
  if (!isAdminOf(user, org, node.parentId)) return { ok: false, error: "Bare de som styrer nivået over gruppen kan slette den." };
  if (confirmation.trim().toLocaleLowerCase("nb") !== node.name.toLocaleLowerCase("nb")) return { ok: false, error: "Navnet stemmer ikke." };
  const impact = groupImpact(db, org, nodeId);
  if (impact.blockers.length) return { ok: false, error: impact.blockers[0] };
  try {
    await mutate(clubId, (d) => deleteGroup(d, createOrg(d.nodes), nodeId, user.id, now, `Slettet gruppen ${node.name}`));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Kunne ikke slette gruppen." };
  }
  refreshAll();
  return { ok: true, parentHref: "/admin/grupper" };
}

/** Erasing a person is for good and for club administrators only: anonymise first, then remove the record. */
export async function erasePersonAction(personId: string, confirmation: string): Promise<DeleteResult> {
  const { clubId, db, org, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Bare klubbadministratorer kan slette personer fra registeret." };
  const person = db.people.find((p) => p.id === personId);
  if (!person) return { ok: false, error: "Personen finnes ikke." };
  if (confirmation.trim().toLocaleLowerCase("nb") !== fullName(person).toLocaleLowerCase("nb")) return { ok: false, error: "Navnet stemmer ikke." };
  const block = personDeletionBlock(db, personId);
  if (block) return { ok: false, error: block };
  try {
    await mutate(clubId, (d) => erasePerson(d, createOrg(d.nodes), personId, user.id, now));
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Kunne ikke slette personen." };
  }
  refreshAll();
  return { ok: true };
}

/* ─── Editing groups' structure and people ──────────────────────────────── */

/**
 * Name and ages of a group: what places it, so it belongs to those who run
 * the level above (a group admin edits what the group says, not what it is).
 * The web address never changes with the name, so shared links keep working.
 * Logged field by field like other group edits, and undone from the same history.
 */
export async function updateGroupStructure(nodeId: string, edit: StructureEdit): Promise<GroupEditResult> {
  const { clubId, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node?.parentId) return { ok: false, error: "Fant ikke gruppen." };
  if (!isAdminOf(user, org, node.parentId)) return { ok: false, error: "Bare de som styrer nivået over gruppen kan endre navn og alder." };
  const invalid = validateStructureEdit(edit);
  if (invalid) return { ok: false, error: invalid };
  const name = edit.name.trim();
  if (org.children(node.parentId).some((c) => c.id !== node.id && c.name.toLocaleLowerCase("nb") === name.toLocaleLowerCase("nb"))) return { ok: false, error: `Det finnes allerede noe som heter ${name} her.` };

  const fields: Record<string, { before: unknown; after: unknown }> = {};
  const note = (key: string, before: unknown, after: unknown) => {
    if (JSON.stringify(before ?? null) !== JSON.stringify(after ?? null)) fields[key] = { before: before ?? null, after };
  };
  note("name", node.name, name);
  note("ageLabel", node.ageLabel ?? "", edit.ageLabel.trim());
  note("ageRange", node.ageRange ?? null, edit.ageFrom.trim() ? [Number(edit.ageFrom), Number(edit.ageTo)] : null);
  const changed = Object.keys(fields);
  if (!changed.length) return { ok: true, changed };

  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === nodeId)!;
    if (fields.name) n.name = name;
    if (fields.ageLabel) n.ageLabel = edit.ageLabel.trim();
    // A group without an age range is for everyone: the stored value is the full span, never a missing key.
    if (fields.ageRange) n.ageRange = (fields.ageRange.after as [number, number] | null) ?? [0, 99];
    n.updatedAt = now;
    n.updatedByUserId = user.id;
    n.updatedNote = "Navn eller alder endret";
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "editGroup",
      summary: `Endret ${changed.map((k) => ({ name: "navn", ageLabel: "aldersbeskrivelse", ageRange: "aldersgrenser" })[k]).join(", ")} for ${name}`,
      change: { nodeId, fields },
    });
  });
  refreshAll();
  return { ok: true, changed };
}

export type PersonResult = { ok: true } | { ok: false; error: string };

/** Name and contact details. Whoever runs a group the person is in may edit them; not once anonymised. */
export async function updatePerson(personId: string, edit: PersonEdit): Promise<PersonResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person) return { ok: false, error: "Personen finnes ikke." };
  if (person.privacy.status === "anonymised") return { ok: false, error: "En anonymisert person kan ikke endres." };
  if (!canRecordConsent(user, org, person) && !isClubAdmin(user)) return { ok: false, error: "Du har ikke tilgang til å endre denne personen." };
  const invalid = validatePersonEdit(edit);
  if (invalid) return { ok: false, error: invalid };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    p.firstName = edit.firstName.trim();
    p.lastName = edit.lastName.trim();
    const email = edit.email.trim();
    const phone = edit.phone.trim();
    p.publicContact = email || phone ? { ...(email ? { email } : {}), ...(phone ? { phone } : {}) } : undefined;
    const account = p.userId ? d.users.find((u) => u.id === p.userId) : undefined;
    if (account) account.name = fullName(p);
    // The log never names a person, only that someone was edited.
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editPerson", personId, summary: "Endret navn eller kontaktinformasjon" });
  });
  refreshAll();
  return { ok: true };
}

/** Puts a person in a group in a role, or changes the role or title they already have there. Needs admin of that group. */
export async function setPersonMembership(personId: string, input: { nodeId: string; role: MembershipRole; title: string; replaces?: { nodeId: string; role: MembershipRole } }): Promise<PersonResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  const node = org.get(input.nodeId);
  if (!person || !node) return { ok: false, error: "Fant ikke personen eller gruppen." };
  if (person.privacy.status === "anonymised") return { ok: false, error: "En anonymisert person kan ikke endres." };
  if (!isAdminOf(user, org, node.id)) return { ok: false, error: "Du har ikke tilgang til å endre medlemmer i denne gruppen." };
  if (input.replaces && !isAdminOf(user, org, input.replaces.nodeId)) return { ok: false, error: "Du har ikke tilgang til å endre medlemskapet i den opprinnelige gruppen." };
  if (!MEMBERSHIP_ROLES.some((r) => r.id === input.role)) return { ok: false, error: "Ugyldig rolle." };
  const invalid = validateMembershipTitle(input.title);
  if (invalid) return { ok: false, error: invalid };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    const gone = input.replaces ?? { nodeId: input.nodeId, role: input.role };
    const entry = { nodeId: input.nodeId, role: input.role, ...(input.title.trim() ? { title: input.title.trim() } : {}) };
    const at = p.memberships.findIndex((m) => m.nodeId === gone.nodeId && m.role === gone.role);
    if (at >= 0) p.memberships[at] = entry;
    else p.memberships.push(entry);
    // The same group and role twice would show a person twice.
    p.memberships = p.memberships.filter((m, i, all) => all.findIndex((x) => x.nodeId === m.nodeId && x.role === m.role) === i);
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editPerson", personId, summary: `Endret medlemskap i ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

/** Takes a person out of a group. They stay in the register, and the reverse is just adding them again. */
export async function removePersonMembership(personId: string, nodeId: string, role: MembershipRole): Promise<PersonResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  const node = org.get(nodeId);
  if (!person || !node) return { ok: false, error: "Fant ikke personen eller gruppen." };
  if (!isAdminOf(user, org, nodeId)) return { ok: false, error: "Du har ikke tilgang til å endre medlemmer i denne gruppen." };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    p.memberships = p.memberships.filter((m) => !(m.nodeId === nodeId && m.role === role));
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editPerson", personId, summary: `Tok en person ut av ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Activities & settings ─────────────────────────────────────────────── */

export async function setActivityCancelled(activityId: string, cancelled: boolean, note?: string) {
  const { clubId, db, org, user, now } = await context();
  const activity = db.activities.find((a) => a.id === activityId);
  if (!activity || !canEditActivities(user, org, activity.nodeId)) return { ok: false };
  await mutate(clubId, (d) => {
    const a = d.activities.find((x) => x.id === activityId)!;
    a.status = cancelled ? "cancelled" : "scheduled";
    a.statusNote = cancelled ? note?.trim() || "Avlyst." : undefined;
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: cancelled ? "cancelActivity" : "restoreActivity",
      activityId,
      summary: `${cancelled ? "Avlyste" : "Gjenopprettet"} ${a.title.toLowerCase()} ${a.date}`,
    });
  });
  refreshAll();
  return { ok: true };
}

export async function setClubTheme(themeId: string) {
  const { clubId, db, user, now } = await context();
  if (!canChangeClubSettings(user) || !db.themes.some((t) => t.id === themeId)) return { ok: false };
  await mutate(clubId, (d) => {
    d.club.themeId = themeId;
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "theme",
      summary: `Endret klubbfarger til ${d.themes.find((t) => t.id === themeId)?.label.toLowerCase()}`,
    });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Group quotes ──────────────────────────────────────────────────────── */

export type QuoteResult = { ok: true } | { ok: false; error: string };

/**
 * A quote on a group's page (OrgNode.quotes). Whoever runs the group adds
 * it — a group admin for their own group, a section or club admin for any
 * below them — and only with the person's say-so, which the form asks for.
 * The quote is from a member of the group, or from a parent, who is then
 * added to the register by name alone.
 */
export async function addGroupQuote(input: {
  nodeId: string;
  personId?: string;
  parent?: { firstName: string; lastName?: string; relation: string };
  quote: string;
  consent: boolean;
}): Promise<QuoteResult> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(input.nodeId);
  if (!node || !isAdminOf(user, org, node.id)) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  const quote = input.quote.trim().replace(/^[«"]|[»"]$/g, "");
  if (quote.length < 10) return { ok: false, error: "Skriv sitatet, minst en setning." };
  if (quote.length > 280) return { ok: false, error: "Sitatet er for langt. Hold det under 280 tegn." };
  if (!input.consent) return { ok: false, error: "Bekreft at personen har godkjent at sitatet publiseres." };

  let personId = input.personId;
  let relation: string | undefined;
  if (input.parent) {
    const firstName = input.parent.firstName.trim();
    relation = input.parent.relation.trim();
    if (!firstName || !relation) return { ok: false, error: "Skriv fornavnet og hvem personen er, for eksempel «Forelder i Gruppe 1»." };
    personId = `bp-q-${Date.now().toString(36)}`;
    const person: Person = {
      id: personId,
      firstName,
      lastName: input.parent.lastName?.trim() ?? "",
      memberships: [],
      privacy: { status: "visible", photoConsent: "unknown" },
    };
    await mutate(clubId, (d) => void d.people.push(person));
  } else {
    const person = db.people.find((p) => p.id === personId);
    if (!person || !person.memberships.some((m) => org.contains(node.id, m.nodeId))) return { ok: false, error: "Velg en person i gruppen." };
    if (person.privacy.status !== "visible") return { ok: false, error: "Personen er merket «Ikke publiser» eller anonymisert og kan ikke siteres." };
    if (node.quotes?.some((q) => q.personId === personId)) return { ok: false, error: "Personen har allerede et sitat i denne gruppen." };
  }

  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    n.quotes = [...(n.quotes ?? []), { personId: personId!, quote, relation, givenAt: now.slice(0, 10) }];
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "quote",
      personId,
      summary: `La inn et sitat på siden til ${node.name}`,
    });
  });
  refreshAll();
  return { ok: true };
}

/**
 * Changes the words of a quote already on a group's page, or how a parent
 * is shown. New words need the person's say-so again, as a new quote does.
 * An example quote stays marked as one: it is still an invented person.
 */
export async function editGroupQuote(input: { nodeId: string; personId: string; quote: string; relation?: string; consent: boolean }): Promise<QuoteResult> {
  const { clubId, org, user, now } = await context();
  const node = org.get(input.nodeId);
  if (!node || !isAdminOf(user, org, node.id)) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  const existing = node.quotes?.find((q) => q.personId === input.personId);
  if (!existing) return { ok: false, error: "Fant ikke sitatet." };
  const quote = input.quote.trim().replace(/^[«"]|[»"]$/g, "");
  if (quote.length < 10) return { ok: false, error: "Skriv sitatet, minst en setning." };
  if (quote.length > 280) return { ok: false, error: "Sitatet er for langt. Hold det under 280 tegn." };
  if (quote !== existing.quote && !input.consent) return { ok: false, error: "Bekreft at personen har godkjent den nye teksten." };
  const relation = existing.relation !== undefined ? input.relation?.trim() || existing.relation : undefined;

  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    n.quotes = (n.quotes ?? []).map((q) =>
      q.personId === input.personId ? { ...q, quote, ...(relation !== undefined && { relation }), ...(quote !== existing.quote && { givenAt: now.slice(0, 10) }) } : q,
    );
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "quote", personId: input.personId, summary: `Endret et sitat på siden til ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

export async function removeGroupQuote(nodeId: string, personId: string): Promise<QuoteResult> {
  const { clubId, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node || !isAdminOf(user, org, node.id)) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    n.quotes = (n.quotes ?? []).filter((q) => q.personId !== personId);
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "quote", personId, summary: `Fjernet et sitat fra siden til ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Import from Spond ─────────────────────────────────────────────────── */

export type SpondPreviewRow = SpondMember & { match: "new" | "member" | "existing"; existingId?: string };
export type SpondPreview =
  | { ok: true; rows: SpondPreviewRow[]; ignored: string[]; skipped: number }
  | { ok: false; error: string };

const sameName = (p: Person, m: SpondMember) =>
  `${p.firstName} ${p.lastName}`.toLowerCase() === `${m.firstName} ${m.lastName}`.toLowerCase() && (!p.birthYear || !m.birthYear || p.birthYear === m.birthYear);

/**
 * Reads a Spond member export and says what an import into a group would
 * do, row by row, without changing anything: a new person, someone already
 * in the group, or someone in the register who would join it. The file is
 * read on the server and not kept; only the name, birth year and photo
 * consent come back (lib/spond-import.ts).
 */
export async function previewSpondImport(formData: FormData): Promise<SpondPreview> {
  const { db, org, user } = await context();
  const nodeId = String(formData.get("nodeId") ?? "");
  const file = formData.get("file");
  if (!org.get(nodeId) || !isAdminOf(user, org, nodeId)) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Velg eksportfilen fra Spond (.xlsx)." };
  if (file.size > 5_000_000) return { ok: false, error: "Filen er for stor." };
  try {
    const parsed = parseSpondMembers(readXlsx(new Uint8Array(await file.arrayBuffer())));
    const rows = parsed.members.map((m): SpondPreviewRow => {
      const existing = db.people.find((p) => p.privacy.status !== "anonymised" && sameName(p, m));
      if (!existing) return { ...m, match: "new" };
      return { ...m, match: existing.memberships.some((x) => x.nodeId === nodeId) ? "member" : "existing", existingId: existing.id };
    });
    return { ok: true, rows, ignored: parsed.ignored, skipped: parsed.skipped };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kunne ikke lese filen." };
  }
}

/**
 * Adds the previewed members to a group: new people are created with an
 * athlete membership and the export's photo consent, people already in the
 * register get the membership. New people are «Ikke publiser» unless the
 * admin chose to make them visible, so an import never puts names on the
 * public site by itself.
 */
export async function importSpondMembers(input: { nodeId: string; members: SpondMember[]; visible: boolean }): Promise<{ ok: true; added: number; joined: number } | { ok: false; error: string }> {
  const { clubId, org, user, now } = await context();
  const node = org.get(input.nodeId);
  if (!node || !isAdminOf(user, org, node.id)) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  const members = input.members.filter((m) => m.firstName?.trim() && m.lastName?.trim()).slice(0, 2000);
  let added = 0;
  let joined = 0;
  await mutate(clubId, (d) => {
    // Counted afresh on each try: the store may run this again if someone else saved first.
    added = 0;
    joined = 0;
    for (const m of members) {
      const existing = d.people.find((p) => p.privacy.status !== "anonymised" && sameName(p, m));
      if (existing) {
        if (!existing.memberships.some((x) => x.nodeId === node.id)) {
          existing.memberships.push({ nodeId: node.id, role: "athlete" });
          joined++;
        }
        continue;
      }
      d.people.push({
        id: `bp-spond-${Date.now().toString(36)}-${added}`,
        firstName: m.firstName.trim(),
        lastName: m.lastName.trim(),
        birthYear: m.birthYear,
        memberships: [{ nodeId: node.id, role: "athlete" }],
        privacy: {
          status: input.visible ? "visible" : "restricted",
          photoConsent: m.photoConsent,
          ...(m.photoConsent !== "unknown" && { consentUpdatedAt: now.slice(0, 10), consentBy: "Spond" }),
        },
      });
      added++;
    }
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "import",
      summary: `Importerte ${added} nye og la ${joined} til i ${node.name} fra Spond`,
    });
  });
  refreshAll();
  return { ok: true, added, joined };
}

/* ─── Portraits ─────────────────────────────────────────────────────────── */

export type PortraitResult = { ok: true } | { ok: false; error: string };

const canEditPortrait = (user: Parameters<typeof canRecordConsent>[0], org: Parameters<typeof canRecordConsent>[1], person: Person) =>
  canRecordConsent(user, org, person) || user.roles.some((r) => r.role === "clubAdmin");

/**
 * A portrait uploaded in admin for someone in a group the admin runs. The
 * browser scales it down to 800 px as JPEG first (portrait-upload.tsx),
 * which also drops the file's metadata, such as where it was taken. Stored
 * in Supabase Storage when the site has it, otherwise kept in memory. The
 * site shows it only with the person's photo consent (portraitOf).
 */
export async function setPortrait(formData: FormData): Promise<PortraitResult> {
  const { clubId, db, org, user, now } = await context();
  const personId = String(formData.get("personId") ?? "");
  const file = formData.get("file");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canEditPortrait(user, org, person)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  if (person.privacy.status === "anonymised") return { ok: false, error: "Personen er anonymisert." };
  if (!(file instanceof File) || !/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, error: "Velg et bilde (JPEG, PNG eller WebP)." };
  if (file.size > 3_000_000) return { ok: false, error: "Bildet er for stort." };
  if (!(width > 0 && height > 0 && width <= 4000 && height <= 4000)) return { ok: false, error: "Kunne ikke lese bildets størrelse." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const stamp = Date.now().toString(36);
  const random = crypto.randomUUID().slice(0, 8);
  let src: string;
  try {
    src = persistent()
      ? await uploadPortrait(bytes, file.type, `${clubId}/${stamp}-${random}.${file.type.split("/")[1]}`)
      : `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kunne ikke laste opp bildet." };
  }

  const role = person.memberships[0];
  const title = role ? membershipTitle(role.role, role.title, org.sportOf(role.nodeId)?.id).toLowerCase() : "medlem";
  const photo: Photo = {
    id: `ph-portrait-${stamp}-${random}`,
    src,
    width: Math.round(width),
    height: Math.round(height),
    focal: { x: 50, y: 40 },
    tone: "#8a8a8a",
    alt: `Portrett av ${title}${role ? ` i ${org.get(role.nodeId)?.name ?? ""}` : ""}`.trim(),
    nodeId: role?.nodeId ?? org.root.id,
    people: [{ personId: person.id, region: null }],
    redactions: [],
    source: { provider: "upload" },
  };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === person.id)!;
    // A portrait replaced in admin is removed; one from the seed stays, unused.
    if (p.portraitPhotoId?.startsWith("ph-portrait-")) d.photos = d.photos.filter((x) => x.id !== p.portraitPhotoId);
    d.photos.push(photo);
    p.portraitPhotoId = photo.id;
    d.audit.unshift({ id: `audit-${stamp}`, at: now, actorUserId: user.id, action: "portrait", personId: person.id, summary: "La inn nytt portrett" });
  });
  refreshAll();
  return { ok: true };
}

export async function removePortrait(personId: string): Promise<PortraitResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canEditPortrait(user, org, person)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    if (p.portraitPhotoId?.startsWith("ph-portrait-")) d.photos = d.photos.filter((x) => x.id !== p.portraitPhotoId);
    p.portraitPhotoId = undefined;
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "portrait", personId, summary: "Fjernet portrett" });
  });
  refreshAll();
  return { ok: true };
}

/**
 * A person's date of birth, optional: set it for an exact age, clear it to
 * go back to the birth year alone. Whoever may change the portrait may
 * change this.
 */
export async function setBirthDate(personId: string, date: string | null): Promise<PortraitResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canEditPortrait(user, org, person)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  if (date !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > now.slice(0, 10) || date < "1900-01-01")) return { ok: false, error: "Skriv en gyldig fødselsdato." };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    if (date) {
      p.birthDate = date;
      p.birthYear = Number(date.slice(0, 4));
    } else {
      p.birthDate = undefined;
    }
  });
  refreshAll();
  return { ok: true };
}
