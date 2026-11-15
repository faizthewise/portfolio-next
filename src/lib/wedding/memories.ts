import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  startAfter,
  updateDoc,
  where,
  type QueryDocumentSnapshot,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  getBlob,
  getMetadata,
} from "firebase/storage";
import {
  getWeddingFirestore,
  getWeddingGuest,
  getWeddingStorage,
  getWeddingOwnerFirestore,
  getWeddingOwnerStorage,
} from "@/lib/wedding/firebase";
import type { WeddingEventId } from "@/lib/wedding/invitations";
import { memoryCanonicalUrl } from "@/lib/wedding/memoryRoutes";
import {
  renderPhotoCanvas,
  type PhotoFilm,
  type PhotoStyle,
} from "@/lib/wedding/memoriesRender";
import { validatePhotoBytes } from "@/lib/wedding/memoriesQueue";

export const MEMORY_EVENTS = {
  bride: {
    id: "faiz-harissa" as const,
    name: "Harissa & Faiz",
    dateLabel: "28 November 2026",
    theme: "garden" as const,
  },
  groom: {
    id: "faiz-harissa-groom" as const,
    name: "Faiz & Harissa",
    dateLabel: "27 December 2026",
    theme: "songket" as const,
  },
};
export const MEMORY_HASHTAG = "#FaIzTheOneForHarissa";
export const PHOTO_LIMIT = 20;
export const PHOTO_MAX_BYTES = 12 * 1024 * 1024;
export const AUDIO_MAX_SECONDS = 30;
export type MemoryPhoto = {
  id: string;
  uid: string;
  slot: number;
  guestName: string;
  originalPath: string;
  contentType: string;
  size: number;
  createdAt?: { toDate(): Date };
  uploadKey?: string;
  photoStyle?: PhotoStyle;
  caption?: string;
};
export type MemoryWish = {
  id: string;
  uid: string;
  guestName: string;
  message: string;
  createdAt?: { toDate(): Date };
};
export type MemoryVoice = {
  id: string;
  uid: string;
  guestName: string;
  path: string;
  downloadUrl?: string;
  createdAt?: { toDate(): Date };
};
export type MemorySettings = {
  welcome: string;
  cover: string;
  film: PhotoFilm;
  stamp: string;
  bankRecipient: string;
  bankDetails: string;
  qrUrl: string;
};
const defaultSettings: MemorySettings = {
  welcome: "Share the moments you captured with us.",
  cover: "",
  film: "fp2",
  stamp: MEMORY_HASHTAG,
  bankRecipient: "",
  bankDetails: "",
  qrUrl: "",
};
const root = (event: WeddingEventId) => `weddings/${event}/memoryAlbums/main`;
function samePhotoStyle(
  existing: unknown,
  requested?: PhotoStyle
): boolean {
  if (!requested) return existing === undefined;
  if (!existing || typeof existing !== "object") return false;
  const style = existing as PhotoStyle;
  return (
    style.film === requested.film &&
    style.stamp === requested.stamp &&
    style.capturedAt === requested.capturedAt
  );
}
export const memoryUrl = (side: "bride" | "groom") =>
  memoryCanonicalUrl(side);
export const MEMORY_PAGE_SIZE = 24;
export type PhotoCursor = QueryDocumentSnapshot<DocumentData>;

export async function reservePhoto(
  event: WeddingEventId,
  guestName: string,
  uploadKey = crypto.randomUUID()
) {
  const uid = await getWeddingGuest();
  const db = getWeddingFirestore();
  const id = `${uid}_`;
  const slot = await runTransaction(db, async (tx) => {
    const refs = Array.from({ length: PHOTO_LIMIT }, (_, i) =>
      doc(db, `${root(event)}/reservations/${id}${i + 1}`)
    );
    const snaps = await Promise.all(refs.map((r) => tx.get(r)));
    const reused = snaps.findIndex(
      (snap) => snap.exists() && snap.data().uploadKey === uploadKey
    );
    if (reused >= 0) return reused + 1;
    const index = snaps.findIndex((snap) => !snap.exists());
    if (index < 0)
      throw new Error("You have used all 20 photo slots for this event.");
    const n = index + 1;
    tx.set(refs[index], {
      uid,
      slot: n,
      guestName,
      uploadKey,
      createdAt: serverTimestamp(),
    });
    return n;
  });
  return { uid, slot, photoId: `${uid}_${slot}` };
}

