# Siloam — Product Overview

## What it is

Siloam is a **Service Quality Evaluation System for Siloam Hospitals**. It ingests
customer-service audio (and video-with-audio) recordings, analyzes them with speech
and LLM models, scores agent performance across service-quality and safety
dimensions, and recommends targeted training courses to close the gaps it finds.

## Who it's for

- **Quality / training teams** — review automated evaluations, track agent
  performance over time, assign recommended courses.
- **Service agents** — receive structured, evidence-backed feedback on real calls.
- **Managers** — dashboards and reports for performance trends across teams.

## How it works (pipeline)

1. **Upload** — User uploads a call recording via the frontend.
2. **Store + enqueue** — Backend stores the media in AWS S3 and publishes an
   analysis job to RabbitMQ (queue `q.ai.analyze.requests`).
3. **Analyze** — AI service consumes the job and runs:
   transcription → speaker diarization → service-quality evaluation →
   course recommendation.
4. **Proxy (optional)** — A worker generates a 480p H.264 proxy for playback;
   the original may be purged once proxy + MP3 exist.
5. **Report** — Results flow back to the backend (MongoDB) and surface in the
   frontend as scored evaluations, transcripts, and recommended courses.

## Scoring model

Each call is evaluated across:

- **SOP compliance**
- **5R safety** — right patient, right medication, right dose, right route, right time
- **Courtesy, empathy, responsiveness, personalization, problem-solving**

Issues are categorized by score band: **critical (<70)**, **major (70–79)**,
**minor (80–89)**.

Course recommendations are produced by cosine-similarity matching of issue
embeddings against a training-course catalog (`siloam-ai/data/courses/`),
using sentence-transformers (default) or OpenAI embeddings.

## Architecture

Monorepo of three interconnected services (each deployed independently):

| Service | Stack | Role |
|---------|-------|------|
| **siloam-frontend** | TypeScript, React Router 7 (SSR), TailwindCSS v4, Vite | Upload UI, dashboards, reports |
| **siloam-backend** | Python, FastAPI, MongoDB (motor), AWS S3, RabbitMQ (aio-pika) | Auth, media storage, job orchestration, data API |
| **siloam-ai** | Python, FastAPI, Replicate/OpenAI/Anthropic/ElevenLabs, pyannote | Transcription, diarization, evaluation, course recs |

**Messaging:** Backend and AI are coupled via RabbitMQ — backend publishes
analysis jobs, AI consumes and replies.

**External integrations:** AWS S3 (media), Replicate / OpenAI / Anthropic (LLM
evaluation), ElevenLabs (TTS), MongoDB (data).

## Security & data handling

- **Auth:** JWT (RS256).
- **Field-level encryption:** Fernet on sensitive stored fields.
- **Rate limiting:** SlowAPI on the backend.
- Media access and PII handling are governed by env-configured S3 + encryption keys.

## Environments & deployment

- **CI/CD:** Jenkins (one `Jenkinsfile` per service), SonarQube scanning.
- **Branch → environment:** `siloam-dev` (development), `siloam-staging`
  (staging), `main`/`master` (production).
- **Packaging:** Docker per service, Kubernetes-ready (namespace per environment).

---

*This is a high-level product orientation. For build/run commands, env vars, and
service-specific conventions, see each service's README and config (`.env.example`,
`config.py`, `pyproject.toml`, `package.json`).*
