import type { HTMLAttributes } from "react";
import type { CategoryEvaluation } from "../../libs/types";
import { useTranscriptionResultContext } from "./context";
import { FindingCard } from "./finding-card";
import { EmptyState, Section, Collapsible, CollapsibleTrigger, CollapsibleContent } from "./primitives";
import {
  ALL_CATEGORIES,
  average,
  formatTime,
  scoreColor,
  shortLabel,
  tabClass,
  type ChunkReview,
  cn,
} from "./utils";

export function TranscriptionResultIssues({
  className,
  title = "Issues",
  description = "Findings from category evaluations.",
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
}) {
  const {
    scoreCards,
    selectedCategory,
    setSelectedCategory,
    filteredReviews,
    categoryEvaluations,
    seekToTimestamp,
  } = useTranscriptionResultContext();

  return (
    <Section
      className={className}
      title={title}
      description={description}
      action={
        <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
          {categoryEvaluations.reduce(
            (count, evaluation) => count + (evaluation.issues?.length ?? 0),
            0,
          )}{" "}
          issues
        </span>
      }
      {...props}
    >
      <div className="mb-4 flex flex-wrap gap-2 border-b pb-4">
        <CategoryFilter
          scoreCards={scoreCards}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </div>
      <div className="space-y-4">
        {filteredReviews.length > 0 ? (
          filteredReviews.map((review, index) => (
            <ReviewCard
              key={`${review.chunk?.chunk_index ?? "all"}-${index}`}
              review={review}
              categoryId={selectedCategory}
              defaultOpen={index === 0}
              onSeekToTimestamp={seekToTimestamp}
            />
          ))
        ) : (
          <EmptyState message="No issues for this category." />
        )}
      </div>
    </Section>
  );
}

function CategoryFilter({
  scoreCards,
  selectedCategory,
  onSelectCategory,
}: {
  scoreCards: Array<{ id: string; title: string }>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelectCategory(ALL_CATEGORIES)}
        className={tabClass(selectedCategory === ALL_CATEGORIES)}
      >
        All
      </button>
      {scoreCards.map((card) => (
        <button
          key={card.id}
          type="button"
          onClick={() => onSelectCategory(card.id)}
          className={tabClass(selectedCategory === card.id)}
        >
          {card.title}
        </button>
      ))}
    </>
  );
}

function ReviewCard({
  review,
  categoryId,
  defaultOpen = false,
  onSeekToTimestamp,
}: {
  review: ChunkReview;
  categoryId: string;
  defaultOpen?: boolean;
  onSeekToTimestamp: (ms: number) => void;
}) {
  const evaluations =
    categoryId === ALL_CATEGORIES
      ? review.evaluations
      : review.evaluations.filter(
          (evaluation) => evaluation.category_id === categoryId,
        );
  const issues = evaluations.flatMap((evaluation) =>
    (evaluation.issues ?? []).map((issue) => ({
      ...issue,
      categoryTitle: evaluation.title,
    })),
  );
  const score =
    categoryId === ALL_CATEGORIES
      ? review.score
      : average(
          evaluations
            .map((evaluation) => evaluation.score)
            .filter((value): value is number => typeof value === "number"),
        );

  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex min-w-0 flex-1 gap-4 text-left">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-muted-foreground">
              {review.chunk
                ? `${formatTime(review.chunk.start_ms)} – ${formatTime(review.chunk.end_ms)}`
                : "Full transcript"}
            </p>
            <h4 className="mt-2 text-base font-semibold">{review.title}</h4>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground group-open:line-clamp-none">
              {review.summary}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {score !== null && (
              <p className={cn("text-2xl font-bold tabular-nums", scoreColor(score))}>
                {Math.round(score)}
              </p>
            )}
            <p className="mt-1 text-xs font-medium text-red-500">{issues.length} issues</p>
          </div>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="flex flex-wrap gap-2">
          {evaluations.map((evaluation: CategoryEvaluation) => (
            <span
              key={`${evaluation.category_id}-${evaluation.chunk_index ?? "all"}`}
              className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {shortLabel(evaluation.title)}{" "}
              {typeof evaluation.score === "number" && (
                <b className={scoreColor(evaluation.score)}>
                  {Math.round(evaluation.score)}
                </b>
              )}
            </span>
          ))}
        </div>

        <div className="space-y-3">
          {issues.length > 0 ? (
            issues.map((issue, index) => (
              <FindingCard
                key={issue.id ?? `${issue.description}-${index}`}
                finding={issue}
                variant="issue"
                onSeekToTimestamp={onSeekToTimestamp}
              />
            ))
          ) : (
            <p className="text-sm italic text-muted-foreground">No issues in this evaluation.</p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function TranscriptionResultStrengths({
  className,
  title = "Strengths",
  description = "Positive findings from category evaluations.",
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
}) {
  const { strengths, seekToTimestamp } = useTranscriptionResultContext();

  if (strengths.length === 0) {
    return null;
  }

  return (
    <Section className={className} title={title} description={description} {...props}>
      <div className="space-y-3">
        {strengths.map((strength, index) => (
          <FindingCard
            key={strength.id ?? `${strength.description}-${index}`}
            finding={strength}
            variant="strength"
            onSeekToTimestamp={seekToTimestamp}
          />
        ))}
      </div>
    </Section>
  );
}
