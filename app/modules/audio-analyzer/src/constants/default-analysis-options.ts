import type { TranscriptionAnalysisOptions } from "../libs/types";

/**
 * Default options sent with every transcribe job (maps to Python `TranscriptionAnalysisOptions`).
 *
 * Customize this file for your use case: domain context, speaker roles, scoring rules,
 * chunking thresholds, and per-pass settings. The API merges omitted fields with its
 * own server defaults.
 */
export const defaultAnalysisOptions: TranscriptionAnalysisOptions = {
  context:
    "Service conversation between staff and customer. Evaluate clarity, responsiveness, and problem resolution.",
  speaker_roles: ["staff", "customer", "other"],
  primary_role: "staff",
  default_role: "customer",
  role_display: {
    staff: "Staff",
    customer: "Customer",
    other: "Other",
  },
  scoring_rules: [
    {
      id: "courtesy_empathy",
      title: "Courtesy & empathy",
      rule: "Score 0-{max_score} for courtesy and empathy. Penalize missing greetings and unprofessional tone.",
      params: { max_score: "100" },
    },
    {
      id: "responsiveness",
      title: "Responsiveness",
      rule: "Score 0-{max_score} for clear, prompt answers. Penalize vague replies and long unexplained silences.",
      params: { max_score: "100" },
    },
    {
      id: "standard_compliance",
      title: "Standard compliance",
      rule: "Score 0-{max_score} for adherence to service standards: greeting, needs confirmation, accurate information, closing.",
      params: { max_score: "100" },
    },
    {
      id: "problem_solving",
      title: "Problem solving",
      rule: "Score 0-{max_score} for resolving the stated need with a clear action plan.",
      params: { max_score: "100" },
    },
  ],
  // chunking: {
  //   enabled: true,
  //   gap_threshold_ms: 180_000,
  //   silence_event_ms: 10_000,
  //   min_chunk_segments: 3,
  //   evaluate_per_chunk: true,
  // },
  // pass_settings: {
  //   noise_filter: { enabled: false },
  //   echo_dedup: { enabled: false },
  //   speaker_role: { fallback_speaker_id: "speaker_0" },
  //   category_evaluation: { base_score: 100 },
  //   overall_summary: { empty_label: "unknown" },
  // },
};
