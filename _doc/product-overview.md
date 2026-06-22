# Siloam — Product Overview

**Siloam** is a Service Quality Evaluation System for **Siloam Hospitals** — an
internal tool that automates how quality and training teams score customer-service
call recordings. What was a slow, inconsistent, manual review of a thin sample of
calls becomes an automated, evidence-backed, trackable system.

---

## Problem & Goal

Quality and training teams at Siloam Hospitals manually review customer-service call
recordings to score agent performance — slow, inconsistent between reviewers, and hard
to track over time, so most calls go unscored and problems surface late.

Siloam automates the loop: **ingest a recording → transcribe + evaluate with AI →
produce evidence-backed scores → recommend training courses → track remediation.**
Staff get answers without manual scoring; leads and executives get dashboards and a
closing feedback loop.

## Who it's for (role-scoped)

- **Staff / agents** — the people whose calls are evaluated; admins can upload on their
  behalf.
- **Unit leads** — review evaluations, leave feedback, assign action plans, and track
  follow-up for their unit.
- **Quality & training teams / executives** — track aggregated scores and trends across
  hospital / unit / staff.

Each role sees data scoped to its permission level.

## The core loop

1. A staff member or admin **uploads or live-records** a call.
2. Siloam **transcribes and evaluates** it automatically with AI — no manual scoring.
3. The user receives a **completed evaluation**: per-category scores, issues sorted into
   **severity bands**, a **timestamped transcript** as evidence, and the **top-3
   recommended training courses**.
4. A lead **reviews, gives feedback, and opens an action plan**; remediation is tracked
   to closure.

## MVP capabilities (as built)

- Authentication and role-based onboarding (role + hospital + unit).
- Upload **or** live mic-recording of a call, with live transcription/analysis progress.
- AI-generated evaluation: per-category scores, severity-banded issues, timestamped
  transcript tied to the audio, and AI-generated **top-3 course recommendations**.
- **Role-scoped dashboards** aggregating scores by hospital / unit / staff, with average
  score and open-action counts.
- **Feedback thread** and an **action-plan remediation tracker** (open vs. completed)
  that closes the loop between staff and leads.

## MVP success criteria

- Upload or live-record a call → receive a completed evaluation without manual
  intervention.
- Evaluation shows per-category scores, banded issues, transcript with timestamps, and
  top-3 recommended courses.
- Role-scoped dashboards aggregate scores by hospital / unit / staff.
- Feedback + action-plan loop closes between staff and leads.

## What's next (staged roadmap)

- **Customizable scoring rubric** — let quality teams define and weight the categories
  the AI scores against.
- **Coaching-to-completion tracking** — track assigned training from recommendation
  through to course completion, with reminders.
- **Quality trends over time** — compare score movement across units and agents,
  period over period.

## Strategic principles

- **Coverage over sampling.** The win is every call scored, not a faster sample.
- **Evidence behind every score.** Each result points back to the exact moment in the
  transcript — defensible, coachable.
- **Internal, clinical, credible.** A hospital-grade B2B tool in a calm teal palette —
  trustworthy, not flashy.
