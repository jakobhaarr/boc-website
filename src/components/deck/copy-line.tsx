"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A line of text with a «Kopier» button, for a deck that is shown while
 * someone pastes from it (the welcome message for the Zwift Meetup's chat).
 * It sits above the deck's click zones (`relative z-10`), so pressing it
 * copies instead of moving to the next slide. Select the text and copy with
 * Cmd or Ctrl + C works as well: the deck's keys ignore those.
 */
export function CopyLine({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // No clipboard access (an insecure address, an old browser): select the text so Cmd/Ctrl + C is one key away.
      const range = document.createRange();
      const node = document.getElementById("copy-line-text");
      if (node) {
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("relative z-10 flex items-center gap-6 rounded-lg bg-surface py-3 pr-3 pl-6 ring-1 ring-line", className)}>
      <p id="copy-line-text" className="min-w-0 flex-1 text-[22px] leading-[1.3] select-text">
        {text}
      </p>
      <button
        type="button"
        onClick={copy}
        className="flex shrink-0 items-center gap-2.5 rounded-md bg-[var(--club-primary)] px-5 py-3 text-[20px] font-semibold text-[var(--club-on-primary)]"
      >
        {copied ? <Check aria-hidden className="size-5" /> : <Copy aria-hidden className="size-5" />}
        <span aria-live="polite">{copied ? "Kopiert" : "Kopier"}</span>
      </button>
    </div>
  );
}
