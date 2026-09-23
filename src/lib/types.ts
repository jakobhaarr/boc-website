/**
 * Domain model for the club platform.
 *
 * Shapes are deliberately close to what relational tables would look like
 * (flat records joined by id), so the in-memory mock store can later be
 * replaced by Supabase without touching components.
 */

/** Club-local calendar date, "YYYY-MM-DD". */
export type ISODate = string;
/** Club-local wall-clock time, "HH:mm". */
export type ClockTime = string;
/** Club-local timestamp, "YYYY-MM-DDTHH:mm". */
export type LocalDateTime = string;

/* ─── Club & identity ───────────────────────────────────────────────────── */

/**
 * A club's colours. `primary` is the brand colour used on surfaces and
 * buttons, and it may be a bright one (BOC's yellow); `link` is the colour
 * the same brand uses for text, links and eyebrows, and must stay readable
 * on white. For most clubs the two are the same.
 */
export interface ClubTheme {
  id: string;
  label: string;
  primary: string;
  primaryHover: string;
  onPrimary: string;
  link: string;
  linkHover: string;
  secondary: string;
  onSecondary: string;
  accent: string;
  tint: string;
  /**
   * Button colour, when it should differ from `primary`. BOC paints its
   * surfaces yellow but its buttons teal with white text, which reads better
   * and stays clear of the yellow highlights in the finder.
   */
  action?: { background: string; hover: string; text: string };
  /**
   * A painted header, when paper is the wrong thing beside the club's mark.
   * BOC's wordmark is a block of near-fluorescent yellow and wants black
   * against it. Clubs that leave this out keep the paper header.
   */
  header?: { background: string; text: string; link: string; action: { background: string; hover: string; text: string } };
}

export interface Sponsor {
  name: string;
  kind: string;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  founded: number;
  orgNumber: string;
  email: string;
  phone: string;
  address: { street: string; postalCode: string; city: string };
  about: string;
  /** Club identity photograph for the front page hero. */
  heroPhotoId?: string;
  /** The picture at the top of /barn-og-ungdom. Without it the page shows the youngest group's cover. */
  youthPhotoId?: string;
  /** Optional film for the hero; the photo above is its poster and fallback. */
  heroVideoUrl?: string;
  /** Front-page proposition. Written by the club, not generated. */
  identity: {
    headline: string;
    headlineMuted: string;
    intro: string;
    aboutHeadline: string;
    aboutMuted: string;
    /**
     * Replaces the youngest-group figure in the hero's number row. A club that
     * takes everyone would rather lead with the span of its members than with
     * an age, and the wording belongs to the club: "elitesyklist" means
     * nothing in a ski club.
     */
    reach?: { value: string; label: string };
    /**
     * What the club's stories are, under «Nyheter». Defaults to
     * «Kampreferater, beskjeder og historier»; a club without matches says
     * «Referater» instead, because a cycling club reports races, not matches.
     */
    newsKinds?: string;
    /** Front-page "Klubbåret" (races, trips, winter programmes). The section is shown only when the club has written it. */
    year?: { headline: string; headlineMuted: string; note: string };
  };
  themeId: string;
  /** "crest" is the drawn shield; "wordmark" is the club's letters alone. */
  logo?: "crest" | "wordmark";
  sponsors: Sponsor[];
  membership: { adult: number; youth: number; family: number; note: string };
  /** Where "bli medlem" leads when the club signs members up elsewhere (e.g. Spond). */
  signupUrl?: string;
  /** Norsk Tipping's organisation number, for the Grasrotandelen panel. */
  grasrotandelenOrgNumber?: string;
  /** Extra links under «Klubben» in the footer, e.g. BOC's member benefits. */
  footerLinks?: { label: string; href: string }[];
  /**
   * The club kit on the front page: how members get it. BOC's comes from
   * Kalas in periodic drops, announced in Spond when the shop opens.
   */
  kit?: {
    headline: string;
    headlineMuted?: string;
    text: string[];
    photoId?: string;
    /** Garment cut-outs (transparent PNGs) shown on a coloured wash instead of `photoId`, when the club has them. */
    jerseys?: { src: string; width: number; height: number; alt: string; label: string }[];
    links: { label: string; href: string }[];
  };
}

