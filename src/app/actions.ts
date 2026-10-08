"use server";

import { isDemoEmail } from "@/lib/demo-accounts";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin-auth";
import { articleHref, articlePhotoIds, articleSlug, fullName, membershipTitle, slugify } from "@/lib/content";
import { nowLocal } from "@/lib/dates";
import { getDb, mutate, resetDb } from "@/lib/data/store";
import { persistent, removeUpload, uploadPortrait } from "@/lib/data/supabase";
import { validateMembershipEdit, type MembershipEdit } from "@/lib/membership-edit";
import { inLibrary, libraryPhotos, type LibraryPhoto } from "@/lib/photo-library";
import { createOrg, type Org } from "@/lib/org";
import {
  canAnonymise,
  canApprove,
  canChangeAuthor,
  canChangeClubSettings,
  isClubAdmin,
  canEditArticle,
  canEditVenues,
  canFeatureOnHomepage,
  canRecordConsent,
  publishMode,
} from "@/lib/permissions";
import { can, canAnywhere, grantable, grantProblem, permsOf, presetMatching, roleKindFor } from "@/lib/access";
import { anonymisePerson } from "@/lib/privacy";
import { EDITABLE_KEYS, FIRST_TRAINING_FIELDS, ABOUT_FIELDS, validateGroupEdit, validateStructureEdit, type GroupEdit, type StructureEdit } from "@/lib/group-fields";
import { paceGuideOf } from "@/lib/rider-fit";
import { validateArticleEdit, type ArticleEdit } from "@/lib/article-edit";
import { articleDeletionBlock, deleteGroup, erasePerson, groupImpact, personDeletionBlock, restoreTrashedArticle, trashArticle } from "@/lib/deletion";
import { linkPeople } from "@/lib/link-people";
import { validateVenueEdit, venueUsage, type VenueEdit } from "@/lib/venue-edit";
import { validateRaceEdit, type RaceEdit } from "@/lib/race-edit";
import { MEMBERSHIP_ROLES, validateMembershipTitle, validatePersonEdit, type PersonEdit } from "@/lib/person-edit";
import { neutralise, personIdsIn, plain, text } from "@/lib/rich-text";
import { CLUB_COOKIE, currentClubId, isClubId } from "@/lib/club";
import { signedIn, USER_COOKIE, userForEmail } from "@/lib/session";
import { DEMO_COOKIE, DEMO_SESSION_HOURS, demoToken, demoUserIdFor } from "@/lib/demo-login";
import { ensureAuthUser, revokeSession, sendCode, SESSION_ACCESS_COOKIE, SESSION_REFRESH_COOKIE, sessionCookie, signInByCodeAvailable, verifyCode } from "@/lib/supabase-auth";
import { parseSpondMembers, type SpondMember } from "@/lib/spond-import";
import { ROLE_LABEL } from "@/lib/permissions";
import type { AccessPreset, Article, AuditEntry, Block, ConsentRequest, Db, External, Inline, MembershipRole, NodeKind, Permission, Person, Photo, Photographer, RoleKind, User } from "@/lib/types";
import { externalUsage, normaliseName, validateExternalName } from "@/lib/externals";
import { consentMail } from "@/lib/consent-mail";
import { ON_BEHALF_LABEL, validatePrivacyContact, WANT_LABEL, type PrivacyContactInput } from "@/lib/privacy-contact";
import { inviteMail } from "@/lib/invite-mail";
import { mailSender, sendMail } from "@/lib/mail";
import { altWithPeople, autoAlt, newReview, parseChoice, resolvePhotographer, withoutPhotoConsent, type PhotographerChoice } from "@/lib/photo-meta";
import { hasRole, lockoutProblem, normaliseEmail, roleSentence, validateEmail, validateName } from "@/lib/user-admin";
import { readXlsx } from "@/lib/xlsx";

/**
 * Server actions — the only write path into the mock store. Each checks the
 * acting user's permissions on the target node before mutating.
 */

function refreshAll() {
  revalidatePath("/", "layout");
}

/** Demo tools (club switcher, reset) exist only outside production: there the site is one real club. */
const demoTools = () => process.env.NODE_ENV !== "production";

/** The admin password check alone, for the prototype's actions that run before a user has been picked. */
async function requireAdminLock() {
  if (!(await isAdminToken((await cookies()).get(ADMIN_COOKIE)?.value))) throw new Error("Logg inn for å gjøre endringer.");
}

async function context() {
  const clubId = await currentClubId();
  const db = await getDb(clubId);
  const org = createOrg(db.nodes);
  // Every action writes or acts as someone, so each asks who that is (lib/session.ts) and refuses nobody.
  const who = await signedIn(db);
  if (!who) throw new Error("Logg inn for å gjøre endringer.");
  return { clubId, db, org, user: who.user, now: nowLocal() };
}

/* ─── Admin lock ─────────────────────────────────────────────────────────── */

export async function lockAdmin() {
  // Signing out also forgets who you were, so the next sign-in starts from «Velg hvem du er».
  const jar = await cookies();
  const accessToken = jar.get(SESSION_ACCESS_COOKIE)?.value;
  if (accessToken && signInByCodeAvailable()) await revokeSession(accessToken);
  jar.delete(ADMIN_COOKIE);
  jar.delete(USER_COOKIE);
  jar.delete(SESSION_ACCESS_COOKIE);
  jar.delete(SESSION_REFRESH_COOKIE);
  jar.delete(DEMO_COOKIE);
  refreshAll();
}

/* ─── Sign-in by e-mailed code ──────────────────────────────────────────── */

/**
 * Sends a six-digit code, but only to an e-mail that belongs to an active
 * user of the club. The answer is the same either way, so the form cannot be
 * used to find out who is a member. Supabase limits how often one address
 * can get a code.
 */
export async function sendLoginCode(email: string): Promise<{ ok: true }> {
  const clean = String(email).trim().toLowerCase();
  if (clean.length > 254 || !clean.includes("@") || !signInByCodeAvailable()) return { ok: true };
  // The demo addresses (lib/demo-accounts.ts) sign in with a password; no mail is ever sent to them, whatever their user looks like.
  if (isDemoEmail(clean)) return { ok: true };
  const db = await getDb(await currentClubId());
  if (!userForEmail(db, clean)) return { ok: true };
  try {
    await ensureAuthUser(clean);
    await sendCode(clean);
  } catch (error) {
    console.error("[login] kunne ikke sende kode", error);
  }
  return { ok: true };
}

/** The board demo's sign-in (lib/demo-login.ts). Temporary; it answers the same whatever was wrong, so it tells nothing. */
export async function demoLogin(email: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const wrong = { ok: false as const, error: "Brukernavn eller passord stemmer ikke." };
  const id = demoUserIdFor(String(email), String(password));
  if (!id) return wrong;
  const db = await getDb(await currentClubId());
  if (!db.users.some((u) => u.id === id && u.roles.length > 0)) return wrong; // the demo users are not invited (active: false) in the seed, and need not be
  (await cookies()).set(DEMO_COOKIE, await demoToken(id), sessionCookie(DEMO_SESSION_HOURS * 3600));
  refreshAll();
  return { ok: true };
}

export async function verifyLoginCode(email: string, code: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const clean = String(email).trim().toLowerCase();
  const digits = String(code).replace(/\D/g, "");
  const wrong = { ok: false as const, error: "Koden stemmer ikke eller har gått ut. Be om en ny." };
  if (!signInByCodeAvailable() || digits.length < 6) return wrong;
  const db = await getDb(await currentClubId());
  if (!userForEmail(db, clean)) return wrong;
  const tokens = await verifyCode(clean, digits);
  if (!tokens) return wrong;
  const jar = await cookies();
  jar.set(SESSION_ACCESS_COOKIE, tokens.accessToken, sessionCookie());
  jar.set(SESSION_REFRESH_COOKIE, tokens.refreshToken, sessionCookie());
  refreshAll();
  return { ok: true };
}

/* ─── Demo session ──────────────────────────────────────────────────────── */

export async function switchDemoUser(userId: string) {
  await requireAdminLock();
  const db = await getDb(await currentClubId());
  if (!db.users.some((u) => u.id === userId && u.roles.length > 0)) return;
  (await cookies()).set(USER_COOKIE, userId, { path: "/", sameSite: "lax", httpOnly: true });
  refreshAll();
}

/**
 * Demo-only: look at another club. Users belong to one club, so the user
 * cookie is cleared and the new club's default administrator takes over.
 */
export async function switchClub(clubId: string) {
  if (!demoTools()) return;
  await requireAdminLock();
  if (!isClubId(clubId)) return;
  const jar = await cookies();
  jar.set(CLUB_COOKIE, clubId, { path: "/", sameSite: "lax", httpOnly: true });
  jar.delete(USER_COOKIE);
  refreshAll();
}

export async function resetDemo() {
  // Drops every change saved from admin (resetDb), so it does not exist in production.
  if (!demoTools()) throw new Error("Tilbakestilling er ikke tilgjengelig.");
  const { clubId, user } = await context();
  if (!isClubAdmin(user)) throw new Error("Bare klubbadministrator kan tilbakestille.");
  await resetDb(clubId);
  refreshAll();
}

/* ─── Publishing ────────────────────────────────────────────────────────── */

export interface ComposerPhoto {
  /** A downscaled data URL from the device, or a demo photo URL. */
  src: string;
  width: number;
  height: number;
  caption?: string;
  /** The uploader covered up faces in this picture before sending it. */
  censored?: boolean;
}

const acceptedPhotoSrc = (src: string) => /^data:image\/(jpeg|png|webp);base64,/.test(src) || src.startsWith("https://images.unsplash.com/");

/** The biggest picture accepted from the composer, after the device has scaled it. */
const MAX_COMPOSER_PHOTO_BYTES = 2_500_000;

/**
 * A picture the composer sends is a data address. With Supabase it goes to
 * storage and only its address is kept, so the club's data stays small; without
 * it (local development) the data address is kept. A demo photo stays as it is.
 */
async function storeComposerPhoto(clubId: string, src: string, stamp: string): Promise<string> {
  const match = /^data:image\/(jpeg|png|webp);base64,(.*)$/s.exec(src);
  if (!match) return src;
  const bytes = Uint8Array.from(Buffer.from(match[2], "base64"));
  if (bytes.length > MAX_COMPOSER_PHOTO_BYTES) throw new Error("Et av bildene er for stort.");
  if (!persistent()) return src;
  return uploadPortrait(bytes, `image/${match[1]}`, `${clubId}/innlegg/${stamp}-${crypto.randomUUID().slice(0, 8)}.${match[1]}`);
}

export interface ComposerInput {
  nodeId: string;
  title: string;
  body: string;
  photos: ComposerPhoto[];
  /** Pictures taken from the library (every picture in the project): used by reference, with the answers they already have. */
  reusedPhotoIds?: string[];
  /** People appearing in the photos. */
  taggedPersonIds: string[];
  /** The uploader said, explicitly, that nobody who can be recognised is in the pictures. */
  noPeople: boolean;
  /** How many people without consent were covered up (blurred) in the pictures; they are not among the tagged. */
  censoredPeople?: number;
  /** Ticked people without consent who are asked by e-mail. The pictures stay hidden until each has answered yes. */
  askConsentFrom?: string[];
  /** Who took the pictures; required with any picture. */
  photographer: PhotographerChoice | null;
  /** People named in the text, confirmed by the author. */
  linkedPersonIds: string[];
  requestHomepage: boolean;
}

export type PublishResult =
  | { ok: true; status: "published" | "pending"; href: string; nodeName: string; /** First names of those asked, whose answers the pictures wait for. */ awaiting?: string[]; /** First names whose request could not be sent. */ unsent?: string[] }
  | { ok: false; error: string };

