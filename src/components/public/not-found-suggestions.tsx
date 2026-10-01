"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { SearchEntry } from "@/lib/search";

const normalise = (s: string) => s.toLocaleLowerCase("nb");

/**
 * «Kanskje du lette etter»: pages whose title or address shares words with the
 * address that was not found, from the same index the site search uses. A
 * renamed group or an old link usually still matches on a word or two, which
 * turns a dead end into one click. Nothing is shown when nothing matches.
 */
export function NotFoundSuggestions({ entries }: { entries: SearchEntry[] }) {
  const pathname = usePathname();
  const suggestions = useMemo(() => {
    // Words of three letters or more, and numbers of any length: «boc-2» must find BOC 2, not just BOC 1.
    const words = [...new Set(normalise(decodeURIComponent(pathname)).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 || /^\p{N}+$/u.test(w)))];
    if (!words.length) return [];
    const hits = (haystack: string, word: string) =>
      /^\p{N}+$/u.test(word) ? new RegExp(`(^|[^\\p{N}])${word}([^\\p{N}]|$)`, "u").test(haystack) : haystack.includes(word);
    return entries
      .filter((e) => e.href !== "/")
      .map((e) => {
        const haystack = normalise(`${e.title} ${e.href}`);
        return { entry: e, score: words.filter((w) => hits(haystack, w)).length };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.entry.title.localeCompare(b.entry.title, "nb"))
      .slice(0, 3)
      .map((x) => x.entry);
  }, [entries, pathname]);

  if (!suggestions.length) return null;
  return (
    <section aria-labelledby="mente-du" className="mt-12 max-w-[34rem]">
      <h2 id="mente-du" className="t-meta font-semibold text-ink-3">
        Kanskje du lette etter
      </h2>
      <ul className="mt-2 divide-y divide-line border-y border-line">
        {suggestions.map((s) => (
          <li key={s.id}>
            <Link href={s.href} className="group flex items-center justify-between gap-4 py-3 transition-colors hover:text-club">
              <span className="min-w-0">
                <span className="block text-[16px] leading-6 font-semibold tracking-[-0.01em]">{s.title}</span>
                {s.subtitle && <span className="block truncate t-small text-ink-3">{s.subtitle}</span>}
              </span>
              <ArrowRight aria-hidden className="size-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
