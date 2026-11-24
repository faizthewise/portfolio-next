import { getWeddingGuest } from "@/lib/wedding/firebase";
import type { PhotoStyle } from "@/lib/wedding/memoriesRender";
import { getUploadFailure } from "@/lib/wedding/memoriesUploadStatus";
import { recordVoice, reservePhoto, uploadPhoto } from "@/lib/wedding/memories";
import {
  createAudioJob,
  createPhotoJob,
  getUploadJob,
  approveLocalPhotoDrafts as moveLocalPhotoDrafts,
  deleteLocalPhotoDraft,
  getLocalPhotoDraft,
  listLocalPhotoDrafts,
  removeUploadJob,
  saveLocalPhotoDraft as persistLocalPhotoDraft,
  saveUploadJob,
  validatePhotoBytes,
  type LocalPhotoDraft,
  type UploadJob,
  type WeddingMemorySide,
} from "@/lib/wedding/memoriesQueue";

export type UploadHandlers = {
  onJob?: (job: UploadJob) => void;
  onProgress?: (id: string, percent: number) => void;
};

export async function savePhotoDraft(
  side: WeddingMemorySide,
  event: UploadJob["event"],
  name: string,
  blob: Blob,
  photoStyle?: PhotoStyle
): Promise<UploadJob> {
  if (!name.trim() || name.trim().length > 100)
    throw new Error("Enter your name before adding photos.");
  const invalid = await validatePhotoBytes(blob);
  if (invalid) throw new Error(invalid);
  const job = createPhotoJob(side, event, name, blob, photoStyle);
  await saveUploadJob(job);
  return job;
}

export async function saveCameraPhotoDraft(
  side: WeddingMemorySide,
  event: UploadJob["event"],
  uid: string,
  name: string,
  blob: Blob,
  photoStyle: PhotoStyle,
  previewBlob: Blob | undefined,
  serverReservedCount: number
): Promise<LocalPhotoDraft> {
  if (!name.trim() || name.trim().length > 100)
    throw new Error("Enter your name before saving photos.");
  const invalid = await validatePhotoBytes(blob);
  if (invalid) throw new Error(invalid);
  const draft = createPhotoJob(
    side,
    event,
    name,
    blob,
    photoStyle,
    uid,
    previewBlob
  ) as LocalPhotoDraft;
  await persistLocalPhotoDraft(draft, serverReservedCount);
  return draft;
}

export async function readCameraPhotoDrafts(
  event: UploadJob["event"],
  uid: string
) {
  if (!uid) return [];
  return listLocalPhotoDrafts(event, uid);
}

export function removeCameraPhotoDraft(
  id: string,
  event: UploadJob["event"],
  uid: string
) {
  return deleteLocalPhotoDraft(id, event, uid);
}

export function approveCameraPhotoDrafts(
  ids: string[],
  event: UploadJob["event"],
  uid: string
) {
  return moveLocalPhotoDrafts(ids, event, uid);
}

export async function saveAudioDraft(
  side: WeddingMemorySide,
  event: UploadJob["event"],
  name: string,
  blob: Blob,
  isPrivate: boolean
): Promise<UploadJob> {
  if (!name.trim() || name.trim().length > 100)
    throw new Error("Enter your name before recording.");
  if (
    blob.size === 0 ||
    blob.size > 4 * 1024 * 1024 ||
    !/^audio\/(webm|mp4|ogg|3gpp)/.test(blob.type)
  ) {
    throw new Error("This voice note format or size is not supported.");
  }
  const job = createAudioJob(side, event, name, blob, isPrivate);
  await saveUploadJob(job);
  return job;
}

const processing = new Map<string, Promise<void>>();
export function processUploadJob(
  job: UploadJob,
  handlers: UploadHandlers = {}
): Promise<void> {
  const active = processing.get(job.id);
  if (active) return active;
  const task = processUploadJobOnce(job, handlers).finally(() =>
    processing.delete(job.id)
  );
  processing.set(job.id, task);
  return task;
}