export async function publishPost(input: ComposerInput): Promise<PublishResult> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(input.nodeId);
  const mode = node ? publishMode(user, org, node.id) : null;
  if (!node || !mode) return { ok: false, error: "Du har ikke tilgang til å publisere på denne siden." };

  const title = input.title.trim();
  const body = input.body.trim();
  if (!title) return { ok: false, error: "Innlegget trenger en overskrift." };
  const reusedIds = [...new Set(input.reusedPhotoIds ?? [])].slice(0, 12);
  if (reusedIds.some((id) => !inLibrary(db, org, id))) return { ok: false, error: "Et av bildene fra biblioteket kan ikke brukes lenger. Fjern det og prøv igjen." };
  if (!body && input.photos.length === 0 && reusedIds.length === 0) return { ok: false, error: "Skriv noen setninger eller legg til bilder." };

  const tagged = input.taggedPersonIds.map((id) => db.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  const blocked = tagged.filter((p) => p.privacy.status !== "visible");
  if (blocked.length) {
    return { ok: false, error: `${blocked.map(fullName).join(", ")} kan ikke vises offentlig. Fjern merkingen eller bildet.` };
  }
  const censoredPeople = Math.max(0, Math.min(Math.floor(input.censoredPeople ?? 0), 50));
  // Someone without photo consent is taken out, covered up, or asked by e-mail; the pictures wait for the answer.
  const asked = tagged.filter((p) => (input.askConsentFrom ?? []).includes(p.id) && p.privacy.photoConsent !== "granted");
  const askedWithoutMail = asked.filter((p) => !p.consentEmail);
  if (askedWithoutMail.length) return { ok: false, error: `${askedWithoutMail.map(fullName).join(", ")} har ingen e-postadresse for samtykke. Legg den inn under Medlemmer.` };
  const unconsented = withoutPhotoConsent(tagged.filter((p) => !asked.some((a) => a.id === p.id)));
  if (unconsented.length) {
    return { ok: false, error: `${unconsented.join(", ")} har ikke gitt samtykke til bilder. Ta dem bort fra bildet, dekk dem til, eller be om samtykke før du publiserer.` };
  }

  const linked = input.linkedPersonIds
    .map((id) => db.people.find((p) => p.id === id))
    .filter((p): p is Person => !!p && p.privacy.status === "visible");

  // Every picture says who took it and who is in it. A club administrator checks it afterwards; it does not hold the post up.
  const sent = input.photos.filter((p) => acceptedPhotoSrc(p.src)).slice(0, 12);
  let photographer: Photographer | undefined;
  if (sent.length > 0) {
    if (tagged.length === 0 && !input.noPeople && censoredPeople === 0) return { ok: false, error: "Si hvem som er med på bildene, eller velg at ingen kan kjennes igjen." };
    if (tagged.length > 0 && input.noPeople) return { ok: false, error: "Du har både merket personer og valgt at ingen kan kjennes igjen." };
    if (censoredPeople > 0 && !sent.some((p) => p.censored)) return { ok: false, error: "Du har sagt at noen er dekket til, men ingen av bildene er sladdet." };
    const resolved = resolvePhotographer(db, input.photographer, { meUserId: user.id, today: now.slice(0, 10) });
    if (!resolved.ok) return resolved;
    photographer = resolved.photographer;
  }

  const stamp = Date.now().toString(36);
  const articleId = `a-${stamp}`;
  const titleInlines = linkPeople(title, linked, node.id, org.sportOf(node.id)?.id);
  const neutralTitle = plain(titleInlines.map((i) => (i.type === "mention" ? text(i.neutral) : i)));
  let slug = articleSlug(db, node.name, neutralTitle, `${slugify(node.name)}-${stamp}`);
  if (db.articles.some((a) => a.slug === slug)) slug = `${slug}-${stamp.slice(-4)}`;

  let sources: string[];
  try {
    sources = await Promise.all(sent.map((p) => storeComposerPhoto(clubId, p.src, stamp)));
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kunne ikke laste opp bildene." };
  }
  const review = newReview(user, isClubAdmin(user), now);
  const photos: Photo[] = sent.map((p, i) => ({
    id: `${articleId}-ph${i + 1}`,
    src: sources[i],
    width: p.width,
    height: p.height,
    focal: { x: 50, y: 45 },
    tone: "#8a8d86",
    // Written by the system, never by hand, and without a name (lib/photo-meta.ts).
    alt: autoAlt({ placeName: node.name, date: now.slice(0, 10), tagged: tagged.length, index: i + 1, total: sent.length }),
    caption: p.caption?.trim() ? linkPeople(p.caption.trim(), linked, node.id, org.sportOf(node.id)?.id) : undefined,
    credit: photographer!.name,
    photographer,
    review,
    noPeople: input.noPeople || undefined,
    censored: p.censored && censoredPeople > 0 ? censoredPeople : undefined,
    ...(asked.length && {
      awaitingConsent: asked.map((a) => a.id),
      withdrawn: { at: now, reason: AWAITING_CONSENT },
    }),
    nodeId: node.id,
    people: tagged.map((person) => ({ personId: person.id, region: null })),
    redactions: [],
    source: { provider: "upload" },
  }));

  const paragraphs: Block[] = body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ type: "paragraph", content: linkPeople(s.replace(/\n/g, " "), linked, node.id, org.sportOf(node.id)?.id) }));

  const blocks: Block[] = [...paragraphs];
  // New pictures first, then the ones taken from the library; the first of all is the main picture.
  const photoIds = [...photos.map((p) => p.id), ...reusedIds];
  if (photoIds.length > 1) blocks.push({ type: "gallery", photoIds: photoIds.slice(1) });

  const status = mode === "direct" ? "published" : "pending";

  await mutate(clubId, (d) => {
    d.photos.push(...photos);
    d.articles.push({
      id: articleId,
      slug,
      nodeId: node.id,
      title: titleInlines,
      blocks,
      heroPhotoId: photoIds[0],
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

  // One request per person, with its own link, for all the pictures of this post.
  const unsent: string[] = [];
  if (asked.length) {
    const origin = await siteOrigin();
    const requests: ConsentRequest[] = asked.map((p) => ({
      id: `cr-${stamp}-${p.id.slice(-6)}`,
      token: `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, ""),
      personId: p.id,
      photoIds: photos.map((x) => x.id),
      articleId,
      email: p.consentEmail!,
      createdAt: now,
      createdByUserId: user.id,
      status: "pending",
      sent: 1,
    }));
    await mutate(clubId, (d) => void d.consentRequests.push(...requests));
    for (const [i, r] of requests.entries()) {
      if (!(await sendConsentRequest(db, org, r, asked[i], user, node.name, photos.length, origin))) unsent.push(asked[i].firstName);
    }
  }

  refreshAll();
  return {
    ok: true,
    status,
    href: status === "published" ? articleHref({ slug }) : "/admin/innhold",
    nodeName: node.name,
    ...(asked.length && { awaiting: asked.map((p) => p.firstName), unsent }),
  };
}

/* ─── Asking for consent by e-mail ──────────────────────────────────────── */

const AWAITING_CONSENT = "Venter på samtykke";

async function sendConsentRequest(db: Db, org: Org, request: ConsentRequest, person: Person, askedBy: User, where: string, count: number, origin: string): Promise<boolean> {
  const mail = consentMail({
    clubName: db.club.name,
    clubShortName: db.club.shortName,
    firstName: person.firstName,
    askedBy: askedBy.name,
    where,
    count,
    url: `${origin}/samtykke/${request.token}`,
  });
  return sendMail({ from: mailSender(db.club.shortName), to: request.email, ...mail });
}

export type ConsentAnswerResult = { ok: true; status: "granted" | "declined" } | { ok: false; error: string };

/**
 * The person's own answer, from the link in the mail. No sign-in: the token is
 * the key, and it works once. «Yes» lifts the hold on the pictures when nobody
 * else is still being asked, and is recorded on them; it is consent to these
 * pictures only, not a general photo consent. «No» keeps them hidden for good.
 */
export async function answerConsent(token: string, answer: "granted" | "declined"): Promise<ConsentAnswerResult> {
  const clubId = await currentClubId();
  const db = await getDb(clubId);
  const request = db.consentRequests.find((r) => r.token === String(token));
  if (!request) return { ok: false, error: "Lenken stemmer ikke." };
  if (request.status !== "pending") return { ok: false, error: "Dette er allerede besvart." };
  if (answer !== "granted" && answer !== "declined") return { ok: false, error: "Ugyldig svar." };
  const now = nowLocal();
  await mutate(clubId, (d) => {
    const r = d.consentRequests.find((x) => x.id === request.id)!;
    r.status = answer;
    r.answeredAt = now;
    for (const id of r.photoIds) {
      const photo = d.photos.find((p) => p.id === id);
      if (!photo) continue;
      photo.awaitingConsent = (photo.awaitingConsent ?? []).filter((x) => x !== r.personId);
      if (answer === "granted") {
        photo.consents = [...(photo.consents ?? []), { personId: r.personId, at: now }];
        // Everyone asked has said yes: the picture goes up.
        if (photo.awaitingConsent.length === 0 && photo.withdrawn?.reason === AWAITING_CONSENT) photo.withdrawn = undefined;
      } else {
        photo.withdrawn = { at: now, reason: "Samtykke avslått" };
      }
    }
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, at: now, actorUserId: "system", action: "consent", personId: r.personId, summary: answer === "granted" ? "Samtykke til bilder gitt via e-post" : "Samtykke til bilder avslått via e-post" });
  });
  refreshAll();
  return { ok: true, status: answer };
}

/** Sends a request again, for a mail that did not arrive. Whoever uploaded the pictures, or a club administrator. */
export async function resendConsentRequest(requestId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { clubId, db, org, user } = await context();
  const request = db.consentRequests.find((r) => r.id === requestId);
  if (!request || request.status !== "pending") return { ok: false, error: "Forespørselen finnes ikke eller er besvart." };
  if (request.createdByUserId !== user.id && !isClubAdmin(user)) return { ok: false, error: "Du har ikke tilgang til denne forespørselen." };
  const person = db.people.find((p) => p.id === request.personId);
  if (!person) return { ok: false, error: "Fant ikke personen." };
  const where = org.get(db.photos.find((p) => request.photoIds.includes(p.id))?.nodeId ?? "")?.name ?? db.club.shortName;
  const sent = await sendConsentRequest(db, org, { ...request, email: person.consentEmail ?? request.email }, person, user, where, request.photoIds.length, await siteOrigin());
  if (!sent) return { ok: false, error: "Kunne ikke sende e-posten. Sjekk adressen under Medlemmer." };
  await mutate(clubId, (d) => {
    const r = d.consentRequests.find((x) => x.id === requestId)!;
    r.sent += 1;
    r.email = person.consentEmail ?? r.email;
  });
  refreshAll();
  return { ok: true };
}

/* ─── Editing articles ──────────────────────────────────────────────────── */

export type ArticleEditResult = { ok: true; changed: boolean } | { ok: false; error: string };

type ArticleCopy = Pick<Article, "title" | "lead" | "blocks" | "authorUserId" | "nodeId"> & { heroPhotoId?: string };

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

  // The group it is published for: moving it needs admin of the group it leaves and of the one it goes to.
  let nodeId = article.nodeId;
  if (edit.nodeId && edit.nodeId !== article.nodeId) {
    const target = org.get(edit.nodeId);
    if (!target) return { ok: false, error: "Fant ikke gruppen." };
    if (!canChangeAuthor(user, org, article) || !can(user, org, target.id, "publish_posts")) return { ok: false, error: "Du kan bare flytte innlegget til en gruppe du selv styrer." };
    nodeId = target.id;
  }

  // The people the article already names, as long as they may still be shown.
  const linked = mentionedIn(article)
    .map((id) => db.people.find((p) => p.id === id))
    .filter((p): p is Person => !!p && p.privacy.status === "visible");
  const rebuild = (value: string, original: Inline[] | undefined): Inline[] => {
    const clean = value.trim().replace(/\s*\n\s*/g, " ");
    return clean === plain(original) && original ? original : linkPeople(clean, linked, article.nodeId, org.sportOf(article.nodeId)?.id);
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

  // The main picture: one from the library (already checked and consented), or none.
  let heroPhotoId = article.heroPhotoId ?? "";
  if (edit.heroPhotoId !== undefined && edit.heroPhotoId !== heroPhotoId) {
    if (edit.heroPhotoId && !inLibrary(db, org, edit.heroPhotoId)) return { ok: false, error: "Fant ikke bildet i biblioteket." };
    heroPhotoId = edit.heroPhotoId;
  }
  const next: ArticleCopy = { title, lead, blocks, authorUserId, nodeId, heroPhotoId };
  const before: ArticleCopy = { title: article.title, lead: article.lead, blocks: article.blocks, authorUserId: article.authorUserId, nodeId: article.nodeId, heroPhotoId: article.heroPhotoId ?? "" };
  if (JSON.stringify(next) === JSON.stringify(before)) return { ok: true, changed: false };

  const authorChanged = authorUserId !== article.authorUserId;
  const moved = nodeId !== article.nodeId;
  const textChanged = JSON.stringify([title, lead, blocks]) !== JSON.stringify([article.title, article.lead, article.blocks]);
  const pictureChanged = heroPhotoId !== (article.heroPhotoId ?? "");
  await mutate(clubId, (d) => {
    const a = d.articles.find((x) => x.id === articleId)!;
    a.title = title;
    a.lead = lead;
    a.blocks = blocks;
    a.authorUserId = authorUserId;
    a.nodeId = nodeId;
    a.heroPhotoId = heroPhotoId || undefined;
    a.editedAt = now;
    a.editedByUserId = user.id;
    const neutralTitle = plain(title.map((i) => (i.type === "mention" ? text(i.neutral) : i)));
    d.audit.unshift({
      id: `audit-${Date.now().toString(36)}`,
      at: now,
      actorUserId: user.id,
      action: "editArticle",
      articleId,
      summary: `${textChanged ? "Redigerte" : pictureChanged && !moved && !authorChanged ? "Byttet bilde på" : moved && !authorChanged ? "Flyttet" : "Endret forfatter på"} «${neutralTitle}»${textChanged && authorChanged ? " og byttet forfatter" : ""}${textChanged && pictureChanged ? " og bildet" : ""}${moved ? ` til ${org.get(nodeId)?.name}` : ""}`,
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
  const restored: ArticleCopy = { ...structuredClone(entry.articleBefore), nodeId: entry.articleBefore.nodeId ?? article.nodeId };
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
  // Older entries do not hold the group; and going back to a group needs admin there, and the group must still exist.
  if (!restored.nodeId || !org.get(restored.nodeId) || (restored.nodeId !== article.nodeId && !can(user, org, restored.nodeId, "publish_posts"))) restored.nodeId = article.nodeId;
  // An older entry has no picture in it, and then the picture stays; a picture that is gone from the library is not brought back.
  if (restored.heroPhotoId === undefined || (restored.heroPhotoId && !db.photos.some((p) => p.id === restored.heroPhotoId))) restored.heroPhotoId = article.heroPhotoId ?? "";
  const current: ArticleCopy = { title: article.title, lead: article.lead, blocks: article.blocks, authorUserId: article.authorUserId, nodeId: article.nodeId, heroPhotoId: article.heroPhotoId ?? "" };
  if (JSON.stringify(restored) === JSON.stringify(current)) return { ok: true, changed: false };

  await mutate(clubId, (d) => {
    const a = d.articles.find((x) => x.id === article.id)!;
    a.title = restored.title;
    a.lead = restored.lead;
    a.blocks = restored.blocks;
    a.authorUserId = restored.authorUserId;
    a.nodeId = restored.nodeId;
    a.heroPhotoId = restored.heroPhotoId || undefined;
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
  if (!parent || !can(user, org, parent.id, "structure")) return { ok: false, error: "Du har ikke tilgang til å endre denne delen av strukturen." };
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
  if (!can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre denne gruppen." };
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
  if (!can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre denne gruppen." };

  const restored: Record<string, { before: unknown; after: unknown }> = {};
  // Name and ages are structure: undoing them needs the same access as changing them.
  const structure = ["name", "ageLabel", "ageRange"];
  const mayRestoreStructure = !!node.parentId && can(user, org, node.parentId, "edit_group");
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
  if (!can(user, org, article.nodeId, "publish_posts")) return { ok: false, error: "Du har ikke tilgang til å slette dette innlegget." };
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
  if (!can(user, org, saved.nodeId, "publish_posts")) return { ok: false, error: "Du har ikke tilgang til å gjenopprette dette innlegget." };
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
  if (!can(user, org, node.parentId, "structure")) return { ok: false, error: "Bare de som styrer nivået over gruppen kan slette den." };
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
  if (!can(user, org, node.parentId, "structure")) return { ok: false, error: "Bare de som styrer nivået over gruppen kan endre navn og alder." };
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
    const consentEmail = edit.consentEmail.trim().toLowerCase();
    p.consentEmail = consentEmail || undefined;
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
  if (!can(user, org, node.id, "members")) return { ok: false, error: "Du har ikke tilgang til å endre medlemmer i denne gruppen." };
  if (input.replaces && !can(user, org, input.replaces.nodeId, "members")) return { ok: false, error: "Du har ikke tilgang til å endre medlemskapet i den opprinnelige gruppen." };
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
  if (!can(user, org, nodeId, "members")) return { ok: false, error: "Du har ikke tilgang til å endre medlemmer i denne gruppen." };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    p.memberships = p.memberships.filter((m) => !(m.nodeId === nodeId && m.role === role));
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editPerson", personId, summary: `Tok en person ut av ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Venues and photos ─────────────────────────────────────────────────── */

export type VenueResult = { ok: true; id: string } | { ok: false; error: string };

/** Adds a venue (no id) or changes one. For those who run a section or the club. */
export async function saveVenue(venueId: string | null, edit: VenueEdit): Promise<VenueResult> {
  const { clubId, db, user, now } = await context();
  if (!canEditVenues(user)) return { ok: false, error: "Du har ikke tilgang til å endre arenaer." };
  const invalid = validateVenueEdit(edit);
  if (invalid) return { ok: false, error: invalid };
  const name = edit.name.trim();
  if (db.venues.some((v) => v.id !== venueId && v.name.toLocaleLowerCase("nb") === name.toLocaleLowerCase("nb"))) return { ok: false, error: `Det finnes allerede en arena som heter ${name}.` };
  if (venueId && !db.venues.some((v) => v.id === venueId)) return { ok: false, error: "Fant ikke arenaen." };

  const id = venueId ?? `v-${Date.now().toString(36)}`;
  await mutate(clubId, (d) => {
    const fields = {
      name,
      area: edit.area.trim(),
      surface: edit.surface.trim(),
      // Fields are never removed from a stored venue, so a cleared one is an empty text.
      address: edit.address.trim(),
      mapQuery: edit.mapQuery.trim(),
      preposition: edit.preposition,
      note: edit.note.trim(),
    };
    const v = venueId ? d.venues.find((x) => x.id === venueId)! : undefined;
    if (v) Object.assign(v, fields);
    else d.venues.push({ id, ...fields });
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editVenue", summary: `${venueId ? "Endret" : "La til"} arenaen ${name}` });
  });
  refreshAll();
  return { ok: true, id };
}

/** A venue that nothing uses can be deleted; its uploaded photo goes with it. */
export async function deleteVenue(venueId: string): Promise<DeleteResult> {
  const { clubId, db, user, now } = await context();
  if (!canEditVenues(user)) return { ok: false, error: "Du har ikke tilgang til å slette arenaer." };
  const venue = db.venues.find((v) => v.id === venueId);
  if (!venue) return { ok: false, error: "Fant ikke arenaen." };
  const use = venueUsage(db, venueId);
  if (use.used) return { ok: false, error: "Arenaen er i bruk. Fjern den fra gruppene og treningene først." };
  await mutate(clubId, (d) => {
    d.venues = d.venues.filter((v) => v.id !== venueId);
    dropIfUnused(d, venue.photoId, "ph-venue-");
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editVenue", summary: `Slettet arenaen ${venue.name}` });
  });
  refreshAll();
  return { ok: true };
}

/**
 * The biggest file an admin may upload. The browser squeezes pictures to the
 * limit for admins (components/admin/prepare-image.ts); this is the check for a
 * request that did not come from it. The club administrator (the web editor) may
 * send the larger `allowed` size, others `limit` with a little room on top.
 */
function maxUploadBytes(user: User, limit: number, allowed: number): number {
  return isClubAdmin(user) ? allowed : Math.round(limit * 1.05);
}

export type PhotoResult = { ok: true } | { ok: false; error: string };

/** Reads and checks an uploaded picture and stores it; the client has already scaled it to at most 1800 px. */
async function storeUploadedPhoto(clubId: string, user: User, formData: FormData): Promise<{ ok: true; src: string; width: number; height: number; stamp: string; random: string } | { ok: false; error: string }> {
  const file = formData.get("file");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  if (formData.get("consent") !== "true") return { ok: false, error: "Bekreft at bildet kan brukes på nettsiden." };
  if (!(file instanceof File) || !/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, error: "Velg et bilde (JPEG, PNG eller WebP)." };
  if (file.size > maxUploadBytes(user, 800_000, 4_000_000)) return { ok: false, error: "Bildet er for stort. Velg et mindre bilde, så gjør nettsiden det lite nok selv." };
  if (!(width > 0 && height > 0 && width <= 4000 && height <= 4000)) return { ok: false, error: "Kunne ikke lese bildets størrelse." };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const stamp = Date.now().toString(36);
  const random = crypto.randomUUID().slice(0, 8);
  try {
    const src = persistent()
      ? await uploadPortrait(bytes, file.type, `${clubId}/${stamp}-${random}.${file.type.split("/")[1]}`)
      : `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
    return { ok: true, src, width: Math.round(width), height: Math.round(height), stamp, random };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kunne ikke laste opp bildet." };
  }
}

/** The photographer a form names, checked against the database (the same rules as in the composer). */
function photographerFromForm(db: Db, formData: FormData, userId: string, today: string): { ok: true; photographer: Photographer } | { ok: false; error: string } {
  let choice: PhotographerChoice | null = null;
  try {
    const raw = JSON.parse(String(formData.get("photographer") ?? "null")) as { kind?: unknown; refId?: unknown } | null;
    choice = raw ? parseChoice(raw.kind === "club" ? "club" : `${String(raw.kind)}:${String(raw.refId ?? "")}`) : null;
  } catch {
    choice = null;
  }
  return resolvePhotographer(db, choice, { meUserId: userId, today });
}

/** Puts a new photo on a venue. A photo uploaded here replaces the previous one; a photo from the seed stays in the library, unused. */
export async function setVenuePhoto(formData: FormData): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const venue = db.venues.find((v) => v.id === String(formData.get("venueId") ?? ""));
  if (!venue || !canEditVenues(user)) return { ok: false, error: "Du har ikke tilgang til å endre denne arenaen." };
  const credit = photographerFromForm(db, formData, user.id, now.slice(0, 10));
  if (!credit.ok) return credit;
  const stored = await storeUploadedPhoto(clubId, user, formData);
  if (!stored.ok) return stored;
  const photo: Photo = {
    id: `ph-venue-${stored.stamp}-${stored.random}`,
    src: stored.src,
    width: stored.width,
    height: stored.height,
    focal: { x: 50, y: 50 },
    tone: "#8a8d86",
    // Written by the system (lib/photo-meta.ts); a place has nobody to identify.
    alt: `${venue.name}, ${venue.area}`,
    credit: credit.photographer.name,
    photographer: credit.photographer,
    review: newReview(user, isClubAdmin(user), now),
    noPeople: true,
    nodeId: org.root.id,
    people: [],
    redactions: [],
    source: { provider: "upload" },
  };
  await mutate(clubId, (d) => {
    const v = d.venues.find((x) => x.id === venue.id)!;
    const before = v.photoId;
    d.photos.push(photo);
    v.photoId = photo.id;
    dropIfUnused(d, before, "ph-venue-");
    d.audit.unshift({ id: `audit-${stored.stamp}`, at: now, actorUserId: user.id, action: "editVenue", summary: `La inn bilde for ${venue.name}` });
  });
  refreshAll();
  return { ok: true };
}

export async function removeVenuePhoto(venueId: string): Promise<PhotoResult> {
  const { clubId, db, user, now } = await context();
  const venue = db.venues.find((v) => v.id === venueId);
  if (!venue || !canEditVenues(user)) return { ok: false, error: "Du har ikke tilgang til å endre denne arenaen." };
  await mutate(clubId, (d) => {
    const v = d.venues.find((x) => x.id === venueId)!;
    const before = v.photoId;
    // An empty id, not a missing key: stored venues never lose a field.
    v.photoId = "";
    dropIfUnused(d, before, "ph-venue-");
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editVenue", summary: `Fjernet bildet for ${venue.name}` });
  });
  refreshAll();
  return { ok: true };
}

/**
 * The main photo of a group. Whoever runs the group may change it. A picture of
 * people goes up with a confirmation that they agree, and with the members who
 * can be recognised ticked, so anonymising one of them later hides the photo
 * (or redacts them) like any other photo on the site.
 */
export async function setGroupPhoto(formData: FormData): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(String(formData.get("nodeId") ?? ""));
  if (!node || !can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre denne gruppen." };
  let taggedIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("tagged") ?? "[]"));
    taggedIds = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return { ok: false, error: "Kunne ikke lese hvem som er med på bildet." };
  }
  const tagged = taggedIds.map((id) => db.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  const blocked = tagged.filter((p) => p.privacy.status !== "visible");
  if (blocked.length) return { ok: false, error: `${blocked.map(fullName).join(", ")} kan ikke vises offentlig. Fjern merkingen eller bruk et annet bilde.` };

  const unconsented = withoutPhotoConsent(tagged);
  if (unconsented.length) return { ok: false, error: `${unconsented.join(", ")} har ikke gitt samtykke til bilder. Ta dem bort fra bildet, eller dekk dem til før du laster opp.` };
  const censored = Math.max(0, Math.min(Math.floor(Number(formData.get("censored") ?? 0)) || 0, 50));
  const noPeople = formData.get("noPeople") === "true";
  if (tagged.length === 0 && !noPeople && censored === 0) return { ok: false, error: "Si hvem som er med på bildet, eller velg at ingen kan kjennes igjen." };
  if (tagged.length > 0 && noPeople) return { ok: false, error: "Du har både merket personer og valgt at ingen kan kjennes igjen." };
  const credit = photographerFromForm(db, formData, user.id, now.slice(0, 10));
  if (!credit.ok) return credit;
  const stored = await storeUploadedPhoto(clubId, user, formData);
  if (!stored.ok) return stored;
  const photo: Photo = {
    id: `ph-group-${stored.stamp}-${stored.random}`,
    src: stored.src,
    width: stored.width,
    height: stored.height,
    focal: { x: 50, y: 45 },
    tone: "#8a8d86",
    // Written by the system, without names (lib/photo-meta.ts).
    alt: autoAlt({ placeName: node.name, date: now.slice(0, 10), tagged: tagged.length }),
    credit: credit.photographer.name,
    photographer: credit.photographer,
    review: newReview(user, isClubAdmin(user), now),
    noPeople: noPeople || undefined,
    censored: censored || undefined,
    nodeId: node.id,
    people: tagged.map((p) => ({ personId: p.id, region: null })),
    redactions: [],
    source: { provider: "upload" },
  };
  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    const before = n.coverPhotoId;
    d.photos.push(photo);
    n.coverPhotoId = photo.id;
    dropIfUnused(d, before, "ph-group-");
    n.updatedAt = now;
    n.updatedByUserId = user.id;
    n.updatedNote = "Bilde endret";
    d.audit.unshift({ id: `audit-${stored.stamp}`, at: now, actorUserId: user.id, action: "editGroup", summary: `La inn nytt bilde for ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

export async function removeGroupPhoto(nodeId: string): Promise<PhotoResult> {
  const { clubId, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node || !can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre denne gruppen." };
  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === nodeId)!;
    const before = n.coverPhotoId;
    n.coverPhotoId = "";
    dropIfUnused(d, before, "ph-group-");
    n.updatedAt = now;
    n.updatedByUserId = user.id;
    n.updatedNote = "Bilde fjernet";
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editGroup", summary: `Fjernet bildet for ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

/* ─── The main picture of an article ─────────────────────────────────────── */

/** Records a change of an article's main picture in its history, so it can be put back (see restoreArticleVersion). */
async function changeArticleHero(articleId: string, heroPhotoId: string, extra?: (d: Db) => void): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const article = db.articles.find((a) => a.id === articleId);
  if (!article || !canEditArticle(user, org, article)) return { ok: false, error: "Du har ikke tilgang til å redigere dette innlegget." };
  if ((article.heroPhotoId ?? "") === heroPhotoId) return { ok: true };
  const before: ArticleCopy = { title: article.title, lead: article.lead, blocks: article.blocks, authorUserId: article.authorUserId, nodeId: article.nodeId, heroPhotoId: article.heroPhotoId ?? "" };
  await mutate(clubId, (d) => {
    extra?.(d);
    const a = d.articles.find((x) => x.id === articleId)!;
    a.heroPhotoId = heroPhotoId || undefined;
    a.editedAt = now;
    a.editedByUserId = user.id;
    const neutralTitle = plain(a.title.map((i) => (i.type === "mention" ? text(i.neutral) : i)));
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editArticle", articleId, summary: `${heroPhotoId ? "Byttet bilde på" : "Tok bort bildet på"} «${neutralTitle}»`, articleBefore: before });
  });
  refreshAll();
  return { ok: true };
}

/** A picture from the library as the article's main picture. */
export async function chooseArticlePhoto(articleId: string, photoId: string): Promise<PhotoResult> {
  const { db, org } = await context();
  if (!inLibrary(db, org, photoId)) return { ok: false, error: "Fant ikke bildet i biblioteket." };
  return changeArticleHero(articleId, photoId);
}

/** Takes the main picture off an article. */
export async function removeArticlePhoto(articleId: string): Promise<PhotoResult> {
  return changeArticleHero(articleId, "");
}

/**
 * A new picture, uploaded for an article: who took it, who is in it and their consent, as for a group's picture. The old
 * picture stays in the library if it is used elsewhere; one made for this article alone is dropped.
 */
export async function setArticlePhoto(formData: FormData): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const article = db.articles.find((a) => a.id === String(formData.get("articleId") ?? ""));
  if (!article || !canEditArticle(user, org, article)) return { ok: false, error: "Du har ikke tilgang til å redigere dette innlegget." };
  let taggedIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("tagged") ?? "[]"));
    taggedIds = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return { ok: false, error: "Kunne ikke lese hvem som er med på bildet." };
  }
  const tagged = taggedIds.map((id) => db.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  const blocked = tagged.filter((p) => p.privacy.status !== "visible");
  if (blocked.length) return { ok: false, error: `${blocked.map(fullName).join(", ")} kan ikke vises offentlig. Fjern merkingen eller bruk et annet bilde.` };
  const unconsented = withoutPhotoConsent(tagged);
  if (unconsented.length) return { ok: false, error: `${unconsented.join(", ")} har ikke gitt samtykke til bilder. Ta dem bort fra bildet, eller dekk dem til før du laster opp.` };
  const censored = Math.max(0, Math.min(Math.floor(Number(formData.get("censored") ?? 0)) || 0, 50));
  const noPeople = formData.get("noPeople") === "true";
  if (tagged.length === 0 && !noPeople && censored === 0) return { ok: false, error: "Si hvem som er med på bildet, eller velg at ingen kan kjennes igjen." };
  if (tagged.length > 0 && noPeople) return { ok: false, error: "Du har både merket personer og valgt at ingen kan kjennes igjen." };
  const credit = photographerFromForm(db, formData, user.id, now.slice(0, 10));
  if (!credit.ok) return credit;
  const stored = await storeUploadedPhoto(clubId, user, formData);
  if (!stored.ok) return stored;
  const node = org.get(article.nodeId);
  const photo: Photo = {
    id: `ph-article-${stored.stamp}-${stored.random}`,
    src: stored.src,
    width: stored.width,
    height: stored.height,
    focal: { x: 50, y: 45 },
    tone: "#8a8d86",
    alt: autoAlt({ placeName: node?.name ?? "Klubben", date: now.slice(0, 10), tagged: tagged.length }),
    credit: credit.photographer.name,
    photographer: credit.photographer,
    review: newReview(user, isClubAdmin(user), now),
    noPeople: noPeople || undefined,
    censored: censored || undefined,
    nodeId: article.nodeId,
    people: tagged.map((p) => ({ personId: p.id, region: null })),
    redactions: [],
    source: { provider: "upload" },
  };
  const result = await changeArticleHero(article.id, photo.id, (d) => void d.photos.push(photo));
  if (!result.ok) await removeUpload(stored.src);
  return result;
}

/**
 * The picture of a ride (Race.photoId), shown on its card on /sykkelritt. Whoever may edit the ride's branch may
 * change it. Rules for a picture of people are the same as for a group's main photo: who is in it, with consent.
 */
export async function setRacePhoto(formData: FormData): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const race = db.races.find((r) => r.id === String(formData.get("raceId") ?? ""));
  if (!race || !can(user, org, race.nodeId, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre dette rittet." };
  let taggedIds: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("tagged") ?? "[]"));
    taggedIds = Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return { ok: false, error: "Kunne ikke lese hvem som er med på bildet." };
  }
  const tagged = taggedIds.map((id) => db.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  const blocked = tagged.filter((p) => p.privacy.status !== "visible");
  if (blocked.length) return { ok: false, error: `${blocked.map(fullName).join(", ")} kan ikke vises offentlig. Fjern merkingen eller bruk et annet bilde.` };
  const unconsented = withoutPhotoConsent(tagged);
  if (unconsented.length) return { ok: false, error: `${unconsented.join(", ")} har ikke gitt samtykke til bilder. Ta dem bort fra bildet, eller dekk dem til før du laster opp.` };
  const censored = Math.max(0, Math.min(Math.floor(Number(formData.get("censored") ?? 0)) || 0, 50));
  const noPeople = formData.get("noPeople") === "true";
  if (tagged.length === 0 && !noPeople && censored === 0) return { ok: false, error: "Si hvem som er med på bildet, eller velg at ingen kan kjennes igjen." };
  if (tagged.length > 0 && noPeople) return { ok: false, error: "Du har både merket personer og valgt at ingen kan kjennes igjen." };
  const credit = photographerFromForm(db, formData, user.id, now.slice(0, 10));
  if (!credit.ok) return credit;
  const stored = await storeUploadedPhoto(clubId, user, formData);
  if (!stored.ok) return stored;
  const photo: Photo = {
    id: `ph-race-${stored.stamp}-${stored.random}`,
    src: stored.src,
    width: stored.width,
    height: stored.height,
    focal: { x: 50, y: 45 },
    tone: "#8a8d86",
    alt: autoAlt({ placeName: race.name, date: now.slice(0, 10), tagged: tagged.length }),
    credit: credit.photographer.name,
    photographer: credit.photographer,
    review: newReview(user, isClubAdmin(user), now),
    noPeople: noPeople || undefined,
    censored: censored || undefined,
    nodeId: race.nodeId,
    people: tagged.map((p) => ({ personId: p.id, region: null })),
    redactions: [],
    source: { provider: "upload" },
  };
  await mutate(clubId, (d) => {
    const r = d.races.find((x) => x.id === race.id)!;
    const before = r.photoId;
    d.photos.push(photo);
    r.photoId = photo.id;
    dropIfUnused(d, before, "ph-race-");
    d.audit.unshift({ id: `audit-${stored.stamp}`, at: now, actorUserId: user.id, action: "editRace", summary: `La inn bilde for rittet ${race.name}` });
  });
  refreshAll();
  return { ok: true };
}

/** A ride's picture taken from the library (every picture in the project). */
export async function chooseRacePhoto(raceId: string, photoId: string): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const race = db.races.find((r) => r.id === raceId);
  if (!race || !can(user, org, race.nodeId, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre dette rittet." };
  if (!inLibrary(db, org, photoId)) return { ok: false, error: "Fant ikke bildet i biblioteket." };
  await mutate(clubId, (d) => {
    const r = d.races.find((x) => x.id === raceId)!;
    const before = r.photoId;
    r.photoId = photoId;
    dropIfUnused(d, before, "ph-race-");
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editRace", summary: `Brukte et bilde fra biblioteket for rittet ${race.name}` });
  });
  refreshAll();
  return { ok: true };
}

/** Takes the picture off a ride; the card on /sykkelritt then shows the club's standard picture. */
export async function removeRacePhoto(raceId: string): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const race = db.races.find((r) => r.id === raceId);
  if (!race || !can(user, org, race.nodeId, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre dette rittet." };
  await mutate(clubId, (d) => {
    const r = d.races.find((x) => x.id === raceId)!;
    const before = r.photoId;
    r.photoId = "";
    dropIfUnused(d, before, "ph-race-");
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editRace", summary: `Fjernet bildet for rittet ${race.name}` });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Membership rates ──────────────────────────────────────────────────── */

/**
 * The club's membership rates, set in one place and read everywhere on the site (Bli med, Barn og ungdom, the front page).
 * Whoever may change the club's settings does it.
 */
export async function saveMembership(input: MembershipEdit): Promise<QuoteResult> {
  const { clubId, user, now } = await context();
  if (!canChangeClubSettings(user)) return { ok: false, error: "Bare klubbadministrator kan sette prisene." };
  const edit: MembershipEdit = {
    rates: input.rates.map((r) => ({
      label: r.label.trim(),
      amount: r.amount,
      ...(r.hint?.trim() && { hint: r.hint.trim() }),
      ...(r.minor && { minor: true }),
      ...(r.children && { children: true }),
    })),
    note: input.note.trim(),
    ...(input.requiredFor?.trim() && { requiredFor: input.requiredFor.trim() }),
  };
  const problem = validateMembershipEdit(edit);
  if (problem) return { ok: false, error: problem };
  await mutate(clubId, (d) => {
    d.club.membership = edit;
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editMembership", summary: "Endret medlemskap og priser" });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Activities & settings ─────────────────────────────────────────────── */

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
  /** Ask for the quote to stand on the front page too; the club administrator approves (or, for them, it is approved at once). */
  front?: boolean;
}): Promise<QuoteResult> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(input.nodeId);
  if (!node || !can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
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
    n.quotes = [...(n.quotes ?? []), { personId: personId!, quote, relation, givenAt: now.slice(0, 10), ...(input.front && { front: isClubAdmin(user) ? ("approved" as const) : ("requested" as const) }) }];
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
export async function editGroupQuote(input: { nodeId: string; personId: string; quote: string; relation?: string; firstName?: string; lastName?: string; consent: boolean }): Promise<QuoteResult> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(input.nodeId);
  if (!node || !can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  const existing = node.quotes?.find((q) => q.personId === input.personId);
  if (!existing) return { ok: false, error: "Fant ikke sitatet." };
  const quote = input.quote.trim().replace(/^[«"]|[»"]$/g, "");
  if (quote.length < 10) return { ok: false, error: "Skriv sitatet, minst en setning." };
  if (quote.length > 280) return { ok: false, error: "Sitatet er for langt. Hold det under 280 tegn." };
  if (quote !== existing.quote && !input.consent) return { ok: false, error: "Bekreft at personen har godkjent den nye teksten." };
  const relation = existing.relation !== undefined ? input.relation?.trim() || existing.relation : undefined;
  // A parent was added by name for this quote only, so the name is the quote's to change; a member's name is the register's.
  const quoteOnly = !!db.people.find((p) => p.id === input.personId && p.memberships.length === 0 && p.id.startsWith("bp-q-"));
  const newFirst = quoteOnly ? input.firstName?.trim() : undefined;
  if (quoteOnly && input.firstName !== undefined && !newFirst) return { ok: false, error: "Skriv fornavnet." };

  await mutate(clubId, (d) => {
    if (quoteOnly && newFirst) {
      const person = d.people.find((x) => x.id === input.personId);
      if (person) {
        person.firstName = newFirst;
        person.lastName = input.lastName?.trim() ?? person.lastName;
      }
    }
    const n = d.nodes.find((x) => x.id === node.id)!;
    n.quotes = (n.quotes ?? []).map((q) =>
      q.personId === input.personId
        ? {
            ...q,
            quote,
            ...(relation !== undefined && { relation }),
            ...(quote !== existing.quote && { givenAt: now.slice(0, 10) }),
            // New words must be approved for the front page again, unless the club administrator wrote them.
            ...(quote !== existing.quote && q.front === "approved" && !isClubAdmin(user) && { front: "requested" as const }),
          }
        : q,
    );
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "quote", personId: input.personId, summary: `Endret et sitat på siden til ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

/**
 * Whether a group quote also stands on the front page. Whoever runs the group
 * can ask for it («requested») or take it down («none»); only the club
 * administrator approves, since the front page speaks for the whole club.
 */
export async function setQuoteFront(nodeId: string, personId: string, state: "none" | "requested" | "approved"): Promise<QuoteResult> {
  const { clubId, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node || !can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  const quote = node.quotes?.find((q) => q.personId === personId);
  if (!quote) return { ok: false, error: "Fant ikke sitatet." };
  if (state === "approved" && !isClubAdmin(user)) return { ok: false, error: "Bare klubbadministrator kan godkjenne sitater for forsiden." };
  if (state === "requested" && quote.front === "approved" && !isClubAdmin(user)) return { ok: false, error: "Sitatet er allerede godkjent for forsiden." };
  const summary = { none: "Tok et sitat av forsiden", requested: "Ba om at et sitat vises på forsiden", approved: "Godkjente et sitat for forsiden" }[state];
  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    n.quotes = (n.quotes ?? []).map((q) => {
      if (q.personId !== personId) return q;
      const { front: _old, ...rest } = q;
      return state === "none" ? rest : { ...rest, front: state };
    });
    // One quote per person stands on the front page: approving this one takes the person's quotes on other groups' pages off.
    if (state === "approved") {
      for (const other of d.nodes) {
        if (other.id === node.id) continue;
        other.quotes = (other.quotes ?? []).map((q) => {
          if (q.personId !== personId || q.front !== "approved") return q;
          const { front: _f, ...rest } = q;
          return rest;
        });
      }
    }
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "quote", personId, summary: `${summary} (${node.name})` });
  });
  refreshAll();
  return { ok: true };
}

export async function removeGroupQuote(nodeId: string, personId: string): Promise<QuoteResult> {
  const { clubId, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node || !can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === node.id)!;
    n.quotes = (n.quotes ?? []).filter((q) => q.personId !== personId);
    // A parent added for this quote alone is not in the register for any other reason: with the quote goes the person and the portrait.
    const person = d.people.find((p) => p.id === personId);
    if (person && person.id.startsWith("bp-q-") && person.memberships.length === 0 && !d.nodes.some((x) => x.quotes?.some((q) => q.personId === personId))) {
      const before = person.portraitPhotoId;
      d.people = d.people.filter((p) => p.id !== personId);
      dropIfUnused(d, before, "ph-portrait-");
    }
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
  if (!org.get(nodeId) || !can(user, org, nodeId, "members")) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
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
  if (!node || !can(user, org, node.id, "members")) return { ok: false, error: "Du har ikke tilgang til denne gruppen." };
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

/* ─── The photo library ─────────────────────────────────────────────────
   Every picture in the project can be used again, by reference: the same Photo record stands
   wherever it is used, so an anonymisation or a withdrawal reaches all of them. */

/** The pictures the picker offers (lib/photo-library.ts). Any admin may look. */
export async function getPhotoLibrary(personId?: string): Promise<LibraryPhoto[]> {
  const { db, org } = await context();
  return libraryPhotos(db, org, { personId });
}

/**
 * Drops a picture that nothing uses any more (a node's cover, a venue's picture,
 * a person's portrait, an article), but only one that admin itself uploaded to
 * stand in one place. A picture reused elsewhere stays.
 */
function dropIfUnused(d: Db, photoId: string | undefined, ownedPrefix: string) {
  if (!photoId || !photoId.startsWith(ownedPrefix)) return;
  const used =
    d.nodes.some((n) => n.coverPhotoId === photoId) ||
    d.venues.some((v) => v.photoId === photoId) ||
    d.people.some((p) => p.portraitPhotoId === photoId) ||
    d.articles.some((a) => articlePhotoIds(a).includes(photoId));
  if (!used) d.photos = d.photos.filter((x) => x.id !== photoId);
}

/** A group's main picture taken from the library instead of uploaded. */
export async function chooseGroupPhoto(nodeId: string, photoId: string): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const node = org.get(nodeId);
  if (!node || !can(user, org, node.id, "edit_group")) return { ok: false, error: "Du har ikke tilgang til å endre denne gruppen." };
  if (!inLibrary(db, org, photoId)) return { ok: false, error: "Fant ikke bildet i biblioteket." };
  await mutate(clubId, (d) => {
    const n = d.nodes.find((x) => x.id === nodeId)!;
    const before = n.coverPhotoId;
    n.coverPhotoId = photoId;
    dropIfUnused(d, before, "ph-group-");
    n.updatedAt = now;
    n.updatedByUserId = user.id;
    n.updatedNote = "Bilde endret";
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editGroup", summary: `Brukte et bilde fra biblioteket for ${node.name}` });
  });
  refreshAll();
  return { ok: true };
}

/** A venue's picture taken from the library. */
export async function chooseVenuePhoto(venueId: string, photoId: string): Promise<PhotoResult> {
  const { clubId, db, org, user, now } = await context();
  const venue = db.venues.find((v) => v.id === venueId);
  if (!venue || !canEditVenues(user)) return { ok: false, error: "Du har ikke tilgang til å endre denne arenaen." };
  if (!inLibrary(db, org, photoId)) return { ok: false, error: "Fant ikke bildet i biblioteket." };
  await mutate(clubId, (d) => {
    const v = d.venues.find((x) => x.id === venueId)!;
    const before = v.photoId;
    v.photoId = photoId;
    dropIfUnused(d, before, "ph-venue-");
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editVenue", summary: `Brukte et bilde fra biblioteket for ${venue.name}` });
  });
  refreshAll();
  return { ok: true };
}

/**
 * A person's portrait taken from the library (a picture they are in, or any
 * picture of the club). From the quotes page it comes with the person's yes to
 * the picture standing with the quote, which is recorded as photo consent.
 */
export async function choosePortrait(personId: string, photoId: string, consent: boolean): Promise<PortraitResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canEditPortrait(user, org, person, db.nodes)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  if (person.privacy.status === "anonymised") return { ok: false, error: "Personen er anonymisert." };
  if (!inLibrary(db, org, photoId)) return { ok: false, error: "Fant ikke bildet i biblioteket." };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    const before = p.portraitPhotoId;
    p.portraitPhotoId = photoId;
    dropIfUnused(d, before, "ph-portrait-");
    if (consent && p.privacy.photoConsent !== "granted") {
      p.privacy.photoConsent = "granted";
      p.privacy.consentUpdatedAt = now.slice(0, 10);
      p.privacy.consentBy = user.name;
    }
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "portrait", personId, summary: "Brukte et bilde fra biblioteket som portrett" });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Rides (Sykkelritt) ──────────────────────────────────────────────────── */

/**
 * Adds or changes a ride in the club's calendar (`/admin/sykkelritt`). Whoever may edit the ride's branch
 * (Landevei, Terreng) may; a ride with a page of its own keeps what that page says, and cannot be removed here.
 */
export async function saveRace(input: RaceEdit & { id?: string }): Promise<QuoteResult> {
  const { clubId, db, org, user, now } = await context();
  const branchIds = org.nodes.filter((n) => n.kind === "discipline" && can(user, org, n.id, "edit_group")).map((n) => n.id);
  const existing = input.id ? db.races.find((r) => r.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "Fant ikke rittet." };
  if (existing && !can(user, org, existing.nodeId, "edit_group")) return { ok: false, error: "Du har ikke tilgang til dette rittet." };
  const problem = validateRaceEdit(input, db, branchIds);
  if (problem) return { ok: false, error: problem };
  const fields = {
    nodeId: input.nodeId,
    name: input.name.trim(),
    date: input.date,
    endDate: input.endDate && input.endDate !== input.date ? input.endDate : undefined,
    place: input.place.trim(),
    format: input.format.trim() || undefined,
    organiser: input.organiser.trim() || undefined,
    url: input.url.trim() || undefined,
    ownEvent: input.ownEvent || undefined,
    groupIds: input.groupIds.length ? input.groupIds : undefined,
  };
  const id = existing?.id ?? `r-${slugify(fields.name).slice(0, 24) || "ritt"}-${Date.now().toString(36)}`;
  await mutate(clubId, (d) => {
    if (existing) Object.assign(d.races.find((r) => r.id === id)!, fields);
    else d.races.push({ id, ...fields });
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editRace", summary: `${existing ? "Endret" : "La inn"} rittet ${fields.name}` });
  });
  refreshAll();
  return { ok: true };
}

/** Removes a ride from the calendar. A ride with a page of its own stays (the page would lose its place). */
export async function removeRace(id: string): Promise<QuoteResult> {
  const { clubId, db, org, user, now } = await context();
  const race = db.races.find((r) => r.id === id);
  if (!race) return { ok: false, error: "Fant ikke rittet." };
  if (!can(user, org, race.nodeId, "edit_group")) return { ok: false, error: "Du har ikke tilgang til dette rittet." };
  if (race.page || race.slug || race.info) return { ok: false, error: "Dette rittet har en egen side og kan ikke fjernes her. Endre det i stedet." };
  await mutate(clubId, (d) => {
    d.races = d.races.filter((r) => r.id !== id);
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "editRace", summary: `Fjernet rittet ${race.name}` });
  });
  refreshAll();
  return { ok: true };
}

/**
 * The page with more behind a quote: a member story (Article.memberStory) about the person, which the
 * quote then links to («Les … historie»). It closes with the person's Strava link and the group they ride
 * in (the page builds both). Written in admin by whoever may change the person's portrait; a line starting
 * «> » becomes a pull quote. Names are linked as mentions, so anonymising the person later rewrites the page.
 * The Strava link is optional and kept on the person; an empty one removes it.
 */
export async function saveMemberStory(input: { personId: string; nodeId: string; title: string; lead: string; text: string; strava: string }): Promise<QuoteResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === input.personId);
  if (!person || !canEditPortrait(user, org, person, db.nodes)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  if (person.privacy.status !== "visible") return { ok: false, error: "Personen er merket «Ikke publiser» eller anonymisert, og kan ikke ha en side." };
  const node = org.get(input.nodeId);
  if (!node) return { ok: false, error: "Fant ikke gruppen." };
  const title = input.title.trim();
  const lead = input.lead.trim();
  const paragraphs = input.text.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  if (title.length < 5 || title.length > 120) return { ok: false, error: "Skriv en overskrift på 5 til 120 tegn." };
  if (!paragraphs.length) return { ok: false, error: "Skriv minst ett avsnitt." };
  if (input.text.length > 6000) return { ok: false, error: "Teksten er for lang." };
  const strava = input.strava.trim();
  if (strava && !/^https:\/\/(www\.)?strava\.com\/[A-Za-z0-9/_?=&.-]+$/.test(strava)) return { ok: false, error: "Strava-lenken må begynne med https://www.strava.com/." };

  const linked = [person];
  const blocks: Block[] = paragraphs.map((para) =>
    para.startsWith("> ")
      ? { type: "quote" as const, content: linkPeople(para.slice(2).replace(/\n/g, " "), linked, node.id, org.sportOf(node.id)?.id), attribution: [{ type: "mention" as const, personId: person.id, text: person.firstName, neutral: "" }], speakerPersonId: person.id }
      : { type: "paragraph" as const, content: linkPeople(para.replace(/\n/g, " "), linked, node.id, org.sportOf(node.id)?.id) },
  );
  const consented = person.privacy.photoConsent === "granted" && person.portraitPhotoId && db.photos.some((x) => x.id === person.portraitPhotoId);
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === person.id)!;
    p.stravaUrl = strava || undefined;
    const fields = {
      title: linkPeople(title, linked, node.id, org.sportOf(node.id)?.id),
      lead: lead ? linkPeople(lead, linked, node.id, org.sportOf(node.id)?.id) : undefined,
      blocks,
      heroPhotoId: consented ? p.portraitPhotoId : undefined,
    };
    const existing = d.articles.find((a) => a.memberStory && a.aboutPersonId === person.id);
    if (existing) {
      Object.assign(existing, fields, { editedAt: now, editedByUserId: user.id, status: "published" as const });
    } else {
      d.articles.push({
        id: `a-story-${Date.now().toString(36)}`,
        slug: `medlem-${crypto.randomUUID().slice(0, 8)}`,
        nodeId: node.id,
        ...fields,
        status: "published",
        authorUserId: user.id,
        createdAt: now,
        publishedAt: now,
        onHomepage: false,
        memberStory: true,
        aboutPersonId: person.id,
      });
    }
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "quote", personId: person.id, summary: existing ? "Endret siden med mer bak et sitat" : "Laget en side med mer bak et sitat" });
  });
  refreshAll();
  return { ok: true };
}

/** Takes a member's story page down again (the quote stays, without its link). */
export async function removeMemberStory(personId: string): Promise<QuoteResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canEditPortrait(user, org, person, db.nodes)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  await mutate(clubId, (d) => {
    d.articles = d.articles.filter((a) => !(a.memberStory && a.aboutPersonId === personId));
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "quote", personId, summary: "Tok ned siden med mer bak et sitat" });
  });
  refreshAll();
  return { ok: true };
}

/** How a person's portrait stands in the quote row (Person.cardStyle). Whoever may change the portrait may change this. */
export async function setPortraitStyle(personId: string, style: "natural" | "studio" | "color"): Promise<PortraitResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canEditPortrait(user, org, person, db.nodes)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  if (!["natural", "studio", "color"].includes(style)) return { ok: false, error: "Ukjent kortstil." };
  await mutate(clubId, (d) => {
    // Kept on the person, so it holds when the portrait is replaced.
    d.people.find((p) => p.id === personId)!.cardStyle = style;
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "portrait", personId, summary: `Kortstil for portrettet: ${style === "natural" ? "naturlig" : style === "studio" ? "hvit studio" : "farget"}` });
  });
  refreshAll();
  return { ok: true };
}

/* ─── Portraits ─────────────────────────────────────────────────────────── */

export type PortraitResult = { ok: true } | { ok: false; error: string };

const canEditPortrait = (user: Parameters<typeof canRecordConsent>[0], org: Parameters<typeof canRecordConsent>[1], person: Person, nodes: Parameters<typeof can>[1]["nodes"] = []) =>
  canRecordConsent(user, org, person) ||
  user.roles.some((r) => r.role === "clubAdmin") ||
  // Someone quoted on the page of a group the user runs (a parent has no membership to go by): the portrait goes with the quote.
  nodes.some((n) => can(user, org, n.id, "edit_group") && n.quotes?.some((q) => q.personId === person.id));

/**
 * A portrait uploaded in admin for someone in a group the admin runs. The
 * browser scales it down to 1200 px as JPEG first (portrait-upload.tsx),
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
  if (!person || !canEditPortrait(user, org, person, db.nodes)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  if (person.privacy.status === "anonymised") return { ok: false, error: "Personen er anonymisert." };
  // From the quotes page: the person has said yes to the picture standing with the quote, which is recorded as photo consent.
  const withConsent = formData.get("consent") === "true";
  const withTransparency = formData.get("transparent") === "true";
  if (!(file instanceof File) || !/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, error: "Velg et bilde (JPEG, PNG eller WebP)." };
  if (file.size > maxUploadBytes(user, 400_000, 3_000_000)) return { ok: false, error: "Bildet er for stort. Velg et mindre bilde, så gjør nettsiden det lite nok selv." };
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
    // A cut-out (the browser sends it as WebP or PNG with see-through parts) is a studio portrait to begin with, unless a style is already chosen.
    if (!p.cardStyle && !db.photos.find((x) => x.id === person.portraitPhotoId)?.cardStyle && withTransparency) p.cardStyle = "studio";
    // A portrait replaced in admin is removed; one from the seed stays, unused.
    const before = p.portraitPhotoId;
    d.photos.push(photo);
    p.portraitPhotoId = photo.id;
    dropIfUnused(d, before, "ph-portrait-");
    if (withConsent && p.privacy.photoConsent !== "granted") {
      p.privacy.photoConsent = "granted";
      p.privacy.consentUpdatedAt = now.slice(0, 10);
      p.privacy.consentBy = user.name;
    }
    d.audit.unshift({ id: `audit-${stamp}`, at: now, actorUserId: user.id, action: "portrait", personId: person.id, summary: withConsent ? "La inn nytt portrett, med samtykke til bildet" : "La inn nytt portrett" });
  });
  refreshAll();
  return { ok: true };
}

export async function removePortrait(personId: string): Promise<PortraitResult> {
  const { clubId, db, org, user, now } = await context();
  const person = db.people.find((p) => p.id === personId);
  if (!person || !canEditPortrait(user, org, person, db.nodes)) return { ok: false, error: "Du har ikke tilgang til denne personen." };
  await mutate(clubId, (d) => {
    const p = d.people.find((x) => x.id === personId)!;
    const before = p.portraitPhotoId;
    p.portraitPhotoId = undefined;
    dropIfUnused(d, before, "ph-portrait-");
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


/* ─── Users: who can sign in, and as what ───────────────────────────────── */

/** `emailed`: an invitation went out by e-mail (only set by the actions that send one). */
export type UserResult = { ok: true; emailed?: boolean } | { ok: false; error: string };

/**
 * Whoever may invite users, for some part of the club, starts here; what they may do to whom is
 * then checked per area (grantProblem). The things that reach beyond one area (a name or an
 * address, stopping someone from signing in) stay with the club administrators (adminOnly).
 */
async function userContext() {
  const ctx = await context();
  if (!canAnywhere(ctx.user, "users")) return { ...ctx, denied: "Du har ikke tilgang til å administrere brukere." as const };
  return { ...ctx, denied: undefined };
}

const adminOnly = (user: User) => (isClubAdmin(user) ? undefined : "Bare klubbadministrator kan gjøre dette.");

/** True when the actor may manage at least one of the target's assignments: invites, reminders and so on stay within their areas. */
const inScopeOf = (actor: User, org: Org, target: User) => target.roles.some((r) => can(actor, org, r.nodeId, "users"));

const userAudit = (e: Omit<AuditEntry, "id">): AuditEntry => ({ id: `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`, ...e });

/** Where the sign-in page is, from the request itself, so the link in the mail points at the site that sent it. */
async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;
}

/** E-mails the invitation: who invited, the access, and a button to sign-in with the address filled in. False when no mail went out. */
async function sendInvitation(db: Db, org: Org, target: User, invitedBy: User): Promise<boolean> {
  const loginUrl = `${await siteOrigin()}/logg-inn?epost=${encodeURIComponent(target.email)}`;
  const mail = inviteMail({ clubName: db.club.name, clubShortName: db.club.shortName, name: target.name, access: roleSentence(org, target), invitedBy: invitedBy.name, loginUrl });
  return sendMail({ from: mailSender(db.club.shortName), to: target.email, ...mail });
}

/**
 * Invites someone: a user with an e-mail address, an area and what they may do there (`can`,
 * possibly from a quick pick), and an e-mail with a button to /logg-inn where the address is
 * already filled in. Being invited to the area lets them read it; each action is one of `can`.
 * The inviter can only give what they hold there themselves. The person then asks for a code
 * (sendLoginCode). If no mail can go out (no RESEND_API_KEY, or Resend refuses) the user is
 * still made, `emailed` is false, and the page hands over a message to pass on instead.
 */
export async function inviteUser(input: { name: string; email: string; nodeId: string; can: Permission[]; preset?: AccessPreset }): Promise<UserResult> {
  const { clubId, db, org, user, now, denied } = await userContext();
  if (denied) return { ok: false, error: denied };
  const can_ = [...new Set(input.can ?? [])];
  const error = validateName(input.name) ?? validateEmail(db, input.email) ?? grantProblem(user, org, input.nodeId, can_);
  if (error) return { ok: false, error };
  const id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const invited: User = {
    id,
    name: input.name.trim(),
    email: normaliseEmail(input.email),
    authProviders: ["email"],
    active: true,
    guardianOfPersonIds: [],
    roles: [{ role: roleKindFor(can_, input.nodeId, org), nodeId: input.nodeId, can: can_, ...(input.preset && presetMatching(can_) === input.preset && { preset: input.preset }) }],
  };
  await mutate(clubId, (d) => {
    d.users.push(invited);
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "inviteUser", userId: id, summary: `Inviterte en bruker til ${org.get(input.nodeId)?.name} med ${can_.length} ${can_.length === 1 ? "tillatelse" : "tillatelser"}` }));
  });
  refreshAll();
  return { ok: true, emailed: await sendInvitation(db, org, invited, user) };
}
/** Sends the invitation again, for someone who did not get it or lost it. Only to an active user. */
export async function resendInvitation(userId: string): Promise<UserResult> {
  const { db, org, user, denied } = await userContext();
  if (denied) return { ok: false, error: denied };
  const target = db.users.find((u) => u.id === userId);
  if (!target || target.active === false || !target.roles.length) return { ok: false, error: "Brukeren kan ikke logge inn, så invitasjonen ville ikke hjulpet. Aktiver brukeren først." };
  if (!isClubAdmin(user) && !inScopeOf(user, org, target)) return { ok: false, error: "Du har ikke tilgang til denne brukeren." };
  const emailed = await sendInvitation(db, org, target, user);
  if (!emailed) return { ok: false, error: "Kunne ikke sende e-posten. Sjekk at e-post er satt opp (RESEND_API_KEY), eller gi beskjed selv." };
  return { ok: true, emailed };
}

/** Name and e-mail address. Nobody changes their own address: a typo would lock them out. */
export async function updateUser(userId: string, edit: { name: string; email: string }): Promise<UserResult> {
  const { clubId, db, user, now, denied } = await userContext();
  if (denied ?? adminOnly(user)) return { ok: false, error: (denied ?? adminOnly(user))! };
  const target = db.users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "Fant ikke brukeren." };
  const error = validateName(edit.name) ?? validateEmail(db, edit.email, userId);
  if (error) return { ok: false, error };
  if (target.id === user.id && normaliseEmail(edit.email) !== normaliseEmail(target.email)) return { ok: false, error: "Du kan ikke endre din egen e-postadresse. Be en annen klubbadministrator om det." };
  await mutate(clubId, (d) => {
    const u = d.users.find((x) => x.id === userId)!;
    u.name = edit.name.trim();
    u.email = normaliseEmail(edit.email);
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "editUser", userId, summary: "Endret navn eller e-postadresse for en bruker" }));
  });
  refreshAll();
  return { ok: true };
}

/** Deactivating keeps the user and their history; a deactivated user is turned away on the next request. */
export async function setUserActive(userId: string, active: boolean): Promise<UserResult> {
  const { clubId, db, user, now, denied } = await userContext();
  if (denied ?? adminOnly(user)) return { ok: false, error: (denied ?? adminOnly(user))! };
  const target = db.users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "Fant ikke brukeren." };
  if (!active) {
    const problem = lockoutProblem(db, user.id, target, { ...target, active: false });
    if (problem) return { ok: false, error: problem };
  } else if (!target.roles.length) {
    return { ok: false, error: "Gi brukeren en rolle før du aktiverer." };
  }
  await mutate(clubId, (d) => {
    d.users.find((x) => x.id === userId)!.active = active;
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "editUser", userId, summary: active ? "Aktiverte en bruker" : "Deaktiverte en bruker" }));
  });
  refreshAll();
  return { ok: true };
}

/**
 * Gives an existing user access to an area, or changes what they may do there: one assignment
 * per area, with the permissions ticked. The one giving can only give what they hold there
 * themselves, and cannot change an assignment that holds more than they do.
 */
export async function grantAccess(userId: string, input: { nodeId: string; can: Permission[]; preset?: AccessPreset }): Promise<UserResult> {
  const { clubId, db, org, user, now, denied } = await userContext();
  if (denied) return { ok: false, error: denied };
  const target = db.users.find((u) => u.id === userId);
  if (!target) return { ok: false, error: "Fant ikke brukeren." };
  const can_ = [...new Set(input.can ?? [])];
  const problem = grantProblem(user, org, input.nodeId, can_);
  if (problem) return { ok: false, error: problem };
  const existing = target.roles.find((r) => r.nodeId === input.nodeId);
  if (existing) {
    const mine = new Set(grantable(user, org, input.nodeId));
    if (permsOf(existing).some((p) => !mine.has(p))) return { ok: false, error: "Personen har mer tilgang her enn du kan endre." };
  }
  const next = { role: roleKindFor(can_, input.nodeId, org), nodeId: input.nodeId, can: can_, ...(input.preset && presetMatching(can_) === input.preset && { preset: input.preset }) };
  const after: User = { ...target, roles: [...target.roles.filter((r) => r.nodeId !== input.nodeId), next] };
  const lockout = lockoutProblem(db, user.id, target, after);
  if (lockout) return { ok: false, error: lockout };
  await mutate(clubId, (d) => {
    const u = d.users.find((x) => x.id === userId)!;
    u.roles = [...u.roles.filter((r) => r.nodeId !== input.nodeId), next];
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "editUser", userId, summary: `${existing ? "Endret" : "Ga"} tilgangen til en bruker på ${org.get(input.nodeId)?.name}` }));
  });
  refreshAll();
  return { ok: true };
}

export async function removeUserRole(userId: string, role: { role: RoleKind; nodeId: string }): Promise<UserResult> {
  const { clubId, db, org, user, now, denied } = await userContext();
  if (denied) return { ok: false, error: denied };
  const target = db.users.find((u) => u.id === userId);
  const found = target?.roles.find((r) => r.role === role.role && r.nodeId === role.nodeId);
  if (!target || !found) return { ok: false, error: "Fant ikke tilgangen." };
  if (!can(user, org, role.nodeId, "users")) return { ok: false, error: "Du har ikke tilgang til å endre tilgang her." };
  const mine = new Set(grantable(user, org, role.nodeId));
  if (permsOf(found).some((p) => !mine.has(p))) return { ok: false, error: "Personen har mer tilgang her enn du kan fjerne." };
  if (target.roles.length === 1) return { ok: false, error: "Brukeren må ha minst én tilgang. Bruk «Deaktiver» for å ta bort all tilgang." };
  const after: User = { ...target, roles: target.roles.filter((r) => !(r.role === role.role && r.nodeId === role.nodeId)) };
  const problem = lockoutProblem(db, user.id, target, after);
  if (problem) return { ok: false, error: problem };
  await mutate(clubId, (d) => {
    const u = d.users.find((x) => x.id === userId)!;
    u.roles = u.roles.filter((r) => !(r.role === role.role && r.nodeId === role.nodeId));
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "editUser", userId, summary: `Tok bort tilgangen på ${org.get(role.nodeId)?.name} fra en bruker` }));
  });
  refreshAll();
  return { ok: true };
}

/* ─── Your own profile picture ──────────────────────────────────────────── */

export type AvatarResult = { ok: true } | { ok: false; error: string };

/**
 * Sets the signed-in user's own profile picture. It is always the acting user
 * who is changed, never an id from the request. The browser has already cropped
 * it square and redrawn it (components/admin/avatar-editor.tsx), which drops
 * the file's metadata; the checks here are for a request that did not come from it.
 */
export async function setOwnAvatar(formData: FormData): Promise<AvatarResult> {
  const { clubId, user } = await context();
  const file = formData.get("file");
  const width = Number(formData.get("width"));
  const height = Number(formData.get("height"));
  if (!(file instanceof File) || !/^image\/(jpeg|png|webp)$/.test(file.type)) return { ok: false, error: "Velg et bilde (JPEG, PNG eller WebP)." };
  if (file.size > 1_000_000) return { ok: false, error: "Bildet er for stort." };
  if (!(width >= 64 && height >= 64 && width <= 2000 && height <= 2000)) return { ok: false, error: "Kunne ikke lese bildets størrelse." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const random = crypto.randomUUID().slice(0, 8);
  let src: string;
  try {
    src = persistent()
      ? await uploadPortrait(bytes, file.type, `${clubId}/profil/${Date.now().toString(36)}-${random}.${file.type.split("/")[1]}`)
      : `data:${file.type};base64,${Buffer.from(bytes).toString("base64")}`;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Kunne ikke laste opp bildet." };
  }

  let previous: string | undefined;
  await mutate(clubId, (d) => {
    const u = d.users.find((x) => x.id === user.id)!;
    previous = u.avatar?.src;
    u.avatar = { src, width: Math.round(width), height: Math.round(height) };
  });
  if (previous) await removeUpload(previous);
  refreshAll();
  return { ok: true };
}

export async function removeOwnAvatar(): Promise<AvatarResult> {
  const { clubId, user } = await context();
  let previous: string | undefined;
  await mutate(clubId, (d) => {
    const u = d.users.find((x) => x.id === user.id)!;
    previous = u.avatar?.src;
    u.avatar = undefined;
  });
  if (previous) await removeUpload(previous);
  refreshAll();
  return { ok: true };
}


/* ─── Externals: people outside the register, such as a photographer ────── */

export type ExternalResult = { ok: true; id: string } | { ok: false; error: string };

/**
 * Adds an external, or returns the one already there with the same name. Anyone
 * who has a role may do it, so an upload is never held up for want of a
 * photographer in the list; a club administrator looks over the list.
 */
export async function addExternal(name: string, note?: string): Promise<ExternalResult> {
  const { clubId, db, user, now } = await context();
  const clean = normaliseName(name);
  const existing = db.externals.find((e) => normaliseName(e.name).toLocaleLowerCase("nb") === clean.toLocaleLowerCase("nb"));
  if (existing) return { ok: true, id: existing.id };
  const error = validateExternalName(db, clean);
  if (error) return { ok: false, error };
  const id = `x-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const external: External = { id, name: clean, note: note?.trim().slice(0, 200) || undefined, createdAt: now, createdByUserId: user.id };
  await mutate(clubId, (d) => {
    d.externals.push(external);
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "editExternal", summary: "La til en ekstern person" }));
  });
  refreshAll();
  return { ok: true, id };
}

export async function updateExternal(id: string, edit: { name: string; note?: string }): Promise<ExternalResult> {
  const { clubId, db, user, now } = await context();
  if (!isClubAdmin(user)) return { ok: false, error: "Bare klubbadministrator kan endre eksterne." };
  const target = db.externals.find((e) => e.id === id);
  if (!target) return { ok: false, error: "Fant ikke personen." };
  const error = validateExternalName(db, edit.name, id);
  if (error) return { ok: false, error };
  await mutate(clubId, (d) => {
    const e = d.externals.find((x) => x.id === id)!;
    e.name = normaliseName(edit.name);
    e.note = edit.note?.trim().slice(0, 200) || undefined;
    // A credit says the name as it was; the pictures follow a corrected name.
    for (const photo of d.photos) {
      if (photo.photographer?.kind === "external" && photo.photographer.refId === id) {
        photo.photographer.name = e.name;
        photo.credit = e.name;
      }
    }
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "editExternal", summary: "Endret en ekstern person" }));
  });
  refreshAll();
  return { ok: true, id };
}

export async function deleteExternal(id: string): Promise<ExternalResult> {
  const { clubId, db, user, now } = await context();
  if (!isClubAdmin(user)) return { ok: false, error: "Bare klubbadministrator kan slette eksterne." };
  if (!db.externals.some((e) => e.id === id)) return { ok: false, error: "Fant ikke personen." };
  const used = externalUsage(db, id);
  if (used > 0) return { ok: false, error: `Personen er oppgitt som fotograf på ${used} ${used === 1 ? "bilde" : "bilder"}. Bytt fotograf på bildene først.` };
  await mutate(clubId, (d) => {
    d.externals = d.externals.filter((e) => e.id !== id);
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "editExternal", summary: "Slettet en ekstern person" }));
  });
  refreshAll();
  return { ok: true, id };
}


/* ─── Checking uploaded pictures ────────────────────────────────────────── */

export type PhotoReviewResult = { ok: true } | { ok: false; error: string };

/* ─── Privacy check: acting on a picture ────────────────────────────────── */

/** Why a picture may not be shown, or undefined when it may: someone tagged in it who is anonymised or not to be published. */
function cannotShow(db: Db, photoId: string): string | undefined {
  const photo = db.photos.find((p) => p.id === photoId);
  if (!photo) return "Fant ikke bildet.";
  if (photo.awaitingConsent?.length) return "Bildet venter på svar om samtykke.";
  const blocked = photo.people.map((t) => db.people.find((p) => p.id === t.personId)).filter((p): p is Person => !!p && p.privacy.status !== "visible");
  if (blocked.length) return "En person i bildet er anonymisert eller skal ikke publiseres. Slett bildet, eller fjern dem fra bildet først.";
  return undefined;
}

/** Hides a picture from the site (it stays in the library for the club administrator). Privacy check, /admin/personvern-kontroll. */
export async function hidePhoto(photoId: string, reason: string): Promise<PhotoReviewResult> {
  const { clubId, db, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Bare klubbadministratorer kan skjule bilder." };
  if (!db.photos.some((p) => p.id === photoId)) return { ok: false, error: "Fant ikke bildet." };
  const why = String(reason).trim().slice(0, 120) || "Skjult av klubbadministrator";
  await mutate(clubId, (d) => {
    const p = d.photos.find((x) => x.id === photoId)!;
    p.withdrawn = { at: now, reason: why };
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "reviewPhoto", summary: "Skjulte et bilde i personvernkontrollen" }));
  });
  refreshAll();
  return { ok: true };
}

/** Shows a hidden picture again, unless someone in it may not be shown. */
export async function showPhotoAgain(photoId: string): Promise<PhotoReviewResult> {
  const { clubId, db, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Bare klubbadministratorer kan vise bilder igjen." };
  const problem = cannotShow(db, photoId);
  if (problem) return { ok: false, error: problem };
  await mutate(clubId, (d) => {
    d.photos.find((x) => x.id === photoId)!.withdrawn = undefined;
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "reviewPhoto", summary: "Viste et skjult bilde igjen i personvernkontrollen" }));
  });
  refreshAll();
  return { ok: true };
}

/**
 * Deletes a picture for good: out of the library, off every page that used it (a group's, a venue's, a ride's or a story's
 * picture, a portrait), and its file out of the bucket. Cannot be undone.
 */
export async function deletePhotoForGood(photoId: string): Promise<PhotoReviewResult> {
  const { clubId, db, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Bare klubbadministratorer kan slette bilder." };
  const photo = db.photos.find((p) => p.id === photoId);
  if (!photo) return { ok: false, error: "Fant ikke bildet." };
  await mutate(clubId, (d) => {
    d.photos = d.photos.filter((x) => x.id !== photoId);
    for (const n of d.nodes) if (n.coverPhotoId === photoId) n.coverPhotoId = "";
    for (const v of d.venues) if (v.photoId === photoId) v.photoId = "";
    for (const r of d.races) if (r.photoId === photoId) r.photoId = "";
    for (const person of d.people) if (person.portraitPhotoId === photoId) person.portraitPhotoId = undefined;
    for (const a of d.articles) {
      if (a.heroPhotoId === photoId) a.heroPhotoId = undefined;
      a.blocks = a.blocks.flatMap((b): typeof a.blocks => {
        if (b.type === "photo") return b.photoId === photoId ? [] : [b];
        if (b.type === "gallery") {
          const ids = b.photoIds.filter((id) => id !== photoId);
          return ids.length ? [{ ...b, photoIds: ids }] : [];
        }
        return [b];
      });
    }
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "reviewPhoto", summary: "Slettet et bilde for godt i personvernkontrollen" }));
  });
  await removeUpload(photo.src);
  refreshAll();
  return { ok: true };
}

