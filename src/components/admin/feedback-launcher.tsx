"use client";

import { Check, MessageSquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NewFeedbackForm } from "@/components/admin/feedback-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/cn";

/**
 * TEMPORARY (lib/leader-tasks.ts): a button on every page in admin that opens the feedback form where the user is,
 * with the page's address sent along. Above the tab bar on a phone.
 */
export function FeedbackLauncher({ hidden }: { hidden?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const close = () => {
    setOpen(false);
    setSent(false);
  };
  return (
    <>
      {!hidden && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "fixed right-4 z-30 flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 t-label text-surface shadow-lg transition-opacity hover:opacity-90 max-md:bottom-[4.75rem] md:bottom-5",
          )}
        >
          <MessageSquare aria-hidden className="size-4" />
          Tilbakemelding
        </button>
      )}
      <Dialog open={open} onClose={close} title={sent ? "Takk for tilbakemeldingen" : "Gi tilbakemelding"} description={sent ? undefined : "Om siden du er på nå. Skjermbilder hjelper oss å forstå."} size="md">
        {sent ? (
          <div className="grid gap-4">
            <p className="flex items-center gap-2 t-small text-ink-2">
              <Check aria-hidden className="size-4 text-success" /> Den er sendt. Du kan sende flere, og se og endre dem under Tilbakemelding.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setSent(false)} className="max-sm:w-full">
                Send en til
              </Button>
              <Button variant="secondary" onClick={close} className="max-sm:w-full">
                Lukk
              </Button>
            </div>
          </div>
        ) : (
          open && <NewFeedbackForm page={pathname} onSent={() => setSent(true)} onCancel={close} />
        )}
      </Dialog>
    </>
  );
}
