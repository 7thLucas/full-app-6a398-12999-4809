import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { RequireSiloam } from "~/components/require-siloam";
import { listEvaluations, type EvaluationRecord } from "~/lib/evaluations.client";
import { statusLabel } from "~/lib/siloam";
import { Card, CardContent } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

function ActionPlansInner() {
  const [rows, setRows] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listEvaluations()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const withPlans = useMemo(
    () => rows.filter((r) => r.actionPlanStatus !== "none"),
    [rows]
  );
  const open = withPlans.filter((r) => r.actionPlanStatus !== "completed");
  const done = withPlans.filter((r) => r.actionPlanStatus === "completed");

  function Row({ ev }: { ev: EvaluationRecord }) {
    return (
      <Link
        to={`/evaluations/${ev._id}`}
        className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40"
      >
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{ev.actionPlan?.title || ev.callTitle || `Call · ${ev.staffName}`}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {ev.staffName} · {ev.unit}
            {ev.actionPlan?.dueDate ? ` · Due ${new Date(ev.actionPlan.dueDate).toLocaleDateString()}` : ""}
          </div>
        </div>
        <Badge variant={ev.actionPlanStatus === "completed" ? "success" : "muted"}>
          {statusLabel(ev.actionPlanStatus)}
        </Badge>
      </Link>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
          Action Plans
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Remediation assignments and their progress.</p>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}
      {error && <Card><CardContent className="p-5 text-sm text-destructive">{error}</CardContent></Card>}

      {!loading && !error && (
        <>
          <div>
            <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Open ({open.length})</h2>
            <Card>
              <CardContent className="p-0">
                {open.length === 0 ? (
                  <p className="p-6 text-sm text-muted-foreground">No open action plans.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {open.map((ev) => <Row key={ev._id} ev={ev} />)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {done.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Completed ({done.length})</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-border">
                    {done.map((ev) => <Row key={ev._id} ev={ev} />)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ActionPlansRoute() {
  return (
    <RequireSiloam>
      <ActionPlansInner />
    </RequireSiloam>
  );
}
