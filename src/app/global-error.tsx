"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * The last safety net: when the page itself breaks, say so in plain words and offer a retry, and report the error. It replaces the
 * root layout, so it carries its own html and body and no site styles.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <html lang="nb">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          padding: "1.5rem",
          background: "#faf9f6",
          color: "#15171b",
        }}
      >
        <main style={{ maxWidth: "32rem" }}>
          <h1 style={{ fontSize: "1.75rem", margin: "0 0 0.75rem" }}>Noe gikk galt</h1>
          <p style={{ lineHeight: 1.5, margin: "0 0 1.5rem" }}>Beklager, siden kunne ikke vises. Prøv igjen. Hvis feilen fortsetter, ta kontakt med klubben.</p>
          <button
            type="button"
            onClick={reset}
            style={{ font: "inherit", padding: "0.75rem 1.25rem", border: 0, borderRadius: "0.375rem", background: "#15171b", color: "#fff", cursor: "pointer" }}
          >
            Prøv igjen
          </button>
        </main>
      </body>
    </html>
  );
}
