"use client";

import { useState, useTransition } from "react";
import { resendConsentRequest } from "@/app/actions";
import { Button } from "@/components/ui/button";

/** Sends a consent request again. The answer is the person's own, on the page the mail links to. */
export function ConsentResend({ requestId }: { requestId: string }) {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await resendConsentRequest(requestId);
            setMessage(res.ok ? { ok: true, text: "Sendt på nytt" } : { ok: false, text: res.error });
          })
        }
      >
        {pending ? "Sender …" : "Send på nytt"}
      </Button>
      {message && (
        <span role={message.ok ? "status" : "alert"} className={message.ok ? "t-small text-ink-2" : "t-small text-danger"}>
          {message.text}
        </span>
      )}
    </span>
  );
}
