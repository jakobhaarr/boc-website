import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Panel } from "@/components/admin/bits";
import { formatDayMonth } from "@/lib/dates";
import { loadAdmin } from "@/lib/data/queries";
import { TOPIC_LABEL } from "@/lib/leader-tasks";
import { isClubAdmin, scopeSummary } from "@/lib/permissions";

export const metadata: Metadata = { title: "Tilbakemeldinger", robots: { index: false, follow: false } };

/**
 * TEMPORARY (lib/leader-tasks.ts): everything the users have sent from «Tilbakemelding» in admin, newest first, by
 * person, with their group. Not linked from anywhere; only a club administrator sees it, everyone else gets «ikke funnet».
 */
export default async function FeedbackOverview() {
  const { db, org, user } = await loadAdmin();
  if (!isClubAdmin(user)) notFound();
  const all = [...db.feedback].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const writers = new Set(all.map((f) => f.userId)).size;
  return (
    <div className="theme-admin min-h-dvh bg-bg text-ink">
      <div className="page pt-8 pb-16">
        <h1 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] md:text-[1.875rem]">Tilbakemeldinger</h1>
        <p className="mt-1.5 t-small text-ink-2">
          {all.length} fra {writers} {writers === 1 ? "bruker" : "brukere"}.
        </p>
        <div className="mt-6 max-w-3xl">
          <Panel>
            {all.length === 0 ? (
              <p className="px-4 py-5 t-small text-ink-2 sm:px-5">Ingen har sendt noe ennå.</p>
            ) : (
              <ul className="divide-y divide-line">
                {all.map((f) => {
                  const who = db.users.find((u) => u.id === f.userId);
                  const scope = who ? scopeSummary(who, org) : undefined;
                  return (
                    <li key={f.id} className="px-4 py-4 sm:px-5">
                      <p className="t-label font-semibold">{who?.name ?? "Ukjent bruker"}</p>
                      <p className="mt-0.5 t-meta text-ink-3">
                        {scope ? `${scope.role} · ${scope.scope} · ` : ""}
                        {formatDayMonth(f.createdAt.slice(0, 10))} kl. {f.createdAt.slice(11, 16)}
                        {f.updatedAt && " · endret"}
                      </p>
                      <p className="mt-2 t-meta font-medium text-ink-2">{TOPIC_LABEL[f.topic]}</p>
                      <p className="mt-1 whitespace-pre-wrap t-small text-ink">{f.message}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
