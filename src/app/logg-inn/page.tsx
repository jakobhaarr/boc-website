import Link from "next/link";
import { LoginFlow } from "@/components/admin/login-flow";
import { ClubCrest } from "@/components/public/crest";
import { loadSite } from "@/lib/data/queries";
import { scopeSummary } from "@/lib/permissions";
import { demoUsers as demoUsersOf } from "@/lib/session";

export const metadata = { title: "Logg inn" };

export default async function LoginPage() {
  const { db, org } = await loadSite();
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
          <LoginFlow demoUsers={demoUsers} />
        </div>
      </div>
    </div>
  );
}
