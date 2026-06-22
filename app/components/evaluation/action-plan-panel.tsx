import { useState } from "react";
import {
  assignActionPlan,
  updateActionStatus,
  type EvaluationRecord,
} from "~/lib/evaluations.client";
import { uploadDocument } from "~/lib/uploader.client";
import { useConfigurables } from "~/modules/configurables";
import { ACTION_FLOW, statusLabel } from "~/lib/siloam";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

export function ActionPlanPanel({
  evaluation,
  canReview,
  onChange,
}: {
  evaluation: EvaluationRecord;
  canReview: boolean;
  onChange: () => Promise<unknown> | void;
}) {
  const { config } = useConfigurables();
  const catalog = config.courseCatalog ?? [];

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(evaluation.actionPlan?.title ?? "");
  const [description, setDescription] = useState(evaluation.actionPlan?.description ?? "");
  const [courseIds, setCourseIds] = useState<string[]>(evaluation.actionPlan?.courseIds ?? []);
  const [dueDate, setDueDate] = useState(evaluation.actionPlan?.dueDate ?? "");
  const [attachmentUrl, setAttachmentUrl] = useState(evaluation.actionPlan?.attachmentUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = evaluation.actionPlan;
  const status = evaluation.actionPlanStatus;

  function toggleCourse(id: string) {
    setCourseIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await uploadDocument(file);
      setAttachmentUrl(res.url);
    } catch (e: any) {
      setError(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await assignActionPlan(evaluation._id, {
        title: title.trim(),
        description: description.trim(),
        courseIds,
        attachmentUrl: attachmentUrl || undefined,
        dueDate: dueDate || undefined,
      });
      setEditing(false);
      await onChange();
    } catch (e: any) {
      setError(e.message ?? "Failed to save action plan");
    } finally {
      setSaving(false);
    }
  }

  async function advance(next: string) {
    setError(null);
    try {
      await updateActionStatus(evaluation._id, next);
      await onChange();
    } catch (e: any) {
      setError(e.message ?? "Failed to update status");
    }
  }

  const currentIdx = ACTION_FLOW.findIndex((s) => s.value === status);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Action Plan</CardTitle>
        {plan && status !== "none" && <Badge variant="muted">{statusLabel(status)}</Badge>}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Existing plan view */}
        {plan && !editing && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <div className="text-sm font-semibold">{plan.title}</div>
              {plan.description && (
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{plan.description}</p>
              )}
              {plan.courseIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {plan.courseIds.map((cid) => {
                    const c = catalog.find((x) => x.id === cid);
                    return (
                      <Badge key={cid} variant="secondary">
                        {c?.title ?? cid}
                      </Badge>
                    );
                  })}
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span>Assigned by {plan.assignedByName}</span>
                {plan.dueDate && <span>· Due {new Date(plan.dueDate).toLocaleDateString()}</span>}
                {plan.attachmentUrl && (
                  <a href={plan.attachmentUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    View attachment
                  </a>
                )}
              </div>
            </div>

            {/* Status flow */}
            <div className="flex flex-wrap items-center gap-2">
              {ACTION_FLOW.map((s, i) => (
                <div key={s.value} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      i <= currentIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                  {i < ACTION_FLOW.length - 1 && <span className="text-muted-foreground">→</span>}
                </div>
              ))}
            </div>

            {status !== "completed" && currentIdx >= 0 && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => advance(ACTION_FLOW[currentIdx + 1].value)}>
                  Mark {ACTION_FLOW[currentIdx + 1].label}
                </Button>
                {canReview && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    Edit plan
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!plan && !editing && (
          <div className="text-sm text-muted-foreground">
            {canReview ? (
              <div className="flex items-center justify-between gap-4">
                <span>No action plan assigned yet.</span>
                <Button size="sm" onClick={() => setEditing(true)}>
                  Assign action plan
                </Button>
              </div>
            ) : (
              <span>No action plan has been assigned for this evaluation yet.</span>
            )}
          </div>
        )}

        {/* Editor (reviewers only) */}
        {editing && canReview && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ap-title">Title</Label>
              <Input id="ap-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Empathy & active listening plan" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap-desc">Description</Label>
              <Textarea id="ap-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What should the agent focus on…" />
            </div>
            <div className="space-y-2">
              <Label>Assign training courses</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {catalog.map((c) => (
                  <label
                    key={c.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-md border p-2 text-sm ${
                      courseIds.includes(c.id) ? "border-primary bg-secondary" : "border-border"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={courseIds.includes(c.id)}
                      onChange={() => toggleCourse(c.id)}
                      className="mt-0.5 accent-[var(--primary)]"
                    />
                    <span>
                      <span className="font-medium">{c.title}</span>
                      <span className="block text-xs text-muted-foreground">{c.focus}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ap-due">Due date (optional)</Label>
                <Input id="ap-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ap-file">Supporting document (optional)</Label>
                <Input
                  id="ap-file"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                  }}
                />
                {uploading && <p className="text-xs text-muted-foreground">Uploading…</p>}
                {attachmentUrl && !uploading && (
                  <p className="text-xs text-primary">Attached ✓</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : plan ? "Update plan" : "Assign plan"}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
