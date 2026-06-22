/*
 * Default Configurable Data — seeded into Mongo on first boot.
 *
 * BEFORE EDITING: read ./RULES.md (especially R5: schema and defaults must
 * stay in sync) and ./configurables.schema.ts. For per-type schema and
 * default-value samples, see RULES.md §5 "Field Type Reference".
 */

export type TBrandColor = {
  // Base
  background: string;
  foreground: string;
  // Card
  card: string;
  cardForeground: string;
  // Popover
  popover: string;
  popoverForeground: string;
  // Primary
  primary: string;
  primaryForeground: string;
  // Secondary
  secondary: string;
  secondaryForeground: string;
  // Muted
  muted: string;
  mutedForeground: string;
  // Accent
  accent: string;
  accentForeground: string;
  // Destructive
  destructive: string;
  destructiveForeground: string;
  // Border / Input / Ring
  border: string;
  input: string;
  ring: string;
  // Charts
  chart1?: string;
  chart2?: string;
  chart3?: string;
  chart4?: string;
  chart5?: string;
  // Navbar
  navbarBackground: string;
  // Sidebar
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;
};

export type TFont = {
  headingFont: string;
  textFont: string;
};

export type TScoreThresholds = {
  excellent: number;
  good: number;
};

export type TCourse = {
  id: string;
  title: string;
  focus: string;
  duration?: string;
};

export type TDefaultConfigurableData = {
  appName: string;
  logoUrl: string;
  brandColor: TBrandColor;
  font: TFont;
  // ── Siloam ────────────────────────────────────────────────────────────
  tagline?: string;
  organizationName?: string;
  supportEmail?: string;
  scoreThresholds: TScoreThresholds;
  hospitals?: string[];
  units?: string[];
  courseCatalog?: TCourse[];
  enableLiveRecording?: boolean;
  enableCourseRecommendations?: boolean;
};

export const defaultConfigurablesData: TDefaultConfigurableData = {
  appName: "Siloam",
  logoUrl: "",
  brandColor: {
    // Base — light slate page, deep slate text
    background:        "#f8fafc",
    foreground:        "#0f172a",
    // Card — white surfaces
    card:              "#ffffff",
    cardForeground:    "#0f172a",
    // Popover
    popover:           "#ffffff",
    popoverForeground: "#0f172a",
    // Primary — clinical teal
    primary:           "#0f766e",
    primaryForeground: "#ffffff",
    // Secondary — soft teal tint
    secondary:           "#ccfbf1",
    secondaryForeground: "#134e4a",
    // Muted — slate
    muted:           "#f1f5f9",
    mutedForeground: "#64748b",
    // Accent — amber
    accent:           "#fef3c7",
    accentForeground: "#92400e",
    // Destructive — rose (critical)
    destructive:           "#e11d48",
    destructiveForeground: "#ffffff",
    // Border / Input / Ring
    border: "#e2e8f0",
    input:  "#e2e8f0",
    ring:   "#0f766e",
    // Charts — teal/slate/amber palette
    chart1: "#0f766e",
    chart2: "#0d9488",
    chart3: "#334155",
    chart4: "#d97706",
    chart5: "#e11d48",
    // Navbar
    navbarBackground: "#ffffff",
    // Sidebar — deep slate with teal accents
    sidebarBackground:        "#0f172a",
    sidebarForeground:        "#cbd5e1",
    sidebarPrimary:           "#0f766e",
    sidebarPrimaryForeground: "#ffffff",
    sidebarAccent:            "#1e293b",
    sidebarAccentForeground:  "#f8fafc",
    sidebarBorder:            "#1e293b",
    sidebarRing:              "#14b8a6",
  },
  font: {
    headingFont: "Plus Jakarta Sans",
    textFont: "Inter",
  },
  // ── Siloam ──────────────────────────────────────────────────────────
  tagline: "Every patient call, scored, understood, and acted on.",
  organizationName: "Siloam Hospitals",
  supportEmail: "quality@siloamhospitals.com",
  scoreThresholds: {
    excellent: 90,
    good: 75,
  },
  hospitals: [
    "Siloam Hospitals Lippo Village",
    "Siloam Hospitals Kebon Jeruk",
    "Siloam Hospitals TB Simatupang",
    "Siloam Hospitals Surabaya",
  ],
  units: [
    "Contact Center",
    "Patient Admission",
    "Appointment & Scheduling",
    "Billing & Insurance",
    "Emergency Coordination",
  ],
  courseCatalog: [
    { id: "C-EMP-101", title: "Empathy in Patient Communication", focus: "Courtesy & empathy", duration: "2h" },
    { id: "C-RES-110", title: "Active Listening & Responsiveness", focus: "Responsiveness", duration: "1.5h" },
    { id: "C-STD-120", title: "Service Standards & Call Protocol", focus: "Standard compliance", duration: "3h" },
    { id: "C-PRB-130", title: "Structured Problem Resolution", focus: "Problem solving", duration: "2h" },
    { id: "C-DEX-140", title: "De-escalation for Difficult Calls", focus: "Courtesy & empathy", duration: "2h" },
    { id: "C-CLR-150", title: "Clarity & Accurate Information Delivery", focus: "Responsiveness", duration: "1h" },
    { id: "C-PRV-160", title: "Patient Privacy & Compliance Essentials", focus: "Standard compliance", duration: "1.5h" },
  ],
  enableLiveRecording: true,
  enableCourseRecommendations: true,
};
