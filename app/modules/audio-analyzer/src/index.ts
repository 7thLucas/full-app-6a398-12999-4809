// ─────────────────────────────────────────────────────────────────────────────
// Client-safe exports only.
//
// Server-only modules (controller, routes, audio-analyzer lib) must NOT be
// re-exported here. Import those directly on the server:
//
//   import audioAnalyzerRoutes from "~/modules/audio-analyzer/src/routes/audio-analyzer.routes";
//   import { audioAnalyzer } from "~/modules/audio-analyzer/src/libs/audio-analyzer";
// ─────────────────────────────────────────────────────────────────────────────

export * from "./hooks/use-transcribe";
export * from "./hooks/use-transcription-result";
export {
  TranscriptionResult,
  TranscriptionResultProvider,
  useTranscriptionResultContext,
} from "./components/transcription-result";
export { TranscriptionUpload } from "./components/transcription-upload";
export type { TranscriptionUploadProps } from "./components/transcription-upload";
export type {
  TranscriptionResultRootProps,
  TranscriptionResultContextValue,
} from "./components/transcription-result";
export type {
  AnalysisResult,
  CategoryEvaluation,
  ChatSegment,
  JobLogEntry,
  ResponseEnvelope,
  TrackTranscribeResult,
  TranscribeResult,
  TranscriptionAnalysisOptions,
  TranscriptionAnalysisPassSettings,
} from "./libs/types";
