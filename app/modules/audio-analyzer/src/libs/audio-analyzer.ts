import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { Readable } from "node:stream";
import { singleton } from "../utils";
import type {
  ResponseEnvelope,
  TrackTranscribeResult,
  TranscribeFileInput,
  TranscribeOptions,
  TranscribeResult,
  RequestInitWithSignal,
  AssetResult,
} from "./types";

export type AudioAnalyzerOptions = {
  /** Base URL with no trailing slash, e.g. `http://localhost:4000` */
  host: string;
};

export class AudioAnalyzerError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "AudioAnalyzerError";
  }
}

export class AudioAnalyzer {
  private readonly host: string;

  constructor(options: AudioAnalyzerOptions) {
    this.host = options.host;
  }

  private joinUrl(path: string): string {
    const p = path.startsWith("/") ? path : `/${path}`;
    const b = this.host.endsWith("/") ? this.host.slice(0, -1) : this.host;
    return `${b}${p}`;
  }

  private async readJsonBody(res: Response): Promise<unknown> {
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

  private messageFromBody(status: number, body: unknown): string {
    if (body && typeof body === "object" && "detail" in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail)) {
        return detail.map(String).join("; ");
      }
    }
    if (typeof body === "string" && body) {
      return body;
    }
    return `Request failed with status ${status}`;
  }

  private toBlob(file: TranscribeFileInput): Blob {
    if (file instanceof Blob) {
      return file;
    }
    const part: BlobPart =
      file.data instanceof ArrayBuffer ? file.data : Uint8Array.from(file.data);
    return new Blob([part], { type: file.mimeType ?? "application/octet-stream" });
  }

  private filenameFor(file: TranscribeFileInput, index: number): string {
    if (file instanceof File) {
      return file.name;
    }
    if (file instanceof Blob) {
      return `upload-${index}`;
    }
    return file.filename;
  }

  private async parseEnvelope<T>(res: Response): Promise<ResponseEnvelope<T>> {
    const body = await this.readJsonBody(res);
    if (!res.ok) {
      throw new AudioAnalyzerError(this.messageFromBody(res.status, body), res.status, body);
    }
    return body as ResponseEnvelope<T>;
  }

  /** GET /healthcheck — verify connectivity to the audio analyzer service. */
  async ping(init?: RequestInitWithSignal): Promise<ResponseEnvelope<{ healthy: string }>> {
    const res = await fetch(this.joinUrl("/healthcheck"), { signal: init?.signal });
    return this.parseEnvelope(res);
  }

  /**
   * POST /transcribe — queue audio/video files for transcription and analysis.
   */
  async transcribe(
    files: TranscribeFileInput | TranscribeFileInput[],
    options?: TranscribeOptions,
  ): Promise<ResponseEnvelope<TranscribeResult>> {
    const formData = new FormData();
    const list = Array.isArray(files) ? files : [files];

    list.forEach((file, index) => {
      const blob = this.toBlob(file);
      formData.append("files", blob, this.filenameFor(file, index));
    });

    if (options?.analysis_options !== undefined) {
      formData.append("analysis_options", JSON.stringify(options.analysis_options));
    }

    if (options?.product_keyspace) {
      formData.append("product_keyspace", options.product_keyspace);
    }

    if (options?.product_default_user_id) {
      formData.append("product_default_user_id", options.product_default_user_id);
    }

    if (options?.dashboard_api_url) {
      formData.append("dashboard_api_url", options.dashboard_api_url);
    }

    const res = await fetch(this.joinUrl("/transcribe"), {
      method: "POST",
      body: formData,
      signal: options?.signal,
    });

    return this.parseEnvelope(res);
  }

  /**
   * GET /transcribe/{ticket_id} — track job status, URLs, analysis, and logs.
   */
  async trackTranscribe(
    ticketId: string,
    init?: RequestInitWithSignal,
  ): Promise<ResponseEnvelope<TrackTranscribeResult>> {
    const res = await fetch(
      this.joinUrl(`/transcribe/${encodeURIComponent(ticketId)}`),
      { signal: init?.signal },
    );
    return this.parseEnvelope(res);
  }

  /**
   * GET /assets/{ticket_id}/{filename} — download a stored audio or video asset.
   */
  async getAsset(
    ticketId: string,
    filename: string,
    init?: RequestInitWithSignal,
  ): Promise<AssetResult> {
    const res = await fetch(
      this.joinUrl(
        `/assets/${encodeURIComponent(ticketId)}/${encodeURIComponent(filename)}`,
      ),
      { signal: init?.signal },
    );

    if (!res.ok) {
      const body = await this.readJsonBody(res);
      throw new AudioAnalyzerError(this.messageFromBody(res.status, body), res.status, body);
    }

    if (!res.body) {
      throw new AudioAnalyzerError("Empty asset response body", 502, null);
    }

    return {
      stream: Readable.fromWeb(res.body as unknown as NodeReadableStream),
      contentType: res.headers.get("content-type"),
      contentLength: res.headers.get("content-length"),
    };
  }

  /** Convenience: returns `result` from {@link transcribe}. */
  async submitTranscription(
    files: TranscribeFileInput | TranscribeFileInput[],
    options?: TranscribeOptions,
  ): Promise<TranscribeResult> {
    const envelope = await this.transcribe(files, options);
    return envelope.result;
  }

  /** Convenience: returns `result` from {@link trackTranscribe}. */
  async getTranscriptionStatus(
    ticketId: string,
    init?: RequestInitWithSignal,
  ): Promise<TrackTranscribeResult> {
    const envelope = await this.trackTranscribe(ticketId, init);
    return envelope.result;
  }
}

export const audioAnalyzer = singleton<AudioAnalyzer>("audioAnalyzer", () => {
  return new AudioAnalyzer({
    // using cluster ip
    host: "http://172.20.15.26",
  });
});

export type {
  ResponseEnvelope,
  TrackTranscribeResult,
  AnalysisResult,
  CategoryEvaluation,
  ChatSegment,
  TranscribeFileInput,
  TranscribeOptions,
  TranscribeResult,
  TranscriptionAnalysisOptions,
  TranscriptionAnalysisPassSettings,
  AnalysisMetricRule,
  ChunkingOptions,
  JobLogEntry,
  RequestInitWithSignal,
  AssetResult,
} from "./types";
