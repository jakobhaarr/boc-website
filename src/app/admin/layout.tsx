import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminChrome, type AdminNavItem } from "@/components/admin/admin-chrome";
import { LiveRefresh } from "@/components/public/live-refresh";
import { loadAdmin } from "@/lib/data/queries";
import { canChangeClubSettings, canSeePeople, publishTargets, scopeSummary } from "@/lib/permissions";
import { DEMO_CLUBS } from "@/lib/club";
import { demoUsers as demoUsersOf } from "@/lib/session";

export const metadata: Metadata = {
  title: { default: "Administrasjon", template: "%s · Administrasjon" },
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { clubId, db, org, user } = await loadAdmin();
  const isAdmin = canSeePeople(user);

  const nav: AdminNavItem[] = [
    { href: "/admin", label: "Oversikt", icon: "overview" },
    ...(isAdmin ? [{ href: "/admin/aktiviteter", label: "Aktiviteter", icon: "activities" as const }] : []),
    { href: "/admin/innhold", label: "Innhold", icon: "content" },
    ...(isAdmin ? [{ href: "/admin/personer", label: "Personer", icon: "people" as const }] : []),
    { href: "/admin/struktur", label: "Struktur", icon: "structure" },
    ...(canChangeClubSettings(user) ? [{ href: "/admin/innstillinger", label: "Innstillinger", icon: "settings" as const }] : []),
  ];

  const demoUsers = demoUsersOf(db).map((u) => ({
    id: u.id,
    name: u.name,
    ...scopeSummary(u, org),
  }));

  return (
    <div className="theme-admin min-h-dvh bg-bg text-ink">
      <AdminChrome
        club={{ name: db.club.name, letters: db.club.shortName, logo: db.club.logo }}
        nav={nav}
        user={{ id: user.id, name: user.name, ...scopeSummary(user, org) }}
        demoUsers={demoUsers}
        clubs={DEMO_CLUBS.map((c) => ({ ...c }))}
        activeClubId={clubId}
        canPublish={publishTargets(user, org).length > 0}
      >
        {children}
      </AdminChrome>
      <LiveRefresh version={db.version} />
    </div>
  );
}
