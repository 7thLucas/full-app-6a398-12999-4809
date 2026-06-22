import type {
  AnalysisResult,
  CategoryEvaluation,
  CategoryFinding,
  CategoryIssue,
  CategoryStrength,
  ChatSegment,
  SessionChunk,
} from "../../libs/types";

export type ScoreCard = {
  id: string;
  title: string;
  score: number;
  issueCount: number;
};

export type ChunkReview = {
  chunk: SessionChunk | null;
  title: string;
  summary: string;
  score: number | null;
  issueCount: number;
  evaluations: CategoryEvaluation[];
};

export type ChunkFindingItem = (CategoryIssue | CategoryStrength) & {
  categoryTitle: string;
};

export const ALL_CATEGORIES = "all";

export function buildScoreCards(evaluations: CategoryEvaluation[]): ScoreCard[] {
  const byCategory = new Map<string, CategoryEvaluation[]>();
  for (const evaluation of evaluations) {
    byCategory.set(evaluation.category_id, [
      ...(byCategory.get(evaluation.category_id) ?? []),
      evaluation,
    ]);
  }
  return [...byCategory.entries()]
    .map(([id, entries]) => {
      const score = average(
        entries
          .map((entry) => entry.score)
          .filter((value): value is number => typeof value === "number"),
      );
      return {
        id,
        title: entries[0]?.title ?? id,
        score: score ?? 0,
        issueCount: entries.reduce(
          (count, entry) => count + (entry.issues?.length ?? 0),
          0,
        ),
      };
    })
    .filter((card) => Number.isFinite(card.score));
}

export function normalizeCategoryEvaluations(
  analysis: AnalysisResult | null,
): CategoryEvaluation[] {
  if (!analysis) {
    return [];
  }
  if (analysis.category_evaluations?.length) {
    return analysis.category_evaluations;
  }
  return (analysis.chunks ?? []).flatMap((chunk) =>
    Object.entries(chunk.category_scores ?? {}).map(([categoryId, score]) => ({
      category_id: categoryId,
      title: titleFromId(categoryId),
      chunk_index: chunk.chunk_index,
      score: score.score ?? null,
      summary: score.summary ?? "",
      issues: score.issues ?? [],
      strengths: score.strengths ?? [],
      references: score.references ?? [],
    })),
  );
}

export function normalizeChunks(analysis: AnalysisResult | null): SessionChunk[] {
  if (!analysis) {
    return [];
  }
  if (analysis.session_chunks?.length) {
    return analysis.session_chunks;
  }
  return (analysis.chunks ?? []).map((chunk, index) => {
    const segments = (chunk.turns ?? []).map(normalizeTurn);
    const startMs = parseTimestamp(chunk.start_ts) ?? segments[0]?.start_ms ?? 0;
    const endMs =
      parseTimestamp(chunk.end_ts) ??
      segments[segments.length - 1]?.end_ms ??
      startMs + (chunk.duration_ms ?? 0);
    return {
      chunk_index: chunk.chunk_index ?? index,
      start_ms: startMs,
      end_ms: endMs,
      duration_ms: chunk.duration_ms ?? Math.max(endMs - startMs, 0),
      segments,
      context_summary: chunk.context_summary,
      silence_events: (chunk.silence_events ?? []).map((event) => {
        const eventStart =
          event.start_ms ?? parseTimestamp((event as { start_time?: string }).start_time) ?? 0;
        const eventEnd =
          event.end_ms ?? parseTimestamp((event as { end_time?: string }).end_time) ?? eventStart;
        return {
          ...event,
          start_ms: eventStart,
          end_ms: eventEnd,
          duration_ms: event.duration_ms ?? Math.max(eventEnd - eventStart, 0),
        };
      }),
    };
  });
}

export function normalizeTurn(turn: ChatSegment): ChatSegment {
  return {
    speaker_id: turn.speaker_id ?? turn.original_speaker ?? "unknown",
    speaker_name: turn.speaker_name ?? turn.speaker ?? null,
    text: turn.text,
    start_ms: turn.start_ms ?? parseTimestamp(turn.start_time) ?? 0,
    end_ms: turn.end_ms ?? parseTimestamp(turn.end_time) ?? 0,
  };
}

export function buildChunkReviews(
  chunks: SessionChunk[],
  evaluations: CategoryEvaluation[],
): ChunkReview[] {
  if (chunks.length === 0) {
    return [
      {
        chunk: null,
        title: "Full conversation",
        summary: buildEvaluationSummary(evaluations),
        score: averageScores(evaluations),
        issueCount: totalIssues(evaluations),
        evaluations,
      },
    ];
  }

  return chunks.map((chunk) => {
    const chunkEvaluations = evaluations.filter(
      (evaluation) => evaluation.chunk_index === chunk.chunk_index,
    );
    return {
      chunk,
      title: `Conversation ${chunk.chunk_index + 1}`,
      summary:
        chunk.context_summary ||
        buildEvaluationSummary(chunkEvaluations) ||
        chunk.reason ||
        "No chunk summary available.",
      score: averageScores(chunkEvaluations),
      issueCount: totalIssues(chunkEvaluations),
      evaluations: chunkEvaluations,
    };
  });
}

