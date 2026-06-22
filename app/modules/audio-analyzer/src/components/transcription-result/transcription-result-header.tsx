import type { HTMLAttributes, ReactNode } from "react";
import { useTranscriptionResultContext } from "./context";
import { cn } from "./utils";

export function TranscriptionResultHeader({
  className,
  title = "Transcription",
  description,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  title?: ReactNode;
  description?: ReactNode;
}) {
  const { ticketId } = useTranscriptionResultContext();

  return (
    <header
      className={cn("flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between", className)}
      {...props}
    >
      <div>
        {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
        {description ?? (
          <p className="mt-1 font-mono text-xs text-muted-foreground">{ticketId}</p>
        )}
      </div>
      {children}
    </header>
  );
}

export function TranscriptionResultStatus({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  const { result, isCompleted, isFailed } = useTranscriptionResultContext();
  const status = result?.status ?? "queued";

  const color = isCompleted
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
    : isFailed
      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200"
      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize",
        color,
        className,
      )}
      {...props}
    >
      {!isCompleted && !isFailed && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
      {status}
    </span>
  );
}

export function TranscriptionResultStage({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { result, isCompleted, isFailed } = useTranscriptionResultContext();

  if (!result?.stage || isCompleted || isFailed) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-muted/40 px-4 py-3 text-sm",
        className,
      )}
      {...props}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Current stage
      </p>
      <p className="mt-1 font-medium capitalize">{result.stage.replace(/_/g, " ")}</p>
    </div>
  );
}
