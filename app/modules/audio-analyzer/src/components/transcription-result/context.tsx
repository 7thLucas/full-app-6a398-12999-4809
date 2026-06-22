import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useTranscriptionResult } from "../../hooks/use-transcription-result";
import type { ChatSegment, TrackTranscribeResult } from "../../libs/types";
import {
  ALL_CATEGORIES,
  average,
  buildChunkReviews,
  buildScoreCards,
  buildStrengths,
  collectSegmentsFromChunks,
  findSegmentIndexForTime,
  normalizeCategoryEvaluations,
  normalizeChunks,
  segmentDomKey,
  type ChunkReview,
  type ScoreCard,
} from "./utils";

export type TranscriptionResultContextValue = {
  ticketId: string;
  result: TrackTranscribeResult | null;
  error: string | null;
  isLoading: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  refetch: () => void;
  analysis: TrackTranscribeResult["analysis"];
  categoryEvaluations: ReturnType<typeof normalizeCategoryEvaluations>;
  scoreCards: ScoreCard[];
  overallScore: number | null;
  chunks: ReturnType<typeof normalizeChunks>;
  reviews: ChunkReview[];
  strengths: ReturnType<typeof buildStrengths>;
  transcriptSegments: ChatSegment[];
  hasMedia: boolean;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  filteredReviews: ChunkReview[];
  activeTimestampMs: number | null;
  seekToTimestamp: (ms: number) => void;
  primaryMediaRef: MutableRefObject<HTMLMediaElement | null>;
  segmentRefs: MutableRefObject<Record<string, HTMLElement | null>>;
  logsEndRef: MutableRefObject<HTMLDivElement | null>;
};

const TranscriptionResultContext =
  createContext<TranscriptionResultContextValue | null>(null);

export type TranscriptionResultProviderProps = {
  ticketId: string;
  pollIntervalMs?: number;
  enabled?: boolean;
  children: ReactNode;
};

export function TranscriptionResultProvider({
  ticketId,
  pollIntervalMs,
  enabled,
  children,
}: TranscriptionResultProviderProps) {
  const polling = useTranscriptionResult(ticketId, { pollIntervalMs, enabled });
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [activeTimestampMs, setActiveTimestampMs] = useState<number | null>(null);

  const logsEndRef = useRef<HTMLDivElement | null>(null) as MutableRefObject<HTMLDivElement | null>;
  const primaryMediaRef = useRef<HTMLMediaElement | null>(null) as MutableRefObject<HTMLMediaElement | null>;
  const segmentRefs = useRef<Record<string, HTMLElement | null>>({}) as MutableRefObject<
    Record<string, HTMLElement | null>
  >;

  const analysis = polling.result?.analysis ?? null;
  const categoryEvaluations = useMemo(
    () => normalizeCategoryEvaluations(analysis),
    [analysis],
  );
  const scoreCards = useMemo(
    () => buildScoreCards(categoryEvaluations),
    [categoryEvaluations],
  );
  const overallScore = useMemo(
    () => average(scoreCards.map((card) => card.score)),
    [scoreCards],
  );
  const chunks = useMemo(() => normalizeChunks(analysis), [analysis]);
  const reviews = useMemo(
    () => buildChunkReviews(chunks, categoryEvaluations),
    [chunks, categoryEvaluations],
  );
  const strengths = useMemo(
    () => buildStrengths(categoryEvaluations),
    [categoryEvaluations],
  );
  const filteredReviews = useMemo(
    () =>
      selectedCategory === ALL_CATEGORIES
        ? reviews
        : reviews
            .map((review) => ({
              ...review,
              evaluations: review.evaluations.filter(
                (evaluation) => evaluation.category_id === selectedCategory,
              ),
            }))
            .filter((review) => review.evaluations.length > 0),
    [reviews, selectedCategory],
  );
  const transcriptSegments = analysis?.segments ?? collectSegmentsFromChunks(chunks);
  const hasMedia = polling.result
    ? polling.result.video_urls.length > 0 || polling.result.audio_urls.length > 0
    : false;

  const seekToTimestamp = useCallback(
    (ms: number) => {
      const clampedMs = Math.max(0, ms);
      setActiveTimestampMs(clampedMs);

      const media = primaryMediaRef.current;
      if (media) {
        media.currentTime = clampedMs / 1000;
        void media.play().catch(() => undefined);
      }

      const index = findSegmentIndexForTime(transcriptSegments, clampedMs);
      if (index >= 0) {
        const key = segmentDomKey(transcriptSegments[index], index);
        segmentRefs.current[key]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    },
    [transcriptSegments],
  );

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [polling.result?.logs]);

  const value = useMemo<TranscriptionResultContextValue>(
    () => ({
      ...polling,
      analysis,
      categoryEvaluations,
      scoreCards,
      overallScore,
      chunks,
      reviews,
      strengths,
      transcriptSegments,
      hasMedia,
      selectedCategory,
      setSelectedCategory,
      filteredReviews,
      activeTimestampMs,
      seekToTimestamp,
      primaryMediaRef,
      segmentRefs,
      logsEndRef,
    }),
    [
      polling,
      analysis,
      categoryEvaluations,
      scoreCards,
      overallScore,
      chunks,
      reviews,
      strengths,
      transcriptSegments,
      hasMedia,
      selectedCategory,
      filteredReviews,
      activeTimestampMs,
      seekToTimestamp,
    ],
  );

  return (
    <TranscriptionResultContext.Provider value={value}>
      {children}
    </TranscriptionResultContext.Provider>
  );
}

export function useTranscriptionResultContext(): TranscriptionResultContextValue {
  const context = useContext(TranscriptionResultContext);
  if (context === null) {
    throw new Error(
      "TranscriptionResult components must be used within TranscriptionResult",
    );
  }
  return context;
}
