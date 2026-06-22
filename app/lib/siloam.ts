/*
 * Siloam shared domain constants & helpers — safe to import from both client
 * and server (no node:* or mongoose imports here).
 */

export type SiloamRole = "staff" | "unit_lead" | "quality_exec";

export const SILOAM_ROLES: { value: SiloamRole; label: string; description: string }[] = [
  { value: "staff", label: "Service Staff / Agent", description: "Handles calls. Sees own evaluations and action plans." },
  { value: "unit_lead", label: "Unit Lead", description: "Reviews staff in their unit, gives feedback, assigns action plans." },
  { value: "quality_exec", label: "Quality / Executive", description: "Org-wide view across hospitals and units." },
];

export interface SiloamProfile {
  fullName: string;
  role: SiloamRole;
  hospital: string;
  unit: string;
  completed: boolean;
}

/** Read the Siloam profile bag off a PublicUser.profile. */
export function getSiloamProfile(profile: Record<string, any> | undefined | null): SiloamProfile | null {
  const p = profile?.siloam;
  if (!p || typeof p !== "object") return null;
  return {
    fullName: p.fullName ?? "",
    role: (p.role as SiloamRole) ?? "staff",
    hospital: p.hospital ?? "",
    unit: p.unit ?? "",
    completed: Boolean(p.completed),
  };
}

export function roleLabel(role: SiloamRole | string | undefined): string {
  return SILOAM_ROLES.find((r) => r.value === role)?.label ?? "Staff";
}

// ── Score banding (mirrors configurables.scoreThresholds defaults) ──────────
export type ScoreBand = "excellent" | "good" | "needs_attention";

export function scoreBand(
  score: number | null | undefined,
  thresholds: { excellent: number; good: number }
): ScoreBand {
  if (score == null) return "needs_attention";
  if (score >= thresholds.excellent) return "excellent";
  if (score >= thresholds.good) return "good";
  return "needs_attention";
}

export const BAND_LABEL: Record<ScoreBand, string> = {
  excellent: "Excellent",
  good: "Good",
  needs_attention: "Needs Attention",
};

// Tailwind classes per band (theme-token aware where possible)
export const BAND_TEXT: Record<ScoreBand, string> = {
  excellent: "text-emerald-700",
  good: "text-primary",
  needs_attention: "text-destructive",
};

export const BAND_BG: Record<ScoreBand, string> = {
  excellent: "bg-emerald-100 text-emerald-800",
  good: "bg-secondary text-secondary-foreground",
  needs_attention: "bg-destructive/10 text-destructive",
};

// ── Issue severity bands ────────────────────────────────────────────────────
export type Severity = "critical" | "major" | "minor";

export function normalizeSeverity(raw: string | null | undefined, penalty?: number): Severity {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("crit") || s.includes("high") || s.includes("severe")) return "critical";
  if (s.includes("major") || s.includes("med")) return "major";
  if (s.includes("minor") || s.includes("low")) return "minor";
  // fall back to penalty magnitude
  if (penalty != null) {
    if (penalty >= 15) return "critical";
    if (penalty >= 7) return "major";
  }
  return "minor";
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  major: "Major",
  minor: "Minor",
};

export const SEVERITY_BADGE: Record<Severity, "destructive" | "warning" | "muted"> = {
  critical: "destructive",
  major: "warning",
  minor: "muted",
};

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  major: 1,
  minor: 2,
};

export function statusLabel(status: string | undefined): string {
  switch (status) {
    case "none": return "No action plan";
    case "assigned": return "Assigned";
    case "acknowledged": return "Acknowledged";
    case "in_progress": return "In Progress";
    case "completed": return "Completed";
    default: return status ?? "—";
  }
}

export const ACTION_FLOW: { value: string; label: string }[] = [
  { value: "assigned", label: "Assigned" },
  { value: "acknowledged", label: "Acknowledged" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];
