import type { PhotoStyle } from "@/lib/wedding/memoriesRender";
export type WeddingMemorySide = "bride" | "groom";
export type UploadKind = "photo" | "audio";
export type UploadJob = {
  id: string;
  event: "faiz-harissa" | "faiz-harissa-groom";
  side: WeddingMemorySide;
  kind: UploadKind;
  uploadKey: string;
  name: string;
  blob: Blob;
  createdAt: number;
  uid?: string;
  slot?: number;
  photoStyle?: PhotoStyle;
  previewBlob?: Blob;
  isPrivate?: boolean;
  metadataSaved?: boolean;
  bytesUploaded?: boolean;
  status: string;
  error?: string;
  errorCode?: string;
};
export type LocalPhotoDraft = UploadJob & {
  kind: "photo";
  uid: string;
  previewBlob?: Blob;
};
type StoredAudioJob = Omit<UploadJob, "blob" | "previewBlob"> & {
  kind: "audio";
  audioBytes: ArrayBuffer;
  audioType: string;
};
type StoredJob = UploadJob | StoredAudioJob;

// IndexedDB in some WebKit contexts cannot serialize a Blob. Keep the public
// queue API unchanged and restore legacy Blob rows as they are read.
const audioBytesByBlob = new WeakMap<Blob, Promise<ArrayBuffer>>();

async function serializeJob(job: UploadJob): Promise<StoredJob> {
  if (job.kind !== "audio") return job;
  const { blob, ...fields } = job;
  delete fields.previewBlob;
  let bytes = audioBytesByBlob.get(blob);
  if (!bytes) {
    bytes = blob.arrayBuffer();
    audioBytesByBlob.set(blob, bytes);
  }
  try {
    return {
      ...fields,
      kind: "audio",
      audioBytes: await bytes,
      audioType: blob.type,
    };
  } catch (error) {
    audioBytesByBlob.delete(blob);
    throw error;
  }
}

function restoreJob(row: StoredJob): UploadJob {
  if (!("audioBytes" in row)) return row;
  const { audioBytes, audioType, ...fields } = row;
  const blob = new Blob([audioBytes], { type: audioType });
  audioBytesByBlob.set(blob, Promise.resolve(audioBytes));
  return { ...fields, blob };
}

const DATABASE = "wedding-memories-queue-v2";
const STORE = "jobs";
const PHOTO_DRAFTS_STORE = "photoDrafts";
const writeChains = new Map<string, Promise<unknown>>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
      }
      if (!request.result.objectStoreNames.contains(PHOTO_DRAFTS_STORE)) {
        request.result.createObjectStore(PHOTO_DRAFTS_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
      };
      resolve(db);
    };
    request.onerror = () =>
      reject(
        request.error ?? new Error("Could not open local upload storage.")
      );
    request.onblocked = () =>
      reject(new Error("Local upload storage is busy in another tab."));
  });
}

function withTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>,
  storeName = STORE
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let result: T;
        let settled = false;
        const transaction = db.transaction(storeName, mode);
        let request: IDBRequest<T>;
        try {
          request = action(transaction.objectStore(storeName));
        } catch (error) {
          transaction.abort();
          db.close();
          reject(error);
          return;
        }
        request.onsuccess = () => {
          result = request.result;
        };
        request.onerror = () => {
          if (!settled) {
            settled = true;
            reject(
              request.error ?? new Error("Local upload storage request failed.")
            );
          }
        };
        transaction.oncomplete = () => {
          if (!settled) {
            settled = true;
            resolve(result);
          }
        };
        transaction.onabort = () => {
          if (!settled) {
            settled = true;
            reject(
              transaction.error ??
                new Error("Local upload storage transaction was aborted.")
            );
          }
        };
        transaction.onerror = () => {
          if (!settled) {
            settled = true;
            reject(
              transaction.error ??
                new Error("Local upload storage transaction failed.")
            );
          }
        };
        transaction.addEventListener("complete", () => db.close(), {
          once: true,
        });
        transaction.addEventListener("abort", () => db.close(), { once: true });
      })
  );
}

export function validatePhotoBlob(blob: Blob): string | undefined {
  if (!blob.size) return "This photo is empty.";
  if (blob.size > 12 * 1024 * 1024) return "Choose a photo up to 12 MB.";
  if (!["image/jpeg", "image/png", "image/webp"].includes(blob.type))
    return "Choose a JPG, PNG, or WebP photo.";
  return undefined;
}

export async function validatePhotoBytes(
  blob: Blob
): Promise<string | undefined> {
  const error = validatePhotoBlob(blob);
  if (error) return error;
  const bytes = new Uint8Array(await blob.slice(0, 12).arrayBuffer());
  const jpeg =
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff;
  const png =
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value
    );
  const webp =
    bytes.length >= 12 &&
    String.fromCharCode(...Array.from(bytes.slice(0, 4))) === "RIFF" &&
    String.fromCharCode(...Array.from(bytes.slice(8, 12))) === "WEBP";
  if (
    (blob.type === "image/jpeg" && !jpeg) ||
    (blob.type === "image/png" && !png) ||
    (blob.type === "image/webp" && !webp)
  )
    return "The selected file does not match its declared image format.";
  return undefined;
}

