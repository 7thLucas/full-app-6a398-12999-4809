/*
 * Helpers to derive a flat score snapshot + banded issues from an
 * audio-analyzer AnalysisResult, and to request top-3 training-course
 * recommendations from the agentic LLM.
 */
import { invokeLLM } from "@qb/agentic";
import type {
  AnalysisResult,
  CategoryEvaluation,
} from "@qb/audio-analyzer";
import type { CategoryIssue } from "~/modules/audio-analyzer/src/libs/types";
import { normalizeSeverity, type Severity, SEVERITY_ORDER } from "~/lib/siloam";
import type { TCourse } from "~/modules/configurables";
import type { RecommendedCourse } from "~/lib/evaluations.client";

export interface FlatIssue {
  description: string;
  category: string;
  severity: Severity;
  startTime?: string;
  startMs?: number | null;
}

/** Pull the per-category evaluations from any of the shapes the API may return. */
export function getCategoryEvaluations(analysis: AnalysisResult | null | undefined): CategoryEvaluation[] {
  if (!analysis) return [];
  if (analysis.category_evaluations?.length) return analysis.category_evaluations;
  // fall back to per-chunk category_scores
  const out: CategoryEvaluation[] = [];
  for (const chunk of analysis.chunks ?? []) {
    for (const [categoryId, cs] of Object.entries(chunk.category_scores ?? {})) {
      out.push({
        category_id: categoryId,
        title: categoryId,
        score: cs.score ?? null,
        issues: cs.issues ?? [],
        strengths: cs.strengths ?? [],
      });
    }
  }
  return out;
}

export function computeOverallScore(cats: CategoryEvaluation[]): number | null {
  const scores = cats.map((c) => c.score).filter((s): s is number => typeof s === "number");
  if (!scores.length) return null;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

export function categoryScoreSnapshot(cats: CategoryEvaluation[]) {
  // de-dup by category_id, averaging if repeated
  const map: Record<string, { title: string; total: number; count: number }> = {};
  for (const c of cats) {
    if (typeof c.score !== "number") continue;
    const k = c.category_id;
    map[k] = map[k] || { title: c.title || k, total: 0, count: 0 };
    map[k].total += c.score;
    map[k].count += 1;
  }
  return Object.entries(map).map(([categoryId, v]) => ({
    categoryId,
    title: v.title,
    score: Math.round(v.total / v.count),
  }));
}

export function flattenIssues(cats: CategoryEvaluation[]): FlatIssue[] {
  const issues: FlatIssue[] = [];
  for (const c of cats) {
    for (const issue of c.issues ?? []) {
      issues.push({
        description: issue.description,
        category: c.title || c.category_id,
        severity: normalizeSeverity((issue as CategoryIssue).severity, (issue as CategoryIssue).penalty_points),
        startTime: (issue as CategoryIssue).start_time,
        startMs: issue.start_ms ?? null,
      });
    }
  }
  return issues.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

const COURSE_SCHEMA = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string", description: "Course ID from the provided catalog" },
          title: { type: "string" },
          focus: { type: "string" },
          reason: { type: "string", description: "One sentence tying this course to a specific weakness." },
        },
        required: ["id", "title", "focus", "reason"],
      },
    },
  },
  required: ["recommendations"],
} as const;

/**
 * Ask the LLM to pick the top-3 most relevant training courses for this
 * evaluation, given the category scores, banded issues, and the org's course
 * catalog. Falls back to a deterministic pick if the call fails.
 */
export async function recommendCourses(input: {
  categoryScores: { categoryId: string; title: string; score: number }[];
  issues: FlatIssue[];
  catalog: TCourse[];
}): Promise<RecommendedCourse[]> {
  const { categoryScores, issues, catalog } = input;
  if (!catalog?.length) return [];

  try {
    const message = [
      "You are a training advisor for a hospital contact center quality program.",
      "Given an agent's call evaluation and the available training catalog, choose the THREE most relevant courses to close the biggest gaps.",
      "",
      "Category scores (0-100, lower = weaker):",
      ...categoryScores.map((c) => `- ${c.title}: ${c.score}`),
      "",
      "Top issues:",
      ...issues.slice(0, 12).map((i) => `- [${i.severity}] (${i.category}) ${i.description}`),
      "",
      "Available courses (pick ids ONLY from this list):",
      ...catalog.map((c) => `- ${c.id} | ${c.title} | focus: ${c.focus}`),
      "",
      "Return exactly 3 recommendations, most impactful first.",
    ].join("\n");

    const out = await invokeLLM({
      message,
      schema: COURSE_SCHEMA as unknown as Record<string, unknown>,
      systemPrompt: "You are a precise training advisor. Only recommend courses whose id appears in the provided catalog. Return strict JSON.",
    });

    const recs = (out.response as any)?.recommendations;
    if (Array.isArray(recs) && recs.length) {
      const valid = recs
        .filter((r: any) => catalog.some((c) => c.id === r.id))
        .slice(0, 3)
        .map((r: any) => ({
          id: String(r.id),
          title: String(r.title),
          focus: String(r.focus),
          reason: String(r.reason),
        }));
      if (valid.length) return valid;
    }
  } catch {
    // fall through to deterministic fallback
  }

  return fallbackRecommend(categoryScores, catalog);
}

function fallbackRecommend(
  categoryScores: { categoryId: string; title: string; score: number }[],
  catalog: TCourse[]
): RecommendedCourse[] {
  // Lowest-scoring categories first; match courses whose focus mentions the category title.
  const weakest = [...categoryScores].sort((a, b) => a.score - b.score);
  const picked: RecommendedCourse[] = [];
  const usedIds = new Set<string>();

  for (const cat of weakest) {
    const match = catalog.find(
      (c) =>
        !usedIds.has(c.id) &&
        (c.focus.toLowerCase().includes(cat.title.toLowerCase().split(" ")[0]) ||
          c.title.toLowerCase().includes(cat.title.toLowerCase().split(" ")[0]))
    );
    if (match) {
      usedIds.add(match.id);
      picked.push({
        id: match.id,
        title: match.title,
        focus: match.focus,
        reason: `Targets your lowest area: ${cat.title} (${cat.score}).`,
      });
    }
    if (picked.length === 3) break;
  }

  // top up to 3 with remaining catalog
  for (const c of catalog) {
    if (picked.length === 3) break;
    if (usedIds.has(c.id)) continue;
    usedIds.add(c.id);
    picked.push({ id: c.id, title: c.title, focus: c.focus, reason: "Recommended to reinforce service standards." });
  }

  return picked.slice(0, 3);
}
