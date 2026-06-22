import type { HTMLAttributes } from "react";
import { useTranscriptionResultContext } from "./context";
import { EmptyState, Section } from "./primitives";
import { cn, formatTime } from "./utils";

export function TranscriptionResultLogs({
  className,
  title = "Logs",
  emptyMessage = "Waiting for logs…",
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  emptyMessage?: string;
}) {
  const { result, logsEndRef } = useTranscriptionResultContext();
  const logs = result?.logs ?? [];

  return (
    <Section className={className} title={title} {...props}>
      <div className="h-44 overflow-y-auto rounded-lg bg-slate-950 p-4 font-mono text-sm text-slate-300">
        {logs.length === 0 ? (
          <p className="text-slate-500">{emptyMessage}</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="flex gap-3">
              <span className="shrink-0 text-slate-500">
                [{new Date(log.at).toLocaleTimeString()}]
              </span>
              <span className="break-all">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </Section>
  );
}

export function TranscriptionResultMedia({
  className,
  title = "Media",
  emptyMessage = "Media is not available yet.",
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  emptyMessage?: string;
}) {
  const { result, hasMedia, primaryMediaRef } = useTranscriptionResultContext();

  if (!result) {
    return null;
  }

  return (
    <Section className={className} title={title} {...props}>
      {!hasMedia ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="space-y-4">
          {result.video_urls.map((url, index) => (
            <video
              key={url}
              ref={
                index === 0
                  ? (element) => {
                      primaryMediaRef.current = element;
                    }
                  : undefined
              }
              controls
              className="aspect-video w-full rounded-lg border bg-black object-contain"
              src={url}
              title={`Video ${index + 1}`}
            />
          ))}
          {result.audio_urls.map((url, index) => (
            <audio
              key={url}
              ref={
                result.video_urls.length === 0 && index === 0
                  ? (element) => {
                      primaryMediaRef.current = element;
                    }
                  : undefined
              }
              controls
              className={cn("w-full")}
              src={url}
              title={`Audio ${index + 1}`}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

export function TranscriptionResultTranscript({
  className,
  title = "Transcript",
  description = "Click a line to seek media to that timestamp.",
  emptyMessage = "Transcript is not available yet.",
  ...props
}: HTMLAttributes<HTMLElement> & {
  title?: string;
  description?: string;
  emptyMessage?: string;
}) {
  const {
    transcriptSegments,
    activeTimestampMs,
    seekToTimestamp,
    segmentRefs,
  } = useTranscriptionResultContext();

  return (
    <section
      className={cn(
        "flex min-h-0 flex-col rounded-xl border bg-card shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="shrink-0 border-b px-4 py-3">
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {transcriptSegments.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          transcriptSegments.map((segment, index) => {
            const key = `${segment.start_ms}-${index}`;
            const endMs = segment.end_ms > 0 ? segment.end_ms : segment.start_ms;
            const isActive =
              activeTimestampMs !== null &&
              activeTimestampMs >= segment.start_ms &&
              activeTimestampMs <= endMs;

            return (
              <button
                key={key}
                type="button"
                ref={(element) => {
                  segmentRefs.current[key] = element;
                }}
                onClick={() => seekToTimestamp(segment.start_ms)}
                className={cn(
                  "w-full rounded-lg px-3 py-2 text-left transition",
                  isActive
                    ? "bg-violet-50 ring-2 ring-violet-300 dark:bg-violet-950/40 dark:ring-violet-700"
                    : "hover:bg-muted/50",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-violet-700 dark:text-violet-300">
                    {segment.speaker_name || segment.speaker_id}
                  </p>
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatTime(segment.start_ms)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6">{segment.text || "[no text]"}</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
