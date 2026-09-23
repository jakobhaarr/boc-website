"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Native <dialog> with showModal(): focus trapping, Escape and inert
 * background come from the platform. On narrow screens it docks to the
 * bottom as a sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  tone = "default",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  dismissible?: boolean;
  tone?: "default" | "danger";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) {
      el.showModal();
      // showModal() focuses the first control (the close button); prefer the
      // field the content marks as primary.
      el.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto w-full max-w-none rounded-t-lg bg-surface p-0 text-ink shadow-dialog backdrop:bg-transparent open:anim-sheet",
        "sm:m-auto sm:rounded-lg sm:open:anim-dialog",
        size === "sm" && "sm:max-w-[420px]",
        size === "md" && "sm:max-w-[560px]",
        size === "lg" && "sm:max-w-[760px]",
      )}
    >
      {open && (
        <div className="flex max-h-[88dvh] flex-col">
          <div className={cn("flex items-start gap-4 border-b border-line px-5 pt-5 pb-4 sm:px-6", tone === "danger" && "border-danger/25")}>
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="t-h3">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 t-small text-ink-2">
                  {description}
                </p>
              )}
            </div>
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Lukk"
                className="-mt-1 -mr-2 inline-flex size-9 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-sunken hover:text-ink"
              >
                <X className="size-[18px]" />
              </button>
            )}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
