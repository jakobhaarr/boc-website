"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePhotoForGood, hidePhoto, showPhotoAgain } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";

/**
 * What can be done with a picture in the privacy check: hide it from the site, show it again (refused while someone in it may
 * not be shown), or delete it for good (out of every page, and the file out of the bucket), which asks first.
 */
export function PhotoCheckActions({ photoId, hidden, afterDelete }: { photoId: string; hidden: boolean; /** Where to go once the picture is deleted (its own page is then gone). */ afterDelete?: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const del = () => deletePhotoForGood(photoId);
  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) return setError(res.error);
      setConfirming(false);
      announceChange();
      if (afterDelete && fn === del) return router.push(afterDelete);
      router.refresh();
    });

  if (confirming)
    return (
      <div className="grid max-w-[14rem] gap-1.5">
        <p className="t-small text-ink-2">Slette bildet for godt? Det tas bort fra alle sider, og kan ikke angres.</p>
        <div className="flex gap-1">
          <Button size="sm" variant="danger" disabled={pending} onClick={() => run(del)}>
            Slett
          </Button>
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
            Behold
          </Button>
        </div>
        {error && (
          <p role="alert" className="t-small text-danger">
            {error}
          </p>
        )}
      </div>
    );

  return (
    <div className="grid max-w-[14rem] justify-items-start gap-1">
      <div className="flex flex-wrap gap-1">
        {hidden ? (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => showPhotoAgain(photoId))}>
            Vis igjen
          </Button>
        ) : (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => hidePhoto(photoId, "Skjult av klubbadministrator"))}>
            Skjul
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(true)}>
          Slett
        </Button>
      </div>
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
