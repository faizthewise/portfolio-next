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
  isPrivate?: boolean;
  metadataSaved?: boolean;
  bytesUploaded?: boolean;
  status: string;
  error?: string;
};

const DATABASE = "wedding-memories-queue-v2";
const STORE = "jobs";
const writeChains = new Map<string, Promise<unknown>>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "id" });
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
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let result: T;
        let settled = false;
        const transaction = db.transaction(STORE, mode);
        const request = action(transaction.objectStore(STORE));
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
  blob: Blob
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
    .then(() => withTransaction("readwrite", (store) => store.put(job)));
  writeChains.set(job.id, next);
  try {
    await next;
  } finally {
    if (writeChains.get(job.id) === next) writeChains.delete(job.id);
  }
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
  const rows = await withTransaction("readonly", (store) => store.getAll());
  return (
    event ? rows.filter((job) => job.event === event) : rows
  ) as UploadJob[];
}

export async function clearUploadQueueForTests(): Promise<void> {
  await withTransaction("readwrite", (store) => store.clear());
}
