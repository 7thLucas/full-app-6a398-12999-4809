import { apiGet, apiRequest } from "~/lib/api.client";

export interface CategoryScoreSnapshot {
  categoryId: string;
  title: string;
  score: number | null;
}

export interface RecommendedCourse {
  id: string;
  title: string;
  focus: string;
  reason: string;
}

export interface FeedbackEntry {
  authorId: string;
  authorName: string;
  role: string;
  message: string;
  at: string;
}

export interface ActionPlan {
  title: string;
  description: string;
  courseIds: string[];
  attachmentUrl?: string;
  assignedById: string;
  assignedByName: string;
  assignedAt: string;
  dueDate?: string;
}

export interface EvaluationRecord {
  _id: string;
  ticketId: string;
  status: "processing" | "completed" | "failed";
  staffName: string;
  hospital: string;
  unit: string;
  callTitle: string;
  notes: string;
  uploadedById: string;
  uploadedByName: string;
  subjectUserId: string;
  overallScore: number | null;
  categoryScores: CategoryScoreSnapshot[];
  issueCount: number;
  summary: string;
  recommendedCourses: RecommendedCourse[];
  feedback: FeedbackEntry[];
  actionPlanStatus: "none" | "assigned" | "acknowledged" | "in_progress" | "completed";
  actionPlan: ActionPlan | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  totalEvaluations: number;
  avgScore: number | null;
  openActions: number;
  byHospital: { name: string; avgScore: number; count: number }[];
  byUnit: { name: string; avgScore: number; count: number }[];
  byStaff: { name: string; avgScore: number; count: number }[];
  recent: EvaluationRecord[];
}

function unwrap<T>(res: { success: boolean; data?: T; message?: string }): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.message ?? "Request failed");
  }
  return res.data;
}

export async function saveSiloamProfile(input: {
  fullName: string;
  role: string;
  hospital: string;
  unit: string;
}) {
  return unwrap(await apiRequest("/api/siloam/profile", { method: "PUT", data: input }));
}

export async function createEvaluation(input: {
  ticketId: string;
  staffName: string;
  hospital: string;
  unit: string;
  callTitle?: string;
  notes?: string;
  subjectUserId?: string;
}): Promise<EvaluationRecord> {
  return unwrap<EvaluationRecord>(
    await apiRequest("/api/evaluations", { method: "POST", data: input })
  );
}

export async function listEvaluations(): Promise<EvaluationRecord[]> {
  return unwrap<EvaluationRecord[]>(await apiGet("/api/evaluations"));
}

export async function getEvaluation(id: string): Promise<EvaluationRecord> {
  return unwrap<EvaluationRecord>(await apiGet(`/api/evaluations/${id}`));
}

export async function finalizeEvaluation(
  id: string,
  input: {
    status?: "completed" | "failed";
    overallScore?: number | null;
    categoryScores?: CategoryScoreSnapshot[];
    issueCount?: number;
    summary?: string;
    recommendedCourses?: RecommendedCourse[];
  }
): Promise<EvaluationRecord> {
  return unwrap<EvaluationRecord>(
    await apiRequest(`/api/evaluations/${id}/finalize`, { method: "PATCH", data: input })
  );
}

export async function addFeedback(id: string, message: string): Promise<EvaluationRecord> {
  return unwrap<EvaluationRecord>(
    await apiRequest(`/api/evaluations/${id}/feedback`, { method: "POST", data: { message } })
  );
}

export async function assignActionPlan(
  id: string,
  input: {
    title: string;
    description?: string;
    courseIds?: string[];
    attachmentUrl?: string;
    dueDate?: string;
  }
): Promise<EvaluationRecord> {
  return unwrap<EvaluationRecord>(
    await apiRequest(`/api/evaluations/${id}/action-plan`, { method: "PUT", data: input })
  );
}

export async function updateActionStatus(id: string, status: string): Promise<EvaluationRecord> {
  return unwrap<EvaluationRecord>(
    await apiRequest(`/api/evaluations/${id}/action-status`, { method: "PATCH", data: { status } })
  );
}

export async function getDashboard(): Promise<DashboardData> {
  return unwrap<DashboardData>(await apiGet("/api/evaluations/dashboard"));
}
