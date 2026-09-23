import { redirect } from "next/navigation";
import { AdminHeader, Panel } from "@/components/admin/bits";
import { ThemePicker } from "@/components/admin/theme-picker";
import { Status } from "@/components/ui/primitives";
import { loadAdmin } from "@/lib/data/queries";
import { canChangeClubSettings } from "@/lib/permissions";

export const metadata = { title: "Innstillinger" };

export default async function SettingsPage() {
  const { db, user } = await loadAdmin();
  if (!canChangeClubSettings(user)) redirect("/admin");
  const { club } = db;

  return (
    <div className="page pb-16">
      <AdminHeader title="Innstillinger" description="Klubbens profil, farger og hvordan folk logger inn." />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <Panel id="farger" title="Klubbfarger">
            <div className="p-4 sm:p-5">
              <p className="max-w-[62ch] t-small text-ink-2">
                Nettsiden bygger på et felles designsystem. Klubben bestemmer bare fargene — typografi, avstander og komponenter er de samme for alle klubber.
              </p>
              <div className="mt-5">
                <ThemePicker themes={db.themes} activeId={club.themeId} clubName={club.name} letters={club.shortName} />
              </div>
            </div>
          </Panel>

          <Panel id="innlogging" title="Innlogging">
            <ul className="divide-y divide-line">
              {[
                ["Google", "Trenere og foreldre kan logge inn med Google-kontoen sin.", true],
                ["E-post med engangskode", "Ingen passord. Brukeren får en kode eller lenke på e-post hver gang.", true],
              ].map(([label, text, on]) => (
                <li key={String(label)} className="flex items-start justify-between gap-4 px-4 py-3.5 sm:px-5">
                  <div>
                    <p className="t-label font-semibold">{label}</p>
                    <p className="t-small text-ink-3">{text}</p>
                  </div>
                  {on && <Status tone="success">Aktiv</Status>}
                </li>
              ))}
            </ul>
            <p className="border-t border-line px-4 py-3 t-small text-ink-3 sm:px-5">
              Innlogging er ikke koblet til i prototypen. Demobrukere velges fra menyen øverst til høyre.
            </p>
          </Panel>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <Panel id="profil" title="Klubbprofil">
            <dl className="divide-y divide-line t-small">
              {[
                ["Navn", club.name],
                ["Forkortelse", club.shortName],
                ["Stiftet", String(club.founded)],
                ["Org.nr.", club.orgNumber],
                ["E-post", club.email],
                ["Telefon", club.phone],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3 px-4 py-2.5 sm:px-5">
                  <dt className="text-ink-3">{k}</dt>
                  <dd className="truncate">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
          <Panel id="personvern" title="Personvern">
            <div className="space-y-2 px-4 py-4 t-small text-ink-2 sm:px-5">
              <p>Personer uten registrert fotosamtykke kan merkes, men lagleder får en påminnelse.</p>
              <p>Personer med status «Ikke publiser» kan ikke merkes eller nevnes i nye innlegg.</p>
              <p>Bare klubbadministratorer kan anonymisere. Anonymisering kan ikke angres.</p>
            </div>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
