"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteSignupResponse } from "@/app/actions";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  name: string;
  email: string;
  phone: string;
  note: string;
  at: string;
}

/** The answers to a sign-up form, newest last, each with a delete that asks first. */
export function SignupAnswers({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (rows.length === 0) return <p className="p-5 t-small text-ink-2">Ingen har meldt seg på ennå.</p>;
  return (
    <>
      <ul className="divide-y divide-line">
        {rows.map((r) => (
          <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
            <div className="min-w-0 flex-1">
              <p className="t-label font-semibold">{r.name}</p>
              <p className="t-small text-ink-2">
                <a href={`mailto:${r.email}`} className="text-club hover:text-club-hover">
                  {r.email}
                </a>
                {r.phone && ` · ${r.phone}`}
              </p>
              {r.note && <p className="mt-1 t-small text-ink-2">{r.note}</p>}
              <p className="mt-1 t-meta text-ink-3">Meldt på {r.at}</p>
            </div>
            {confirm === r.id ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  className="max-sm:w-full"
                  onClick={() =>
                    start(async () => {
                      const res = await deleteSignupResponse(r.id);
                      setConfirm(null);
                      if (!res.ok) return setError(res.error);
                      router.refresh();
                    })
                  }
                >
                  Slett svaret
                </Button>
                <Button size="sm" variant="secondary" className="max-sm:w-full" onClick={() => setConfirm(null)}>
                  Behold
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" className="max-sm:w-full" onClick={() => setConfirm(r.id)}>
                Slett
              </Button>
            )}
          </li>
        ))}
      </ul>
      {error && (
        <p role="alert" className="px-5 pb-4 t-small text-danger">
          {error}
        </p>
      )}
    </>
  );
}
