import { useRef, useState, type ChangeEvent, type DragEvent, type HTMLAttributes } from "react";
import { cn } from "./transcription-result/utils";

function isMediaFile(file: File): boolean {
  return file.type.startsWith("audio/") || file.type.startsWith("video/");
}

export type TranscriptionUploadProps = Omit<HTMLAttributes<HTMLDivElement>, "onDrop"> & {
  onUpload: (file: File) => void | Promise<void>;
  isLoading?: boolean;
  disabled?: boolean;
  accept?: string;
  label?: string;
  hint?: string;
  loadingLabel?: string;
  draggingLabel?: string;
  invalidFileMessage?: string;
};

export function TranscriptionUpload({
  onUpload,
  isLoading = false,
  disabled = false,
  accept = "audio/*,video/*",
  label = "Click or drag a file",
  hint = "Audio or video files",
  loadingLabel = "Uploading…",
  draggingLabel = "Drop file here",
  invalidFileMessage = "Please upload an audio or video file.",
  className,
  ...props
}: TranscriptionUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isDisabled = disabled || isLoading;

  const handleFile = (file: File) => {
    if (!isMediaFile(file)) {
      setValidationError(invalidFileMessage);
      return;
    }

    setValidationError(null);
    void onUpload(file);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFile(file);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      {validationError && (
        <div
          className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {validationError}
        </div>
      )}

      <div
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 transition",
          isDragging
            ? "border-foreground/40 bg-muted/50"
            : "border-border bg-card hover:border-foreground/20 hover:bg-muted/30",
          isDisabled && "pointer-events-none opacity-60",
        )}
        onDragOver={(event) => {
          event.preventDefault();
          if (!isDisabled) {
            setIsDragging(true);
          }
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <p className="text-base font-medium">
          {isLoading ? loadingLabel : isDragging ? draggingLabel : label}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={isDisabled}
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
