import { EyeOff, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { Status } from "@/components/ui/primitives";
import { cn } from "@/lib/cn";
import type { PrivacyStatus as Status_ } from "@/lib/types";

/** Page header used across admin screens. */
export function AdminHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 pt-6 pb-6 sm:flex-row sm:items-end sm:justify-between md:pt-10", className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="text-[1.625rem] leading-tight font-semibold tracking-[-0.02em] md:text-[1.875rem]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[64ch] t-small text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className, id }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-lg border border-line bg-surface", className)}>
      {title && (
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
          <h2 id={id} className="t-label font-semibold">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function PrivacyStatusBadge({ status }: { status: Status_ }) {
  if (status === "anonymised")
    return (
      <Status tone="ink" icon={<ShieldCheck aria-hidden />}>
        Anonymisert
      </Status>
    );
  if (status === "restricted")
    return (
      <Status tone="warning" icon={<EyeOff aria-hidden />}>
        Ikke publiser
      </Status>
    );
  return <Status tone="neutral">Synlig</Status>;
}
