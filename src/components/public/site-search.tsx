"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { SearchCategory, SearchEntry } from "@/lib/search";

const CATEGORY_ORDER: SearchCategory[] = ["Sider", "Grupper", "Nyheter"];
const MAX_RESULTS_PER_CATEGORY = 8;

function normalise(text: string) {
  return text.toLocaleLowerCase("nb");
}

/** Bolds the part of `text` that matched `query`, for the first occurrence only. */
function HighlightedText({ text, query }: { text: string; query: string }) {
  const at = normalise(text).indexOf(normalise(query));
  if (!query || at === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark className="rounded-xs bg-warning-surface text-ink">{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

/**
 * Site-wide search: a button that opens a dialog over the whole index built
 * in lib/search.ts (fixed pages, the club's own pages, every branch and
 * group, and published news). Filtering happens client-side against the
 * query, since the index is small enough to ship with the page; matching is
 * a plain substring test against each entry's title and subtitle.
 */
export function SiteSearch({ entries, darkHeader }: { entries: SearchEntry[]; darkHeader?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // The header can paint itself dark (.header-dark redefines --surface etc.
  // for its subtree, see globals.css), which would otherwise leak into the
  // dialog since a native <dialog> still inherits CSS variables from its DOM
  // ancestors. Portal it to <body> so the search overlay always follows the
  // page's own theme, not the header panel's.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const results = useMemo(() => {
    const q = normalise(query.trim());
    if (!q) return [];
    return entries.filter((e) => normalise(e.title).includes(q) || (e.subtitle && normalise(e.subtitle).includes(q)));
  }, [entries, query]);

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    items: results.filter((e) => e.category === category).slice(0, MAX_RESULTS_PER_CATEGORY),
  })).filter((g) => g.items.length);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const goTo = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Søk"
        className={cn(
          "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-sunken hover:text-ink",
          darkHeader && "text-white/70 hover:bg-white/10 hover:text-white",
        )}
      >
        <Search aria-hidden className="size-[18px]" />
      </button>

      {mounted &&
        createPortal(
          <Dialog open={open} onClose={close} title="Søk" size="lg">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && results[0]) goTo(results[0].href);
              }}
              data-autofocus
              placeholder="Søk etter grupper, nyheter og sider …"
              aria-label="Søketekst"
              className="h-11 w-full rounded-md border border-line-strong bg-surface px-3.5 text-[16px] text-ink placeholder:text-ink-3 focus:border-focus focus:ring-[3px] focus:ring-focus/20 focus:outline-none"
            />

            {query.trim() && grouped.length === 0 && <EmptyState className="mt-4">Ingen treff for «{query.trim()}».</EmptyState>}

            {grouped.length > 0 && (
              <div className="mt-4 grid gap-5">
                {grouped.map((g) => (
                  <div key={g.category}>
                    <p className="mb-1.5 t-meta text-ink-3">{g.category}</p>
                    <ul className="-mx-2">
                      {g.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={close}
                            className="flex min-w-0 flex-col justify-center gap-0.5 rounded-md px-2 py-2 t-body text-ink transition-colors hover:bg-sunken"
                          >
                            <span className="truncate font-medium">
                              <HighlightedText text={item.title} query={query.trim()} />
                            </span>
                            {item.subtitle && <span className="truncate t-small text-ink-3">{item.subtitle}</span>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Dialog>,
          document.body,
        )}
    </>
  );
}
