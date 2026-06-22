import type {
  ResponseEnvelope,
  TrackTranscribeResult,
  TranscribeResult,
  TranscriptionAnalysisOptions,
} from "./types";

export class AudioAnalyzerClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "AudioAnalyzerClientError";
  }
}

export type QueueTranscriptionOptions = {
  analysis_options?: TranscriptionAnalysisOptions;
  signal?: AbortSignal;
};

async function readJsonBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function messageFromBody(status: number, body: unknown): string {
  if (body && typeof body === "object") {
    if ("message" in body && typeof (body as { message: unknown }).message === "string") {
      return (body as { message: string }).message;
    }
    if ("detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail.map(String).join("; ");
      }
    }
  }
  if (typeof body === "string" && body) {
    return body;
  }
  return `Request failed with status ${status}`;
}

async function parseEnvelope<T>(res: Response): Promise<ResponseEnvelope<T>> {
  const body = await readJsonBody(res);
  if (!res.ok) {
    throw new AudioAnalyzerClientError(messageFromBody(res.status, body), res.status, body);
  }
  return body as ResponseEnvelope<T>;
}

/** POST /api/audio-analyzer/transcribe — queue files for transcription. */
export async function queueTranscription(
  files: File | File[],
  options?: QueueTranscriptionOptions,
): Promise<TranscribeResult> {
  const formData = new FormData();
  const list = Array.isArray(files) ? files : [files];

  for (const file of list) {
    formData.append("files", file);
  }

  if (options?.analysis_options !== undefined) {
    formData.append("analysis_options", JSON.stringify(options.analysis_options));
  }

  const res = await fetch("/api/audio-analyzer/transcribe", {
    method: "POST",
    body: formData,
    signal: options?.signal,
  });

  const envelope = await parseEnvelope<TranscribeResult>(res);
  return envelope.result;
}

/** GET /api/audio-analyzer/transcribe/:ticketId — fetch job status. */
export async function getTranscriptionStatus(
  ticketId: string,
  init?: { signal?: AbortSignal },
): Promise<TrackTranscribeResult> {
  const res = await fetch(
    `/api/audio-analyzer/transcribe/${encodeURIComponent(ticketId)}`,
    { signal: init?.signal },
  );
  const envelope = await parseEnvelope<TrackTranscribeResult>(res);
  return envelope.result;
}
