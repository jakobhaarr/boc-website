import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LoginFlow } from "@/components/admin/login-flow";
import { CodeLogin } from "@/components/admin/code-login";
import { ClubCrest } from "@/components/public/crest";
import { ADMIN_COOKIE, isAdminToken } from "@/lib/admin-auth";
import { loadSite } from "@/lib/data/queries";
import { scopeSummary } from "@/lib/permissions";
import { demoUsers as demoUsersOf, signedIn } from "@/lib/session";
import { signInByCodeAvailable } from "@/lib/supabase-auth";

export const metadata = { title: "Logg inn" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ neste?: string }> }) {
  const { neste } = await searchParams;
  // Only paths inside admin, so the page cannot be used to send someone elsewhere.
  const next = neste?.startsWith("/admin") ? neste : "/admin";
  const unlocked = await isAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  const { db, org } = await loadSite();
  if ((await signedIn(db))?.via === "code") redirect(next);
  const demoUsers = demoUsersOf(db).map((u) => ({ id: u.id, name: u.name, ...scopeSummary(u, org) }));

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-club-2 p-12 text-on-club-2 lg:flex">
        <Link href="/" className="flex items-center gap-3">
          <ClubCrest letters={db.club.shortName} logo={db.club.logo} tone="dark" className={db.club.logo === "wordmark" ? "h-8 w-auto" : "h-11 w-auto"} />
          <span className="font-display text-xl font-semibold">{db.club.name}</span>
        </Link>
        <div className="max-w-md">
          <h1 className="t-h1">For trenere, lagledere og foreldre</h1>
          <p className="mt-4 t-body-lg text-white/70">
            Logg inn for å publisere innlegg og bilder fra laget ditt, holde aktiviteter oppdatert og se hvem som er med.
          </p>
        </div>
        <p className="t-small text-white/50">Du ser bare lagene og gruppene du har ansvar for.</p>
      </div>

      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 lg:hidden">
          <ClubCrest letters={db.club.shortName} logo={db.club.logo} className={db.club.logo === "wordmark" ? "h-6 w-auto text-club" : "h-9 w-auto"} />
          <span className="font-display text-[17px] font-semibold">{db.club.name}</span>
        </Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          {unlocked ? <LoginFlow demoUsers={demoUsers} mock={process.env.NODE_ENV !== "production"} codeAvailable={signInByCodeAvailable()} /> : <CodeLogin next={next} codeAvailable={signInByCodeAvailable()} />}
        </div>
      </div>
    </div>
  );
}
