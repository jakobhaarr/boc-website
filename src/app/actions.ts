"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { articleHref, articleSlug, fullName, slugify } from "@/lib/content";
import { nowLocal } from "@/lib/dates";
import { getDb, mutate, resetDb } from "@/lib/data/store";
import { createOrg } from "@/lib/org";
import {
  canAnonymise,
  canApprove,
  canChangeClubSettings,
  canEditActivities,
  canFeatureOnHomepage,
  canRecordConsent,
  isAdminOf,
  publishMode,
} from "@/lib/permissions";
import { anonymisePerson } from "@/lib/privacy";
import { m, plain, text } from "@/lib/rich-text";
import { CLUB_COOKIE, currentClubId, isClubId } from "@/lib/club";
import { currentUser, USER_COOKIE } from "@/lib/session";
import type { Block, Inline, NodeKind, Person, Photo } from "@/lib/types";

/**
 * Server actions — the only write path into the mock store. Each checks the
 * acting user's permissions on the target node before mutating.
 */

function refreshAll() {
  revalidatePath("/", "layout");
}

async function context() {
  const clubId = await currentClubId();
  const db = getDb(clubId);
  const org = createOrg(db.nodes);
  const user = await currentUser(db);
  return { clubId, db, org, user, now: nowLocal() };
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
  resetDb(await currentClubId());
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

function neutralPhrase(person: Person, nodeId: string): string {
  const role = person.memberships.find((x) => x.nodeId === nodeId)?.role ?? person.memberships[0]?.role;
  if (role === "teamManager") return "laglederen";
  if (role === "headCoach" || role === "coach") return "treneren";
  return "en av spillerne";
}

/**
 * Turns plain composer text into inline segments, linking confirmed people.
 * Full names match first, then first names. Neutral wording is capitalised
 * when the mention starts a sentence.
 */
function linkPeople(source: string, people: Person[], nodeId: string): Inline[] {
  if (!people.length) return [text(source)];
  const patterns = people.flatMap((p) => [
    { person: p, needle: fullName(p) },
    { person: p, needle: p.firstName },
  ]);
  const escaped = patterns.map((p) => p.needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`(?<![\\p{L}])(${escaped.join("|")})(?![\\p{L}])`, "gu");
  const out: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(re)) {
    const idx = match.index ?? 0;
    const hit = patterns.find((p) => p.needle === match[0]);
    if (!hit) continue;
    if (idx > last) out.push(text(source.slice(last, idx)));
    const before = source.slice(0, idx).trimEnd();
    const sentenceStart = before === "" || /[.!?]$/.test(before);
    const neutral = neutralPhrase(hit.person, nodeId);
    out.push(m(hit.person.id, match[0], sentenceStart ? neutral[0].toUpperCase() + neutral.slice(1) : neutral));
    last = idx + match[0].length;
  }
  if (last < source.length) out.push(text(source.slice(last)));
  return out;
}

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

  mutate(clubId, (d) => {
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

export async function reviewArticle(articleId: string, decision: "approve" | "reject") {
  const { clubId, db, org, user, now } = await context();
  const article = db.articles.find((a) => a.id === articleId);
  if (!article || !canApprove(user, org, article.nodeId)) return { ok: false };
  mutate(clubId, (d) => {
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
  mutate(clubId, (d) => {
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

  const report = mutate(clubId, (d) => anonymisePerson(d, org, personId, user.id, now));
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

  mutate(clubId, (d) => {
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
  mutate(clubId, (d) => {
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
  return { ok: true, id, href: createOrg(getDb(clubId).nodes).href(id) };
}

/* ─── Activities & settings ─────────────────────────────────────────────── */

export async function setActivityCancelled(activityId: string, cancelled: boolean, note?: string) {
  const { clubId, db, org, user, now } = await context();
  const activity = db.activities.find((a) => a.id === activityId);
  if (!activity || !canEditActivities(user, org, activity.nodeId)) return { ok: false };
  mutate(clubId, (d) => {
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
  mutate(clubId, (d) => {
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
