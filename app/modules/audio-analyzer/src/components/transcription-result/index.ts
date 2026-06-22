import { TranscriptionResultRoot } from "./transcription-result-root";
import { TranscriptionResultContent } from "./transcription-result-root";
import {
  TranscriptionResultLoading,
  TranscriptionResultError,
} from "./transcription-result-status-states";
import {
  TranscriptionResultHeader,
  TranscriptionResultStatus,
  TranscriptionResultStage,
} from "./transcription-result-header";
import {
  TranscriptionResultScores,
  TranscriptionResultSummary,
} from "./transcription-result-scores";
import {
  TranscriptionResultIssues,
  TranscriptionResultStrengths,
} from "./transcription-result-issues";
import {
  TranscriptionResultLogs,
  TranscriptionResultMedia,
  TranscriptionResultTranscript,
} from "./transcription-result-media";

export {
  TranscriptionResultProvider,
  useTranscriptionResultContext,
} from "./context";

export type { TranscriptionResultRootProps } from "./transcription-result-root";
export type { TranscriptionResultContextValue } from "./context";

export const TranscriptionResult = Object.assign(TranscriptionResultRoot, {
  Root: TranscriptionResultRoot,
  Content: TranscriptionResultContent,
  Loading: TranscriptionResultLoading,
  Error: TranscriptionResultError,
  Header: TranscriptionResultHeader,
  Status: TranscriptionResultStatus,
  Stage: TranscriptionResultStage,
  Scores: TranscriptionResultScores,
  Summary: TranscriptionResultSummary,
  Issues: TranscriptionResultIssues,
  Strengths: TranscriptionResultStrengths,
  Logs: TranscriptionResultLogs,
  Media: TranscriptionResultMedia,
  Transcript: TranscriptionResultTranscript,
});