export function buildStrengths(
  evaluations: CategoryEvaluation[],
): Array<CategoryStrength & { categoryTitle: string }> {
  return evaluations.flatMap((evaluation) =>
    (evaluation.strengths ?? []).map((strength) => ({
      ...strength,
      categoryTitle: evaluation.title,
    })),
  );
}

export function buildEvaluationSummary(evaluations: CategoryEvaluation[]): string {
  const summaries = evaluations
    .map((evaluation) => evaluation.summary)
    .filter((summary): summary is string => Boolean(summary?.trim()));
  return summaries[0] ?? "";
}

export function collectSegmentsFromChunks(chunks: SessionChunk[]): ChatSegment[] {
  return chunks.flatMap((chunk) => chunk.segments);
}

export function parseTimestamp(value: string | undefined): number | null {
  if (!value) {
    return null;
  }
  const cleaned = value.trim();
  let milliseconds = 0;
  let timePart = cleaned;
  if (cleaned.includes(".")) {
    const [base, fraction] = cleaned.split(".", 2);
    timePart = base;
    milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));
  }
  const parts = timePart.split(":");
  if (parts.length < 2 || parts.length > 3) {
    return null;
  }
  const [hours, minutes, seconds] =
    parts.length === 2 ? ["0", parts[0], parts[1]] : parts;
  const totalMs =
    Number(hours) * 3_600_000 +
    Number(minutes) * 60_000 +
    Number(seconds) * 1_000 +
    (Number.isFinite(milliseconds) ? milliseconds : 0);
  return Number.isFinite(totalMs) ? totalMs : null;
}

export function findingTimestampMs(
  finding: CategoryFinding,
  bound: "start" | "end",
): number | null {
  const ms = bound === "start" ? finding.start_ms : finding.end_ms;
  if (typeof ms === "number") {
    return ms;
  }
  const time =
    bound === "start"
      ? (finding as CategoryIssue | CategoryStrength).start_time
      : (finding as CategoryIssue | CategoryStrength).end_time;
  return parseTimestamp(time);
}

export function formatFindingTimeBadge(
  finding: CategoryFinding,
  startMs: number,
): string {
  const startLabel =
    (finding as CategoryIssue | CategoryStrength).start_time ?? formatTime(startMs);
  const endMs = findingTimestampMs(finding, "end");
  if (endMs === null || endMs === startMs) {
    return startLabel;
  }
  const endLabel =
    (finding as CategoryIssue | CategoryStrength).end_time ?? formatTime(endMs);
  return `${startLabel} – ${endLabel}`;
}

export function titleFromId(id: string): string {
  return id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function averageScores(evaluations: CategoryEvaluation[]): number | null {
  return average(
    evaluations
      .map((evaluation) => evaluation.score)
      .filter((score): score is number => typeof score === "number"),
  );
}

export function average(values: number[]): number | null {
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function totalIssues(evaluations: CategoryEvaluation[]): number {
  return evaluations.reduce(
    (count, evaluation) => count + (evaluation.issues?.length ?? 0),
    0,
  );
}

export function totalCardIssues(cards: ScoreCard[]): number {
  return cards.reduce((count, card) => count + card.issueCount, 0);
}

export function scoreColor(score: number): string {
  if (score >= 90) {
    return "text-emerald-600";
  }
  if (score >= 75) {
    return "text-amber-500";
  }
  return "text-red-500";
}

export function scoreLabel(score: number): string {
  if (score >= 90) {
    return "Excellent";
  }
  if (score >= 75) {
    return "Good";
  }
  return "Needs improvement";
}

export function tabClass(active: boolean): string {
  return active
    ? "rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
    : "rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200";
}

export function segmentDomKey(segment: ChatSegment, index: number): string {
  return `${segment.start_ms}-${index}`;
}

export function segmentContainsTimestamp(segment: ChatSegment, ms: number): boolean {
  const endMs = segment.end_ms > 0 ? segment.end_ms : segment.start_ms;
  return ms >= segment.start_ms && ms <= endMs;
}

export function findSegmentIndexForTime(segments: ChatSegment[], ms: number): number {
  if (segments.length === 0) {
    return -1;
  }

  for (let index = 0; index < segments.length; index += 1) {
    if (segmentContainsTimestamp(segments[index], ms)) {
      return index;
    }
  }

  let closestIndex = 0;
  for (let index = 0; index < segments.length; index += 1) {
    if (segments[index].start_ms <= ms) {
      closestIndex = index;
    }
  }
  return closestIndex;
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

export function shortLabel(title: string): string {
  return title
    .split(/\s+/)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 4);
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
