"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { completePrivacyContact } from "@/app/actions";
import { Button } from "@/components/ui/button";

/** «Merk som behandlet» for one message from the privacy form. */
export function CompleteContact({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await completePrivacyContact(id);
            if (!res.ok) return setError(res.error);
            router.refresh();
          })
        }
      >
        {pending ? "Lagrer …" : "Merk som behandlet"}
      </Button>
      {error && <span className="t-small text-danger">{error}</span>}
    </div>
  );
}
