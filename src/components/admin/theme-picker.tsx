"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setClubTheme } from "@/app/actions";
import { ClubCrest } from "@/components/public/crest";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { contrastRatio, themeStyle } from "@/lib/theme";
import type { ClubTheme } from "@/lib/types";

export function ThemePicker({ themes, activeId, clubName, letters }: { themes: ClubTheme[]; activeId: string; clubName: string; letters: string }) {
  const [selectedId, setSelectedId] = useState(activeId);
  const [pending, start] = useTransition();
  const router = useRouter();
  const selected = themes.find((t) => t.id === selectedId) ?? themes[0];
  const ratio = contrastRatio(selected.primary, selected.onPrimary);

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div role="radiogroup" aria-label="Fargetema" className="grid gap-2">
        {themes.map((t) => (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={t.id === selectedId}
            onClick={() => setSelectedId(t.id)}
            className={cn(
              "flex items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors",
              t.id === selectedId ? "border-ink bg-surface" : "border-line hover:border-line-strong",
            )}
          >
            <span className="flex overflow-hidden rounded-sm ring-1 ring-black/10" aria-hidden>
              <span className="size-6" style={{ background: t.primary }} />
              <span className="size-6" style={{ background: t.secondary }} />
              <span className="size-6" style={{ background: t.accent }} />
            </span>
            <span className="flex-1 t-label">{t.label}</span>
            {t.id === activeId && <span className="t-meta text-ink-3">I bruk</span>}
            {t.id === selectedId && <Check aria-hidden className="size-4" />}
          </button>
        ))}
      </div>

      <div>
        <div style={themeStyle(selected)} className="overflow-hidden rounded-md border border-line bg-[#faf9f6] text-[#15171b]">
          <div className="flex items-center gap-2 border-b border-[#e4e2dc] px-4 py-3">
            <ClubCrest letters={letters} className="h-7 w-auto" />
            <span className="font-display text-[15px] font-semibold">{clubName}</span>
            <span className="ml-auto rounded-md px-2.5 py-1 text-[12px] font-medium" style={{ background: selected.primary, color: selected.onPrimary }}>
              Bli med
            </span>
          </div>
          <div className="px-4 py-4">
            <p className="text-[12px] font-semibold" style={{ color: selected.primary }}>
              Fotball · J16-2
            </p>
            <p className="mt-1 font-display text-[20px] leading-tight font-semibold">Seier i siste serierunde</p>
            <div className="mt-3 flex items-center justify-between border-y border-[#e4e2dc] py-2 text-[13px]">
              <span className="font-semibold">18.00 J16-2 – Lyn</span>
              <span style={{ color: selected.primary }} className="font-semibold">
                Kamp
              </span>
            </div>
          </div>
          <div className="px-4 py-3 text-[12px]" style={{ background: selected.secondary, color: selected.onSecondary }}>
            Finn en gruppe <span style={{ color: selected.accent }}>· Prøv gratis</span>
          </div>
        </div>
        <p className={cn("mt-2 t-small", ratio >= 4.5 ? "text-ink-3" : "text-danger")}>
          Kontrast mellom knappetekst og primærfarge: {String(ratio).replace(".", ",")}:1 {ratio >= 4.5 ? "— oppfyller WCAG AA" : "— for lav"}
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            disabled={pending || selectedId === activeId}
            onClick={() =>
              start(async () => {
                await setClubTheme(selectedId);
                announceChange();
                router.refresh();
              })
            }
          >
            {pending ? "Lagrer …" : "Bruk på nettsiden"}
          </Button>
          {selectedId !== activeId && (
            <Button variant="ghost" onClick={() => setSelectedId(activeId)}>
              Tilbake
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
