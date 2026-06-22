import { useCallback, useState } from "react";
import { queueTranscription } from "../libs/audio-analyzer.client";
import type { TranscribeResult, TranscriptionAnalysisOptions } from "../libs/types";

export type SubmitTranscriptionInput = {
  files: File | File[];
  analysis_options?: TranscriptionAnalysisOptions;
  signal?: AbortSignal;
};

export type UseTranscribeState = {
  ticketId: string | null;
  isSubmitting: boolean;
  error: string | null;
  submit: (input: SubmitTranscriptionInput) => Promise<TranscribeResult>;
  reset: () => void;
};

export function useTranscribe(): UseTranscribeState {
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: SubmitTranscriptionInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await queueTranscription(input.files, {
        analysis_options: input.analysis_options,
        signal: input.signal,
      });
      setTicketId(result.ticket_id);
      return result;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to queue transcription";
      setError(message);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const reset = useCallback(() => {
    setTicketId(null);
    setError(null);
  }, []);

  return {
    ticketId,
    isSubmitting,
    error,
    submit,
    reset,
  };
}