export async function uploadPhoto(
  event: WeddingEventId,
  slot: number,
  uid: string,
  guestName: string,
  file: Blob,
  onProgress: (value: number) => void,
  uploadKey?: string,
  photoStyle?: PhotoStyle
) {
  if (
    slot < 1 ||
    slot > PHOTO_LIMIT ||
    file.size > PHOTO_MAX_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(file.type)
  )
    throw new Error("Choose a JPG, PNG, or WebP photo up to 12 MB.");
  const invalidBytes = await validatePhotoBytes(file);
  if (invalidBytes) throw new Error(invalidBytes);
  const id = `${uid}_${slot}`;
  const path = `${root(event)}/photos/${uid}/${slot}/original`;
  const db = getWeddingFirestore();
  const reservation = await import("firebase/firestore").then(({ getDoc }) =>
    getDoc(doc(db, `${root(event)}/reservations/${id}`))
  );
  if (!reservation.exists() || reservation.data().uid !== uid)
    throw new Error("This photo slot is not reserved in this browser account.");
  const stableUploadKey = uploadKey ?? reservation.data().uploadKey;
  if (!stableUploadKey || reservation.data().uploadKey !== stableUploadKey)
    throw new Error("This upload no longer matches its reserved photo slot.");
  const storage = getWeddingStorage();
  const fileRef = ref(storage, path);
  try {
    const existing = await getMetadata(fileRef);
    if (
      existing.customMetadata?.uid !== uid ||
      existing.customMetadata?.slot !== String(slot) ||
      existing.customMetadata?.event !== event ||
      existing.customMetadata?.uploadKey !== stableUploadKey ||
      existing.size !== file.size ||
      existing.contentType !== file.type
    )
      throw new Error(
        "An upload already occupies this photo slot with different contents."
      );
  } catch (error) {
    if ((error as { code?: string }).code !== "storage/object-not-found")
      throw error;
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        uid,
        slot: String(slot),
        event,
        uploadKey: stableUploadKey,
      },
    });
    await new Promise<void>((resolve, reject) =>
      task.on(
        "state_changed",
        (s) =>
          onProgress(Math.round((s.bytesTransferred / s.totalBytes) * 100)),
        reject,
        resolve
      )
    );
  }
  const existingPhoto = await import("firebase/firestore").then(({ getDoc }) =>
    getDoc(doc(db, `${root(event)}/photos/${id}`))
  );
  if (existingPhoto.exists()) {
    const metadata = existingPhoto.data();
    if (
      metadata.uid === uid &&
      metadata.slot === slot &&
      metadata.originalPath === path &&
      metadata.uploadKey === stableUploadKey &&
      metadata.size === file.size &&
      metadata.contentType === file.type &&
      samePhotoStyle(metadata.photoStyle, photoStyle) &&
      metadata.status === "complete"
    )
      return id;
    throw new Error("A different photo already occupies this reserved slot.");
  }
  await setDoc(doc(db, `${root(event)}/photos/${id}`), {
    uid,
    slot,
    guestName,
    uploadKey: stableUploadKey,
    originalPath: path,
    contentType: file.type,
    size: file.size,
    createdAt: serverTimestamp(),
    status: "complete",
    ...(photoStyle ? { photoStyle } : {}),
  });
  return id;
}

