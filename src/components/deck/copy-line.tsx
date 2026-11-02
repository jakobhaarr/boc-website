"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
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
  const textId = useId();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // No clipboard access (an insecure address, an old browser): select the text so Cmd/Ctrl + C is one key away.
      const range = document.createRange();
      const node = document.getElementById(textId);
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
    <div className={cn("relative z-10 flex flex-col gap-4 rounded-lg bg-surface p-4 ring-1 ring-line sm:flex-row sm:items-center sm:gap-6 sm:py-3 sm:pr-3 sm:pl-6", className)}>
      <p id={textId} className="min-w-0 flex-1 text-[17px] leading-[1.35] select-text sm:text-[22px] sm:leading-[1.3]">
        {text}
      </p>
      <button
        type="button"
        onClick={copy}
        className="flex min-h-[52px] w-full shrink-0 items-center justify-center gap-2.5 rounded-md bg-[var(--club-primary)] px-5 py-3 text-[17px] font-semibold text-[var(--club-on-primary)] sm:min-h-0 sm:w-auto sm:text-[20px]"
      >
        {copied ? <Check aria-hidden className="size-5" /> : <Copy aria-hidden className="size-5" />}
        <span aria-live="polite">{copied ? "Kopiert" : "Kopier"}</span>
      </button>
    </div>
  );
}
