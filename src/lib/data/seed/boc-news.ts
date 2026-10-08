import { autoAlt } from "@/lib/photo-meta";
import { fullName } from "@/lib/content";
import { m, text } from "@/lib/rich-text";
import type { Article, Block, Inline, Person, Photo, User } from "@/lib/types";
import data from "./news-import.json";

/**
 * The club's own news from baerumock.no/news (106 posts, fetched from the
 * site's public article feed in October 2026, at the club's say-so), as articles.
 *
 * - The pictures are in public/news, scaled to 1600 px and under about 230 kB.
 *   Each is a Photo of its own with no one tagged and no photographer
 *   recorded, so they show up for checking under Personvern-kontroll.
 * - Names of people in the register are turned into mentions, so anonymising
 *   a person rewrites the text. Only full names are matched.
 * - A post with the same title as a hand-written one already in the seed
 *   replaces it, keeping its address, group and place on the front page.
 * - The author's name is matched to the closest user of the club; an author
 *   with no match gets a user without access.
 */

type Seg = ["t", string] | ["l", string, string];
type NewsBlock =
  | { t: "p"; s: Seg[] }
  | { t: "h"; x: string }
  | { t: "ul"; o: boolean; i: Seg[][] }
  | { t: "img"; k: string; c: string };
interface NewsPost {
  id: string;
  title: string;
  date: string;
  author: string;
  forside: boolean;
  hero: string | null;
  blocks: NewsBlock[];
}
const NEWS = data as unknown as { articles: NewsPost[]; images: Record<string, { w: number; h: number; tone: string }> };

/** Lower case, no accents, hyphens as spaces: «Thélia Haugen» and «Thelia Haugen» compare equal. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/ø/g, "o")
    .replace(/æ/g, "ae")
    .replace(/å/g, "a")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** The same writer under another spelling in the feed. */
const AUTHOR_ALIASES: Record<string, string> = {
  "thelia tryaire haugen": "bu-thelia",
  "anders anker rasch": "bu-anders-anker-rasch",
};

/** The spelling used for an author who gets a user, where the feed spells the name two ways. */
const AUTHOR_NAMES: Record<string, string> = { "bu-anders-anker-rasch": "Anders Anker-Rasch" };

/** Persons in the register who write without a user of their own yet. */
const AUTHOR_PERSONS: Record<string, string> = {
  "jon amundsen": "bp-jon-asbjorn-amundsen",
  "ole jorgen kvarsvik": "bp-ole-jorgen-kvarsvik",
};

/** Where a post belongs when no hand-written one says so: by what it is about. */
function nodeFor(post: NewsPost): string {
  const plain = `${post.title} ${post.blocks.map((b) => (b.t === "p" ? b.s.map((x) => x[1]).join("") : "")).join(" ")}`.toLowerCase();
  const title = post.title.toLowerCase();
  const has = (s: string, re: RegExp) => re.test(s);
  if (has(title, /bmx/)) return "b-bmx";
  if (has(title, /downhill|utfor|utføre/)) return "b-downhill";
  if (has(title, /terreng|enduro|mtb|young guns/)) return "b-terreng";
  if (has(title, /spinning/)) return "b-spinning";
  if (has(title, /zwift/)) return "b-zwift";
  if (has(title, /bane|velodrom/)) return "b-bane";
  if (has(title, /triatlon/)) return "b-triatlon";
  if (has(plain, /bmx/) && !has(plain, /landevei|terreng/)) return "b-bmx";
  if (has(plain, /terreng|enduro|mtb/) && !has(plain, /landevei/)) return "b-terreng";
  return "b-boc";
}

export interface ExistingNews {
  id: string;
  slug: string;
  nodeId: string;
  title: string;
  home?: boolean;
  photo?: string;
  author: string;
}

/** What the import adds to the seed: articles, their photos, the authors that had no user, and the ids of the hand-written posts it replaces. */
export interface ImportedNews {
  articles: Article[];
  photos: Photo[];
  users: User[];
  replaced: Set<string>;
}

