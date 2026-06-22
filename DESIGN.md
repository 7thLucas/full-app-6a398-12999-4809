
# Siloam — Design Guidelines

## Direction
Calm, clinical, hospital-grade internal tool. Professional and evidence-driven, never flashy or playful. Generous whitespace, clear hierarchy, rounded cards, soft borders. Think a premium healthcare operations console — legible, reassuring, trustworthy.

## Color palette
- **Primary — Clinical Teal:** `teal-700` (#0f766e) for primary actions, active nav, key accents and headings emphasis. Lighter teals (`teal-50`, `teal-100`) for soft backgrounds/badges.
- **Neutral — Slate:** `slate-900` for primary text and dark feature/ROI blocks; `slate-600` for body copy; `slate-500` for secondary; `slate-200` for borders; `slate-50`/white for surfaces.
- **Accent — Amber:** `amber-600`/`amber-500` (and `amber-50`/`amber-100` backgrounds) used sparingly for highlights, projections, and attention chips. Do not overuse.
- **Surfaces:** white app surface, very light slate page background.

## Severity band colors (for issues)
- **Critical:** rose (`rose-100` bg / `rose-600` text/icon).
- **Major:** amber (`amber-100` / `amber-700`).
- **Minor:** slate (`slate-100` / `slate-600`).
- **Strength / positive:** teal/emerald (`teal-50` / `teal-700`).
Always pair color with a text label — never rely on color alone (accessibility).

## Typography
- Sans-serif system/Inter-style. Bold, tight headings (`font-bold`, tight leading). Body `text-slate-600 leading-relaxed`.
- Section eyebrows: small uppercase, letter-spaced (`tracking-[0.18em]`), `text-teal-700` (or `text-amber-600` for accents).
- Use `font-mono` only for derived numeric formulas / data readouts.

## Components & elevation
- **Cards:** `rounded-2xl`, `border border-slate-200`, padding `p-6`/`p-7`. Minimal shadow — rely on borders and spacing.
- **Logo mark:** rounded-lg teal-700 square with white bold "S".
- **Badges/chips:** `rounded-full`, soft colored bg + matching text (teal for active, slate for inactive).
- **Primary button:** teal-700 bg, white text, rounded. **Secondary:** white bg, slate border.
- **Dark blocks:** `slate-900` background with amber/teal accents for emphasis / summary / ROI sections.
- **Score visuals:** clear scorecards, progress bars/rings in teal; consistent rubric layout.
- **Dashboards:** clean aggregation cards, restrained data-viz in teal/slate, amber only to flag.

## Layout
- Internal-tool shell: left sidebar nav (role-scoped) + top bar, content area on light slate background with white cards.
- Responsive but desktop-first (this is a back-office operations tool).
- Keep it uncluttered — clear primary action per screen.