export interface PhotoDetailsEdit {
  photographer: PhotographerChoice | null;
  tagged: string[];
  noPeople: boolean;
  /** Among the tagged: who is covered up in the picture. */
  covered: string[];
}

/**
 * The privacy check's own edit of a picture: who took it, who is tagged, who of them is covered up. A tagged person who is
 * anonymised can never be tagged; one who may not be shown (no photo consent, or «Ikke publiser») can only be tagged when
 * covered up, since the picture then does not show them.
 */
export async function editPhotoDetails(photoId: string, edit: PhotoDetailsEdit): Promise<PhotoReviewResult> {
  const { clubId, db, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Bare klubbadministratorer kan rette bilder." };
  const photo = db.photos.find((p) => p.id === photoId);
  if (!photo) return { ok: false, error: "Fant ikke bildet." };
  const tagged = edit.tagged.map((id) => db.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
  const covered = edit.covered.filter((id) => edit.tagged.includes(id));
  const anonymised = tagged.filter((p) => p.privacy.status === "anonymised");
  if (anonymised.length) return { ok: false, error: "Anonymiserte personer kan ikke merkes i bilder. Slett bildet, eller sladd personen og la være å merke dem." };
  const mustCover = tagged.filter((p) => (p.privacy.status !== "visible" || p.privacy.photoConsent !== "granted") && !covered.includes(p.id));
  if (mustCover.length) return { ok: false, error: `${mustCover.map(fullName).join(", ")} kan ikke vises. Sladd dem i bildet og huk av at de er sladdet, eller ta dem ut av merkingen.` };
  if (tagged.length > 0 && edit.noPeople) return { ok: false, error: "Du har både merket personer og valgt at ingen kan kjennes igjen." };
  let photographer: Photographer | undefined;
  if (edit.photographer) {
    const resolved = resolvePhotographer(db, edit.photographer, { meUserId: photo.review?.uploadedByUserId ?? user.id, today: now.slice(0, 10) });
    if (!resolved.ok) return resolved;
    photographer = resolved.photographer;
  }
  await mutate(clubId, (d) => {
    const p = d.photos.find((x) => x.id === photoId)!;
    if (photographer) {
      p.photographer = photographer;
      p.credit = photographer.name;
    }
    p.people = tagged.map((person) => ({ personId: person.id, region: p.people.find((pp) => pp.personId === person.id)?.region ?? null }));
    p.noPeople = edit.noPeople || undefined;
    p.coveredPersonIds = covered.length ? covered : undefined;
    p.alt = altWithPeople(p.alt, tagged.length);
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "reviewPhoto", summary: "Rettet fotograf, merking og sladding på et bilde i personvernkontrollen" }));
  });
  refreshAll();
  return { ok: true };
}

