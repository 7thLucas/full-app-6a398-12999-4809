import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { RequireSiloam } from "~/components/require-siloam";
import { useAuth } from "~/modules/authentication";
import { useConfigurables } from "~/modules/configurables";
import { TranscriptionResult } from "@qb/audio-analyzer";
import {
  getEvaluation,
  type EvaluationRecord,
} from "~/lib/evaluations.client";
import {
  getSiloamProfile,
  scoreBand,
  BAND_BG,
  BAND_LABEL,
  roleLabel,
} from "~/lib/siloam";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { FeedbackPanel } from "~/components/evaluation/feedback-panel";
import { ActionPlanPanel } from "~/components/evaluation/action-plan-panel";

function EvaluationDetailInner() {
  const { id = "" } = useParams();
  const { user } = useAuth();
  const { config } = useConfigurables();
  const profile = getSiloamProfile(user?.profile);
  const thresholds = config.scoreThresholds ?? { excellent: 90, good: 75 };
  const canReview = profile?.role === "unit_lead" || profile?.role === "quality_exec";

  const [ev, setEv] = useState<EvaluationRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    return getEvaluation(id)
      .then(setEv)
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    reload().finally(() => setLoading(false));
  }, [reload]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-64 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (error || !ev) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error ?? "Evaluation not found."}
            <div className="mt-3">
              <Link to="/evaluations" className="text-primary hover:underline">
                Back to evaluations
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const band = scoreBand(ev.overallScore, thresholds);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link to="/evaluations" className="text-sm text-muted-foreground hover:text-foreground">
          ← Evaluations
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
            {ev.callTitle || `Call · ${ev.staffName}`}
          </h1>
          {ev.status === "completed" && (
            <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${BAND_BG[band]}`}>
              {ev.overallScore ?? "—"} · {BAND_LABEL[band]}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {ev.staffName} · {ev.hospital} · {ev.unit} · {new Date(ev.createdAt).toLocaleString()}
        </p>
        {ev.notes && <p className="mt-2 rounded-md bg-muted/40 px-3 py-2 text-sm">{ev.notes}</p>}
      </div>

      {/* Category score snapshot */}
      {ev.categoryScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ev.categoryScores.map((c) => {
                const b = scoreBand(c.score, thresholds);
                return (
                  <div key={c.categoryId} className="rounded-lg border border-border p-3">
                    <div className="text-xs text-muted-foreground">{c.title}</div>
                    <div className={`mt-1 text-2xl font-bold ${BAND_BG[b].split(" ").find((x) => x.startsWith("text-")) ?? ""}`}>
                      {c.score ?? "—"}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended courses */}
      {ev.recommendedCourses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended Training (Top {ev.recommendedCourses.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ev.recommendedCourses.map((c, i) => (
              <div key={c.id} className="flex gap-3 rounded-lg border border-border p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{c.title}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="mr-2">{c.focus}</Badge>
                    {c.id}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{c.reason}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Action plan */}
      <ActionPlanPanel evaluation={ev} canReview={canReview} onChange={reload} />

      {/* Full transcription analysis (scores, banded issues, transcript with timestamps, media) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Analysis & Evidence</CardTitle>
        </CardHeader>
        <CardContent>
          <TranscriptionResult ticketId={ev.ticketId} className="space-y-6">
            <TranscriptionResult.Loading message="Loading analysis…" />
            <TranscriptionResult.Error />
            <TranscriptionResult.Content className="space-y-6">
              <TranscriptionResult.Summary />
              <TranscriptionResult.Scores />
              <TranscriptionResult.Issues />
              <TranscriptionResult.Strengths />
              <TranscriptionResult.Media />
              <TranscriptionResult.Transcript />
            </TranscriptionResult.Content>
          </TranscriptionResult>
        </CardContent>
      </Card>

      {/* Feedback thread */}
      <FeedbackPanel
        evaluation={ev}
        currentUserName={profile?.fullName || user?.username || "You"}
        currentRoleLabel={roleLabel(profile?.role)}
        onChange={reload}
      />
    </div>
  );
}

export default function EvaluationDetailRoute() {
  return (
    <RequireSiloam>
      <EvaluationDetailInner />
    </RequireSiloam>
  );
}
