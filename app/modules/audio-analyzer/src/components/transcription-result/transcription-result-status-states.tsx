import type { HTMLAttributes } from "react";
import { useTranscriptionResultContext } from "./context";
import { cn } from "./utils";

export function TranscriptionResultLoading({
  className,
  message = "Loading…",
  ...props
}: HTMLAttributes<HTMLDivElement> & { message?: string }) {
  const { isLoading, result } = useTranscriptionResultContext();

  if (!isLoading || result) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border bg-card p-8 text-center",
        className,
      )}
      {...props}
    >
      <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-foreground" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

export function TranscriptionResultError({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { error, refetch } = useTranscriptionResultContext();

  if (!error) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive",
        className,
      )}
      role="alert"
      {...props}
    >
      <p className="font-medium">Failed to load transcription</p>
      <p className="mt-1 text-sm">{error}</p>
      <button
        type="button"
        onClick={refetch}
        className="mt-3 rounded-md border border-current px-3 py-1.5 text-sm font-medium transition hover:bg-destructive/10"
      >
        Retry
      </button>
    </div>
  );
}
