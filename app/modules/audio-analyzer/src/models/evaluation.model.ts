/*
 * Siloam domain model — an Evaluation wraps an audio-analyzer transcription
 * ticket with hospital/unit/staff metadata, a score snapshot, recommended
 * training courses, reviewer feedback, and an action plan (the remediation
 * loop). Lives inside the audio-analyzer module folder so the host's
 * model/route/seed auto-discovery (which scans app/modules/<slug>/src/*) picks
 * it up.
 */
import {
  prop,
  getModelForClass,
  modelOptions,
  Severity,
} from "@typegoose/typegoose";
import { CommonTypegooseEntity } from "~/api/models/base/common-typegoose.entity";

export type EvaluationStatus = "processing" | "completed" | "failed";
export type ActionPlanStatus =
  | "none"
  | "assigned"
  | "acknowledged"
  | "in_progress"
  | "completed";

@modelOptions({
  schemaOptions: {
    collection: "tbl_siloam_evaluations",
    timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" },
  },
  options: { allowMixed: Severity.ALLOW },
})
export class Evaluation extends CommonTypegooseEntity {
  // ── Audio-analyzer linkage ───────────────────────────────────────────────
  @prop({ type: String, required: true, index: true })
  ticketId!: string;

  @prop({ type: String, default: "processing" })
  status!: EvaluationStatus;

  // ── Subject of the evaluation ────────────────────────────────────────────
  @prop({ type: String, required: true })
  staffName!: string;

  @prop({ type: String, required: true, index: true })
  hospital!: string;

  @prop({ type: String, required: true, index: true })
  unit!: string;

  @prop({ type: String, default: "" })
  callTitle!: string;

  @prop({ type: String, default: "" })
  notes!: string;

  // ── Who uploaded / owns the record ───────────────────────────────────────
  @prop({ type: String, required: true, index: true })
  uploadedById!: string;

  @prop({ type: String, default: "" })
  uploadedByName!: string;

  // The staff member this evaluation is *about* (user id, when known)
  @prop({ type: String, default: "", index: true })
  subjectUserId!: string;

  // ── Score snapshot (denormalized from analysis for fast dashboards) ───────
  @prop({ type: Number, default: null })
  overallScore?: number | null;

  // [{ categoryId, title, score }]
  @prop({ type: () => [Object], default: [] })
  categoryScores!: Array<{ categoryId: string; title: string; score: number | null }>;

  @prop({ type: Number, default: 0 })
  issueCount!: number;

  @prop({ type: String, default: "" })
  summary!: string;

  // ── AI training-course recommendations (top 3) ───────────────────────────
  // [{ id, title, focus, reason }]
  @prop({ type: () => [Object], default: [] })
  recommendedCourses!: Array<{
    id: string;
    title: string;
    focus: string;
    reason: string;
  }>;

  // ── Reviewer feedback thread ─────────────────────────────────────────────
  // [{ authorId, authorName, role, message, at }]
  @prop({ type: () => [Object], default: [] })
  feedback!: Array<{
    authorId: string;
    authorName: string;
    role: string;
    message: string;
    at: string;
  }>;

  // ── Action plan (remediation loop) ───────────────────────────────────────
  @prop({ type: String, default: "none" })
  actionPlanStatus!: ActionPlanStatus;

  @prop({ type: Object, default: null })
  actionPlan?: {
    title: string;
    description: string;
    courseIds: string[];
    attachmentUrl?: string;
    assignedById: string;
    assignedByName: string;
    assignedAt: string;
    dueDate?: string;
  } | null;
}

export const EvaluationModel = getModelForClass(Evaluation);
