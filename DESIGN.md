
# Siloam — Design Guidelines

## Direction
Calm, clinical, hospital-grade internal tool. Professional and evidence-driven, never flashy or playful. Generous whitespace, clear hierarchy, rounded cards, soft borders. Think a premium healthcare operations console — legible, reassuring, trustworthy.

## Color palette
*Source of truth: the live `siloam-frontend` app (Tailwind v4, Inter, `bg-slate-50` body). The deck and any new surfaces follow these.*
- **Primary — Blue:** `blue-900` (#1e3a8a) for primary actions/buttons (the `Button` primary variant), active nav, and key accents; hover `blue-800` (#1e40af). `blue-600` (#2563eb) for inline links/secondary accents and focus rings; `blue-50`/`blue-100` for soft backgrounds/badges; `blue-950` (#172554) for dark emphasis blocks.
- **Neutral — Gray/Slate:** `gray-900` for primary text and dark feature/ROI blocks; `gray-600` body copy; `gray-400`/`gray-500` secondary; `gray-200` borders; `gray-50`/white surfaces. (`slate-*` is interchangeable and used widely.)
- **Accent — Amber:** `amber-500`/`amber-600` (and `amber-50`/`amber-100` backgrounds) used sparingly for highlights, projections, and attention chips. Do not overuse.
- **Positive — Emerald:** `emerald-500`/`emerald-600` (`emerald-50` bg) for success, strengths, positive deltas.
- **Surfaces:** white app surface, very light gray/slate page background.

## Severity band colors (for issues)
- **Critical:** rose (`rose-50`/`rose-100` bg / `rose-600`/`rose-700` text/icon).
- **Major:** amber (`amber-50`/`amber-100` / `amber-700`).
- **Minor:** gray/slate (`gray-100` / `gray-600`).
- **Strength / positive:** emerald (`emerald-50` / `emerald-600`).
Always pair color with a text label — never rely on color alone (accessibility).

## Typography
- Sans-serif system/Inter-style. Bold, tight headings (`font-bold`, tight leading). Body `text-slate-600 leading-relaxed`.
- Section eyebrows: small uppercase, letter-spaced (`tracking-[0.18em]`), `text-blue-600` (or `text-amber-600` for accents).
- Use `font-mono` only for derived numeric formulas / data readouts.

## Components & elevation
- **Cards:** `rounded-2xl`, `border border-slate-200`, padding `p-6`/`p-7`. Minimal shadow — rely on borders and spacing.
- **Logo mark:** rounded-lg blue-600 square with white bold "S".
- **Badges/chips:** `rounded-full`, soft colored bg + matching text (blue for active, gray/slate for inactive).
- **Primary button:** blue-600 bg, white text, rounded (hover blue-700). **Secondary:** white bg, slate border.
- **Dark blocks:** `gray-900`/`blue-900` background with amber accents for emphasis / summary / ROI sections.
- **Score visuals:** clear scorecards, progress bars/rings in blue; consistent rubric layout.
- **Dashboards:** clean aggregation cards, restrained data-viz in blue/slate, amber only to flag.

## Layout
- Internal-tool shell: left sidebar nav (role-scoped) + top bar, content area on light slate background with white cards.
- Responsive but desktop-first (this is a back-office operations tool).
- Keep it uncluttered — clear primary action per screen.
