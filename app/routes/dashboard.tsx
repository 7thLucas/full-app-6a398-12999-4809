import { useEffect, useState } from "react";
import { Link } from "react-router";
import { RequireSiloam } from "~/components/require-siloam";
import { useAuth } from "~/modules/authentication";
import { useConfigurables } from "~/modules/configurables";
import { getDashboard, type DashboardData } from "~/lib/evaluations.client";
import {
  getSiloamProfile,
  roleLabel,
  scoreBand,
  BAND_BG,
  BAND_TEXT,
  BAND_LABEL,
} from "~/lib/siloam";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

function ScorePill({ score }: { score: number | null }) {
  const { config } = useConfigurables();
  const thresholds = config.scoreThresholds ?? { excellent: 90, good: 75 };
  const band = scoreBand(score, thresholds);
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_BG[band]}`}>
      {score == null ? "—" : score} · {BAND_LABEL[band]}
    </span>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-2 text-3xl font-bold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
          {value}
        </div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; avgScore: number; count: number }[];
}) {
  const { config } = useConfigurables();
  const thresholds = config.scoreThresholds ?? { excellent: 90, good: 75 };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {rows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">No completed evaluations yet.</p>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((r) => {
              const band = scoreBand(r.avgScore, thresholds);
              return (
                <div key={r.name} className="flex items-center justify-between px-6 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.count} evaluation{r.count === 1 ? "" : "s"}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.min(100, Math.max(4, r.avgScore))}%` }}
                      />
                    </div>
                    <span className={`w-10 text-right text-sm font-semibold ${BAND_TEXT[band]}`}>{r.avgScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardInner() {
  const { user } = useAuth();
  const profile = getSiloamProfile(user?.profile);
  const role = profile?.role ?? "staff";

  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
          {role === "staff" ? "My Performance" : "Quality Dashboard"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {roleLabel(role)} · {profile?.hospital}
          {role !== "quality_exec" && profile?.unit ? ` · ${profile.unit}` : ""}
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Evaluations" value={String(data.totalEvaluations)} hint="Completed analyses" />
            <StatCard
              label="Average Score"
              value={data.avgScore == null ? "—" : String(data.avgScore)}
              hint="Across all completed calls"
            />
            <StatCard label="Open Action Plans" value={String(data.openActions)} hint="Awaiting completion" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {role === "quality_exec" && <BreakdownTable title="By Hospital" rows={data.byHospital} />}
            {role !== "staff" && <BreakdownTable title="By Service Unit" rows={data.byUnit} />}
            <BreakdownTable title={role === "staff" ? "My Calls" : "By Staff"} rows={data.byStaff} />
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Evaluations</CardTitle>
              <Link to="/evaluations" className="text-sm font-medium text-primary hover:underline">
                View all
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {data.recent.length === 0 ? (
                <div className="px-6 pb-6 text-sm text-muted-foreground">
                  No evaluations yet.{" "}
                  <Link to="/evaluations/new" className="font-medium text-primary hover:underline">
                    Start one
                  </Link>
                  .
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {data.recent.map((ev) => (
                    <Link
                      key={ev._id}
                      to={`/evaluations/${ev._id}`}
                      className="flex items-center justify-between px-6 py-3 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">
                          {ev.callTitle || `Call · ${ev.staffName}`}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {ev.staffName} · {ev.unit}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {ev.actionPlanStatus !== "none" && (
                          <Badge variant="muted" className="hidden sm:inline-flex">
                            Action plan
                          </Badge>
                        )}
                        <ScorePill score={ev.overallScore} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export default function DashboardRoute() {
  return (
    <RequireSiloam>
      <DashboardInner />
    </RequireSiloam>
  );
}
