# @qb/audio-analyzer

> Audio and video analysis module — upload recordings, transcribe speech, and run AI-powered quality scoring. Includes Express routes, a server client, React hooks, and composable UI for the full transcription-and-analysis workflow.

| Field | Value |
|-------|-------|
| **Package** | `@qb/audio-analyzer` |
| **Version** | `1.0.0` |
| **Owner** | [Bytes-Quantum](https://github.com/Bytes-Quantum) |
| **Repo** | `github.com/Bytes-Quantum/microg-audio-analyzer` |

## Overview

**This package exists to analyze audio and video.** `@qb/audio-analyzer` is not a general file or text tool — every route, hook, and component is built around uploading **audio or video recordings**, turning speech into a transcript, and running AI quality analysis on that media.

It wires an Express backend to the `qb-micro-audio-analyzer-service` microservice and exposes a React-friendly surface for the frontend: upload audio/video → transcribe → score, summarize, and review findings (issues, strengths, segment-level transcript). The server proxies multipart uploads, job polling, and asset streaming; the client provides hooks and composable components for the full UX without direct microservice calls from the browser.

## Supported media

This module is built for **audio and video files only** — not documents, images, or other file types.

| Layer | What is accepted |
|-------|------------------|
| **UI upload** (`TranscriptionUpload`) | Browser files with MIME type `audio/*` or `video/*` (default `accept="audio/*,video/*"`). |
| **API** (`POST /api/audio-analyzer/transcribe`) | One or more `files` in `multipart/form-data`. Intended for audio/video media; the server forwards files as-is to the upstream service. |
| **Upstream processing** | Final format support (codec/container) is enforced by `qb-micro-audio-analyzer-service`. Unsupported files fail at the job level with an upstream error. |

**Typical formats** (when the browser reports the correct MIME type):

- **Audio:** MP3, WAV, M4A/AAC, OGG, FLAC, WebM audio
- **Video:** MP4, WebM, MOV, MKV, and other common `video/*` containers

The plugin does **not** restrict uploads to a single format (for example, MP4 only). Use standard audio/video files; if a job fails, check the upstream service logs for codec or container limits.

## What It Provides

- **`AudioAnalyzer` server client** — singleton class (`src/libs/audio-analyzer.ts`) that calls the upstream microservice (`ping`, `transcribe`, `trackTranscribe`, `getAsset`) and maps errors to typed `AudioAnalyzerError` instances.
- **Express route module** — four routes under `/api/audio-analyzer/*` auto-discoverable by the host app; handles multer uploads and streams asset responses.
- **Browser fetch helpers** — `queueTranscription` and `getTranscriptionStatus` in `src/libs/audio-analyzer.client.ts`, safe for import in browser bundles (no Node.js deps).
- **`useTranscribe` hook** — submits files to `POST /api/audio-analyzer/transcribe` and tracks ticket ID, loading, and error state.
- **`useTranscriptionResult` hook** — long-polls `GET /api/audio-analyzer/transcribe/:ticketId` at a configurable interval and auto-stops on terminal status (`completed` / `failed`).
- **`TranscriptionResult` compound component** — Radix-style composable UI (`Root`, `Content`, `Loading`, `Error`, `Header`, `Status`, `Stage`, `Scores`, `Summary`, `Issues`, `Strengths`, `Logs`, `Media`, `Transcript`) that reads from shared context — no prop drilling required.
- **`TranscriptionUpload` component** — drag-and-drop / click-to-browse picker for **audio and video** files (`audio/*`, `video/*`), with loading, dragging, and validation states.
- **`defaultAnalysisOptions`** — pre-configured `TranscriptionAnalysisOptions` (domain context, speaker roles, scoring rules) that the controller merges with any client-provided overrides.
- **Shared TypeScript types** — full schema mirror of the Python microservice (`TranscribeResult`, `TrackTranscribeResult`, `AnalysisResult`, `CategoryEvaluation`, `ChatSegment`, and more).

## UI/Component Change Policy

When editing anything under `src/components/` (including `TranscriptionResult` and `TranscriptionUpload`), **do not change runtime behavior, business logic, API contracts, or state flow unless it is truly necessary**. Prefer **style-only changes** (CSS, Tailwind classes, layout, spacing, typography, visuals) to keep functionality stable.

## Environment Variables

KEEP THE HARDCODED CLUSTER IP UNTOUCHED!

## API Reference

All routes are registered under the prefix `/api` by the host Express app.

| Method | Path | Controller | Description |
|--------|------|-----------|-------------|
| `GET` | `/api/audio-analyzer/ping` | `pingAudioAnalyzer` | Health check — proxies to upstream `GET /healthcheck` and returns `{ ok, upstream }`. |
| `POST` | `/api/audio-analyzer/transcribe` | `postTranscribe` | Accepts `multipart/form-data` with one or more **audio or video** `files` fields and an optional JSON `analysis_options` field. Queues transcription + analysis and returns `{ ticket_id }`. |
| `GET` | `/api/audio-analyzer/transcribe/:ticketId` | `getTranscribeStatus` | Returns full job status, transcript path, analysis result, audio/video URLs, and log entries. |
| `GET` | `/api/audio-analyzer/assets/:ticketId/:filename` | `getTranscribeAsset` | Streams a stored audio or video file from the microservice, forwarding `Content-Type` and `Content-Length`. |

## Source Layout

```
src/
├── index.ts                              # Client-safe public exports only
├── utils.ts                              # Singleton factory helper
├── RULES.md                              # Data-contract rules & integration guide
├── prescript.sh                          # Pre-install script (bun add multer)
├── libs/
│   ├── types.ts                          # Shared TypeScript types (mirrors Python schema)
│   ├── audio-analyzer.ts                 # Server-side AudioAnalyzer class + singleton
│   └── audio-analyzer.client.ts         # Browser fetch helpers (no Node deps)
├── constants/
│   ├── default-analysis-options.ts       # Editable default TranscriptionAnalysisOptions
│   └── resolve-analysis-options.ts       # Merges client override with defaults
├── controllers/
│   └── audio-analyzer.controller.ts     # Express request handlers
├── routes/
│   └── audio-analyzer.routes.ts         # Express Router definition
├── hooks/
│   ├── use-transcribe.ts                 # React hook: submit files, track ticket ID
│   └── use-transcription-result.ts      # React hook: long-poll job status
├── model/
│   └── audio-analyzer.model.ts          # Reserved (scaffold placeholder)
├── seed/
│   └── audio-analyzer.seed.ts           # Reserved (scaffold placeholder)
└── components/
    ├── transcription-upload.tsx          # Drag-and-drop upload component
    └── transcription-result/
        ├── index.ts                      # Compound component assembly
        ├── context.tsx                   # React context + provider
        ├── transcription-result-root.tsx
        ├── transcription-result-header.tsx
        ├── transcription-result-scores.tsx
        ├── transcription-result-issues.tsx
        ├── transcription-result-media.tsx
        ├── transcription-result-status-states.tsx
        ├── finding-card.tsx
        ├── primitives.tsx
        └── utils.ts
```

## Integration Steps

1. **Run the prescript** — execute `src/prescript.sh` (or `bun add multer`) in your host project to install the required server dependency.

2. **Set the microservice host** — add `AUDIO_ANALYZER_HOST=<url>` to your host project's environment. Update the singleton factory in `src/libs/audio-analyzer.ts` to read `process.env.AUDIO_ANALYZER_HOST` in place of the hardcoded IP.

3. **Mount the Express routes** — in your server entry point, import and register the router under the `/api` prefix:
   ```ts
   import audioAnalyzerRoutes from "~/modules/audio-analyzer/src/routes/audio-analyzer.routes";
   app.use("/api", audioAnalyzerRoutes);
   ```

4. **Customize analysis options** — edit `src/constants/default-analysis-options.ts` to set your domain context, speaker roles (`staff`, `customer`, …), and scoring rules. Per-keyspace config can also be loaded from `https://micro-audio-analyzer.quantumbyte.ai/api/configs/:keyspace` when `process.env._KEYSPACE` is set (falls back to the hardcoded defaults on 404). Client `analysis_options` overrides still merge on top.

5. **Upload audio or video** — use `TranscriptionUpload` or `POST /api/audio-analyzer/transcribe` with `audio/*` or `video/*` files. See [Supported media](#supported-media) above.

6. **Import client-side APIs from the package root only** — all browser-safe exports are available from `@qb/audio-analyzer`. Never import `audio-analyzer.ts`, routes, or the controller from client-side code; import those directly on the server.

7. **Render only API-available data** — see `src/RULES.md` for the full data contract. Do not display staff profile names/photos, review dates, waveforms, or any field not present in `TrackTranscribeResult` / `AnalysisResult`.

## Quick Start

```tsx
// ── Server (Express) ─────────────────────────────────────────────────────────
import audioAnalyzerRoutes from "~/modules/audio-analyzer/src/routes/audio-analyzer.routes";
app.use("/api", audioAnalyzerRoutes);

// ── Client (React) ───────────────────────────────────────────────────────────
import {
  useTranscribe,
  TranscriptionUpload,
  TranscriptionResult,
} from "@qb/audio-analyzer";

export function AudioPage() {
  const { submit, ticketId, isSubmitting } = useTranscribe();

  return (
    <div>
      <TranscriptionUpload
        isLoading={isSubmitting}
        onUpload={(file) => submit({ files: file })}
      />

      {ticketId && (
        <TranscriptionResult ticketId={ticketId}>
          <TranscriptionResult.Loading />
          <TranscriptionResult.Error />
          <TranscriptionResult.Content>
            <TranscriptionResult.Header />
            <TranscriptionResult.Status />
            <TranscriptionResult.Scores />
            <TranscriptionResult.Summary />
            <TranscriptionResult.Issues />
            <TranscriptionResult.Strengths />
            <TranscriptionResult.Transcript />
            <TranscriptionResult.Media />
            <TranscriptionResult.Logs />
          </TranscriptionResult.Content>
        </TranscriptionResult>
      )}
    </div>
  );
}
```
