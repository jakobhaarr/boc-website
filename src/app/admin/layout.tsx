import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminChrome, type AdminNavItem } from "@/components/admin/admin-chrome";
import { LiveRefresh } from "@/components/public/live-refresh";
import { loadAdmin } from "@/lib/data/queries";
import { canChangeClubSettings, canEditVenues, canSeePeople, isClubAdmin, publishTargets, scopeSummary } from "@/lib/permissions";
import { DEMO_CLUBS } from "@/lib/club";
import { demoUsers as demoUsersOf } from "@/lib/session";
import { userPhoto } from "@/lib/user-admin";

export const metadata: Metadata = {
  title: { default: "Administrasjon", template: "%s · Administrasjon" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { clubId, db, org, user, via } = await loadAdmin();
  const isAdmin = canSeePeople(user);
  const demoTools = process.env.NODE_ENV !== "production";

  const nav: AdminNavItem[] = [
    { href: "/admin", label: "Oversikt", icon: "overview" },
    ...(isAdmin ? [{ href: "/admin/grupper", label: "Grupper", group: "klubben" as const, icon: "groups" as const }] : []),
    ...(isAdmin ? [{ href: "/admin/aktiviteter", label: "Aktiviteter", group: "klubben" as const, icon: "activities" as const }] : []),
    { href: "/admin/innhold", label: "Innhold", group: "innhold" as const, menuLabel: "Innlegg", icon: "content" as const },
    ...(isAdmin ? [{ href: "/admin/personer", label: "Personer", group: "folk" as const, icon: "people" as const }] : []),
    ...(isAdmin ? [{ href: "/admin/sitater", label: "Sitater", group: "innhold" as const, icon: "quotes" as const }] : []),
    { href: "/admin/struktur", label: "Struktur", group: "klubben" as const, icon: "structure" as const },
    ...(canEditVenues(user) ? [{ href: "/admin/arenaer", label: "Arenaer", group: "klubben" as const, icon: "venues" as const }] : []),
    ...(isClubAdmin(user) ? [{ href: "/admin/brukere", label: "Brukere", group: "folk" as const, icon: "users" as const }] : []),
    ...(canChangeClubSettings(user) ? [{ href: "/admin/innstillinger", label: "Innstillinger", group: "klubben" as const, icon: "settings" as const }] : []),
  ];

  // Only the prototype's shared-password sign-in may switch user, and only it needs the list of everyone.
  const demoUsers = (via === "password" ? demoUsersOf(db) : []).map((u) => ({
    id: u.id,
    name: u.name,
    photo: userPhoto(db, u),
    ...scopeSummary(u, org),
  }));

  return (
    <div className="theme-admin min-h-dvh bg-bg text-ink">
      <AdminChrome
        club={{ name: db.club.name, letters: db.club.shortName, logo: db.club.logo }}
        nav={nav}
        user={{ id: user.id, name: user.name, photo: userPhoto(db, user), ...scopeSummary(user, org) }}
        demoUsers={demoUsers}
        clubs={demoTools ? DEMO_CLUBS.map((c) => ({ ...c })) : []}
        activeClubId={clubId}
        demoTools={demoTools}
        canSwitchUser={via === "password"}
        canPublish={publishTargets(user, org).length > 0}
      >
        {children}
      </AdminChrome>
      <LiveRefresh version={db.version} />
    </div>
  );
}
