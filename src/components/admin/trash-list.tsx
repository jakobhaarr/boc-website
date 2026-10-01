"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { restoreDeletedArticle } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";

export interface TrashRow {
  auditId: string;
  title: string;
  where: string;
  deletedBy: string;
  deletedWhen: string;
  daysLeft: number;
}

/** Deleted articles, kept 30 days. «Gjenopprett» puts one back exactly as it was. */
export function TrashList({ rows }: { rows: TrashRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  if (!rows.length) return <p className="px-5 py-8 t-small text-ink-2">Ingen slettede innlegg. Det du sletter, ligger her i 30 dager før det er borte for godt.</p>;
  return (
    <>
      {error && (
        <p role="alert" className="border-b border-line px-5 py-3 t-small text-danger">
          {error}
        </p>
      )}
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.auditId} className="grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-6">
            <div className="min-w-0">
              <p className="t-label font-semibold">{r.title}</p>
              <p className="mt-0.5 t-small text-ink-3">
                {r.where} · slettet av {r.deletedBy}, {r.deletedWhen} · {r.daysLeft} {r.daysLeft === 1 ? "dag" : "dager"} igjen
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={pending}
              onClick={() =>
                start(async () => {
                  setError(null);
                  const res = await restoreDeletedArticle(r.auditId);
                  if (!res.ok) return setError(res.error);
                  announceChange();
                  router.refresh();
                })
              }
            >
              Gjenopprett
            </Button>
          </li>
        ))}
      </ul>
    </>
  );
}