/**
 * Puts a picture that has been covered up by hand (done on the administrator's device, on the pixels) in place of the old one,
 * and deletes the old file, so the uncovered picture does not stay in the bucket. `regions` is how many boxes were drawn.
 */
export async function replacePhotoWithCovered(formData: FormData): Promise<PhotoReviewResult> {
  const { clubId, db, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Bare klubbadministratorer kan sladde bilder." };
  const photo = db.photos.find((p) => p.id === String(formData.get("photoId") ?? ""));
  if (!photo) return { ok: false, error: "Fant ikke bildet." };
  const regions = Math.max(0, Math.min(Math.floor(Number(formData.get("regions") ?? 0)) || 0, 50));
  if (regions < 1) return { ok: false, error: "Tegn minst én boks." };
  const stored = await storeUploadedPhoto(clubId, user, formData);
  if (!stored.ok) return stored;
  const old = photo.src;
  await mutate(clubId, (d) => {
    const p = d.photos.find((x) => x.id === photo.id)!;
    p.src = stored.src;
    p.width = stored.width;
    p.height = stored.height;
    p.censored = (p.censored ?? 0) + regions;
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "reviewPhoto", summary: "Sladdet et bilde for hånd i personvernkontrollen" }));
  });
  await removeUpload(old);
  refreshAll();
  return { ok: true };
}

