"use client";

import { ArrowUpRight, Check, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { lockAdmin, resetDemo, switchClub, switchDemoUser } from "@/app/actions";
import { AvatarEditor } from "@/components/admin/avatar-editor";
import { ClubCrest } from "@/components/public/crest";
import { announceChange } from "@/components/public/live-refresh";
import { buttonClass } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import { accentVars, SECTIONS, sectionAccent, sectionOf, type SectionIcon } from "./sections";

export interface AdminNavItem {
  href: string;
  label: string;
  /** A count after the name, red when something has waited too long (pictures to check). */
  badge?: { count: number; tone: "danger" | "warning" };
  /** A shorter name for the phone's tab bar, where five tabs share the width. */
  tabLabel?: string;
  /** The top bar on desktop folds items with a group into a drop-down; the phone's tab bar ignores it. */
  group?: "klubben" | "folk";
  icon: SectionIcon;
}

const NAV_GROUPS: { id: NonNullable<AdminNavItem["group"]>; label: string }[] = [
  { id: "klubben", label: "Klubben" },
  { id: "folk", label: "Folk" },
];

interface UserSummary {
  id: string;
  name: string;
  role: string;
  scope: string;
  /** The portrait of the person behind the account, if one is on file. */
  photo?: { src: string; focal?: { x: number; y: number } };
}

/** The clubs this prototype can show: one multi-sport, one single-sport. */
export interface ClubSummary {
  id: string;
  name: string;
  shortName: string;
  kind: string;
  note: string;
}

/**
 * Admin chrome: a single quiet top bar on desktop, a thumb-reachable tab bar
 * on phones. The composer runs full-screen on phones, so both hide there.
 */
export function AdminChrome({
  club,
  nav,
  user,
  demoUsers,
  clubs,
  activeClubId,
  demoTools,
  canSwitchUser,
  canPublish,
  children,
}: {
  club: { name: string; letters: string; logo?: "crest" | "wordmark" };
  nav: AdminNavItem[];
  user: UserSummary;
  demoUsers: UserSummary[];
  clubs: ClubSummary[];
  activeClubId: string;
  /** Club switcher and reset: shown outside production only. */
  demoTools: boolean;
  /** Only the prototype's shared-password sign-in can switch user; a signed-in person is who they are. */
  canSwitchUser: boolean;
  canPublish: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const inComposer = pathname.startsWith("/admin/publiser");
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      <header className={cn("sticky top-0 z-40 border-b border-line bg-surface", inComposer && "max-md:hidden")}>
        <div className="page flex h-14 items-stretch gap-2">
          <Link href="/admin" className="flex shrink-0 items-center gap-2.5 pr-2" aria-label={`${club.name} administrasjon`}>
            <ClubCrest letters={club.letters} logo={club.logo} className={club.logo === "wordmark" ? "h-5 w-auto text-ink" : "h-7 w-auto"} />
          </Link>
          <nav aria-label="Administrasjon" className="ml-2 hidden items-stretch gap-0.5 md:flex">
            {nav
              .filter((n) => !n.group)
              .map((n) => (
                <NavLink key={n.href} item={n} active={isActive(n.href)} />
              ))}
            {NAV_GROUPS.map((g) => {
              const items = nav.filter((n) => n.group === g.id);
              // A group someone sees only one page of is just that page, not a menu with a single choice.
              if (items.length === 1) return <NavLink key={g.id} item={items[0]} active={isActive(items[0].href)} />;
              if (items.length === 0) return null;
              return <NavGroup key={g.id} label={g.label} items={items} isActive={isActive} />;
            })}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <a href="/" target="_blank" rel="noreferrer" className={cn(buttonClass({ variant: "ghost", size: "sm" }), "max-lg:hidden")}>
              Se nettsiden
              <ArrowUpRight aria-hidden />
            </a>
            {canPublish && !inComposer && (
              <Link href="/admin/publiser" aria-label="Nytt innlegg" className={cn(buttonClass({ size: "sm" }), "px-2 max-md:hidden lg:px-3")}>
                <Plus aria-hidden />
                <span className="hidden lg:inline">Nytt innlegg</span>
              </Link>
            )}
            <UserMenu user={user} demoUsers={demoUsers} clubs={clubs} activeClubId={activeClubId} demoTools={demoTools} canSwitchUser={canSwitchUser} />
          </div>
        </div>
      </header>

      <main style={accentVars(SECTIONS[sectionOf(pathname)].hue)} className={cn(!inComposer && "pb-24 md:pb-0")}>
        {children}
      </main>

      {!inComposer && <MobileTabBar nav={nav} canPublish={canPublish} isActive={isActive} />}
    </>
  );
}

const navItemClass = (active: boolean) =>
  cn(
    "relative flex items-center gap-1.5 px-2.5 t-label whitespace-nowrap transition-colors duration-150",
    active ? "text-ink after:absolute after:inset-x-2.5 after:bottom-[-1px] after:h-0.5 after:bg-[var(--accent)]" : "text-ink-3 hover:text-ink",
  );

/** The small dot in a page's colour that goes before its name. */
const Dot = () => <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />;

function Badge({ badge }: { badge?: AdminNavItem["badge"] }) {
  if (!badge || badge.count === 0) return null;
  return (
    <span className={cn("ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] leading-none font-semibold tnum", badge.tone === "danger" ? "bg-danger text-white" : "bg-warning-surface text-warning")}>
      <span className="sr-only">{badge.tone === "danger" ? "Venter for lenge: " : "Venter: "}</span>
      {badge.count}
    </span>
  );
}

function NavLink({ item, active, label }: { item: AdminNavItem; active: boolean; label?: string }) {
  return (
    <Link href={item.href} aria-current={active ? "page" : undefined} style={sectionAccent(item.icon)} className={navItemClass(active)}>
      <Dot />
      {label ?? item.label}
      <Badge badge={item.badge} />
    </Link>
  );
}

/**
 * A drop-down in the top bar: a button that opens a short list of pages.
 * Opens on press (not hover, so a touch screen works too), closes on Escape,
 * on a press outside and when you go to a page, and the arrow keys move
 * between the pages. It reads as current when one of its pages is open.
 */
function NavGroup({ label, items, isActive }: { label: string; items: AdminNavItem[]; isActive: (href: string) => boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const current = items.find((n) => isActive(n.href));
  const active = !!current;

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const move = (e: React.KeyboardEvent, step: 1 | -1) => {
    e.preventDefault();
    const links = [...(ref.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const at = links.indexOf(document.activeElement as HTMLElement);
    links[(at + step + links.length) % links.length]?.focus();
  };

  return (
    <div ref={ref} className="relative flex items-stretch">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
          }
        }}
        style={current ? sectionAccent(current.icon) : undefined}
        className={navItemClass(active)}
      >
        {label}
        <ChevronDown aria-hidden className={cn("size-3.5 transition-transform duration-150", open && "rotate-180")} />
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={(e) => (e.key === "ArrowDown" ? move(e, 1) : e.key === "ArrowUp" ? move(e, -1) : undefined)}
          className="absolute top-full left-0 z-50 mt-px min-w-48 rounded-lg border border-line bg-surface p-1.5 shadow-popover anim-pop"
        >
          {items.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              role="menuitem"
              aria-current={isActive(n.href) ? "page" : undefined}
              style={sectionAccent(n.icon)}
              className={cn("flex items-center gap-2.5 rounded-md px-2.5 py-2 t-label transition-colors hover:bg-[var(--accent-bg)]", isActive(n.href) ? "text-ink" : "text-ink-2")}
            >
              <Dot />
              {n.label}
              {isActive(n.href) && <Check aria-hidden className="ml-auto size-4 text-ink" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu({
  user,
  demoUsers,
  clubs,
  activeClubId,
  demoTools,
  canSwitchUser,
}: {
  user: UserSummary;
  demoUsers: UserSummary[];
  clubs: ClubSummary[];
  activeClubId: string;
  demoTools: boolean;
  canSwitchUser: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const switchTo = (id: string) =>
    startTransition(async () => {
      await switchDemoUser(id);
      setOpen(false);
      router.push("/admin");
      router.refresh();
    });

  // Clubs are separate tenants: switching one changes every page, so the menu
  // closes and the overview reloads as the new club's administrator.
  const switchToClub = (id: string) =>
    startTransition(async () => {
      await switchClub(id);
      setOpen(false);
      router.push("/admin");
      router.refresh();
    });

  return (
    <div ref={ref} className="relative flex items-center">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setConfirmReset(false);
        }}
        className="flex items-center gap-2 rounded-md py-1 pr-1.5 pl-1 transition-colors hover:bg-sunken"
      >
        <Avatar name={user.name} size={28} photo={user.photo} />
        <span className="hidden text-left leading-tight lg:block">
          <span className="block t-label">{user.name}</span>
          <span className="block t-meta text-ink-3">{user.role}</span>
        </span>
        <ChevronDown aria-hidden className="size-3.5 text-ink-3" />
      </button>

      {open && (
        <div role="menu" aria-label="Bruker" className="absolute top-full right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-surface shadow-popover anim-pop">
          <div className="border-b border-line px-4 py-3">
            <p className="t-label font-semibold">{user.name}</p>
            <p className="t-small text-ink-3">
              {user.role} · {user.scope}
            </p>
          </div>
          {demoTools && (
            <div className="border-b border-line p-1.5">
              <p className="px-2.5 pt-2 pb-1.5 t-overline text-ink-3">Klubb</p>
              {clubs.map((c) => {
                const active = c.id === activeClubId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    disabled={pending}
                    onClick={() => switchToClub(c.id)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                      active ? "bg-sunken" : "hover:bg-sunken",
                    )}
                  >
                    <ClubCrest letters={c.shortName} className="h-6 w-auto shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate t-label">{c.name}</span>
                      <span className="block truncate t-meta text-ink-3">
                        {c.kind} · {c.note}
                      </span>
                    </span>
                    {active && <Check aria-hidden className="size-4 shrink-0 text-ink" />}
                  </button>
                );
              })}
            </div>
          )}
          {canSwitchUser && (
            <div className="p-1.5">
              <p className="px-2.5 pt-2 pb-1.5 t-overline text-ink-3">Bytt bruker</p>
              {demoUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={u.id === user.id}
                  disabled={pending}
                  onClick={() => switchTo(u.id)}
                  className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-sunken disabled:opacity-60"
                >
                  <Avatar name={u.name} size={32} photo={u.photo} />
                  <span className="min-w-0 flex-1">
                    <span className="block t-label">{u.name}</span>
                    <span className="block truncate t-meta text-ink-3">
                      {u.role} · {u.scope}
                    </span>
                  </span>
                  {u.id === user.id && <Check aria-hidden className="size-4 text-ink" />}
                </button>
              ))}
            </div>
          )}
          <div className="grid gap-0.5 border-t border-line p-1.5">
            {demoTools && (
              <button
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={() => {
                  if (!confirmReset) return setConfirmReset(true);
                  startTransition(async () => {
                    await resetDemo();
                    announceChange();
                    setOpen(false);
                    router.push("/admin");
                    router.refresh();
                  });
                }}
                className={cn(
                  "rounded-md px-2.5 py-2 text-left t-small transition-colors hover:bg-sunken",
                  confirmReset ? "font-medium text-danger" : "text-ink-2",
                )}
              >
                {/* With Supabase this drops every change saved from admin (resetDb), not just the demo's. */}
                {confirmReset ? "Klikk igjen: alle endringer gjort i admin slettes" : "Tilbakestill til utgangspunktet"}
              </button>
            )}
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                setEditingPhoto(true);
              }}
              className="rounded-md px-2.5 py-2 text-left t-small text-ink-2 transition-colors hover:bg-sunken"
            >
              {user.photo ? "Bytt profilbilde" : "Legg til profilbilde"}
            </button>
            <button
              type="button"
              role="menuitem"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await lockAdmin();
                  router.push("/logg-inn");
                })
              }
              className="rounded-md px-2.5 py-2 text-left t-small text-ink-2 transition-colors hover:bg-sunken"
            >
              Logg ut
            </button>
          </div>
        </div>
      )}
      <AvatarEditor open={editingPhoto} onClose={() => setEditingPhoto(false)} name={user.name} photo={user.photo} />
    </div>
  );
}

