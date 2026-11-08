import type { Metadata, Viewport } from "next";
import { Inter, Schibsted_Grotesk } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import bocIcon from "@/components/assets/boc-logo.jpeg";
import { PreviewBanner } from "@/components/public/preview-banner";
import { isPreview } from "@/lib/env";
import { loadSite } from "@/lib/data/queries";
import { themeStyle } from "@/lib/theme";
import "./globals.css";

/* The site is set in SF Pro (the system font on Apple devices, see --font-sans in globals.css). Inter is the fallback
   where SF Pro is not installed. Schibsted Grotesk is kept only for the sponsor wordmarks drawn in sponsor-logos.tsx. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { db } = await loadSite();
  return {
    // Absolute address for the share pictures and links (SITE_URL on Vercel; the club's own domain).
    metadataBase: new URL(process.env.SITE_URL?.trim() || "https://baerumock.no"),
    title: { default: db.club.name, template: `%s – ${db.club.name}` },
    description: db.club.about,
    openGraph: { type: "website", siteName: db.club.name, locale: "nb_NO", title: db.club.name, description: db.club.about },
    twitter: { card: "summary_large_image" },
    // A test copy is never indexed (lib/env.ts); next.config.ts sends the same as a header.
    ...(isPreview() && { robots: { index: false, follow: false } }),
    icons: {
      icon: db.club.id === "boc" ? bocIcon.src : "/icon.svg",
      apple: db.club.id === "boc" ? bocIcon.src : "/icon.svg",
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#faf9f6",
};

/* Sets data-theme before first paint, from a stored choice or — failing
   that — the OS preference, so a dark-mode visitor never sees a flash of
   the light theme while React hydrates. Kept as a plain inline script
   rather than state, since state can only apply itself after hydration. */
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = await loadSite();
  return (
    <html lang="nb" className={`${inter.variable} ${schibsted.variable}`} style={themeStyle(theme)} suppressHydrationWarning>
      <body>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        {children}
        <PreviewBanner />
      </body>
    </html>
  );
}
