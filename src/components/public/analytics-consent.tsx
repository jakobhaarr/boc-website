"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Statistics with Google Analytics, only with a yes.
 *
 * Nothing from Google is loaded, and no cookie is set, until the visitor has
 * said yes in the banner. «Nei takk» is as easy to press as «Ja», the site
 * works the same either way, and the choice can be changed at any time from
 * the footer («Informasjonskapsler»). The choice itself is kept in this
 * browser only (localStorage); it is not a tracking cookie.
 *
 * Without a measurement id (GA_MEASUREMENT_ID) the banner never appears and
 * nothing is loaded, so a club that does not want statistics has none.
 *
 * What goes to Google after a yes: the page address and title, the browser,
 * device and approximate place, and a random id in the _ga cookies. The IP
 * address is not stored by Google Analytics 4. A page view is sent for each
 * page the visitor opens, including those the site opens without a reload
 * (usePathname). Saying no afterwards deletes the _ga cookies and stops the
 * measuring.
 */

const KEY = "klubb-statistikk";
const OPEN_EVENT = "klubb:cookie-valg";
type Choice = "ja" | "nei";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function read(): Choice | null {
  try {
    const value = localStorage.getItem(KEY);
    return value === "ja" || value === "nei" ? value : null;
  } catch {
    return null;
  }
}

function write(choice: Choice) {
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // Without storage the question is simply asked again next time.
  }
}

function load(id: string) {
  if (document.getElementById("ga-script")) return;
  window.dataLayer = window.dataLayer ?? [];
  // gtag.js reads the Arguments object, not an array, so this has to be a plain function.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  // Page views are sent below, once per page the visitor opens.
  window.gtag("config", id, { send_page_view: false });
  const script = document.createElement("script");
  script.id = "ga-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/** Removes the _ga cookies Google Analytics set, on this domain and the ones above it. */
function clearCookies() {
  const parts = location.hostname.split(".");
  const domains = [undefined, ...parts.slice(0, -1).map((_, i) => `.${parts.slice(i).join(".")}`)];
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0].trim();
    if (!/^_ga(_|$)/.test(name)) continue;
    for (const domain of domains) document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain ? `; domain=${domain}` : ""}`;
  }
}

export function AnalyticsConsent({ measurementId }: { measurementId?: string }) {
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!measurementId) return;
    const saved = read();
    setChoice(saved);
    setOpen(saved === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, [measurementId]);

  useEffect(() => {
    if (measurementId && choice === "ja") load(measurementId);
  }, [measurementId, choice]);

  useEffect(() => {
    if (choice !== "ja" || !window.gtag) return;
    window.gtag("event", "page_view", { page_path: pathname, page_location: location.href, page_title: document.title });
  }, [choice, pathname]);

  if (!measurementId || !open) return null;

  const decide = (next: Choice) => {
    const before = read();
    write(next);
    setChoice(next);
    setOpen(false);
    if (next === "nei" && before === "ja") {
      clearCookies();
      // The script is already running on this page: a reload is what stops it.
      location.reload();
    }
  };

  return (
    <section
      aria-label="Informasjonskapsler og statistikk"
      className="fixed inset-x-3 bottom-3 z-50 rounded-lg border border-line bg-surface p-4 text-ink shadow-popover sm:right-auto sm:left-4 sm:bottom-4 sm:max-w-[26rem] sm:p-5"
    >
      <h2 className="text-[16px] leading-6 font-semibold tracking-[-0.01em]">Vil du hjelpe oss med statistikk?</h2>
      <p className="mt-1.5 t-small text-ink-2">
        Vi bruker Google Analytics for å se hvilke sider som leses. Det setter informasjonskapsler. Det er helt frivillig, og nettsiden fungerer likt uansett hva du velger.{" "}
        <a href="/personvern#statistikk" className="font-medium text-club underline underline-offset-2 hover:text-club-hover">
          Les mer
        </a>
      </p>
      {choice && <p className="mt-2 t-meta text-ink-3">Nå: {choice === "ja" ? "du har sagt ja til statistikk" : "du har sagt nei til statistikk"}.</p>}
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <Button variant="secondary" onClick={() => decide("nei")}>
          Nei takk
        </Button>
        <Button variant="secondary" onClick={() => decide("ja")}>
          Ja, det er greit
        </Button>
      </div>
    </section>
  );
}

/** «Informasjonskapsler» in the footer: opens the choice again, to change it. */
export function CookieChoiceButton({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Informasjonskapsler
    </button>
  );
}
