import { useState } from "react";
import { addFeedback, type EvaluationRecord } from "~/lib/evaluations.client";
import { roleLabel } from "~/lib/siloam";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";

export function FeedbackPanel({
  evaluation,
  currentUserName,
  currentRoleLabel,
  onChange,
}: {
  evaluation: EvaluationRecord;
  currentUserName: string;
  currentRoleLabel: string;
  onChange: () => Promise<unknown> | void;
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const text = message.trim();
    if (!text) return;
    setSubmitting(true);
    setError(null);
    try {
      await addFeedback(evaluation._id, text);
      setMessage("");
      await onChange();
    } catch (e: any) {
      setError(e.message ?? "Failed to add feedback");
    } finally {
      setSubmitting(false);
    }
  }

  const initials = (name: string) =>
    name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {evaluation.feedback.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet. Be the first to comment.</p>
        ) : (
          <div className="space-y-4">
            {evaluation.feedback.map((f, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                  {initials(f.authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">{f.authorName}</span>
                    <span className="text-xs text-muted-foreground">{roleLabel(f.role)}</span>
                    <span className="text-xs text-muted-foreground">· {new Date(f.at).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-foreground/90">{f.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-4">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Textarea
            placeholder={`Add feedback as ${currentUserName} (${currentRoleLabel})…`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={submitting || !message.trim()}>
              {submitting ? "Posting…" : "Post feedback"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
