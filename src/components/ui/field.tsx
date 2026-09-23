import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

const control =
  "w-full rounded-md border border-line-strong bg-surface text-ink placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150 " +
  "hover:border-ink-3 focus:border-focus focus:outline-none focus:ring-[3px] focus:ring-focus/20 disabled:opacity-60 " +
  "aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
  optional,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
  optional?: boolean;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      <label htmlFor={htmlFor} className="t-label text-ink">
        {label}
        {optional && <span className="ml-1.5 font-normal text-ink-3">valgfritt</span>}
      </label>
      {children}
      {hint && !error && <p className="t-small text-ink-3">{hint}</p>}
      {error && (
        <p role="alert" className="t-small text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, "h-10 px-3 text-[15px] sm:text-sm", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "min-h-24 px-3 py-2.5 text-[15px] leading-relaxed sm:text-sm", className)} {...props} />;
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(control, "h-10 appearance-none pr-9 pl-3 text-[15px] sm:text-sm", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  );
}

export function Checkbox({ label, description, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; description?: ReactNode }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded-xs border-line-strong accent-[var(--action)]"
        {...props}
      />
      <span className="grid gap-0.5">
        <span className="t-small text-ink">{label}</span>
        {description && <span className="t-small text-ink-3">{description}</span>}
      </span>
    </label>
  );
}
