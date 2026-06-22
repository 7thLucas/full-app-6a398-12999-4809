
# Siloam — Service Quality Evaluation System

## What it is
An internal B2B tool for **Siloam Hospitals** that automates customer-service call quality evaluation. Quality and training teams currently review call recordings by hand — slow, inconsistent, impossible to track over time. Siloam ingests a recording, transcribes + evaluates it with AI, produces evidence-backed scores, recommends training, and tracks remediation. Quality stops being a sampled spot-check and becomes a managed system.

## Users / Roles (permission-scoped — each sees only data for their scope)
- **Staff / Agent** — the person whose calls are evaluated. Can upload or live-record their own calls, view their own evaluations, read feedback, and respond to assigned action plans.
- **Admin** — can upload/record calls on behalf of staff members.
- **Unit Lead** — reviews evaluations for their unit, leaves feedback, assigns action plans, tracks follow-up. Dashboards scoped to their unit.
- **Quality / Executive** — org-wide view; dashboards aggregate scores across hospitals, units, and staff.

## Core loop (build this FIRST — it is the heart of the MVP)
1. A user (staff, or admin on their behalf) **uploads OR live-records** a customer-service call recording.
2. The recording is **transcribed and evaluated automatically with AI** — there is NO manual scoring step.
3. The user receives a **completed evaluation** containing:
   - **Per-category scores** (e.g. greeting/courtesy, problem resolution, empathy, compliance, closing) shown as a clear scorecard.
   - **Issues sorted into severity bands** (e.g. Critical / Major / Minor / Strengths) — clearly color-coded.
   - A **transcript with timestamps** as evidence; each issue/score points back to the moment in the call.
   - The **top-3 recommended training courses** tied to the weak spots.

## Review & dashboards
- Unit leads / executives **review evaluations**, leave **feedback**, assign an **action plan**, and track follow-up status.
- **Role-scoped dashboards** aggregate scores by hospital / unit / staff with trends over time.
- The **feedback + action-plan loop closes** between staff and leads (assigned → acknowledged → in progress → completed).

## North Star metric
- Primary: **Calls evaluated** (a recording analyzed into a completed, scored evaluation).
- Secondary: **Action plans closed** (a feedback + remediation loop completed between staff and lead).

## Tone & positioning
Calm, clinical, trustworthy, hospital-grade. This is a serious internal operations tool — NOT a flashy consumer app. Professional, evidence-driven, reassuring. Every score must be defensible (traceable to transcript evidence).

## MVP success criteria
- Upload or live-record a call → receive a completed evaluation with no manual intervention.
- Evaluation shows per-category scores, banded issues, transcript with timestamps, and top-3 courses.
- Role-scoped dashboards aggregate scores by hospital / unit / staff.
- Feedback + action-plan loop closes between staff and leads.

## Build priority order
1. Auth + role scoping (staff/admin, unit lead, quality/executive).
2. Core loop: upload/live-record → AI transcription + evaluation → completed evaluation view (scorecard, severity-banded issues, timestamped transcript, top-3 courses).
3. Review flow: lead leaves feedback + assigns action plan; staff sees and progresses it.
4. Role-scoped dashboards aggregating by hospital / unit / staff.