export async function subscribePhotos(
  event: WeddingEventId,
  callback: (
    rows: MemoryPhoto[],
    cursor?: PhotoCursor,
    hasMore?: boolean
  ) => void,
  error: (e: Error) => void,
  guestUid?: string
): Promise<Unsubscribe> {
  const db = getWeddingFirestore();
  const extra = guestUid ? [where("uid", "==", guestUid)] : [];
  return onSnapshot(
    query(
      collection(db, `${root(event)}/photos`),
      where("status", "==", "complete"),
      orderBy("createdAt", "desc"),
      ...extra,
      limit(MEMORY_PAGE_SIZE)
    ),
    (snap) => {
      callback(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as MemoryPhoto)),
        snap.docs.at(-1),
        snap.size === MEMORY_PAGE_SIZE
      );
    },
    error
  );
}
export async function readMorePhotos(
  event: WeddingEventId,
  cursor: PhotoCursor,
  guestUid?: string
) {
  const db = getWeddingFirestore();
  const extra = guestUid ? [where("uid", "==", guestUid)] : [];
  const snap = await getDocs(
    query(
      collection(db, `${root(event)}/photos`),
      where("status", "==", "complete"),
      orderBy("createdAt", "desc"),
      ...extra,
      startAfter(cursor),
      limit(MEMORY_PAGE_SIZE)
    )
  );
  return {
    rows: snap.docs.map((d) => ({ id: d.id, ...d.data() } as MemoryPhoto)),
    cursor: snap.docs.at(-1) ?? cursor,
    hasMore: snap.size === MEMORY_PAGE_SIZE,
  };
}
export async function subscribePublicSettings(
  event: WeddingEventId,
  callback: (settings: MemorySettings) => void,
  error: (e: Error) => void
) {
  const db = getWeddingFirestore();
  return onSnapshot(
    doc(db, `${root(event)}/public/settings`),
    (snap) =>
      callback(
        snap.exists()
          ? ({ ...defaultSettings, ...snap.data() } as MemorySettings)
          : defaultSettings
      ),
    error
  );
}
export async function subscribeWishes(
  event: WeddingEventId,
  callback: (rows: MemoryWish[]) => void,
  error: (e: Error) => void
): Promise<Unsubscribe> {
  const db = getWeddingFirestore();
  return onSnapshot(
    query(
      collection(db, `${root(event)}/wishes`),
      orderBy("createdAt", "desc"),
      limit(100)
    ),
    (snap) =>
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as MemoryWish))),
    error
  );
}
export async function subscribeVoices(
  event: WeddingEventId,
  callback: (rows: MemoryVoice[]) => void,
  error: (e: Error) => void
): Promise<Unsubscribe> {
  const db = getWeddingFirestore();
  return onSnapshot(
    query(
      collection(db, `${root(event)}/voicePublic`),
      where("status", "==", "complete"),
      orderBy("createdAt", "desc"),
      limit(100)
    ),
    (snap) =>
      callback(
        snap.docs.map((d) => ({ id: d.id, ...d.data() } as MemoryVoice))
      ),
    error
  );
}
export async function readSettings(
  event: WeddingEventId
): Promise<MemorySettings> {
  const db = getWeddingFirestore();
  const snap = await import("firebase/firestore").then(({ getDoc }) =>
    getDoc(doc(db, `${root(event)}/public/settings`))
  );
  return snap.exists()
    ? ({ ...defaultSettings, ...snap.data() } as MemorySettings)
    : defaultSettings;
}
export async function saveWish(
  event: WeddingEventId,
  name: string,
  message: string
) {
  if (
    !name.trim() ||
    name.trim().length > 100 ||
    !message.trim() ||
    message.trim().length > 2000
  )
    throw new Error("Add your name and a message up to 2,000 characters.");
  const uid = await getWeddingGuest();
  const db = getWeddingFirestore();
  const id = `${uid}_${Date.now()}`;
  await setDoc(doc(db, `${root(event)}/wishes/${id}`), {
    uid,
    guestName: name.trim(),
    message: message.trim(),
    createdAt: serverTimestamp(),
  });
}
export async function saveFavorite(
  event: WeddingEventId,
  photoId: string,
  enabled = true
) {
  const uid = await getWeddingGuest();
  const favorite = doc(
    getWeddingFirestore(),
    `${root(event)}/photos/${photoId}/favorites/${uid}`
  );
  if (enabled) await setDoc(favorite, { uid, createdAt: serverTimestamp() });
  else
    await import("firebase/firestore").then(({ deleteDoc }) =>
      deleteDoc(favorite)
    );
}
export async function recordVoice(
  event: WeddingEventId,
  name: string,
  blob: Blob,
  isPrivate: boolean,
  recordId?: string,
  onPhase?: (phase: "metadata" | "bytes" | "complete") => Promise<void>
) {
  if (
    blob.size > 4 * 1024 * 1024 ||
    !/^audio\/(webm|mp4|ogg|3gpp)/.test(blob.type)
  )
    throw new Error("This voice note format or size is not supported.");
  const uid = await getWeddingGuest();
  const id = recordId ?? `${uid}_${crypto.randomUUID()}`;
  if (!id.startsWith(`${uid}_`))
    throw new Error("This voice note belongs to a different browser account.");
  const collectionName = isPrivate ? "voicePrivate" : "voicePublic";
  const uploadKey = id.slice(uid.length + 1);
  if (!/^[a-zA-Z0-9-]{36}$/.test(uploadKey))
    throw new Error("This voice note upload key is invalid.");
  const path = `${root(event)}/${
    isPrivate ? "privateAudio" : "publicAudio"
  }/${id}`;
  const db = getWeddingFirestore();
  const recordRef = doc(db, `${root(event)}/${collectionName}/${id}`);
  const existing = await import("firebase/firestore").then(({ getDoc }) =>
    getDoc(recordRef)
  );
  if (!existing.exists()) {
    await setDoc(recordRef, {
      uid,
      guestName: name.trim(),
      uploadKey,
      path,
      contentType: blob.type,
      createdAt: serverTimestamp(),
      status: "pending",
    });
  } else {
    const saved = existing.data();
    if (
      saved.uid !== uid ||
      saved.guestName !== name.trim() ||
      saved.path !== path ||
      saved.uploadKey !== uploadKey ||
      saved.contentType !== blob.type
    )
      throw new Error("A different recording already uses this note ID.");
    if (saved.status === "complete") {
      await onPhase?.("complete");
      return;
    }
  }
  await onPhase?.("metadata");
  const storage = getWeddingStorage();
  const audioRef = ref(storage, path);
  try {
    const metadata = await getMetadata(audioRef);
    if (
      metadata.customMetadata?.uid !== uid ||
      metadata.customMetadata?.event !== event ||
      metadata.customMetadata?.uploadKey !== uploadKey ||
      metadata.customMetadata?.private !== String(isPrivate) ||
      metadata.size !== blob.size ||
      metadata.contentType !== blob.type
    )
      throw new Error("A different recording already occupies this note path.");
  } catch (error) {
    if ((error as { code?: string }).code !== "storage/object-not-found")
      throw error;
    const task = uploadBytesResumable(audioRef, blob, {
      contentType: blob.type,
      customMetadata: { uid, event, private: String(isPrivate), uploadKey },
    });
    await new Promise<void>((resolve, reject) =>
      task.on("state_changed", undefined, reject, resolve)
    );
  }
  await onPhase?.("bytes");
  await updateDoc(recordRef, { status: "complete" });
  await onPhase?.("complete");
}
export async function readSettingsSnapshot(
  event: WeddingEventId,
  cb: (s: MemorySettings) => void,
  error: (e: Error) => void
) {
  const db = getWeddingOwnerFirestore();
  return onSnapshot(
    doc(db, `${root(event)}/public/settings`),
    (snap) =>
      cb(
        snap.exists()
          ? ({ ...defaultSettings, ...snap.data() } as MemorySettings)
          : defaultSettings
      ),
    error
  );
}
export async function updateSettings(
  event: WeddingEventId,
  values: MemorySettings
) {
  const db = getWeddingOwnerFirestore();
  await setDoc(doc(db, `${root(event)}/public/settings`), {
    ...values,
    updatedAt: serverTimestamp(),
  });
}
export async function readGuestPhotoCount(event: WeddingEventId) {
  const uid = await getWeddingGuest();
  const db = getWeddingFirestore();
  const checks = await Promise.all(
    Array.from({ length: PHOTO_LIMIT }, (_, index) =>
      import("firebase/firestore").then(({ getDoc }) =>
        getDoc(doc(db, `${root(event)}/reservations/${uid}_${index + 1}`))
      )
    )
  );
  return checks.filter((snapshot) => snapshot.exists()).length;
}
export async function readFavoriteIds(
  event: WeddingEventId,
  photoIds: string[]
) {
  const uid = await getWeddingGuest();
  const db = getWeddingFirestore();
  const checks = await Promise.all(
    photoIds.map((id) =>
      import("firebase/firestore").then(({ getDoc }) =>
        getDoc(doc(db, `${root(event)}/photos/${id}/favorites/${uid}`))
      )
    )
  );
  return photoIds.filter((_, index) => checks[index].exists());
}
export async function countMemories(event: WeddingEventId) {
  const db = getWeddingOwnerFirestore();
  const names = ["photos", "wishes", "voicePublic", "voicePrivate"];
  const snapshots = await Promise.all(
    names.map((name) => {
      const rows = collection(db, `${root(event)}/${name}`);
      return name === "wishes"
        ? getDocs(rows)
        : getDocs(query(rows, where("status", "==", "complete")));
    })
  );
  const contributors = new Set(
    snapshots.flatMap((snap) =>
      snap.docs.map((entry) => entry.data().uid as string).filter(Boolean)
    )
  );
  return Object.fromEntries([
    ...names.map((name, index) => [name, snapshots[index].size]),
    ["contributors", contributors.size],
  ]);
}
export async function exportMemoryFiles(
  event: WeddingEventId,
  onProgress: (label: string) => void
) {
  const db = getWeddingOwnerFirestore();
  const storage = getWeddingOwnerStorage();
  const [{ default: JSZip }, photosSnap, wishesSnap, publicSnap, privateSnap] =
    await Promise.all([
      import("jszip"),
      getDocs(
        query(
          collection(db, `${root(event)}/photos`),
          where("status", "==", "complete")
        )
      ),
      getDocs(collection(db, `${root(event)}/wishes`)),
      getDocs(
        query(
          collection(db, `${root(event)}/voicePublic`),
          where("status", "==", "complete")
        )
      ),
      getDocs(
        query(
          collection(db, `${root(event)}/voicePrivate`),
          where("status", "==", "complete")
        )
      ),
    ]);
  const zip = new JSZip();
  const favoritesByPhoto = await Promise.all(
    photosSnap.docs.map((photo) =>
      getDocs(collection(db, `${root(event)}/photos/${photo.id}/favorites`))
    )
  );
  const settings = await readSettings(event);
  const metadata = {
    event,
    exportedAt: new Date().toISOString(),
    settings,
    photos: photosSnap.docs.map((d, index) => ({
      id: d.id,
      ...d.data(),
      favorites: favoritesByPhoto[index].docs.map((favorite) => favorite.id),
    })),
    wishes: wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    publicVoices: publicSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    privateVoices: privateSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
  zip.file("metadata.json", JSON.stringify(metadata, null, 2));
  const getAsset = async (path: string) => getBlob(ref(storage, path));
  for (const d of photosSnap.docs) {
    const p = d.data();
    onProgress(`Photo ${d.id}`);
    const blob = await getAsset(p.originalPath);
    const ext =
      p.contentType === "image/png"
        ? "png"
        : p.contentType === "image/webp"
        ? "webp"
        : "jpg";
    zip.file(`originals/${d.id}.${ext}`, blob);
    const source = URL.createObjectURL(blob);
    try {
      const image = new Image();
      image.src = source;
      await image.decode();
      const styled = drawStyledPhoto(image, settings.film, settings.stamp, {
        photoDate: dateValue(p.createdAt),
        coupleNames: coupleNamesForEvent(event),
        photoStyle: p.photoStyle,
      });
      const styledBlob = await new Promise<Blob>((resolve, reject) =>
        styled.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error(`Could not render styled photo ${d.id}.`)),
          "image/jpeg",
          0.92
        )
      );
      zip.file(`styled-photos/${d.id}.jpg`, styledBlob);
    } finally {
      URL.revokeObjectURL(source);
    }
  }
  for (const d of publicSnap.docs) {
    const p = d.data();
    onProgress(`Public voice note ${d.id}`);
    zip.file(
      `voice-notes/public/${d.id}.${extension(p.contentType)}`,
      await getAsset(p.path)
    );
  }
  for (const d of privateSnap.docs) {
    const p = d.data();
    onProgress(`Private voice note ${d.id}`);
    zip.file(
      `voice-notes/private/${d.id}.${extension(p.contentType)}`,
      await getAsset(p.path)
    );
  }
  onProgress("Building ZIP archive");
  return zip.generateAsync({ type: "blob", compression: "DEFLATE" });
}
function extension(type: string) {
  return type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
}
export function drawStyledPhoto(
  image: HTMLImageElement,
  film: MemorySettings["film"],
  stamp: string,
  options: {
    maxDimension?: number;
    photoDate?: Date;
    coupleNames?: string;
    photoStyle?: PhotoStyle;
  } = {}
) {
  const selected = options.photoStyle;
  return renderPhotoCanvas(image, {
    film: selected?.film ?? film,
    stamp: selected?.stamp ?? stamp,
    capturedAt:
      selected?.capturedAt ??
      options.photoDate?.getTime() ??
      Date.now(),
    coupleNames: options.coupleNames ?? "Harissa & Faiz",
    maxDimension: options.maxDimension,
  });
}
function dateValue(value: unknown): Date | undefined {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  )
    return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}
function coupleNamesForEvent(event: WeddingEventId) {
  return event === "faiz-harissa" ? "Harissa & Faiz" : "Faiz & Harissa";
}
