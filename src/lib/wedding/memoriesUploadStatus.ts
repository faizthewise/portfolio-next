type UploadStatusJob = {
  status: string;
  error?: string;
  errorCode?: string;
};

export type PhotoUploadPresentation = {
  status: string;
  progress?: number;
  error?: string;
  retryDisabled: boolean;
  retryLabel: string;
};

export type UploadAttemptResult = "uploaded" | "failed" | "active";

export type UploadBatchResult = {
  uploaded: number;
  failed: number;
  alreadyActive: number;
};

export function getPhotoUploadPresentation(
  job: UploadStatusJob,
  progress: number | undefined,
  active: boolean,
  online: boolean
): PhotoUploadPresentation {
  const percent =
    typeof progress === "number"
      ? Math.max(0, Math.min(100, Math.round(progress)))
      : undefined;
  return {
    status: online ? job.status || "Ready to upload" : "Waiting for an internet connection",
    progress: percent,
    error: job.error
      ? [job.errorCode, job.error].filter(Boolean).join(": ")
      : undefined,
    retryDisabled: active || !online,
    retryLabel: !online
      ? "Waiting for connection"
      : active
        ? "Uploading…"
        : "Retry upload",
  };
}

export function getUploadFailure(error: unknown): {
  message: string;
  code?: string;
} {
  if (error && typeof error === "object") {
    const candidate = error as { code?: unknown; message?: unknown };
    const code = typeof candidate.code === "string" ? candidate.code : undefined;
    const message =
      typeof candidate.message === "string" && candidate.message.trim()
        ? candidate.message
        : "Upload failed. Try again.";
    return { message, code };
  }
  return {
    message: typeof error === "string" && error.trim() ? error : "Upload failed. Try again.",
  };
}
