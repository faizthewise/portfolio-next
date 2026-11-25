import type { UploadJob } from "@/lib/wedding/memoriesQueue";

type UploadStatusJob = {
  status: string;
  error?: string;
  errorCode?: string;
};

type HomeUploadState = "active" | "failed" | "waiting" | "ready";
type HomeUploadJob = Pick<
  UploadJob,
  "id" | "kind" | "status" | "error" | "errorCode"
>;
type HomeUploadCounts = Record<
  HomeUploadState,
  Record<UploadJob["kind"], number>
>;

export function getHomeUploadCounts(
  jobs: HomeUploadJob[],
  activeUploadIds: string[],
  online: boolean
): HomeUploadCounts {
  const counts: HomeUploadCounts = {
    active: { photo: 0, audio: 0 },
    failed: { photo: 0, audio: 0 },
    waiting: { photo: 0, audio: 0 },
    ready: { photo: 0, audio: 0 },
  };
  const activeIds = new Set(activeUploadIds);

  for (const job of jobs) {
    if (activeIds.has(job.id)) {
      counts[online ? "active" : "waiting"][job.kind]++;
    } else if (job.error || job.errorCode || job.status === "Needs retry") {
      counts.failed[job.kind]++;
    } else {
      counts[online ? "ready" : "waiting"][job.kind]++;
    }
  }

  return counts;
}

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
    status: online
      ? job.status || "Ready to upload"
      : "Waiting for an internet connection",
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
    const code =
      typeof candidate.code === "string" ? candidate.code : undefined;
    const message =
      typeof candidate.message === "string" && candidate.message.trim()
        ? candidate.message
        : "Upload failed. Try again.";
    return { message, code };
  }
  return {
    message:
      typeof error === "string" && error.trim()
        ? error
        : "Upload failed. Try again.",
  };
}
