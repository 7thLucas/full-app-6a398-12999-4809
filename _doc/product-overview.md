# Siloam — MVP Product Requirements Document

**Product:** Service Quality Evaluation System for Siloam Hospitals
**Scope of this doc:** MVP. Focus on frontend UI, user flows, and the core
business logic the product owns. Backend/AI internals referenced only where they
shape the UX.
**Companion docs:** `product-overview.md` (orientation), `user-flows.md`
(behavioral map).

---

## 1. Problem & Goal

Quality and training teams at Siloam Hospitals manually review customer-service
call recordings to score agent performance — slow, inconsistent, hard to track
over time. Siloam automates the loop: ingest a recording → transcribe + evaluate
with AI → produce evidence-backed scores → recommend training courses → track
remediation.

**MVP goal:** A staff member (or admin on their behalf) can get a recording
analyzed and receive a structured, scored evaluation with transcript evidence and
course recommendations; a unit lead / executive can review, give feedback, and
track follow-up through dashboards.

**MVP success criteria**
- Upload or live-record a call → receive a completed evaluation without manual
  intervention.
- Evaluation shows per-category scores, banded issues, transcript with
  timestamps, and top-3 recommended courses.
- Role-scoped dashboards aggregate scores by hospital / unit / staff.
- Feedback + action-plan loop closes between staff and leads.

---