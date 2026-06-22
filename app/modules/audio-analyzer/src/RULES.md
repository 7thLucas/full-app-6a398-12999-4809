# Audio Analyzer Module — RULES & Reference

> **MUST READ** before building UI or routes that consume `qb-micro-audio-analyzer-service`.

## 1. Data contract

UI **hanya** boleh memakai data yang ada di respons API (`TrackTranscribeResult` / `AnalysisResult`). Jangan menampilkan placeholder, mock, atau field yang belum tersedia di backend.

### Tersedia di API

| Area | Fields |
|------|--------|
| Job | `ticket_id`, `status`, `stage`, `logs`, `audio_urls`, `video_urls` |
| Analysis | `summary`, `metrics`, `segments`, `session_chunks`, `category_evaluations`, `recommendations_text`, dll. |
| Speaker (transkrip) | `speaker_id`, `speaker_name` per segmen (`ChatSegment`) — dari diarization/role pass, bukan profil HR |

### Belum tersedia — jangan ditampilkan

| UI element | Alasan |
|------------|--------|
| Nama petugas (profil) | Tidak ada entitas staff/user di respons |
| Foto profil | Tidak ada URL avatar di respons |
| Tanggal review | Tidak ada metadata tanggal review di respons |
| Waveform | Tidak ada data peak/amplitude di respons |

Gunakan `<audio>` / `<video>` native dengan `audio_urls` / `video_urls` untuk playback. Seek/sync cukup lewat timestamp segmen (`start_ms` / `end_ms`).

## 2. Client

- Server-side client: `audioAnalyzer` singleton di `src/libs/audio-analyzer.ts`
- Base URL: env `AUDIO_ANALYZER_HOST` (default `http://localhost:4000`)
- Types: `src/libs/types.ts` — mirror schema Python di microservice

## 3. Routes

Express routes auto-discovered dari `src/routes/*.routes.ts` → prefix `/api/...`.

| Method | Path | Upstream |
|--------|------|----------|
| GET | `/api/audio-analyzer/ping` | `GET /healthcheck` |
| POST | `/api/audio-analyzer/transcribe` | `POST /transcribe` via `audioAnalyzer.transcribe()` + `default-analysis-options.ts` |
| GET | `/api/audio-analyzer/transcribe/:ticketId` | `GET /transcribe/{ticket_id}` |
| GET | `/api/audio-analyzer/assets/:ticketId/:filename` | `GET /assets/{ticket_id}/{filename}` |

Server-only imports (client, routes) **jangan** di-re-export dari `index.ts` (ikuti pola `configurables`).

## 4. Client hooks & components

| Hook / Component | Purpose |
|------------------|---------|
| `useTranscribe()` | Queue files via `POST /api/audio-analyzer/transcribe` |
| `useTranscriptionResult(ticketId)` | Long-poll job status |
| `TranscriptionResult` | Composable result UI (Radix-style compound components) |

Browser fetch helpers live in `src/libs/audio-analyzer.client.ts` (types only from `src/libs/types.ts`).

Customize pipeline defaults in `src/constants/default-analysis-options.ts` (editable by AI / installers).
