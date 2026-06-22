import type { HTMLAttributes } from "react";
import { useTranscriptionResultContext } from "./context";
import { EmptyState } from "./primitives";
import {
  scoreColor,
  scoreLabel,
  totalCardIssues,
  type ScoreCard,
  cn,
} from "./utils";

export function TranscriptionResultScores({
  className,
  showOverall = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & { showOverall?: boolean }) {
  const { scoreCards, overallScore } = useTranscriptionResultContext();

  const cards: ScoreCard[] = [
    ...(showOverall && overallScore !== null
      ? [
          {
            id: "overall",
            title: "Overall",
            score: overallScore,
            issueCount: totalCardIssues(scoreCards),
          },
        ]
      : []),
    ...scoreCards,
  ];

  if (cards.length === 0) {
    return (
      <section className={cn("rounded-xl border bg-card p-4 shadow-sm", className)} {...props}>
        <EmptyState message="Category scores are not available yet." />
      </section>
    );
  }

  return (
    <section
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6", className)}
      {...props}
    >
      {cards.map((card) => (
        <article
          key={card.id}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <p className="line-clamp-2 min-h-9 text-xs font-medium text-muted-foreground">
            {card.title}
          </p>
          <p className={cn("mt-2 text-3xl font-bold tabular-nums", scoreColor(card.score))}>
            {Math.round(card.score)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{scoreLabel(card.score)}</p>
        </article>
      ))}
    </section>
  );
}

export function TranscriptionResultSummary({
  className,
  title = "Summary",
  ...props
}: HTMLAttributes<HTMLElement> & { title?: string }) {
  const { analysis } = useTranscriptionResultContext();

  if (!analysis?.summary) {
    return null;
  }

  return (
    <section className={cn("rounded-xl border bg-card p-4 shadow-sm", className)} {...props}>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{analysis.summary}</p>
    </section>
  );
}
