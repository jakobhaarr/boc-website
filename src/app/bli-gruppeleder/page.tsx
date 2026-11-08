import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { LeaderSignup } from "@/components/admin/leader-signup";
import { ClubCrest } from "@/components/public/crest";
import { loadSite } from "@/lib/data/queries";
import { claimableGroups, leaderSignupEnabled, signupNeedsCode } from "@/lib/leader-signup";
import { signInByCodeAvailable } from "@/lib/supabase-auth";

export const metadata: Metadata = { title: "Bli ansvarlig for gruppa", robots: { index: false, follow: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };

/** TEMPORARY (lib/leader-signup.ts): the group leaders' meeting. Closed unless LEADER_SIGNUP is set. */
export default async function LeaderSignupPage() {
  const { db, org } = await loadSite();
  const open = leaderSignupEnabled();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-[var(--header-bg)]">
        <Link href="/" aria-label={`${db.club.name}, til forsiden`} className="flex h-20 items-center px-5 sm:px-10">
          <ClubCrest letters={db.club.shortName} logo={db.club.logo} tone="dark" className={db.club.logo === "wordmark" ? "h-7 w-auto" : "h-9 w-auto"} />
        </Link>
      </header>
      <div aria-hidden className="h-1.5 bg-[var(--club-primary)]" />
      <main className="flex flex-1 flex-col px-5 py-8 sm:px-10">
        <div className="mx-auto w-full max-w-sm pt-6 pb-12">
          {open ? (
            <LeaderSignup groups={claimableGroups(db, org)} codeAvailable={signInByCodeAvailable()} needsCode={signupNeedsCode()} />
          ) : (
            <div>
              <h1 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em]">Registreringen er stengt</h1>
              <p className="mt-2 t-small text-ink-2">
                Har du allerede en bruker,{" "}
                <Link href="/logg-inn" className="underline underline-offset-2">
                  logg inn her
                </Link>
                . Ellers kan klubbadministrator invitere deg.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