/* ─── Organisation hierarchy ────────────────────────────────────────────── */

/**
 * Club → Sport → Discipline → Age group → Team/group.
 * Every level below "sport" is optional: a node's parent may be any
 * ancestor kind. Page templates are chosen by position (leaf or not),
 * never by assuming a fixed depth.
 */
export type NodeKind = "club" | "sport" | "discipline" | "ageGroup" | "team";

/** One step in a group's join wizard (OrgNode.participation.wizard). */
export interface ParticipationStep {
  title: string;
  text?: string;
  /** What to tap or choose, in order. */
  points?: string[];
  /** Screenshots, at most two side by side. */
  images?: { src: string; width: number; height: number; alt: string }[];
}

export interface ExternalLink {
  kind: "spond" | "web";
  label: string;
  url: string;
}

/**
 * A planned pause in the season (summer holiday, winter break). Set on a
 * sport or a branch; groups below inherit the nearest one.
 */
export interface SeasonBreak {
  label: string;
  from: ISODate;
  to: ISODate;
}

/** Rider level, from new to racing. The scale and its copy live in lib/levels.ts. */
export type LevelId = "ny" | "litt" | "aktiv";

export interface OrgNode {
  id: string;
  parentId: string | null;
  kind: NodeKind;
  name: string;
  /** Path segment. Full URL is the chain of ancestor slugs. */
  slug: string;
  /** One factual sentence shown in lists. */
  summary?: string;
  description?: string;
  /** Keeps the route and content available while omitting this node from primary navigation. */
  hideFromNavigation?: boolean;
  /** Sports can rename their levels, e.g. Fotball: "Avdeling", Sykkel: "Gren". */
  levelLabels?: Partial<Record<NodeKind, string>>;
  ageLabel?: string;
  /** Inclusive age span for "find a group" discovery. */
  ageRange?: [number, number];
  /** The levels a group is right for, used by the front-page finder. See lib/levels.ts. */
  levels?: LevelId[];
  /** Recommended first among equally good matches in the finder — the club's pick, e.g. Zwift in Innendørs. */
  recommendFirst?: boolean;
  coverPhotoId?: string;
  /** Sport profile image for navigation and discovery. Chosen without tagged people. */
  identityPhotoId?: string;
  venueIds?: string[];
  joinInfo?: string;
  /** Ordered, practical instructions shown on group pages when joining takes more than one step. */
  participation?: {
    title: string;
    intro?: string;
    steps: string[];
    note?: string;
    source?: ExternalLink;
    /**
     * A guided version of the steps, one at a time with screenshots, for a
     * group where joining means setting up an app (Zwift). Shown in place of
     * the plain list when present.
     */
    wizard?: ParticipationStep[];
    /** Where the wizard's last step points, e.g. the group's presentation. */
    wizardDone?: { label: string; href: string };
  };
  league?: string;
  /**
   * What the group trains towards this season, e.g. «Vätternrunden» — shown in
   * the group's fact row where a football team shows its squad size.
   */
  /**
   * What the person presenting a group is called on its lead card, inherited
   * down the tree: BOC calls them «Gruppeleder», and «Road Captain» on
   * Landevei. Without one, the card shows the person's own title.
   */
  leadTitle?: string;
  /**
   * Show one «Når og hvor» section — where and when to turn up, and in which
   * months — instead of the season summary and the weekly plan. For groups
   * whose year is one simple rhythm, like BOC 1–4.
   */
  simpleSchedule?: boolean;
  /**
   * When in the year the group runs, for a group that is not there all year,
   * shown in its fact row — Zwift: «Vintersesongen», «November til mars».
   */
  seasonFact?: { value: string; label: string };
  /** The fact row's first fact, in place of the age — Zwift: «Intervalltrening», which says more than «Fra 15 år». */
  leadFact?: { value: string; label: string };
  /** More facts of the group's own, after the others — Zwift: «Alle nivåer», because the Meetup keeps everyone together. */
  moreFacts?: { value: string; label: string }[];
  /**
   * Something the group's riders must not miss, as a band straight under the
   * hero: the next course, a league to sign up for. With `opensAt` the band
   * says `title` until then and `titleOpen` from that moment, so a sign-up
   * announced ahead reads right on the day it opens without anyone editing
   * it. The band goes once `until` has passed.
   */
  announcement?: {
    eyebrow: string;
    title: string;
    titleOpen?: string;
    opensAt?: LocalDateTime;
    until?: LocalDateTime;
    text: string;
    href: string;
    linkLabel: string;
    /** Show as a compact note in the weekly plan instead of a band under the hero. */
    inline?: boolean;
  };
  /**
   * Sections a group's page leaves out when they have nothing to say for it —
   * Zwift has no dated events and one rhythm through its season, so it drops
   * the terminliste and the season summary and keeps the weekly plan.
   */
  hideSections?: ("terminliste" | "season")[];
  /** "dark" renders the group's whole page dark (.page-dark), for a group that meets in the dark — Zwift. */
  pageTone?: "dark";
  /**
   * Groups whose seasonal programme belongs in this node's terminliste and
   * every page below it — Landevei lists the Zwift season, where its riders
   * go through the winter. Each row links to the group.
   */
  seasonsInTerminliste?: string[];
  /**
   * The two actions in the group's hero, where the page has better ones than
   * «Se aktiviteter» and «Bli med» — Zwift leads with how to get started,
   * because taking part means setting up the app and following the organiser.
   */
  heroActions?: { primary: { label: string; href: string }; secondary: { label: string; href: string } };
  seasonFocus?: string;
  season?: string;
  /** Pauses in the year, inherited by everything below. See lib/seasons.ts. */
  breaks?: SeasonBreak[];
  externalLinks?: ExternalLink[];
  /**
   * Where a newcomer starts: the branch's own Spond group, where the sessions
   * are and where you sign up for them. The page's «Bli med» goes here rather
   * than to club membership, which can come later.
   */
  joinGroup?: ExternalLink;
  sortOrder: number;
  updatedAt: LocalDateTime;
  updatedNote?: string;
  updatedByUserId?: string;
}

