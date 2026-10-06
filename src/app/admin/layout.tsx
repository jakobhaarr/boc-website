import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminChrome, type AdminNavItem } from "@/components/admin/admin-chrome";
import { LiveRefresh } from "@/components/public/live-refresh";
import { loadAdmin } from "@/lib/data/queries";
import { pendingPhotos, reviewState } from "@/lib/photo-meta";
import { canAnywhere } from "@/lib/access";
import { canAnonymise, canChangeClubSettings, canEditVenues, isClubAdmin, publishTargets, scopeSummary } from "@/lib/permissions";
import { DEMO_CLUBS } from "@/lib/club";
import { demoUsers as demoUsersOf } from "@/lib/session";
import { userPhoto } from "@/lib/user-admin";

export const metadata: Metadata = {
  title: { default: "Administrasjon", template: "%s · Administrasjon" },
  robots: { index: false },
};

/** Pictures waiting for a check: a count in the menu, red once one has waited too long. */
function photoBadge(db: Parameters<typeof pendingPhotos>[0], now: Parameters<typeof reviewState>[1]) {
  const waiting = pendingPhotos(db);
  return { count: waiting.length, tone: waiting.some((p) => reviewState(p, now) === "overdue") ? ("danger" as const) : ("warning" as const) };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { clubId, db, org, user, via, now } = await loadAdmin();
  const demoTools = process.env.NODE_ENV !== "production";

  const nav: AdminNavItem[] = [
    { href: "/admin", label: "Oversikt", icon: "overview" },
    ...(canAnywhere(user, "edit_group") ? [{ href: "/admin/grupper", label: "Grupper", group: "klubben" as const, icon: "groups" as const }] : []),
    ...(canAnywhere(user, "activities") ? [{ href: "/admin/aktiviteter", label: "Aktiviteter", group: "klubben" as const, icon: "activities" as const }] : []),
    { href: "/admin/innhold", label: "Innlegg", icon: "content" as const },
    ...(canAnywhere(user, "members") ? [{ href: "/admin/personer", label: "Medlemmer", group: "folk" as const, icon: "people" as const }] : []),
    ...(canAnywhere(user, "edit_group") ? [{ href: "/admin/sitater", label: "Sitater", icon: "quotes" as const }] : []),
    ...(isClubAdmin(user) ? [{ href: "/admin/bilder", label: "Bilder", icon: "photos" as const, badge: photoBadge(db, now) }] : []),
    { href: "/admin/struktur", label: "Struktur", group: "klubben" as const, icon: "structure" as const },
    ...(canEditVenues(user) ? [{ href: "/admin/arenaer", label: "Arenaer", group: "klubben" as const, icon: "venues" as const }] : []),
    ...(canAnywhere(user, "users") ? [{ href: "/admin/brukere", label: "Brukere og tilgang", tabLabel: "Tilgang", group: "folk" as const, icon: "users" as const }] : []),
    ...(canAnonymise(user) ? [{ href: "/admin/personvern", label: "Personvern", group: "folk" as const, icon: "privacy" as const, badge: { count: db.privacyContacts.filter((c) => c.status === "open").length, tone: "warning" as const } }] : []),
    ...(isClubAdmin(user) ? [{ href: "/admin/eksterne", label: "Eksterne", group: "folk" as const, icon: "externals" as const }] : []),
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
