import type { Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginFlow } from "@/components/admin/login-flow";
import { CodeLogin } from "@/components/admin/code-login";
import { ClubCrest } from "@/components/public/crest";
import { loadSite } from "@/lib/data/queries";
import { scopeSummary } from "@/lib/permissions";
import { demoUsers as demoUsersOf, signedIn } from "@/lib/session";
import { signInByCodeAvailable } from "@/lib/supabase-auth";

export const metadata = { title: "Logg inn" };

/**
 * A phone must not zoom in when the address field gets focus (the page opens
 * with it focused). Fields are 16 px, which is what iOS Safari wants, and the
 * scale is held at 1 on this one page as well, so nothing can make it zoom.
 * Everywhere else pinch zoom is left alone.
 */
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ neste?: string; epost?: string }> }) {
  const { neste, epost } = await searchParams;
  // Only paths inside admin, so the page cannot be used to send someone elsewhere.
  const next = neste?.startsWith("/admin") ? neste : "/admin";
  // An invitation links here with the address filled in; it is only a start for the field, nothing is sent from it.
  const initialEmail = epost && epost.length <= 254 && epost.includes("@") ? epost : "";
  const { db, org } = await loadSite();
  if ((await signedIn(db))?.via === "code") redirect(next);
  // Picking a demo user is for local development without the e-mail sign-in; production offers the code only.
  const devLogin = process.env.NODE_ENV !== "production" && !signInByCodeAvailable();
  const demoUsers = devLogin ? demoUsersOf(db).map((u) => ({ id: u.id, name: u.name, ...scopeSummary(u, org) })) : [];

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-club-2 p-12 text-on-club-2 lg:flex">
        <Slants />
        <Bars className="absolute top-0 right-12 h-40" />
        <Link href="/" aria-label={`${db.club.name}, til forsiden`} className="relative flex items-center">
          <ClubCrest letters={db.club.shortName} logo={db.club.logo} tone="dark" className={db.club.logo === "wordmark" ? "h-8 w-auto" : "h-11 w-auto"} />
        </Link>
        <div className="relative max-w-md">
          <h1 className="t-h1">For trenere, lagledere og foreldre</h1>
          <p className="mt-4 t-body-lg text-white/70">
            Logg inn for å publisere innlegg og bilder fra laget ditt, holde aktiviteter oppdatert og se hvem som er med.
          </p>
        </div>
        <p className="relative t-small text-white/50">Du ser bare lagene og gruppene du har ansvar for.</p>
      </div>

      <div className="flex flex-col">
        {/* On a phone: a band in the club's dark with the wordmark, the three bars of the logo and the yellow rule under it. */}
        <header className="lg:hidden">
          <div className="relative overflow-hidden bg-[var(--header-bg)]">
            <Link href="/" aria-label={`${db.club.name}, til forsiden`} className="relative flex h-20 items-center px-5">
              <ClubCrest letters={db.club.shortName} logo={db.club.logo} tone="dark" className={db.club.logo === "wordmark" ? "h-7 w-auto" : "h-9 w-auto"} />
            </Link>
            <Bars className="absolute top-0 right-7 h-full" />
          </div>
          <div aria-hidden className="h-1.5 bg-[var(--club-primary)]" />
        </header>
        <div className="relative flex flex-1 flex-col px-5 py-8 sm:px-10">
          <div aria-hidden className="pointer-events-none absolute inset-0 lg:hidden" style={{ backgroundImage: "repeating-linear-gradient(111.25deg, transparent 0 239px, var(--border) 239px 240px)" }} />
          <div className="relative mx-auto flex w-full max-w-sm flex-1 flex-col justify-start pt-6 pb-12 lg:justify-center lg:py-12">
            {devLogin ? <LoginFlow demoUsers={demoUsers} /> : <CodeLogin next={next} codeAvailable={signInByCodeAvailable()} initialEmail={initialEmail} />}
          </div>
        </div>
      </div>
    </div>
  );
}

/** The three slanted bars of the club's mark, the same lean as the fact strip, as a quiet signature. */
function Bars({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none flex gap-2.5 ${className ?? ""}`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="block h-full w-3.5 bg-[var(--club-primary)]" style={{ transform: "skewX(-21.25deg)" }} />
      ))}
    </div>
  );
}

/** The slant of the fact strip as a faint texture on the dark panel. */
function Slants() {
  return <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "repeating-linear-gradient(111.25deg, transparent 0 299px, rgb(255 255 255 / 0.08) 299px 300px)" }} />;
}