export interface Venue {
  id: string;
  name: string;
  area: string;
  surface: string;
  address?: string;
  mapQuery: string;
  photoId?: string;
  note?: string;
}

/* ─── People vs users ───────────────────────────────────────────────────── */

/**
 * PERSON — someone who exists in the club (a player, coach, parent volunteer).
 * Does not need to be able to log in. A child is a Person without a User.
 */
export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  birthYear?: number;
  memberships: Membership[];
  privacy: PersonPrivacy;
  /** Only filled for people in public-facing roles (coaches, contacts). */
  publicContact?: { email?: string; phone?: string };
  /**
   * Portrait for the group this person presents (see presenterFor). Uploaded
   * by the club; shown only while the person is visible and has consented to
   * photos, otherwise their initials stand in.
   */
  portraitPhotoId?: string;
  /** Set when this person can also log in. */
  userId?: string;
  /** Users acting as guardians for this person. */
  guardianUserIds?: string[];
}

export type MembershipRole =
  | "athlete"
  | "headCoach"
  | "coach"
  | "teamManager"
  | "sectionLead"
  | "generalManager"
  | "boardChair"
  | "volunteer";

export interface Membership {
  nodeId: string;
  role: MembershipRole;
  /** Shown publicly instead of the generic role label, e.g. "Turleder". */
  title?: string;
}

/**
 * VISIBLE    — may appear publicly according to club policy and consent.
 * RESTRICTED — must never be published (e.g. protected identity). Tagging blocked.
 * ANONYMISED — permanently removed from historical public content. Irreversible.
 */
export type PrivacyStatus = "visible" | "restricted" | "anonymised";

export interface PersonPrivacy {
  status: PrivacyStatus;
  photoConsent: "granted" | "declined" | "unknown";
  consentUpdatedAt?: ISODate;
  consentBy?: string;
  anonymisedAt?: LocalDateTime;
  anonymisedByUserId?: string;
}

/**
 * USER — someone who can authenticate and use the admin interface.
 * Future auth: Google or passwordless e-mail (magic link / one-time code).
 */
export type AuthProvider = "google" | "email";

/**
 * Roles attach to a node and are inherited by all descendants.
 *   clubAdmin    — whole club
 *   sectionAdmin — one branch (e.g. Fotball) and everything below
 *   groupAdmin   — one team/group; publishes directly
 *   contributor  — can submit to a node; needs approval
 *   guardian     — parent/guardian with no publishing rights of their own
 */