export interface PhotoMetaEdit {
  photographer: PhotographerChoice | null;
  tagged: string[];
  noPeople: boolean;
}

/**
 * A club administrator checks an uploaded picture: who took it and who is in
 * it. The picture has been live since it was uploaded; this is only the check
 * afterwards. With `edit` the answers are corrected first. Approving is what
 * clears the warning, which turns red when a picture waits too long.
 */
export async function reviewPhoto(photoId: string, edit?: PhotoMetaEdit): Promise<PhotoReviewResult> {
  const { clubId, db, user, now } = await context();
  if (!isClubAdmin(user)) return { ok: false, error: "Bare klubbadministrator kontrollerer bilder." };
  const photo = db.photos.find((p) => p.id === photoId);
  if (!photo?.review) return { ok: false, error: "Fant ikke bildet." };

  let photographer: Photographer | undefined;
  let tagged: Person[] = [];
  if (edit) {
    // Whoever uploaded it stays «meg selv» in the list, not the administrator.
    const resolved = resolvePhotographer(db, edit.photographer, { meUserId: photo.review.uploadedByUserId, today: now.slice(0, 10) });
    if (!resolved.ok) return resolved;
    photographer = resolved.photographer;
    tagged = edit.tagged.map((id) => db.people.find((p) => p.id === id)).filter((p): p is Person => !!p);
    const hidden = tagged.filter((p) => p.privacy.status !== "visible");
    if (hidden.length) return { ok: false, error: `${hidden.map(fullName).join(", ")} kan ikke vises offentlig.` };
    if (tagged.length === 0 && !edit.noPeople) return { ok: false, error: "Si hvem som er med, eller at ingen kan kjennes igjen." };
    if (tagged.length > 0 && edit.noPeople) return { ok: false, error: "Du har både merket personer og valgt at ingen kan kjennes igjen." };
  }

  await mutate(clubId, (d) => {
    const p = d.photos.find((x) => x.id === photoId)!;
    if (edit && photographer) {
      p.photographer = photographer;
      p.credit = photographer.name;
      p.people = tagged.map((person) => ({ personId: person.id, region: p.people.find((pp) => pp.personId === person.id)?.region ?? null }));
      p.noPeople = edit.noPeople || undefined;
      p.alt = altWithPeople(p.alt, tagged.length);
    }
    p.review = { ...p.review!, status: "approved", approvedAt: now, approvedByUserId: user.id };
    d.audit.unshift(userAudit({ at: now, actorUserId: user.id, action: "reviewPhoto", summary: edit ? "Rettet og godkjente et bilde" : "Godkjente et bilde" }));
  });
  refreshAll();
  return { ok: true };
}


