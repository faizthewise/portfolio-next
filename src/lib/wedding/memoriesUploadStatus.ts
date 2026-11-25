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
> &
  Partial<Pick<UploadJob, "blob">>;
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
    if (job.kind === "photo") {
      const state = getPhotoUploadState(
        job,
        undefined,
        activeIds.has(job.id),
        online
      );
      const group =
        state.group === "attention"
          ? "failed"
          : state.group === "active"
          ? "active"
          : online
          ? "ready"
          : "waiting";
      counts[group].photo++;
      continue;
    }
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

type PhotoUploadJob = UploadStatusJob & { blob?: Blob };

type PhotoUploadState = {
  group: "attention" | "active" | "waiting";
  status: string;
  detail?: string;
  progress?: number;
  canRetry?: boolean;
};

export type PhotoTransferPhase = "Uploading photo" | "Confirming photo upload";

export const missingPhotoMediaCode = "photo/missing-local-media";

export function hasLocalPhotoMedia(job: { blob?: Blob }) {
  return job.blob instanceof Blob && job.blob.size > 0;
}

function hasFailure(job: UploadStatusJob) {
  return Boolean(job.error || job.errorCode || job.status === "Needs retry");
}

const networkFailures = new Set([
  "auth/network-request-failed",
  "deadline-exceeded",
  "storage/retry-limit-exceeded",
  "unavailable",
]);

const interruptedPhases = new Set([
  "Checking photo",
  "Checking account",
  "Identity ready",
  "Reserving photo slot",
  "Uploading photo",
  "Confirming photo upload",
]);

export function canResumePhotoUpload(job: PhotoUploadJob) {
  return (
    hasLocalPhotoMedia(job) &&
    (!hasFailure(job) || networkFailures.has(job.errorCode ?? ""))
  );
}

export function getPhotoUploadState(
  job: PhotoUploadJob,
  progress: number | undefined,
  active: boolean,
  online: boolean
): PhotoUploadState {
  if (!hasLocalPhotoMedia(job))
    return {
      group: "attention",
      status: "Photo unavailable",
      detail:
        "The original is missing from this device. Check your photo library for a copy.",
    };

  if (active && online) {
    if (
      job.status === "Confirming photo upload" ||
      (job.status === "Uploading photo" &&
        typeof progress === "number" &&
        progress >= 100)
    )
      return { group: "active", status: "Confirming upload…" };
    if (job.status === "Uploading photo")
      return {
        group: "active",
        status: "Uploading…",
        progress:
          typeof progress === "number" && Number.isFinite(progress)
            ? Math.max(0, Math.min(99, Math.round(progress)))
            : undefined,
      };
    return { group: "active", status: "Preparing your photo…" };
  }

  const networkFailure = networkFailures.has(job.errorCode ?? "");
  if (hasFailure(job) && !active && (online || !networkFailure))
    return {
      group: "attention",
      status: "Couldn’t upload",
      detail: online
        ? "Saved on this device. Try uploading again."
        : "Saved on this device. Reconnect to try again.",
      canRetry: online,
    };

  if (!online)
    return {
      group: "waiting",
      status: "Waiting for connection",
      detail:
        "Saved on this device. Return to Wedding Memories while online to continue.",
    };

  if (
    interruptedPhases.has(job.status) ||
    job.status.startsWith("Reserved photo ")
  )
    return {
      group: "attention",
      status: "Upload interrupted",
      detail: "Saved on this device. Try uploading again.",
      canRetry: true,
    };

  return {
    group: "waiting",
    status: "Waiting to upload",
    detail: "Saved on this device.",
  };
}

export type UploadAttemptResult = "uploaded" | "failed" | "active";

export type UploadBatchResult = {
  uploaded: number;
  failed: number;
  alreadyActive: number;
};

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