export type RoleKind = "clubAdmin" | "sectionAdmin" | "groupAdmin" | "contributor" | "guardian";

export interface RoleAssignment {
  role: RoleKind;
  nodeId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Used by the club to reach guardians, e.g. to chase a missing consent. */
  phone?: string;
  authProviders: AuthProvider[];
  personId?: string;
  guardianOfPersonIds: string[];
  roles: RoleAssignment[];
}

/* ─── Photos ────────────────────────────────────────────────────────────── */

/** Rectangle in percent of the original image (0–100). */
export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * A structural link between a person and a photo. `region` is the person's
 * body in the image. Without a region the system cannot redact precisely,
 * so anonymising that person withdraws the photo from public view instead.
 */
export interface PhotoPerson {
  personId: string;
  region: Region | null;
}

export interface Photo {
  id: string;
  src: string;
  width: number;
  height: number;
  /** Crop anchor in percent — used as object-position for varying aspect ratios. */
  focal: { x: number; y: number };
  /**
   * Scale on top of cover-fit, for a photo whose subject is too small in its
   * frame (1 = cover, 1.3 = 30 % closer). The focal point still decides which
   * part of the enlarged picture the frame shows.
   */
  zoom?: number;
  /** Dominant colour: placeholder background and redaction fill. */
  tone: string;
  /** Must describe the scene without identifying anyone. */
  alt: string;
  caption?: Inline[];
  credit?: string;
  nodeId: string;
  /** Analogue grade applied when the photo is shown. See .photo-film in globals.css. */
  grade?: "film";
  people: PhotoPerson[];
  /** Permanent redactions applied by anonymisation. */
  redactions: Region[];
  withdrawn?: { at: LocalDateTime; reason: string };
  source: { provider: "unsplash" | "upload"; photographer?: string };
}

/* ─── Rich text with structural person references ───────────────────────── */

/**
 * `mention` covers the whole phrase that identifies someone ("Nora Hansen",
 * " Hun har spilt i klubben siden hun var sju.") and carries the neutral
 * replacement written when the phrase is anonymised ("En av spillerne", "").
 */
export type Inline =
  | { type: "text"; text: string }
  | { type: "mention"; personId: string; text: string; neutral: string }
  /** A link in running text; `href` may be a page on the site or another site. */
  | { type: "link"; text: string; href: string };

export type Block =
  | { type: "paragraph"; content: Inline[] }
  /** A subheading inside an article, for a notice with several parts. */
  | { type: "heading"; text: string }
  /** A list of points or steps. Items are inline text, so a mention in one is anonymised like any other. */
  | { type: "list"; items: Inline[][]; ordered?: boolean }
  /** Quotes by a person are removed entirely if that person is anonymised. */
  | { type: "quote"; content: Inline[]; attribution: Inline[]; speakerPersonId?: string }
  | { type: "photo"; photoId: string }
  | { type: "gallery"; photoIds: string[] };

/* ─── Content ───────────────────────────────────────────────────────────── */

export type ContentStatus = "published" | "pending" | "rejected";

export interface Article {
  id: string;
  /** Never derived from names — a slug must not leak identity after anonymisation. */
  slug: string;
  nodeId: string;
  title: Inline[];
  lead?: Inline[];
  blocks: Block[];
  heroPhotoId?: string;
  status: ContentStatus;
  authorUserId: string;
  createdAt: LocalDateTime;
  publishedAt?: LocalDateTime;
  /** Shown on the club front page (approved by a club admin). */
  onHomepage: boolean;
  /** Author asked for front-page placement. */
  homepageRequested?: boolean;
  relatedActivityId?: string;
  reviewedByUserId?: string;
  privacyEditedAt?: LocalDateTime;
}

/* ─── Activities ────────────────────────────────────────────────────────── */

export type ActivityKind = "training" | "match" | "race" | "event" | "volunteer" | "camp";

export interface ActivityPerson {
  /** null once the person has been anonymised — the slot is kept, the identity is not. */
  personId: string | null;
  role: "scorer" | "selected" | "duty";
  count?: number;
}

