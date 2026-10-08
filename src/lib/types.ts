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
  /**
   * The club's own palette for the visitor's dark mode, in place of the
   * shared navy and light blue. BOC's is its teal, darkened for the ground
   * and lightened for links. Links must keep ≥ 4.5:1 on the ground and on
   * the lightest surface (ground + 11 % white).
   */
  dark?: { background: string; link: string; linkHover: string };
}

export interface Sponsor {
  name: string;
  kind: string;
}

/** A heading and article blocks (paragraphs, subheadings, lists), for Club.pages and OrgNode.sections. */
export interface InfoSection {
  /** Anchor on the page; set it to link straight to the section. */
  id?: string;
  eyebrow?: string;
  title: string;
  blocks: Block[];
}

/** See Club.pages. */
export interface InfoPage {
  /** The body that issues what the page is about (Politiet for the certificate): its logo sits above the page's title. A file in `public`. */
  logo?: { src: string; alt: string; width: number; height: number };
  /** A drawn illustration beside the title (the sports grant's certificate). */
  illustration?: { kind: "stipend"; amount: string };
  slug: string;
  /** Its name in the footer and on Om klubben. */
  navLabel: string;
  eyebrow: string;
  title: string;
  lead: string;
  /** Two or three sentences for its card on Om klubben. */
  teaser: string;
  /** The page's main action, e.g. where to apply. */
  action?: { label: string; href: string };
  sections: InfoSection[];
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  founded: number;
  /**
   * The club's history on /om-klubben, in its own words: a few paragraphs
   * and the years that mark it. Shown only when the club has written one.
   */
  history?: {
    headline: string;
    /** «{år}» is replaced with the club's age from `since`, rounded to a decade: «Snart 60 år», «Over 60 år». */
    headlineMuted?: string;
    /** The year the club's story starts, for «{år}». */
    since?: number;
    paragraphs: string[];
    milestones: { year: number; text: string }[];
  };
  /**
   * The club's business idea, values and goals (virksomhetsidé og strategi), on /om-klubben in the club's own words.
   * `period` is the period the goals cover.
   */
  mission?: {
    idea: string[];
    slogan?: string;
    values: { title: string; text: string }[];
    period: string;
    goals: { title: string; text: string }[];
  };
  /**
   * What members say about the club, on the front page under the partners.
   * Each quote belongs to a Person, so name, age, groups and portrait come
   * from the register and follow its privacy rules: a restricted or
   * anonymised person's quote is not shown. `example` marks a placeholder
   * written for the prototype, and the page says so on it — a quote is only
   * presented as a member's own once that member has given it.
   */
  testimonials?: {
    personId: string;
    /**
     * The words on the front page for a person who has no quote on a group's page. When they have one (OrgNode.quotes),
     * that quote is what the front page says, so a change made on /admin/sitater reaches the front page too.
     */
    quote?: string;
    example?: boolean;
    /** The member's story, an Article with `memberStory`. */
    articleSlug?: string;
    /** Left out of the photo deck on Bli medlem, which shows six faces. */
    notInDeck?: boolean;
    /** Light or dark overall (BOC: yellow or black kit), so the deck can mix them across its rows. */
    shade?: "light" | "dark";
  }[];
  /** The club on Strava, linked from Om klubben and Bli medlem. */
  stravaClubUrl?: string;
  orgNumber: string;
  email: string;
  phone: string;
  address: { street: string; postalCode: string; city: string };
  about: string;
  /** Club identity photograph for the front page hero. */
  heroPhotoId?: string;
  /** The picture behind «Bli med» at the foot of every group page. Without it the band shows the sport's photo. */
  joinPhotoId?: string;
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
  membership: {
    /**
     * The club's membership rates for the year, as the annual meeting set
     * them, in the order shown. The first three are shown large on Bli med;
     * the rest (`minor`) sit in a line under them. `children` marks the
     * rates the page for barn og ungdom shows.
     */
    rates: { label: string; amount: number; hint?: string; minor?: boolean; children?: boolean }[];
    note: string;
    /**
     * What membership is needed for, where the club draws that line. Training
     * is open to anyone who turns up, so this is what the site says instead of
     * "join after two sessions": for BOC, races and the Mallorca trips.
     */
    requiredFor?: string;
  };
  /** Where "bli medlem" leads when the club signs members up elsewhere (e.g. Spond). */
  signupUrl?: string;
  /** Norsk Tipping's organisation number, for the Grasrotandelen panel. */
  grasrotandelenOrgNumber?: string;
  /** What Norsk Tipping's recipient page showed on `asOf`: kroner generated so far in the year and the number of givers. Dated, because the numbers are theirs and move. */
  grasrotandelenStats?: { year: number; amountNok: number; givers: number; asOf: ISODate };
  /** Extra links under «Klubben» in the footer, e.g. BOC's member benefits. */
  footerLinks?: { label: string; href: string }[];
  /**
   * The club's information pages, in its own words, at /klubben/<slug>:
   * BOC's police certificate guide and its sports grant. Each is introduced
   * on Om klubben and linked from the footer.
   */
  pages?: InfoPage[];
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
  /** A step that asks someone to install an app: its icon and store links, shown as badges under the points. */
  appLink?: { name: string; icon: { src: string; width: number; height: number }; iosUrl: string; androidUrl: string };
  /** A link to a page that explains more, shown under the points. */
  link?: { label: string; url: string };
  /** A step that is the group's Spond sign-up itself (OrgNode.joinGroup), shown as the same button and note used elsewhere. */
  spond?: boolean;
  /** The logo of who the step is about (a federation), on a plain card where a picture would stand. */
  logo?: { src: string; width: number; height: number; alt: string };
  /** A drawn illustration where a picture would stand: the membership card and the Spond card (SpondMembership). */
  illustration?: "spond-membership" | "ride-entry";
  /** A simplified table that illustrates the step: a mark in each column the row allows. `emphasis` lifts the row most people are in. */
  table?: { columns: string[]; rows: { label: string; marks: boolean[]; emphasis?: boolean }[]; note?: string };
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

/** See OrgNode.firstTraining. Every field is optional and free text in the club's own words. */
export interface FirstTrainingFacts {
  /** Typical pace, e.g. «24–27 km/t». */
  pace?: string;
  /** Typical distance, e.g. «50–70 km». */
  distance?: string;
  /** When to be there, e.g. «10 minutter før». */
  arrive?: string;
  /** Whether and how to say you are coming, e.g. «Meld deg på en rekruttdag i Spond». */
  signUp?: string;
  /** What to bring. */
  bring?: string;
  /** What to look for on arrival, where it is not a person — Zwift: an invitation in Zwift Companion. Otherwise the group's coaches are named. */
  lookFor?: string;
  /**
   * What happens if the pace or the terrain is too much for you during the
   * session — no-drop, regrouping, a way home. Only the group's actual
   * policy; left out where the club has not said. Punctures and mechanicals
   * are a different question (the riding rule marked «wait»).
   */
  keepUp?: string;
  /** What a first-timer has to do in Spond before their first session, if anything. */
  spondFirstTime?: string;
  /** Whether you can try before joining the club, and what needs membership. */
  trial?: string;
}

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
  /**
   * The heading on the group's own page, where it should say more than the
   * name used everywhere else — BOC 3: «BOC 3 / BOC T-O», for the part of
   * the group riding Trondheim–Oslo. Cards, menus, lists and the page title
   * keep `name`.
   */
  pageHeading?: string;
  /** Keeps the route and content available while omitting this node from primary navigation. */
  hideFromNavigation?: boolean;
  /** A sport's own words for kinds of dates, e.g. Sykkel: race → «Ritt» where the platform says «Konkurranse». */
  kindLabels?: Partial<Record<ActivityKind, string>>;
  /** Sports can rename their levels, e.g. Fotball: "Avdeling", Sykkel: "Gren". */
  levelLabels?: Partial<Record<NodeKind, string>>;
  ageLabel?: string;
  /** Inclusive age span for "find a group" discovery. */
  ageRange?: [number, number];
  /** The levels a group is right for, used by the front-page finder. See lib/levels.ts. */
  levels?: LevelId[];
  /**
   * How the finder asks about level for this branch, in words a newcomer can
   * answer without knowing the club: what they have done, not what they are
   * («Vant til å sykle i gruppe», not «Aktiv mosjonist»). Set on a
   * discipline; used when it is the only one chosen. See lib/levels.ts.
   */
  levelOptions?: Partial<Record<LevelId, { label: string; hint: string }>>;
  /**
   * How a road group's pace is told to newcomers and experienced riders, and
   * how the finder places a rider in it (see lib/rider-fit.ts). The club's own
   * figures, edited by the group's admin; a group without one falls back to
   * the club's defaults in code.
   *  - longRide: average km/h on the Sunday long ride, in the group;
   *  - ftp: typical FTP in watts for a man of 80 kg, `null` for an open end
   *    («opp til 210 W», «over 350 W»);
   *  - soloSpeed: km/h on a calm long ride ALONE that suits the group, `null`
   *    for an open end. Lower than longRide: a group rides in each other's slipstream.
   */
  paceGuide?: { longRide: [number, number]; ftp: [number | null, number | null]; soloSpeed: [number | null, number | null] };
  /** Recommended first among equally good matches in the finder — the club's pick, e.g. Zwift in Innendørs. */
  recommendFirst?: boolean;
  coverPhotoId?: string;
  /** Sport profile image for navigation and discovery. Chosen without tagged people. */
  identityPhotoId?: string;
  venueIds?: string[];
  joinInfo?: string;
  /**
   * What someone needs to know before their first session, one fact each,
   * inherited down the tree like leadTitle (a group's own value wins): set
   * «bring» once on the sport and every group has it. Only what the club has
   * actually said goes in; a missing fact is left out on the page, never
   * guessed. Where and when, how long a session lasts, who to look for and
   * what happens if you fall behind come from the schedule, the contacts and
   * the riding rules instead (lib/first-training.ts).
   */
  firstTraining?: FirstTrainingFacts;
  /**
   * The club's own sections on a branch or group page, in its words — BMX:
   * «Løp og konkurranser», from the club's page about races. Shown after the
   * riding rules, before the terminliste.
   */
  sections?: InfoSection[];
  /** One more way to reach the group, shown under Kontakt after the Spond line («Du kan også skrive til …»). An address in it becomes a link. */
  contactNote?: string;
  /**
   * Why people ride in this group, in their own words, on the group's page.
   * Each quote belongs to a Person, so name, age and portrait come from the
   * register and follow its privacy rules (restricted or anonymised: not
   * shown). A child's group quotes a parent (`relation`, e.g. «Forelder i
   * Gruppe 1») rather than the child. `example` marks a quote written for the
   * prototype; the page says so.
   */
  quotes?: {
    personId: string;
    quote: string;
    relation?: string;
    example?: boolean;
    /** When the words were given (set on adding or rewording), so the age shown is the age they were then. */
    givenAt?: ISODate;
    /**
     * Whether the quote may also stand on the front page, under «Fra medlemmene».
     * A group admin can only ask for it («requested»); the club administrator
     * approves. New words send an approved quote back to «requested».
     */
    front?: "requested" | "approved";
  }[];
  /**
   * The group's ordinary sessions are not where a newcomer starts — a course
   * (bane) or a recruit day (BMX) comes first — so its page does not offer
   * the next one as «Neste trening». Inherited down the tree.
   */
  newcomersStartElsewhere?: boolean;
  /** A short film shown edge to edge right under the page's top (a file in public/video), as wide as the film on the Mallorca page. */
  video?: { src: string; label: string; width: number; height: number };
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
   * How the club rides together, inherited down the tree like leadTitle:
   * set once on BOC's Landevei, shown on it and on every group under it
   * (RidingRules). A short title, a sentence or two, and an icon from
   * RIDING_RULE_ICONS in riding-rules.tsx.
   */
  ridingRules?: { title: string; text: string; icon?: RidingRuleIcon }[];
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
  /** Preposition before the group's own name in running text: «sykler i BOC 1», but «sykler på Zwift» since the name is also the platform. Defaults to «i». */
  namePreposition?: "i" | "på";
  /**
   * Shows this wordmark in the hero instead of the page title text (NodeHero
   * still keeps the name as the h1's accessible name). Pick the file that
   * reads against this node's own `pageTone`, not the visitor's light/dark
   * preference, which a page painted by the club ignores.
   */
  titleLogo?: { src: string; width: number; height: number };
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
  /** A place on the internet (the Zwift app): no address, so no map link. */
  online?: boolean;
  /** How a sentence reaches the place: «på Bekkestua torg», «i Vestmarka», «ved Kaffebrenneriet». Default «på». */
  preposition?: "på" | "i" | "ved";
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
  /** Optional, entered in admin; gives an exact age where the year alone is a year off until the birthday. Sets birthYear too. */
  birthDate?: ISODate;
  memberships: Membership[];
  privacy: PersonPrivacy;
  /** Only filled for people in public-facing roles (coaches, contacts). */
  publicContact?: { email?: string; phone?: string };
  /**
   * Where to ask for consent to a picture: the person's own address, or a parent's for a child.
   * Never shown anywhere; used only to send a «godkjenn dette bildet» request (ConsentRequest).
   */
  consentEmail?: string;
  /** The member's own Strava profile, shown on their story while they are visible. */
  stravaUrl?: string;
  /**
   * Portrait for the group this person presents (see presenterFor). Uploaded
   * by the club; shown only while the person is visible and has consented to
   * photos, otherwise their initials stand in.
   */
  portraitPhotoId?: string;
  /**
   * How the portrait stands on this person's quote cards (see Photo.cardStyle for the three styles). Chosen in admin,
   * and kept when the portrait is replaced; without it the portrait's own style (set in the seed) applies.
   */
  cardStyle?: "natural" | "studio" | "color";
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

/**
 * What a person may do, one entry per action the admin offers (lib/access.ts
 * lists them with their words). Reading what is in an area follows from being
 * invited to it; every action that changes something needs its own.
 */
export type Permission = "write_posts" | "publish_posts" | "edit_group" | "members" | "structure" | "users" | "venues" | "club" | "privacy";

/** A quick pick at the invitation that ticks a sensible set of permissions. Only a label afterwards: the permissions decide. */
export type AccessPreset = "parent" | "coach" | "teamLead" | "board";

export interface RoleAssignment {
  /**
   * The level this assignment is closest to, for labels and colours. Without `can` it also decides
   * what the person may do (the permissions that role has always had); with `can` it is derived from it.
   */
  role: RoleKind;
  nodeId: string;
  /** What the person may do here and everywhere below. Missing: the role's own permissions. */
  can?: Permission[];
  /** Set when the invitation used a quick pick and the ticks still match it. */
  preset?: AccessPreset;
}

export interface User {
  id: string;
  name: string;
  email: string;
  /** Used by the club to reach guardians, e.g. to chase a missing consent. */
  phone?: string;
  authProviders: AuthProvider[];
  /** False: cannot sign in by e-mail code (not yet invited, or deactivated). Missing means active. */
  active?: boolean;
  /**
   * The user's own profile picture, set by themselves (setOwnAvatar). Shown in
   * admin only, never on the public site, and kept apart from the person
   * register's portrait (which follows photo consent). Admin shows this, or
   * else the portrait of the linked person.
   */
  avatar?: { src: string; width: number; height: number };
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
  /**
   * Focal point and zoom from md (768 px) up, where a frame is often much
   * wider than on a phone (see Photo's mdRatio): the join band crops closer
   * and further left there, so the riders clear the text laid over it.
   */
  mdFocal?: { x: number; y: number };
  mdZoom?: number;
  /**
   * Framing for tall frames (width < height, like the 2:3 group cards), in
   * place of focal/zoom and the md variants. A landscape photo already shows
   * its full height there, so the riders can only be lifted clear of the text
   * laid over the lower part by zooming in with the frame's bottom edge held
   * (focal y 100): the zoom sets how far up they come. Wide frames keep the
   * ordinary framing.
   */
  tall?: { focal: { x: number; y: number }; zoom?: number };
  /** Dominant colour: placeholder background and redaction fill. */
  tone: string;
  /** Must describe the scene without identifying anyone. */
  alt: string;
  caption?: Inline[];
  credit?: string;
  nodeId: string;
  /** Analogue grade applied when the photo is shown. See .photo-film in globals.css. */
  grade?: "film";
  /**
   * How a portrait stands in the quote row on the front and group pages (the default for it; a person's own choice in
   * admin, Person.cardStyle, wins):
   * «natural» (a photo with its own surroundings: the picture stands at the right and a blurred
   * enlargement of it fills the card behind the words), «studio» (a portrait on a white
   * background: a white card, the picture seamless in it) or «color» (the default: a plain
   * coloured ground, rotating by place in the row).
   */
  cardStyle?: "natural" | "studio" | "color";
  people: PhotoPerson[];
  /** Permanent redactions applied by anonymisation. */
  redactions: Region[];
  withdrawn?: { at: LocalDateTime; reason: string };
  source: { provider: "unsplash" | "upload"; photographer?: string };
  /**
   * Who took it, set at upload and never guessed: the uploader, a member, an
   * external (a parent, a hobby photographer) or the club itself when the
   * photographer does not want a credit. `credit` (the text shown as «Foto: …»)
   * follows from it. Missing on the demo photos, which carry only `credit`.
   */
  photographer?: Photographer;
  /** Review by a club administrator. A photo goes live at once; this is the check afterwards. Missing means nothing to check. */
  review?: PhotoReview;
  /** Set when the uploader said, explicitly, that nobody who can be recognised is in the picture; `people` is then empty on purpose. */
  noPeople?: boolean;
  /**
   * How many people without photo consent were covered up in the picture before it was uploaded
   * (the pixels themselves are changed on the uploader's device). Shown to the administrator who checks it.
   */
  censored?: number;
  /** Who is covered up in the picture (a mosaic over the whole person), among those tagged. Set in the privacy check; the picture itself is what hides them. */
  coveredPersonIds?: string[];
  /** People who were asked for consent by e-mail and have not answered. While any remain the picture is withdrawn (hidden). */
  awaitingConsent?: string[];
  /** Consent given for this picture alone, by e-mail. Not a general photo consent. */
  consents?: { personId: string; at: LocalDateTime }[];
}

/**
 * A request to one person to approve being shown in pictures. The link in the
 * mail carries `token`, which is the only key: whoever holds it can answer, once.
 * A «yes» covers these pictures only and does not change the person's general
 * photo consent.
 */
export interface ConsentRequest {
  id: string;
  token: string;
  personId: string;
  photoIds: string[];
  /** The post the pictures belong to, for the text on the answer page. */
  articleId?: string;
  email: string;
  createdAt: LocalDateTime;
  createdByUserId: string;
  status: "pending" | "granted" | "declined";
  answeredAt?: LocalDateTime;
  /** How many times the mail has been sent, the first included. */
  sent: number;
}

export type PhotographerKind = "user" | "member" | "external" | "club";

export interface Photographer {
  kind: PhotographerKind;
  /** The user, person or external it points at; none for the club. */
  refId?: string;
  /** What the credit says, as it was when the photo was uploaded. */
  name: string;
}

export interface PhotoReview {
  status: "pending" | "approved";
  uploadedAt: LocalDateTime;
  uploadedByUserId: string;
  approvedAt?: LocalDateTime;
  approvedByUserId?: string;
}

/**
 * Someone outside the member register whom the club names: today, a photographer
 * who is not a member. Only a name (and a note for the club's own use), since a
 * credit is all the site needs from them.
 */
export interface External {
  id: string;
  name: string;
  note?: string;
  createdAt: LocalDateTime;
  createdByUserId: string;
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
  /** Last edit of the text or the author in admin (updateArticle), not a privacy edit. */
  editedAt?: LocalDateTime;
  editedByUserId?: string;
  /**
   * A longer piece about one member, reached from their quote on the front
   * page («Les … historie»). Kept out of the news lists: it is a portrait,
   * not news.
   */
  memberStory?: boolean;
  /** Who a member story is about: their groups and training times close the page («Sykle med …»). */
  aboutPersonId?: string;
  /** Written for the prototype about an invented person; the page says so at the top. */
  example?: boolean;
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
  /** A line under the place's name, for a place without a venue record: «Hotel St Jordi, Platja de Palma» under «Mallorca». */
  locationDetail?: string;
  description?: string;
  /**
   * Always «scheduled»: the site publishes the season (the weekly rhythm and the dated events), and a session or an event is
   * called off in Spond, never here. Kept as a field so the records and the stored data keep their shape.
   */
  status: "scheduled";
  /** A page of its own about the activity (the Mallorca trips): the terminliste links to it. */
  page?: { href: string; label: string };
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
  /** A page of its own on this site (Genus Open); the terminliste and the club year link to it instead of `url`. */
  page?: { href: string; label: string };
  /** The ride's main picture (a Photo), shown on its page and in the calendar's block for it. */
  photoId?: string;
  /** More pictures from the race, shown as a gallery on its page (Genus Open). */
  photoIds?: string[];
  /** The race's own page, /sykkelritt/[slug]: what the organiser's site says, in the club's words. */
  slug?: string;
  info?: RaceInfo;
}

/** What a race page says, written from the organiser's own pages and checked on `checked`. Nothing here is the club's own claim. */
export interface RaceInfo {
  lead: string;
  facts: { label: string; value: string }[];
  /** Headed lists: the route, rules, practicalities, history. */
  sections: { title: string; items: string[] }[];
  /** The organiser's pages: the first is the button on the race page. */
  links: { label: string; url: string }[];
  /** The pages the notes were made from. */
  sources: string[];
  /** Month the pages were read, «2026-10». */
  checked: string;
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

/**
 * A message from the privacy section on Om klubben: someone asking for access, deletion or anonymisation, for
 * themselves, their child or someone else. It is not tied to a person in the register yet; an administrator finds the
 * person, checks who is writing, and answers by e-mail. See lib/privacy-contact.ts.
 */
export interface PrivacyContact {
  id: string;
  receivedAt: LocalDateTime;
  /** Who the message is on behalf of. */
  onBehalfOf: "self" | "child" | "other";
  fromName: string;
  fromEmail: string;
  /** The person it concerns, when that is not the sender. */
  subjectName?: string;
  /** The group or team, to find them. */
  where?: string;
  wants: ("innsyn" | "anonymisering" | "sletting")[];
  message?: string;
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
  action: "anonymise" | "publish" | "submit" | "approve" | "reject" | "theme" | "cancelActivity" | "restoreActivity" | "consent" | "import" | "quote" | "portrait" | "editGroup" | "editArticle" | "deleteArticle" | "restoreArticle" | "deleteGroup" | "erasePerson" | "editPerson" | "editVenue" | "editRace" | "inviteUser" | "editUser" | "editExternal" | "reviewPhoto" | "editMembership";
  /** Human description. For anonymisation this never contains the person's name. */
  summary: string;
  personId?: string;
  /** The user an invitation or change was about; names and addresses stay out of `summary`. */
  userId?: string;
  articleId?: string;
  activityId?: string;
  /** What an edit of a group changed, field by field, so it can be undone (see restoreGroupVersion). */
  /** A deleted article, whole, for the trash (see lib/deletion.ts); dropped after TRASH_DAYS days, and rewritten if someone in it is anonymised. */
  deletedArticle?: { article: Article; unlinkedTestimonials: string[] };
  /** What an article looked like before an edit, so the edit can be undone (see restoreArticleVersion). */
  articleBefore?: { title: Inline[]; lead?: Inline[]; blocks: Block[]; authorUserId: string; nodeId?: string; /** The main picture before the edit; empty when it had none. Missing on older entries. */ heroPhotoId?: string };
  change?: { nodeId: string; fields: Record<string, { before: unknown; after: unknown }> };
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
  /** Messages from the public privacy form. */
  privacyContacts: PrivacyContact[];
  externals: External[];
  consentRequests: ConsentRequest[];
  audit: AuditEntry[];
}

/** The icons a riding rule can carry (Lucide, drawn in Feather's style); see RidingRules. */
export type RidingRuleIcon = "side-by-side" | "level" | "traffic" | "light" | "spit" | "hazard" | "stop" | "wait";
