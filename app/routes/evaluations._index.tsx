import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { RequireSiloam } from "~/components/require-siloam";
import { useConfigurables } from "~/modules/configurables";
import { listEvaluations, type EvaluationRecord } from "~/lib/evaluations.client";
import { scoreBand, BAND_BG, BAND_LABEL, statusLabel } from "~/lib/siloam";
import { Card, CardContent } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";

function EvaluationsInner() {
  const { config } = useConfigurables();
  const thresholds = config.scoreThresholds ?? { excellent: 90, good: 75 };

  const [rows, setRows] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    listEvaluations()
      .then(setRows)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesQ =
        !q ||
        r.staffName.toLowerCase().includes(q.toLowerCase()) ||
        r.callTitle.toLowerCase().includes(q.toLowerCase()) ||
        r.unit.toLowerCase().includes(q.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "with_action" && r.actionPlanStatus !== "none") ||
        r.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [rows, q, statusFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
            Evaluations
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Scored calls within your scope.</p>
        </div>
        <Link
          to="/evaluations/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New evaluation
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search by staff, title, or unit…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="sm:max-w-[200px]">
          <option value="all">All statuses</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="with_action">With action plan</option>
        </Select>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}
      {error && <Card><CardContent className="p-5 text-sm text-destructive">{error}</CardContent></Card>}

      {!loading && !error && (
        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No evaluations match your filters.</p>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((ev) => {
                  const band = scoreBand(ev.overallScore, thresholds);
                  return (
                    <Link
                      key={ev._id}
                      to={`/evaluations/${ev._id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {ev.callTitle || `Call · ${ev.staffName}`}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">
                          {ev.staffName} · {ev.hospital} · {ev.unit} ·{" "}
                          {new Date(ev.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {ev.actionPlanStatus !== "none" && (
                          <Badge variant="muted" className="hidden md:inline-flex">
                            {statusLabel(ev.actionPlanStatus)}
                          </Badge>
                        )}
                        {ev.status === "processing" ? (
                          <Badge variant="secondary">Processing</Badge>
                        ) : ev.status === "failed" ? (
                          <Badge variant="destructive">Failed</Badge>
                        ) : (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${BAND_BG[band]}`}>
                            {ev.overallScore ?? "—"} · {BAND_LABEL[band]}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function EvaluationsIndexRoute() {
  return (
    <RequireSiloam>
      <EvaluationsInner />
    </RequireSiloam>
  );
}