export interface Activity {
  id: string;
  nodeId: string;
  kind: ActivityKind;
  title: string;
  date: ISODate;
  /** Last day of a multi-day activity (cup, training camp). Omitted for single days. */
  endDate?: ISODate;
  start: ClockTime;
  end?: ClockTime;
  /** Inherited from the series it came from — see TrainingSeries.startApprox. */
  startApprox?: boolean;
  meetTime?: ClockTime;
  venueId?: string;
  locationNote?: string;
  description?: string;
  status: "scheduled" | "cancelled";
  statusNote?: string;
  /** Set when generated from a TrainingSeries. */
  seriesId?: string;
  opponent?: string;
  home?: boolean;
  result?: { us: number; them: number };
  people?: ActivityPerson[];
  signup?: ExternalLink;
}

/** A recurring weekly session. Expanded into Activity occurrences. */
export interface TrainingSeries {
  id: string;
  nodeId: string;
  title: string;
  /** 1 = Monday … 7 = Sunday */
  weekday: number;
  start: ClockTime;
  end: ClockTime;
  /**
   * The club announces a window, not a clock: the exact start is settled in
   * Spond each week. `start` is then the earliest it is likely to be, shown
   * as approximate, and `note` carries what the club actually said
   * ("Som regel 9, 9.30 eller 10"). See lib/timetable.ts.
   */
  startApprox?: boolean;
  /** Omitted for online sessions (Zwift) and places the club only borrows. */
  venueId?: string;
  locationNote?: string;
  from: ISODate;
  to: ISODate;
  note?: string;
  exceptions?: { date: ISODate; note: string }[];
  /** Runs in a defined part of the year and is drawn on the club year. */
  seasonal?: boolean;
  /** Seasonal series with the same key are merged into one club-year band. */
  clubYearGroupId?: string;
  /** Public label for the merged club-year band. */
  clubYearLabel?: string;
}

/**
 * A race the club's members ride together, arranged by the club or by
 * others. Organisers publish dates one season at a time, so the record keeps
 * the latest known date and the club year projects the next edition from it
 * (same day, next year) until the organiser confirms. See lib/club-year.ts.
 */
export interface Race {
  id: string;
  /** The branch the race belongs to (Landevei, Terreng). */
  nodeId: string;
  name: string;
  /** Latest date published by the organiser. */
  date: ISODate;
  /** Last day, for races over two days. */
  endDate?: ISODate;
  /** Where it starts or goes, e.g. "Rena – Lillehammer". */
  place: string;
  /** Format when it is not a mass-start road race, e.g. "Temporitt". */
  format?: string;
  organiser?: string;
  /** Arranged by the club itself. */
  ownEvent?: boolean;
  /** Groups that train towards the race; it appears in their terminliste. */
  groupIds?: string[];
  url?: string;
}

/* ─── Privacy operations ────────────────────────────────────────────────── */

export interface PrivacyRequest {
  id: string;
  personId: string;
  kind: "anonymise";
  receivedAt: ISODate;
  fromName: string;
  relation: string;
  message: string;
  status: "open" | "completed";
  completedAt?: LocalDateTime;
}

export interface AnonymisationReport {
  photosRedacted: string[];
  photosWithdrawn: string[];
  textLocations: { articleId: string; where: "title" | "lead" | "body" | "quote" | "caption" }[];
  activities: string[];
  articlesChanged: string[];
}

export interface AuditEntry {
  id: string;
  at: LocalDateTime;
  actorUserId: string;
  action: "anonymise" | "publish" | "submit" | "approve" | "reject" | "theme" | "cancelActivity" | "restoreActivity" | "consent";
  /** Human description. For anonymisation this never contains the person's name. */
  summary: string;
  personId?: string;
  articleId?: string;
  activityId?: string;
  report?: AnonymisationReport;
}

/* ─── Store ─────────────────────────────────────────────────────────────── */

export interface Db {
  version: number;
  seededOn: ISODate;
  club: Club;
  themes: ClubTheme[];
  nodes: OrgNode[];
  venues: Venue[];
  people: Person[];
  users: User[];
  photos: Photo[];
  articles: Article[];
  series: TrainingSeries[];
  activities: Activity[];
  races: Race[];
  privacyRequests: PrivacyRequest[];
  audit: AuditEntry[];
}
