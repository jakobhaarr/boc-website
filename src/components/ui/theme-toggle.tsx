"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const STORAGE_KEY = "theme";

/**
 * Light/dark is a visitor's own choice, not a club design decision (that's
 * OrgNode.pageTone/.page-dark). The initial value is set synchronously by an
 * inline script in the root layout, before paint, so there is no flash; this
 * component only reads that result back on mount (see the useEffect below —
 * rendering "light" on the server and correcting after mount avoids a
 * hydration mismatch, at the cost of the icon swapping once on load).
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.getAttribute("data-theme") === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private browsing or a blocked store: the toggle still works this visit.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? "Bytt til lyst tema" : "Bytt til mørkt tema"}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sunken hover:text-ink",
        className,
      )}
    >
      {dark ? <Sun aria-hidden className="size-[18px]" /> : <Moon aria-hidden className="size-[18px]" />}
    </button>
  );
}
