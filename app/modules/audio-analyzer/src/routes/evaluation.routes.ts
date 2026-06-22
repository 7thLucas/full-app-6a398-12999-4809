/*
 * Siloam Evaluation API — server-only Express routes, auto-discovered by the
 * host (app/api/routes.ts scans app/modules/<slug>/src/routes/*.routes.ts).
 *
 * Endpoints (all mounted under /api):
 *   POST   /api/evaluations                 create (staff/lead/exec/admin)
 *   GET    /api/evaluations                 list, role-scoped
 *   GET    /api/evaluations/:id             get one, role-scoped
 *   PATCH  /api/evaluations/:id/finalize    write score snapshot + courses
 *   POST   /api/evaluations/:id/feedback    add reviewer feedback
 *   PUT    /api/evaluations/:id/action-plan assign/update action plan
 *   PATCH  /api/evaluations/:id/action-status  advance the remediation status
 *   GET    /api/evaluations/dashboard       aggregated metrics, role-scoped
 *   PUT    /api/siloam/profile              save Siloam profile (role/hospital/unit)
 */
import { Router } from "express";
import type { Request, Response } from "express";
import { requireAuth } from "~/modules/authentication/authentication.middleware";
import { UserRole } from "~/modules/authentication/authentication.types";
import { UserModel } from "~/modules/authentication/authentication.model";
import { EvaluationModel } from "../models/evaluation.model";

const router = Router();

type SiloamRole = "staff" | "unit_lead" | "quality_exec";

function siloamRole(user: Request["user"]): SiloamRole | "admin" {
  if (user?.role === UserRole.Admin) return "admin";
  const r = user?.profile?.siloam?.role;
  return (r as SiloamRole) ?? "staff";
}

function siloamScope(user: Request["user"]): { hospital?: string; unit?: string } {
  return {
    hospital: user?.profile?.siloam?.hospital,
    unit: user?.profile?.siloam?.unit,
  };
}

/**
 * Build a Mongo filter scoped to what the requesting user is allowed to see.
 *  - admin / quality_exec: everything
 *  - unit_lead: their hospital + unit
 *  - staff: only evaluations about themselves (subjectUserId) or uploaded by them
 */
function scopeFilter(user: Request["user"]): Record<string, any> {
  const role = siloamRole(user);
  if (role === "admin" || role === "quality_exec") return {};
  const { hospital, unit } = siloamScope(user);
  if (role === "unit_lead") {
    const f: Record<string, any> = {};
    if (hospital) f.hospital = hospital;
    if (unit) f.unit = unit;
    return f;
  }
  // staff
  return { $or: [{ subjectUserId: user!.id }, { uploadedById: user!.id }] };
}

function canReview(user: Request["user"]): boolean {
  const role = siloamRole(user);
  return role === "admin" || role === "quality_exec" || role === "unit_lead";
}

// ── Profile ─────────────────────────────────────────────────────────────────
router.put("/siloam/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { fullName, role, hospital, unit } = req.body ?? {};
    const user = await UserModel.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }
    user.profile = {
      ...(user.profile ?? {}),
      siloam: {
        fullName: String(fullName ?? "").trim(),
        role: (role as SiloamRole) ?? "staff",
        hospital: String(hospital ?? "").trim(),
        unit: String(unit ?? "").trim(),
        completed: true,
      },
    };
    user.markModified("profile");
    await user.save();
    res.json({ success: true, data: user.profile.siloam });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to save profile" });
  }
});

