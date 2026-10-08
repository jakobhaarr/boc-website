"use client";

import { Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Print or save the access report as a PDF (the browser's own print dialog), or take it as a data file. */
export function ReportActions({ dataHref }: { dataHref: string | null }) {
  return (
    <div className="no-print flex flex-col gap-3 sm:flex-row">
      <Button type="button" onClick={() => window.print()}>
        <Printer aria-hidden className="size-4" />
        Skriv ut eller lagre som PDF
      </Button>
      {dataHref && (
      <a href={dataHref} download className="inline-flex h-12 items-center justify-center gap-1.5 rounded-[var(--radius-button)] px-5 t-small font-medium text-ink shadow-[inset_0_0_0_1px_var(--border-strong)] hover:bg-sunken">
        <Download aria-hidden className="size-4" />
        Last ned som datafil (JSON)
      </a>
      )}
    </div>
  );
}