export function importNews(people: Person[], users: User[], existing: ExistingNews[], nodeName: (id: string) => string): ImportedNews {
  const byTitle = new Map(existing.map((e) => [norm(e.title), e]));
  const userByName = new Map(users.map((u) => [norm(u.name), u.id]));
  const newUsers = new Map<string, User>();

  const authorId = (name: string): string => {
    if (!name) return "bu-christian";
    const key = norm(name);
    const alias = AUTHOR_ALIASES[key];
    if (alias && users.some((u) => u.id === alias)) return alias;
    const known = userByName.get(key);
    if (known) return known;
    const id = alias ?? `bu-${key.replace(/ /g, "-")}`;
    if (!newUsers.has(id)) {
      const personId = AUTHOR_PERSONS[key];
      const person = personId ? people.find((p) => p.id === personId) : undefined;
      newUsers.set(id, {
        id,
        name: person ? fullName(person) : (AUTHOR_NAMES[id] ?? name.replace(/\s+/g, " ").trim()),
        email: "post@baerumock.no",
        authProviders: [],
        active: false,
        personId: person?.id,
        guardianOfPersonIds: [],
        roles: [],
      });
    }
    return id;
  };

  // Full names only: a first name alone is too weak a sign to rewrite someone's name in a text.
  const names = people
    .filter((p) => `${p.firstName} ${p.lastName}`.trim().split(/\s+/).length >= 2)
    .map((p) => ({ person: p, name: fullName(p) }))
    .sort((a, b) => b.name.length - a.name.length);
  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const nameRe = names.length ? new RegExp(`(?<![\\p{L}])(${names.map((n) => escape(n.name)).join("|")})(?![\\p{L}])`, "gu") : null;
  const byName = new Map(names.map((n) => [n.name, n.person]));
  const neutralOf = (p: Person) => {
    const role = p.memberships[0]?.role;
    if (role === "teamManager") return "laglederen";
    if (role === "headCoach" || role === "coach") return "treneren";
    return "en av rytterne";
  };

  const textInline = (value: string): Inline[] => {
    if (!nameRe) return [text(value)];
    const out: Inline[] = [];
    let last = 0;
    for (const match of value.matchAll(nameRe)) {
      const person = byName.get(match[0]);
      if (!person) continue;
      const idx = match.index ?? 0;
      if (idx > last) out.push(text(value.slice(last, idx)));
      const before = value.slice(0, idx).trimEnd();
      const start = before === "" || /[.!?:]$/.test(before);
      const neutral = neutralOf(person);
      out.push(m(person.id, match[0], start ? neutral[0].toUpperCase() + neutral.slice(1) : neutral));
      last = idx + match[0].length;
    }
    if (last < value.length) out.push(text(value.slice(last)));
    return out.length ? out : [text(value)];
  };
  const inline = (segs: Seg[]): Inline[] => segs.flatMap((s): Inline[] => (s[0] === "l" ? [{ type: "link", text: s[1], href: s[2] }] : textInline(s[1])));

  const photos = new Map<string, Photo>();
  const articles: Article[] = [];
  const replaced = new Set<string>();

  for (const post of NEWS.articles) {
    const match = byTitle.get(norm(post.title));
    if (match) replaced.add(match.id);
    const nodeId = match?.nodeId ?? nodeFor(post);
    const keys = [...new Set([...(post.hero ? [post.hero] : []), ...post.blocks.flatMap((b) => (b.t === "img" ? [b.k] : []))])];
    const photoIdOf = (k: string) => `b-ph-n-${k}`;
    keys.forEach((k, i) => {
      if (photos.has(k)) return;
      const img = NEWS.images[k];
      const caption = post.blocks.find((b): b is Extract<NewsBlock, { t: "img" }> => b.t === "img" && b.k === k)?.c;
      photos.set(k, {
        id: photoIdOf(k),
        src: `/news/${k}.webp`,
        width: img.w,
        height: img.h,
        focal: { x: 50, y: 40 },
        tone: img.tone,
        alt: autoAlt({ placeName: nodeName(nodeId), date: post.date, tagged: 0, index: i + 1, total: keys.length }),
        caption: caption ? [text(caption)] : undefined,
        nodeId,
        people: [],
        redactions: [],
        source: { provider: "upload" },
      });
    });

    // The first short paragraph is the lead; the rest is the body.
    const rest = [...post.blocks];
    let lead: Inline[] | undefined;
    const first = rest[0];
    if (first?.t === "p" && first.s.map((x) => x[1]).join("").length <= 280) {
      lead = inline(first.s);
      rest.shift();
    }
    const blocks: Block[] = [];
    for (let i = 0; i < rest.length; i++) {
      const b = rest[i];
      if (b.t === "p") blocks.push({ type: "paragraph", content: inline(b.s) });
      else if (b.t === "h") blocks.push({ type: "heading", text: b.x });
      else if (b.t === "ul") blocks.push({ type: "list", items: b.i.map(inline), ordered: b.o || undefined });
      else {
        const run = [b.k];
        while (rest[i + 1]?.t === "img") run.push((rest[++i] as Extract<NewsBlock, { t: "img" }>).k);
        blocks.push(run.length > 1 ? { type: "gallery", photoIds: run.map(photoIdOf) } : { type: "photo", photoId: photoIdOf(run[0]) });
      }
    }

    articles.push({
      id: match?.id ?? `b-a-n-${post.id}`,
      slug: match?.slug ?? `nyhet-${post.date}-${post.id}`,
      nodeId,
      title: textInline(post.title),
      lead,
      blocks,
      heroPhotoId: post.hero ? photoIdOf(post.hero) : match?.photo,
      status: "published",
      authorUserId: authorId(post.author),
      createdAt: `${post.date}T08:30`,
      publishedAt: `${post.date}T09:00`,
      onHomepage: !!match?.home,
    });
  }

  return { articles, photos: [...photos.values()], users: [...newUsers.values()], replaced };
}