export function createPhotoJob(
  side: WeddingMemorySide,
  event: UploadJob["event"],
  name: string,
  blob: Blob,
  photoStyle?: PhotoStyle,
  uid?: string,
  previewBlob?: Blob
): UploadJob {
  const uploadKey = crypto.randomUUID();
  return {
    id: `${event}:photo:${uploadKey}`,
    side,
    event,
    kind: "photo",
    uploadKey,
    name: name.trim(),
    blob,
    photoStyle,
    previewBlob,
    uid,
    createdAt: Date.now(),
    status: "Saved on this device",
  };
}

export function createAudioJob(
  side: WeddingMemorySide,
  event: UploadJob["event"],
  name: string,
  blob: Blob,
  isPrivate: boolean
): UploadJob {
  const uploadKey = crypto.randomUUID();
  return {
    id: `${event}:audio:${uploadKey}`,
    side,
    event,
    kind: "audio",
    uploadKey,
    name: name.trim(),
    blob,
    isPrivate,
    createdAt: Date.now(),
    status: "Saved on this device",
  };
}

export async function saveUploadJob(job: UploadJob): Promise<void> {
  const previous = writeChains.get(job.id) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(async () => {
      const row = await serializeJob(job);
      await withTransaction("readwrite", (store) => store.put(row));
    });
  writeChains.set(job.id, next);
  try {
    await next;
  } finally {
    if (writeChains.get(job.id) === next) writeChains.delete(job.id);
  }
}

export async function saveLocalPhotoDraft(
  draft: LocalPhotoDraft,
  serverReservedCount: number,
  photoLimit = 20
): Promise<void> {
  if (!draft.uid || draft.kind !== "photo")
    throw new Error("A local photo draft needs its guest identity.");
  if (!Number.isInteger(serverReservedCount) || serverReservedCount < 0)
    throw new Error("The current photo count is unavailable.");

  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    let resultError: Error | undefined;
    let checkedJobs = false;
    let checkedDrafts = false;
    let jobs: StoredJob[] = [];
    let drafts: LocalPhotoDraft[] = [];
    const transaction = db.transaction([STORE, PHOTO_DRAFTS_STORE], "readwrite");
    const jobStore = transaction.objectStore(STORE);
    const draftStore = transaction.objectStore(PHOTO_DRAFTS_STORE);
    const jobsRequest = jobStore.getAll();
    const draftsRequest = draftStore.getAll();

    const saveIfReady = () => {
      if (!checkedJobs || !checkedDrafts || resultError) return;
      const belongsToGuest = (job: StoredJob) =>
        job.kind === "photo" &&
        job.event === draft.event &&
        (!job.uid || job.uid === draft.uid) &&
        !job.slot;
      const unreservedCount = jobs.filter(belongsToGuest).length +
        drafts.filter(belongsToGuest).length;
      if (serverReservedCount + unreservedCount >= photoLimit) {
        resultError = new Error("All 20 photo slots are already in use or waiting for upload.");
        transaction.abort();
        return;
      }
      const existing = [...jobs, ...drafts].find((job) => job.id === draft.id);
      if (existing) {
        resultError = new Error("This local photo draft already exists.");
        transaction.abort();
        return;
      }
      draftStore.put(draft);
    };
    jobsRequest.onsuccess = () => {
      jobs = jobsRequest.result as StoredJob[];
      checkedJobs = true;
      saveIfReady();
    };
    draftsRequest.onsuccess = () => {
      drafts = draftsRequest.result as LocalPhotoDraft[];
      checkedDrafts = true;
      saveIfReady();
    };
    jobsRequest.onerror = () => {
      resultError = jobsRequest.error ?? new Error("Could not count queued photos.");
      transaction.abort();
    };
    draftsRequest.onerror = () => {
      resultError = draftsRequest.error ?? new Error("Could not count local photo drafts.");
      transaction.abort();
    };
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => {
      db.close();
      reject(resultError ?? transaction.error ?? new Error("Could not save the local photo draft."));
    };
    transaction.onerror = () => {
      db.close();
      reject(resultError ?? transaction.error ?? new Error("Could not save the local photo draft."));
    };
    transaction.addEventListener("complete", () => db.close(), { once: true });
  });
}

export async function listLocalPhotoDrafts(
  event?: UploadJob["event"],
  uid?: string
): Promise<LocalPhotoDraft[]> {
  const rows = (await withTransaction(
    "readonly",
    (store) => store.getAll(),
    PHOTO_DRAFTS_STORE
  )) as LocalPhotoDraft[];
  return rows.filter(
    (draft) => (!event || draft.event === event) && (!uid || draft.uid === uid)
  );
}

export async function getLocalPhotoDraft(
  id: string
): Promise<LocalPhotoDraft | undefined> {
  return (await withTransaction(
    "readonly",
    (store) => store.get(id),
    PHOTO_DRAFTS_STORE
  )) as LocalPhotoDraft | undefined;
}