function MobileTabBar({
  nav,
  canPublish,
  isActive,
}: {
  nav: AdminNavItem[];
  canPublish: boolean;
  isActive: (href: string) => boolean;
}) {
  const primary = nav.filter((n) => n.icon !== "settings" && n.icon !== "structure" && n.icon !== "venues" && n.icon !== "users" && n.icon !== "externals" && n.icon !== "photos").slice(0, 4);
  const left = primary.slice(0, 2);
  const right = primary.slice(2, 4);
  const item = (n: AdminNavItem) => {
    const Icon = SECTIONS[n.icon].icon;
    const active = isActive(n.href);
    return (
      <li key={n.href}>
        <Link
          href={n.href}
          aria-current={active ? "page" : undefined}
          style={sectionAccent(n.icon)}
          className={cn("flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-[var(--accent)]" : "text-ink-3")}
        >
          <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
          {n.tabLabel ?? n.label}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="Administrasjon" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid grid-cols-5">
        {left.map(item)}
        <li className="flex items-center justify-center">
          {canPublish ? (
            <Link
              href="/admin/publiser"
              aria-label="Nytt innlegg"
              className="flex size-11 items-center justify-center rounded-full bg-action text-on-action transition-transform active:scale-95"
            >
              <Plus aria-hidden className="size-5" />
            </Link>
          ) : null}
        </li>
        {right.map(item)}
      </ul>
    </nav>
  );
}
