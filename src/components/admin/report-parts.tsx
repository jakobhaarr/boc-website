import type { ReactNode } from "react";

/** A titled block of an access report; an empty one says so instead of standing blank. */
export const ReportSection = ({ title, empty, children }: { title: string; empty?: string; children?: ReactNode }) => (
  <section className="break-inside-avoid border-t border-line pt-5">
    <h2 className="t-h3">{title}</h2>
    <div className="mt-3 grid gap-2 t-body text-ink-2">{children || <p className="text-ink-3">{empty}</p>}</div>
  </section>
);

/** A label and its value in an access report; nothing at all when there is no value. */
export const ReportRow = ({ label, value }: { label: string; value?: ReactNode }) =>
  value ? (
    <div className="grid gap-x-4 sm:grid-cols-[14rem_minmax(0,1fr)]">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  ) : null;
