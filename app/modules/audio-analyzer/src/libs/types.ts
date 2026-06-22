import type { Readable } from "node:stream";

export interface ResponseEnvelope<T> {
  message: string;
  result: T;
  status: string;
}

export interface JobLogEntry {
  message: string;
  at: string;
}

export interface TranscribeResult {
  ticket_id: string;
}

export interface AnalysisMetricRule {
  id: string;
  title: string;
  rule: string;
  params?: Record<string, string>;
}

export interface ChunkingOptions {
  enabled?: boolean;
  gap_threshold_ms?: number;
  silence_event_ms?: number;
  min_chunk_segments?: number;
  companion_gap_ms?: number;
  min_gap_after_farewell_ms?: number;
  min_segments_before_greeting?: number;
  dominant_speaker_count?: number;
  greeting_patterns?: string[];
  farewell_patterns?: string[];
  use_candidate_splits?: boolean;
  confirmed_splits?: number[] | null;
  evaluate_per_chunk?: boolean;
}

export interface NoiseFilterPassSettings {
  enabled?: boolean;
  noise_patterns?: string[];
  prefix_patterns?: string[];
  artifact_pattern?: string | null;
  dash_pattern?: string | null;
}

export interface EchoDedupPassSettings {
  enabled?: boolean;
  similarity_threshold?: number;
}

export interface ChunkBoundaryPassSettings {
  primary_speaker_ids?: string[] | null;
}

export interface SessionChunkPassSettings {
  primary_speaker_ids?: string[] | null;
}

export interface SpeakerRolePassSettings {
  stat_patterns?: Record<string, string> | null;
  system_prompt?: string | null;
  user_prompt_template?: string | null;
  fallback_speaker_id?: string;
  model?: string | null;
}

export interface CategoryEvaluationPassSettings {
  base_score?: number;
  model?: string | null;
  empty_label?: string;
}

export interface OverallSummaryPassSettings {
  model?: string | null;
  empty_label?: string;
  fallback_summary?: string;
}

export interface TranscriptionAnalysisPassSettings {
  noise_filter?: NoiseFilterPassSettings;
  echo_dedup?: EchoDedupPassSettings;
  chunk_boundary?: ChunkBoundaryPassSettings;
  session_chunk?: SessionChunkPassSettings;
  speaker_role?: SpeakerRolePassSettings;
  category_evaluation?: CategoryEvaluationPassSettings;
  overall_summary?: OverallSummaryPassSettings;
}

/** Matches server `TranscriptionAnalysisOptions` (all fields optional when submitting partial overrides). */
export interface TranscriptionAnalysisOptions {
  context?: string;
  speaker_roles?: string[];
  primary_role?: string;
  default_role?: string;
  role_display?: Record<string, string>;
  scoring_rules?: AnalysisMetricRule[];
  category_evaluation_system_prompt?: string;
  overall_summary_system_prompt?: string;
  overall_summary_instructions?: string;
  chunking?: ChunkingOptions;
  pass_settings?: TranscriptionAnalysisPassSettings;
}

export interface TrackTranscribeResult {
  ticket_id: string;
  status: string | null;
  stage: string | null;
  transcript_path?: string | null;
  analysis_path?: string | null;
  analysis_options?: TranscriptionAnalysisOptions | null;
  audio_urls: string[];
  video_urls: string[];
  analysis: AnalysisResult | null;
  logs: JobLogEntry[];
}

export interface ChatSegment {
  speaker_id: string;
  text: string;
  start_ms: number;
  end_ms: number;
  speaker_name?: string | null;
  start_time?: string;
  end_time?: string;
  duration_ms?: number;
  speaker?: string;
  raw_text?: string;
  original_speaker?: string;
  addressee?: string;
}

export interface AnalyzeMetric {
  title: string;
  id: string;
  value: string;
  description: string;
}

export interface SilenceEvent {
  start_ms?: number;
  end_ms?: number;
  start_time?: string;
  end_time?: string;
  duration_ms?: number;
  context?: string;
  is_boundary_silence?: boolean;
  staff_communicated_wait?: boolean;
  is_colleague_silence?: boolean;
}

export interface SessionChunk {
  chunk_index: number;
  start_ms: number;
  end_ms: number;
  duration_ms: number;
  segments: ChatSegment[];
  reason?: string;
  context_summary?: string;
  silence_events?: SilenceEvent[];
}

export interface CategoryFinding {
  description: string;
  category?: string | null;
  segment_ids?: number[];
  start_ms?: number | null;
  end_ms?: number | null;
}

export interface CategoryIssue extends CategoryFinding {
  id?: string;
  penalty_points?: number;
  severity?: string | null;
  start_time?: string;
  end_time?: string;
}

export interface CategoryStrength extends CategoryFinding {
  id?: string;
  start_time?: string;
  end_time?: string;
}

export interface CategoryEvaluation {
  category_id: string;
  title: string;
  chunk_index?: number | null;
  score?: number | null;
  summary?: string;
  issues?: CategoryIssue[];
  strengths?: CategoryStrength[];
  references?: string[];
}

export interface CategoryScore {
  score?: number | null;
  summary?: string;
  issues?: CategoryIssue[];
  strengths?: CategoryStrength[];
  references?: string[];
}

export interface AnalysisChunk {
  chunk_index: number | null;
  context_summary?: string;
  start_ts?: string;
  end_ts?: string;
  duration_ms?: number;
  chunk_score?: number | null;
  evaluable?: boolean;
  turns?: ChatSegment[];
  category_scores?: Record<string, CategoryScore>;
  issues?: CategoryIssue[];
  strengths?: CategoryStrength[];
  silence_events?: SilenceEvent[];
}

/** Parsed analysis payload from `GET /transcribe/{ticket_id}`. */
export interface AnalysisResult {
  metrics?: AnalyzeMetric[];
  segments?: ChatSegment[];
  summary?: string;
  silence_events?: SilenceEvent[];
  session_chunks?: SessionChunk[];
  chunk_candidate_splits?: number[];
  category_evaluations?: CategoryEvaluation[];
  chunks?: AnalysisChunk[];
  overall_strengths?: CategoryStrength[];
  recommendations_text?: string;
  status?: string;
}

export type TranscribeFileInput =
  | File
  | Blob
  | {
      filename: string;
      data: Buffer | Uint8Array | ArrayBuffer;
      mimeType?: string;
    };

export type TranscribeOptions = {
  analysis_options?: TranscriptionAnalysisOptions;
  product_keyspace?: string;
  product_default_user_id?: string;
  dashboard_api_url?: string;
  signal?: AbortSignal;
};

export type RequestInitWithSignal = Pick<RequestInit, "signal">;

export type AssetResult = {
  stream: Readable;
  contentType: string | null;
  contentLength: string | null;
};