export async function deleteLocalPhotoDraft(
  id: string,
  event: UploadJob["event"],
  uid: string
): Promise<boolean> {
  const db = await openDatabase();
  return new Promise<boolean>((resolve, reject) => {
    let deleted = false;
    const transaction = db.transaction(PHOTO_DRAFTS_STORE, "readwrite");
    const store = transaction.objectStore(PHOTO_DRAFTS_STORE);
    const request = store.get(id);
    request.onsuccess = () => {
      const draft = request.result as LocalPhotoDraft | undefined;
      if (draft?.event === event && draft.uid === uid) {
        store.delete(id);
        deleted = true;
      }
    };
    transaction.oncomplete = () => { db.close(); resolve(deleted); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error("Could not delete this local photo.")); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Could not delete this local photo.")); };
  });
}

export async function approveLocalPhotoDrafts(
  ids: string[],
  event: UploadJob["event"],
  uid: string
): Promise<UploadJob[]> {
  const uniqueIds = Array.from(new Set(ids));
  if (!uniqueIds.length) return [];
  const db = await openDatabase();
  return new Promise<UploadJob[]>((resolve, reject) => {
    let resultError: Error | undefined;
    let jobs: StoredJob[] = [];
    let drafts: LocalPhotoDraft[] = [];
    let approved: UploadJob[] = [];
    let checkedJobs = false;
    let checkedDrafts = false;
    const transaction = db.transaction([STORE, PHOTO_DRAFTS_STORE], "readwrite");
    const jobStore = transaction.objectStore(STORE);
    const draftStore = transaction.objectStore(PHOTO_DRAFTS_STORE);
    const jobsRequest = jobStore.getAll();
    const draftsRequest = draftStore.getAll();
    const commitIfReady = () => {
      if (!checkedJobs || !checkedDrafts || resultError) return;
      const existingJobs = new Map(jobs.map((job) => [job.id, job]));
      const localDrafts = new Map(drafts.map((draft) => [draft.id, draft]));
      for (const id of uniqueIds) {
        const draft = localDrafts.get(id);
        if (!draft) continue;
        if (draft.event !== event || draft.uid !== uid || draft.kind !== "photo") {
          resultError = new Error("This local photo belongs to another event or browser account.");
          transaction.abort();
          return;
        }
        const existing = existingJobs.get(id);
        if (
          existing &&
          (existing.event !== event ||
            existing.uid !== uid ||
            existing.kind !== "photo" ||
            existing.uploadKey !== draft.uploadKey)
        ) {
          resultError = new Error("This upload ID belongs to another event or browser account.");
          transaction.abort();
          return;
        }
        const approvedJob = existing
          ? restoreJob(existing)
          : {
              ...draft,
              status: "Saved on this device",
              error: undefined,
            };
        if (!existing) jobStore.put(approvedJob);
        draftStore.delete(id);
        approved.push(approvedJob);
      }
    };
    jobsRequest.onsuccess = () => {
      jobs = jobsRequest.result as StoredJob[];
      checkedJobs = true;
      commitIfReady();
    };
    draftsRequest.onsuccess = () => {
      drafts = draftsRequest.result as LocalPhotoDraft[];
      checkedDrafts = true;
      commitIfReady();
    };
    jobsRequest.onerror = () => {
      resultError = jobsRequest.error ?? new Error("Could not approve local photos.");
      transaction.abort();
    };
    draftsRequest.onerror = () => {
      resultError = draftsRequest.error ?? new Error("Could not approve local photos.");
      transaction.abort();
    };
    transaction.oncomplete = () => { db.close(); resolve(approved); };
    transaction.onabort = () => { db.close(); reject(resultError ?? transaction.error ?? new Error("Could not approve local photos.")); };
    transaction.onerror = () => { db.close(); reject(resultError ?? transaction.error ?? new Error("Could not approve local photos.")); };
  });
}

export async function removeUploadJob(id: string): Promise<void> {
  const previous = writeChains.get(id) ?? Promise.resolve();
  const next = previous
    .catch(() => undefined)
    .then(() => withTransaction("readwrite", (store) => store.delete(id)));
  writeChains.set(id, next);
  try {
    await next;
  } finally {
    if (writeChains.get(id) === next) writeChains.delete(id);
  }
}

export async function listUploadJobs(
  event?: UploadJob["event"]
): Promise<UploadJob[]> {
  const rows: StoredJob[] = await withTransaction("readonly", (store) =>
    store.getAll()
  );
  return (event ? rows.filter((job) => job.event === event) : rows).map(
    restoreJob
  );
}

export async function getUploadJob(id: string): Promise<UploadJob | undefined> {
  const row: StoredJob | undefined = await withTransaction(
    "readonly",
    (store) => store.get(id)
  );
  return row && restoreJob(row);
}

export async function clearUploadQueueForTests(): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE, PHOTO_DRAFTS_STORE], "readwrite");
    transaction.objectStore(STORE).clear();
    transaction.objectStore(PHOTO_DRAFTS_STORE).clear();
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? new Error("Could not clear the test upload queue.")); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? new Error("Could not clear the test upload queue.")); };
  });
}
