"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

/** Start a post from the overview; continues in the full composer. */
export function QuickPublish({ targetId, targetName }: { targetId?: string; targetName?: string }) {
  const [text, setText] = useState("");
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (targetId) params.set("gruppe", targetId);
        if (text.trim()) params.set("tekst", text.trim());
        router.push(`/admin/publiser${params.size ? `?${params}` : ""}`);
      }}
      className="rounded-lg border border-line bg-surface p-4 transition-[border-color,box-shadow] focus-within:border-focus focus-within:ring-[3px] focus-within:ring-focus/15"
    >
      <label htmlFor="quick-publish" className="t-label font-semibold">
        Nytt innlegg
      </label>
      <textarea
        id="quick-publish"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Hva har skjedd?"
        className="mt-1.5 w-full resize-none bg-transparent text-[15px] leading-relaxed placeholder:text-ink-3 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-3">
        <span className="truncate t-small text-ink-3">{targetName ? `Til ${targetName}` : "Velg gruppe i neste steg"}</span>
        <Button type="submit" size="sm">
          Fortsett
        </Button>
      </div>
    </form>
  );
}
