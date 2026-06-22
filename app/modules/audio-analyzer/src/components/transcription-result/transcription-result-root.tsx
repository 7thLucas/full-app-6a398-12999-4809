import type { HTMLAttributes, ReactNode } from "react";
import {
  TranscriptionResultProvider,
  useTranscriptionResultContext,
  type TranscriptionResultProviderProps,
} from "./context";
import { cn } from "./utils";

export type TranscriptionResultRootProps = Omit<
  TranscriptionResultProviderProps,
  "children"
> &
  HTMLAttributes<HTMLDivElement> & {
    children: ReactNode;
  };

export function TranscriptionResultRoot({
  ticketId,
  pollIntervalMs,
  enabled,
  className,
  children,
  ...props
}: TranscriptionResultRootProps) {
  return (
    <TranscriptionResultProvider
      ticketId={ticketId}
      pollIntervalMs={pollIntervalMs}
      enabled={enabled}
    >
      <div className={cn("w-full", className)} {...props}>
        {children}
      </div>
    </TranscriptionResultProvider>
  );
}

export function TranscriptionResultContent({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { result, isLoading, error } = useTranscriptionResultContext();

  if (isLoading || error || !result) {
    return null;
  }

  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}
