"use client";

import {
  ArrowUpRight,
  CalendarDays,
  Check,
  ChevronDown,
  FileText,
  LayoutGrid,
  Network,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { resetDemo, switchClub, switchDemoUser } from "@/app/actions";
import { ClubCrest } from "@/components/public/crest";
import { announceChange } from "@/components/public/live-refresh";
import { buttonClass } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";

export interface AdminNavItem {
  href: string;
  label: string;
  icon: "overview" | "activities" | "content" | "people" | "structure" | "settings";
}

const ICONS = {
  overview: LayoutGrid,
  activities: CalendarDays,
  content: FileText,
  people: Users,
  structure: Network,
  settings: Settings,
};

interface UserSummary {
  id: string;
  name: string;
  role: string;
  scope: string;
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
  canPublish,
  children,
}: {
  club: { name: string; letters: string; logo?: "crest" | "wordmark" };
  nav: AdminNavItem[];
  user: UserSummary;
  demoUsers: UserSummary[];
  clubs: ClubSummary[];
  activeClubId: string;
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
            <span className="t-label font-semibold md:hidden xl:inline">{club.name}</span>
          </Link>
          <nav aria-label="Administrasjon" className="ml-2 hidden items-stretch gap-0.5 md:flex">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={isActive(n.href) ? "page" : undefined}
                className={cn(
                  "relative flex items-center px-2 t-label whitespace-nowrap transition-colors duration-150 lg:px-2.5",
                  isActive(n.href)
                    ? "text-ink after:absolute after:inset-x-2 after:bottom-[-1px] after:h-0.5 after:bg-ink lg:after:inset-x-2.5"
                    : "text-ink-3 hover:text-ink",
                )}
              >
                {n.label}
              </Link>
            ))}
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
            <UserMenu user={user} demoUsers={demoUsers} clubs={clubs} activeClubId={activeClubId} />
          </div>
        </div>
      </header>

      <main className={cn(!inComposer && "pb-24 md:pb-0")}>{children}</main>

      {!inComposer && <MobileTabBar nav={nav} canPublish={canPublish} isActive={isActive} />}
    </>
  );
}

function UserMenu({
  user,
  demoUsers,
  clubs,
  activeClubId,
}: {
  user: UserSummary;
  demoUsers: UserSummary[];
  clubs: ClubSummary[];
  activeClubId: string;
}) {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
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
        <Avatar name={user.name} size={28} />
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
          <div className="p-1.5">
            <p className="px-2.5 pt-2 pb-1.5 t-overline text-ink-3">Bytt demobruker</p>
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
                <Avatar name={u.name} size={32} />
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
          <div className="grid gap-0.5 border-t border-line p-1.5">
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
              {confirmReset ? "Klikk igjen for å tilbakestille alle demodata" : "Tilbakestill demodata"}
            </button>
            <Link href="/logg-inn" role="menuitem" className="rounded-md px-2.5 py-2 t-small text-ink-2 transition-colors hover:bg-sunken">
              Logg ut
            </Link>
          </div>
        </div>
      )}
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
  const primary = nav.filter((n) => n.icon !== "settings" && n.icon !== "structure").slice(0, 4);
  const left = primary.slice(0, 2);
  const right = primary.slice(2, 4);
  const item = (n: AdminNavItem) => {
    const Icon = ICONS[n.icon];
    const active = isActive(n.href);
    return (
      <li key={n.href}>
        <Link
          href={n.href}
          aria-current={active ? "page" : undefined}
          className={cn("flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-ink" : "text-ink-3")}
        >
          <Icon aria-hidden className="size-5" strokeWidth={active ? 2.25 : 1.75} />
          {n.label}
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