async function processUploadJobOnce(
  job: UploadJob,
  handlers: UploadHandlers
): Promise<void> {
  let current = job;
  if (job.kind === "photo") {
    const heldDraft = await getLocalPhotoDraft(job.id);
    if (heldDraft)
      throw new Error("This photo is still waiting for your approval to upload.");
    const approvedJob = await getUploadJob(job.id);
    if (!approvedJob)
      throw new Error("This photo is not in the approved upload queue.");
    current = approvedJob;
  }
  try {
    const persistPhase = async (status: string) => {
      current = { ...current, status, error: undefined, errorCode: undefined };
      await saveUploadJob(current);
      handlers.onJob?.(current);
    };
    await persistPhase(current.kind === "photo" ? "Checking photo" : "Checking voice note");
    if (current.kind === "photo") {
      const invalid = await validatePhotoBytes(current.blob);
      if (invalid) throw new Error(invalid);
    }
    await persistPhase("Checking account");
    const uid = await getWeddingGuest();
    if (current.uid && current.uid !== uid) {
      throw new Error(
        "This queued upload belongs to a different browser account. Return to the original browser account to retry it."
      );
    }
    if (!current.uid) {
      current = { ...current, uid, status: "Identity ready", error: undefined };
      await saveUploadJob(current);
      handlers.onJob?.(current);
    }
    if (current.kind === "photo") {
      if (!current.slot) {
        await persistPhase("Reserving photo slot");
        const reserved = await reservePhoto(
          current.event,
          current.name,
          current.uploadKey
        );
        current = {
          ...current,
          uid: reserved.uid,
          slot: reserved.slot,
          status: `Reserved photo ${reserved.slot}`,
          error: undefined,
        };
        await saveUploadJob(current);
        handlers.onJob?.(current);
      }
      await persistPhase("Uploading photo");
      await uploadPhoto(
        current.event,
        current.slot!,
        current.uid!,
        current.name,
        current.blob,
        (percent) => {
          handlers.onProgress?.(current.id, percent);
        },
        current.uploadKey,
        current.photoStyle
      );
    } else {
      if (!current.uid) {
        current = {
          ...current,
          uid,
          status: "Preparing voice note",
          error: undefined,
          errorCode: undefined,
        };
        await saveUploadJob(current);
        handlers.onJob?.(current);
      }
      await recordVoice(
        current.event,
        current.name,
        current.blob,
        Boolean(current.isPrivate),
        `${uid}_${current.uploadKey}`,
        async (phase) => {
          current = {
            ...current,
            metadataSaved: phase === "metadata" || current.metadataSaved,
            bytesUploaded:
              phase === "bytes" ||
              phase === "complete" ||
              current.bytesUploaded,
            status:
              phase === "complete"
                ? "Complete"
                : phase === "bytes"
                ? "Publishing voice note"
                : "Uploading voice note",
            error: undefined,
          };
          await saveUploadJob(current);
          handlers.onJob?.(current);
        }
      );
    }
    await removeUploadJob(current.id);
  } catch (error) {
    const failure = getUploadFailure(error);
    current = {
      ...current,
      status: "Needs retry",
      error: failure.message,
      errorCode: failure.code,
    };
    await saveUploadJob(current);
    handlers.onJob?.(current);
    throw error;
  }
}

export async function createAndProcessPhotoDraft(
  side: WeddingMemorySide,
  event: UploadJob["event"],
  name: string,
  blob: Blob,
  handlers: UploadHandlers = {}
): Promise<UploadJob> {
  const job = await savePhotoDraft(side, event, name, blob);
  handlers.onJob?.(job);
  await processUploadJob(job, handlers);
  return job;
}

export async function createAndProcessAudioDraft(
  side: WeddingMemorySide,
  event: UploadJob["event"],
  name: string,
  blob: Blob,
  isPrivate: boolean,
  handlers: UploadHandlers = {}
): Promise<UploadJob> {
  const job = await saveAudioDraft(side, event, name, blob, isPrivate);
  handlers.onJob?.(job);
  await processUploadJob(job, handlers);
  return job;
}
