import { Fragment } from "react";
import type { Inline } from "@/lib/types";

/**
 * Renders stored inline text. Mentions are plain text publicly — the link to
 * a person exists in data, not in the reader's view. Admin views can
 * highlight a person's mentions.
 */
export function Inlines({ content, highlight }: { content?: Inline[]; highlight?: string }) {
  if (!content) return null;
  return (
    <>
      {content.map((i, idx) =>
        i.type === "mention" && highlight && i.personId === highlight ? (
          <mark key={idx} className="rounded-xs bg-warning-surface px-0.5 text-ink ring-1 ring-warning/30">
            {i.text}
          </mark>
        ) : i.type === "link" ? (
          <a
            key={idx}
            href={i.href}
            {...(/^https?:/.test(i.href) ? { target: "_blank", rel: "noreferrer noopener" } : {})}
            className="link font-medium text-club"
          >
            {i.text}
          </a>
        ) : (
          <Fragment key={idx}>{i.text}</Fragment>
        ),
      )}
    </>
  );
}
