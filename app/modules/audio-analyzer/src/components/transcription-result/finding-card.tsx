import type { CategoryFinding, CategoryIssue, CategoryStrength } from "../../libs/types";
import {
  findingTimestampMs,
  formatFindingTimeBadge,
  type ChunkFindingItem,
} from "./utils";
import { TimestampBadge } from "./primitives";

type FindingVariant = "issue" | "strength";

export function FindingCard({
  finding,
  variant,
  onSeekToTimestamp,
}: {
  finding: ChunkFindingItem;
  variant: FindingVariant;
  onSeekToTimestamp: (ms: number) => void;
}) {
  const isIssue = variant === "issue";
  const issue = isIssue ? (finding as CategoryIssue) : null;
  const startMs = findingTimestampMs(finding as CategoryFinding, "start");
  const styles = isIssue
    ? {
        card: "bg-orange-50 text-orange-950 dark:bg-orange-950/30 dark:text-orange-50",
        id: "text-orange-800 dark:text-orange-200",
        severity: "bg-orange-200/80 text-orange-900 dark:bg-orange-900/50 dark:text-orange-100",
        penalty: "text-orange-600 dark:text-orange-300",
        meta: "text-orange-600 dark:text-orange-300",
        badge: "border-orange-200 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-200",
      }
    : {
        card: "bg-emerald-50 text-emerald-950 dark:bg-emerald-950/30 dark:text-emerald-50",
        id: "text-emerald-800 dark:text-emerald-200",
        severity: "bg-emerald-200/80 text-emerald-900",
        penalty: "text-emerald-600 dark:text-emerald-300",
        meta: "text-emerald-600 dark:text-emerald-300",
        badge: "border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-200",
      };

  return (
    <div className={`rounded-lg px-4 py-3 text-sm ${styles.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {finding.id && (
            <span
              className={`rounded-full bg-background px-2 py-0.5 font-mono text-xs font-semibold ${styles.id}`}
            >
              {finding.id}
            </span>
          )}
          {isIssue && issue?.severity && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${styles.severity}`}
            >
              {issue.severity}
            </span>
          )}
        </div>
        {isIssue &&
          typeof issue?.penalty_points === "number" &&
          issue.penalty_points > 0 && (
            <span
              className={`shrink-0 rounded-full bg-background px-2 py-1 text-xs font-semibold ${styles.penalty}`}
            >
              -{issue.penalty_points}
            </span>
          )}
      </div>
      <p className="mt-2">{finding.description}</p>
      {startMs !== null && (
        <div className="mt-2">
          <TimestampBadge
            label={formatFindingTimeBadge(finding as CategoryFinding, startMs)}
            onClick={() => onSeekToTimestamp(startMs)}
            className={styles.badge}
          />
        </div>
      )}
      <p className={`mt-2 text-xs font-medium ${styles.meta}`}>
        {finding.categoryTitle}
        {finding.segment_ids && finding.segment_ids.length > 0
          ? ` · Segment ${finding.segment_ids.join(", ")}`
          : ""}
      </p>
    </div>
  );
}
