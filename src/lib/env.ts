/**
 * Which environment the site runs in, so a test copy never behaves like the real one.
 *
 *   production   the live site (Vercel's production deployment, or `next start` anywhere else)
 *   preview      a deployment of a branch or pull request on Vercel (VERCEL_ENV=preview)
 *   development  `npm run dev` on a developer's machine
 *
 * A preview must not touch the real club's data or people: it keeps changes in memory (lib/data/supabase.ts `persistent`), sends no
 * e-mail (lib/mail.ts), measures nothing (no analytics), tells search engines to stay away, and says on every page that it is a
 * test copy. The environment variables below let one preview opt back in on purpose, for example one with its own Supabase project.
 */
export type AppEnv = "production" | "preview" | "development";

export function appEnv(env: Record<string, string | undefined> = process.env): AppEnv {
  if (env.VERCEL_ENV === "production") return "production";
  if (env.VERCEL_ENV === "preview") return "preview";
  if (env.VERCEL_ENV === "development") return "development";
  return env.NODE_ENV === "production" ? "production" : "development";
}

export const isPreview = () => appEnv() === "preview";
export const isProduction = () => appEnv() === "production";

/** A preview has its own database only when told so: PREVIEW_PERSISTENT=on (with its own SUPABASE_URL and key for Preview in Vercel). */
export const previewMayPersist = (env: Record<string, string | undefined> = process.env) => env.PREVIEW_PERSISTENT?.trim().toLowerCase() === "on";

/** A preview sends e-mail only when told so: PREVIEW_MAIL=on. */
export const previewMayMail = (env: Record<string, string | undefined> = process.env) => env.PREVIEW_MAIL?.trim().toLowerCase() === "on";
