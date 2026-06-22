import { useCallback, useEffect, useState } from "react";
import { getTranscriptionStatus } from "../libs/audio-analyzer.client";
import type { TrackTranscribeResult } from "../libs/types";

const DEFAULT_POLL_INTERVAL_MS = 2000;
const TERMINAL_STATUSES = new Set(["completed", "failed"]);

export type UseTranscriptionResultOptions = {
  pollIntervalMs?: number;
  enabled?: boolean;
};

export type UseTranscriptionResultState = {
  ticketId: string;
  result: TrackTranscribeResult | null;
  error: string | null;
  isLoading: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  refetch: () => void;
};

export function useTranscriptionResult(
  ticketId: string,
  options: UseTranscriptionResultOptions = {},
): UseTranscriptionResultState {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const enabled = options.enabled ?? true;

  const [result, setResult] = useState<TrackTranscribeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollKey, setPollKey] = useState(0);

  const refetch = useCallback(() => {
    setPollKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (!enabled || !ticketId) {
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const data = await getTranscriptionStatus(ticketId);
        if (cancelled) {
          return;
        }
        setResult(data);
        setError(null);

        const status = data.status ?? "";
        if (!TERMINAL_STATUSES.has(status)) {
          timeoutId = setTimeout(poll, pollIntervalMs);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
      }
    };

    setResult(null);
    setError(null);
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [ticketId, pollKey, pollIntervalMs, enabled]);

  const status = result?.status ?? null;

  return {
    ticketId,
    result,
    error,
    isLoading: result === null && error === null,
    isCompleted: status === "completed",
    isFailed: status === "failed",
    refetch,
  };
}
