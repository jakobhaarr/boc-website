import type { Metadata, Viewport } from "next";
import { Inter, Schibsted_Grotesk } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import bocIcon from "@/components/assets/boc-logo.jpeg";
import { loadSite } from "@/lib/data/queries";
import { themeStyle } from "@/lib/theme";
import "./globals.css";

/* Inter carries UI and body text; Schibsted Grotesk — drawn for Norwegian
   news media — carries editorial headlines. */
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const { db } = await loadSite();
  return {
    title: { default: db.club.name, template: `%s – ${db.club.name}` },
    description: db.club.about,
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
      </body>
    </html>
  );
}