// ── Create ────────────────────────────────────────────────────────────────--
router.post("/evaluations", requireAuth, async (req: Request, res: Response) => {
  try {
    const b = req.body ?? {};
    if (!b.ticketId || !b.staffName || !b.hospital || !b.unit) {
      res.status(400).json({ success: false, message: "ticketId, staffName, hospital and unit are required" });
      return;
    }
    const doc = await EvaluationModel.create({
      ticketId: String(b.ticketId),
      status: "processing",
      staffName: String(b.staffName),
      hospital: String(b.hospital),
      unit: String(b.unit),
      callTitle: String(b.callTitle ?? ""),
      notes: String(b.notes ?? ""),
      uploadedById: req.user!.id,
      uploadedByName: req.user!.profile?.siloam?.fullName || req.user!.username,
      subjectUserId: String(b.subjectUserId ?? ""),
    });
    res.status(201).json({ success: true, data: doc.toObject() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to create evaluation" });
  }
});

// ── List (role-scoped) ───────────────────────────────────────────────────────
router.get("/evaluations", requireAuth, async (req: Request, res: Response) => {
  try {
    const filter = { deletedAt: null, ...scopeFilter(req.user) };
    const docs = await EvaluationModel.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    res.json({ success: true, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to list evaluations" });
  }
});

// ── Dashboard aggregation (role-scoped) ──────────────────────────────────────
router.get("/evaluations/dashboard", requireAuth, async (req: Request, res: Response) => {
  try {
    const filter = { deletedAt: null, status: "completed", ...scopeFilter(req.user) };
    const docs = await EvaluationModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();

    const scores = docs.map((d) => d.overallScore).filter((s): s is number => typeof s === "number");
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

    const byKey = (key: "hospital" | "unit" | "staffName") => {
      const map: Record<string, { total: number; count: number }> = {};
      for (const d of docs) {
        if (typeof d.overallScore !== "number") continue;
        const k = (d as any)[key] || "—";
        map[k] = map[k] || { total: 0, count: 0 };
        map[k].total += d.overallScore;
        map[k].count += 1;
      }
      return Object.entries(map)
        .map(([name, v]) => ({ name, avgScore: Math.round(v.total / v.count), count: v.count }))
        .sort((a, b) => b.avgScore - a.avgScore);
    };

    const openActions = await EvaluationModel.countDocuments({
      deletedAt: null,
      actionPlanStatus: { $in: ["assigned", "acknowledged", "in_progress"] },
      ...scopeFilter(req.user),
    });

    res.json({
      success: true,
      data: {
        totalEvaluations: docs.length,
        avgScore: avg,
        openActions,
        byHospital: byKey("hospital"),
        byUnit: byKey("unit"),
        byStaff: byKey("staffName"),
        recent: docs.slice(0, 6),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to load dashboard" });
  }
});

// ── Get one (role-scoped) ────────────────────────────────────────────────────
router.get("/evaluations/:id", requireAuth, async (req: Request, res: Response) => {
  try {
    const doc = await EvaluationModel.findOne({ _id: req.params.id, deletedAt: null, ...scopeFilter(req.user) }).lean();
    if (!doc) {
      res.status(404).json({ success: false, message: "Evaluation not found" });
      return;
    }
    res.json({ success: true, data: doc });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to load evaluation" });
  }
});

// ── Finalize (write score snapshot + course recommendations) ─────────────────
router.patch("/evaluations/:id/finalize", requireAuth, async (req: Request, res: Response) => {
  try {
    const b = req.body ?? {};
    const doc = await EvaluationModel.findOne({ _id: req.params.id, deletedAt: null });
    if (!doc) {
      res.status(404).json({ success: false, message: "Evaluation not found" });
      return;
    }
    doc.status = b.status === "failed" ? "failed" : "completed";
    if (typeof b.overallScore === "number") doc.overallScore = b.overallScore;
    if (Array.isArray(b.categoryScores)) doc.categoryScores = b.categoryScores;
    if (typeof b.issueCount === "number") doc.issueCount = b.issueCount;
    if (typeof b.summary === "string") doc.summary = b.summary;
    if (Array.isArray(b.recommendedCourses)) doc.recommendedCourses = b.recommendedCourses;
    await doc.save();
    res.json({ success: true, data: doc.toObject() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to finalize" });
  }
});

// ── Feedback ────────────────────────────────────────────────────────────────
router.post("/evaluations/:id/feedback", requireAuth, async (req: Request, res: Response) => {
  try {
    const message = String(req.body?.message ?? "").trim();
    if (!message) {
      res.status(400).json({ success: false, message: "Message is required" });
      return;
    }
    const doc = await EvaluationModel.findOne({ _id: req.params.id, deletedAt: null, ...scopeFilter(req.user) });
    if (!doc) {
      res.status(404).json({ success: false, message: "Evaluation not found" });
      return;
    }
    doc.feedback.push({
      authorId: req.user!.id,
      authorName: req.user!.profile?.siloam?.fullName || req.user!.username,
      role: siloamRole(req.user),
      message,
      at: new Date().toISOString(),
    });
    doc.markModified("feedback");
    await doc.save();
    res.json({ success: true, data: doc.toObject() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to add feedback" });
  }
});

// ── Action plan (reviewers assign) ───────────────────────────────────────────
router.put("/evaluations/:id/action-plan", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!canReview(req.user)) {
      res.status(403).json({ success: false, message: "Only unit leads and quality reviewers can assign action plans" });
      return;
    }
    const b = req.body ?? {};
    if (!b.title) {
      res.status(400).json({ success: false, message: "title is required" });
      return;
    }
    const doc = await EvaluationModel.findOne({ _id: req.params.id, deletedAt: null, ...scopeFilter(req.user) });
    if (!doc) {
      res.status(404).json({ success: false, message: "Evaluation not found" });
      return;
    }
    doc.actionPlan = {
      title: String(b.title),
      description: String(b.description ?? ""),
      courseIds: Array.isArray(b.courseIds) ? b.courseIds.map(String) : [],
      attachmentUrl: b.attachmentUrl ? String(b.attachmentUrl) : undefined,
      assignedById: req.user!.id,
      assignedByName: req.user!.profile?.siloam?.fullName || req.user!.username,
      assignedAt: new Date().toISOString(),
      dueDate: b.dueDate ? String(b.dueDate) : undefined,
    };
    doc.actionPlanStatus = "assigned";
    doc.markModified("actionPlan");
    await doc.save();
    res.json({ success: true, data: doc.toObject() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to save action plan" });
  }
});

// ── Action status advance (staff progresses, reviewers can too) ──────────────
router.patch("/evaluations/:id/action-status", requireAuth, async (req: Request, res: Response) => {
  try {
    const allowed = ["assigned", "acknowledged", "in_progress", "completed"];
    const next = String(req.body?.status ?? "");
    if (!allowed.includes(next)) {
      res.status(400).json({ success: false, message: "Invalid status" });
      return;
    }
    const doc = await EvaluationModel.findOne({ _id: req.params.id, deletedAt: null, ...scopeFilter(req.user) });
    if (!doc) {
      res.status(404).json({ success: false, message: "Evaluation not found" });
      return;
    }
    if (!doc.actionPlan) {
      res.status(400).json({ success: false, message: "No action plan assigned yet" });
      return;
    }
    doc.actionPlanStatus = next as any;
    await doc.save();
    res.json({ success: true, data: doc.toObject() });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message ?? "Failed to update status" });
  }
});

export default router;
