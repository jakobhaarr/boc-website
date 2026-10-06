"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reviewPhoto } from "@/app/actions";
import { PeopleTagger, type TaggablePerson } from "@/components/admin/people-tagger";
import { PhotographerPicker } from "@/components/admin/photographer-picker";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { parseChoice, type PhotographerOption } from "@/lib/photo-meta";

/**
 * «Godkjenn» confirms the answers the uploader gave; «Rett» opens them for
 * correction (who took the picture, who is in it) and approves with the fix.
 * Either way the picture stays live: the check never takes it down.
 */
export function PhotoReviewActions({
  photoId,
  options,
  people,
  photographerKey,
  tagged,
  noPeople,
  clubName,
  heading,
}: {
  photoId: string;
  options: PhotographerOption[];
  /** The group's members, who can be ticked; left out for a picture of a place. */
  people?: TaggablePerson[];
  photographerKey: string;
  tagged: string[];
  noPeople: boolean;
  clubName: string;
  heading: string;
}) {
  const [editing, setEditing] = useState(false);
  const [photographer, setPhotographer] = useState(photographerKey);
  const [ids, setIds] = useState(tagged);
  const [none, setNone] = useState(noPeople);
  const [error, setError] = useState<string>();
  const [pending, start] = useTransition();
  const router = useRouter();

  const run = (edit?: Parameters<typeof reviewPhoto>[1]) =>
    start(async () => {
      setError(undefined);
      const res = await reviewPhoto(photoId, edit);
      if (!res.ok) return setError(res.error);
      announceChange();
      router.refresh();
      setEditing(false);
    });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" disabled={pending} onClick={() => run()}>
          {pending && !editing ? "Godkjenner …" : "Godkjenn"}
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={() => setEditing(true)}>
          Rett
        </Button>
      </div>
      {error && !editing && (
        <p role="alert" className="mt-2 t-small text-danger">
          {error}
        </p>
      )}
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        size="md"
        title="Rett og godkjenn"
        description={heading}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={pending}>
              Avbryt
            </Button>
            <Button disabled={pending || !parseChoice(photographer) || (!!people && ids.length === 0 && !none)} onClick={() => run({ photographer: parseChoice(photographer), tagged: ids, noPeople: none })}>
              {pending ? "Lagrer …" : "Lagre og godkjenn"}
            </Button>
          </>
        }
      >
        <div className="grid gap-6">
          <PhotographerPicker id={`rev-${photoId}-photographer`} options={options} value={photographer} onChange={setPhotographer} clubName={clubName} />
          {people && (
            <PeopleTagger
              idPrefix={`rev-${photoId}-tag`}
              people={people}
              tagged={ids}
              noPeople={none}
              allowRestricted={false}
              onChange={(next, noOne) => {
                setIds(next);
                setNone(noOne);
              }}
            />
          )}
          {error && (
            <p role="alert" className="t-small text-danger">
              {error}
            </p>
          )}
        </div>
      </Dialog>
    </>
  );
}