/**
 * The privacy form on Om klubben: anyone may send it, so nothing here trusts the
 * sender. It is checked, a hidden field catches programs, and only so many open
 * messages are kept. It is stored for an administrator to answer and the club's
 * address is told by e-mail (if mail is set up). The sender gets a reference on
 * screen but no mail: an address typed into a public form is not proof of whose
 * it is, and the club asks for that before it gives anything out.
 */
export async function submitPrivacyContact(input: PrivacyContactInput): Promise<{ ok: true; reference: string } | { ok: false; error: string }> {
  const checked = validatePrivacyContact(input ?? {});
  if (!checked.ok) return checked;
  // A program filled in the hidden field: it is told it went well, and nothing is kept.
  if (checked.trap) return { ok: true, reference: "-" };
  const clubId = await currentClubId();
  const db = await getDb(clubId);
  if (db.privacyContacts.filter((c) => c.status === "open").length >= 200) return { ok: false, error: "Vi har for mange åpne henvendelser akkurat nå. Send en e-post til klubben i stedet." };
  const id = `pc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
  const reference = id.replace(/-/g, "").slice(-6).toUpperCase();
  await mutate(clubId, (d) => {
    d.privacyContacts.unshift({ id, receivedAt: nowLocal(), status: "open", ...checked.value });
  });
  const v = checked.value;
  const lines = [
    `Fra: ${v.fromName} (${v.fromEmail})`,
    `På vegne av: ${ON_BEHALF_LABEL[v.onBehalfOf]}${v.subjectName ? `: ${v.subjectName}` : ""}`,
    v.where ? `Lag eller gruppe: ${v.where}` : "",
    `Ber om: ${v.wants.map((w) => WANT_LABEL[w]).join(", ")}`,
    v.message ? `Melding: ${v.message}` : "",
    "",
    "Henvendelsen ligger i administrasjonen under Personvern. Bekreft at det er riktig person før du gir ut noe eller sletter.",
  ].filter((l, i, all) => l || (i > 0 && all[i - 1]));
  const body = lines.join("\n");
  await sendMail({
    from: mailSender(db.club.shortName),
    to: db.club.email,
    subject: `Personvernhenvendelse ${reference}`,
    text: body,
    html: `<pre style="font-family:inherit;white-space:pre-wrap">${body.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</pre>`,
  });
  revalidatePath("/admin");
  return { ok: true, reference };
}

/**
 * An administrator who has checked who is writing ties the message to that person: a member in the register, an
 * external (a photographer) or a user (a guardian). Only then is the access report offered for it. The log says that it
 * happened, never whom it was about.
 */
export async function confirmContactIdentity(id: string, kind: "person" | "external" | "user", refId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { clubId, db, user, now } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Du har ikke tilgang til personverndelen." };
  if (!db.privacyContacts.some((c) => c.id === id)) return { ok: false, error: "Henvendelsen finnes ikke." };
  const exists = kind === "person" ? db.people.some((p) => p.id === refId && p.privacy.status !== "anonymised") : kind === "external" ? db.externals.some((e) => e.id === refId) : db.users.some((u) => u.id === refId);
  if (!exists) return { ok: false, error: "Fant ikke den du valgte." };
  await mutate(clubId, (d) => {
    const c = d.privacyContacts.find((x) => x.id === id)!;
    c.identity = { kind, refId, confirmedAt: now, confirmedByUserId: user.id };
    d.audit.unshift({ id: `audit-${Date.now().toString(36)}`, at: now, actorUserId: user.id, action: "confirmIdentity", summary: "Bekreftet identiteten til en som har skrevet til personvernskjemaet" });
  });
  refreshAll();
  return { ok: true };
}

/** Takes the confirmation back, if the wrong one was chosen. */
export async function clearContactIdentity(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { clubId, db, user } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Du har ikke tilgang til personverndelen." };
  if (!db.privacyContacts.some((c) => c.id === id)) return { ok: false, error: "Henvendelsen finnes ikke." };
  await mutate(clubId, (d) => {
    delete d.privacyContacts.find((x) => x.id === id)!.identity;
  });
  refreshAll();
  return { ok: true };
}

/** An administrator with the privacy permission marks a message answered. */
export async function completePrivacyContact(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const { clubId, db, user } = await context();
  if (!canAnonymise(user)) return { ok: false, error: "Du har ikke tilgang til personverndelen." };
  if (!db.privacyContacts.some((c) => c.id === id && c.status === "open")) return { ok: false, error: "Henvendelsen finnes ikke eller er behandlet." };
  await mutate(clubId, (d) => {
    const c = d.privacyContacts.find((x) => x.id === id)!;
    c.status = "completed";
    c.completedAt = nowLocal();
  });
  refreshAll();
  return { ok: true };
}
