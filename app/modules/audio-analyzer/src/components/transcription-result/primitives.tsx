import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./utils";

export function EmptyState({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground", className)}>
      {message}
    </div>
  );
}

export function TimestampBadge({
  label,
  onClick,
  className,
}: {
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border bg-background px-2.5 py-1 font-mono text-xs font-medium transition hover:bg-muted",
        className,
      )}
    >
      {label}
    </button>
  );
}

export function Section({
  title,
  description,
  action,
  children,
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border bg-card text-card-foreground shadow-sm", className)} {...props}>
      {(title || description || action) && (
        <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
          <div>
            {title && <h3 className="font-semibold">{title}</h3>}
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Collapsible({
  defaultOpen = false,
  className,
  children,
  ...props
}: Omit<HTMLAttributes<HTMLDetailsElement>, "open"> & {
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  return (
    <details
      className={cn("group rounded-xl border bg-card shadow-sm", className)}
      ref={(node) => {
        if (node && defaultOpen) {
          node.open = true;
        }
      }}
      {...props}
    >
      {children}
    </details>
  );
}

export function CollapsibleTrigger({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <summary
      className={cn(
        "flex cursor-pointer list-none items-start gap-3 p-4 marker:content-none [&::-webkit-details-marker]:hidden",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronIcon className="mt-1 shrink-0 text-muted-foreground transition group-open:rotate-180" />
    </summary>
  );
}

export function CollapsibleContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={cn("space-y-4 border-t px-4 pb-4 pt-4", className)} {...props}>
      {children}
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn("h-4 w-4", className)}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}
