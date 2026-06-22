import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { RequireSiloam } from "~/components/require-siloam";
import { useAuth } from "~/modules/authentication";
import { useConfigurables } from "~/modules/configurables";
import {
  useTranscribe,
  useTranscriptionResult,
  TranscriptionResult,
  TranscriptionUpload,
} from "@qb/audio-analyzer";
import { defaultAnalysisOptions } from "~/modules/audio-analyzer/src/constants/default-analysis-options";
import { getSiloamProfile } from "~/lib/siloam";
import {
  createEvaluation,
  finalizeEvaluation,
  type EvaluationRecord,
} from "~/lib/evaluations.client";
import {
  getCategoryEvaluations,
  computeOverallScore,
  categoryScoreSnapshot,
  flattenIssues,
  recommendCourses,
} from "~/lib/analysis";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";

type Step = "form" | "processing";

function NewEvaluationInner() {
  const { user } = useAuth();
  const { config } = useConfigurables();
  const navigate = useNavigate();
  const profile = getSiloamProfile(user?.profile);

  const hospitals = config.hospitals ?? [];
  const units = config.units ?? [];
  const enableRecording = config.enableLiveRecording ?? true;

  const [step, setStep] = useState<Step>("form");
  const [staffName, setStaffName] = useState(profile?.role === "staff" ? profile.fullName : "");
  const [hospital, setHospital] = useState(profile?.hospital ?? hospitals[0] ?? "");
  const [unit, setUnit] = useState(profile?.unit ?? units[0] ?? "");
  const [callTitle, setCallTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [recordError, setRecordError] = useState<string | null>(null);

  const { submit, isSubmitting, error: submitError } = useTranscribe();
  const [evaluation, setEvaluation] = useState<EvaluationRecord | null>(null);

  // Live recording
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function startRecording() {
    setRecordError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const file = new File([blob], `live-recording-${Date.now()}.webm`, { type: blob.type });
        setPendingFile(file);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      setRecordError("Could not access microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }

  async function handleStart() {
    if (!pendingFile || !staffName || !hospital || !unit) return;
    try {
      const { ticket_id } = await submit({
        files: pendingFile,
        analysis_options: defaultAnalysisOptions,
      });
      const ev = await createEvaluation({
        ticketId: ticket_id,
        staffName,
        hospital,
        unit,
        callTitle,
        notes,
        subjectUserId: profile?.role === "staff" ? user?.id : undefined,
      });
      setEvaluation(ev);
      setStep("processing");
    } catch {
      /* submitError surfaces the message */
    }
  }

  if (step === "processing" && evaluation) {
    return (
      <ProcessingView
        evaluation={evaluation}
        onDone={(id) => navigate(`/evaluations/${id}`)}
      />
    );
  }

  const canStart = !!pendingFile && !!staffName && !!hospital && !!unit && !isSubmitting && !isRecording;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
          New Evaluation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload or record a customer-service call. It will be transcribed and scored automatically.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call details</CardTitle>
          <CardDescription>Who and where this call belongs to.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="staffName">Staff / Agent name</Label>
              <Input
                id="staffName"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                placeholder="Agent being evaluated"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="callTitle">Call title (optional)</Label>
              <Input
                id="callTitle"
                value={callTitle}
                onChange={(e) => setCallTitle(e.target.value)}
                placeholder="e.g. Appointment rescheduling"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hospital">Hospital</Label>
              <Select id="hospital" value={hospital} onChange={(e) => setHospital(e.target.value)}>
                {hospitals.map((h) => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Service unit</Label>
              <Select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
                {units.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any context for the reviewer…"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recording</CardTitle>
          <CardDescription>Upload an audio/video file or record live.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingFile ? (
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{pendingFile.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(pendingFile.size / 1024 / 1024).toFixed(1)} MB
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setPendingFile(null)}>
                Remove
              </Button>
            </div>
          ) : (
            <>
              <TranscriptionUpload onUpload={(file) => setPendingFile(file)} />
              {enableRecording && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              {enableRecording && (
                <div className="flex flex-col items-center gap-2">
                  {isRecording ? (
                    <Button variant="destructive" onClick={stopRecording}>
                      <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
                      Stop recording
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={startRecording}>
                      Record live audio
                    </Button>
                  )}
                  {recordError && <p className="text-xs text-destructive">{recordError}</p>}
                </div>
              )}
            </>
          )}

          {submitError && (
            <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{submitError}</div>
          )}

          <Button className="w-full" disabled={!canStart} onClick={handleStart}>
            {isSubmitting ? "Submitting…" : "Transcribe & evaluate"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProcessingView({
  evaluation,
  onDone,
}: {
  evaluation: EvaluationRecord;
  onDone: (id: string) => void;
}) {
  const { config } = useConfigurables();
  const { result, isCompleted, isFailed } = useTranscriptionResult(evaluation.ticketId);
  const [finalizing, setFinalizing] = useState(false);
  const [recsMessage, setRecsMessage] = useState("Generating training recommendations…");
  const finalizedRef = useRef(false);

  useEffect(() => {
    if (!isCompleted || finalizedRef.current || !result) return;
    finalizedRef.current = true;

    (async () => {
      setFinalizing(true);
      try {
        const cats = getCategoryEvaluations(result.analysis);
        const snapshot = categoryScoreSnapshot(cats);
        const overall = computeOverallScore(cats);
        const issues = flattenIssues(cats);

        let courses: EvaluationRecord["recommendedCourses"] = [];
        if (config.enableCourseRecommendations ?? true) {
          courses = await recommendCourses({
            categoryScores: snapshot.map((s) => ({ ...s, score: s.score ?? 0 })),
            issues,
            catalog: config.courseCatalog ?? [],
          });
        }

        await finalizeEvaluation(evaluation._id, {
          status: "completed",
          overallScore: overall,
          categoryScores: snapshot,
          issueCount: issues.length,
          summary: result.analysis?.summary ?? "",
          recommendedCourses: courses,
        });
        onDone(evaluation._id);
      } catch {
        setRecsMessage("Saved with partial results.");
        await finalizeEvaluation(evaluation._id, { status: "completed", summary: result.analysis?.summary ?? "" }).catch(() => {});
        onDone(evaluation._id);
      } finally {
        setFinalizing(false);
      }
    })();
  }, [isCompleted, result]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isFailed && !finalizedRef.current) {
      finalizedRef.current = true;
      finalizeEvaluation(evaluation._id, { status: "failed" }).catch(() => {});
    }
  }, [isFailed, evaluation._id]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--heading-font)" }}>
          Analyzing call
        </h1>
        <Badge variant="secondary">{evaluation.staffName}</Badge>
      </div>

      <TranscriptionResult ticketId={evaluation.ticketId} className="space-y-5">
        <TranscriptionResult.Loading message="Queued for transcription…" />
        <TranscriptionResult.Error />
        <Card>
          <CardContent className="space-y-3 p-5">
            <TranscriptionResult.Header />
            <div className="flex items-center gap-3">
              <TranscriptionResult.Status />
              <TranscriptionResult.Stage />
            </div>
          </CardContent>
        </Card>
        <TranscriptionResult.Content className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <TranscriptionResult.Scores />
            </CardContent>
          </Card>
        </TranscriptionResult.Content>
      </TranscriptionResult>

      {(isCompleted || finalizing) && (
        <Card>
          <CardContent className="flex items-center gap-3 p-5">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-primary" />
            <p className="text-sm text-muted-foreground">{recsMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function NewEvaluationRoute() {
  return (
    <RequireSiloam>
      <NewEvaluationInner />
    </RequireSiloam>
  );
}
