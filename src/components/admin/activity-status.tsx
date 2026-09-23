"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setActivityCancelled } from "@/app/actions";
import { announceChange } from "@/components/public/live-refresh";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";

export function ActivityStatusToggle({ activityId, cancelled, title }: { activityId: string; cancelled: boolean; title: string }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  const apply = (value: boolean) =>
    start(async () => {
      await setActivityCancelled(activityId, value, note);
      announceChange();
      setOpen(false);
      setNote("");
      router.refresh();
    });

  if (cancelled) {
    return (
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => apply(false)} className="justify-self-start md:justify-self-end">
        Gjenopprett
      </Button>
    );
  }

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} className="justify-self-start md:justify-self-end">
        Avlys
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        size="sm"
        title={`Avlys ${title.toLowerCase()}?`}
        description="Aktiviteten vises som avlyst på nettsiden. Gi gjerne en kort grunn."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Behold
            </Button>
            <Button variant="danger" disabled={pending} onClick={() => apply(true)}>
              Avlys aktiviteten
            </Button>
          </>
        }
      >
        <Field label="Grunn" htmlFor={`note-${activityId}`} optional>
          <Input id={`note-${activityId}`} data-autofocus value={note} onChange={(e) => setNote(e.target.value)} placeholder="For eksempel: Banen er stengt." />
        </Field>
      </Dialog>
    </>
  );
}
