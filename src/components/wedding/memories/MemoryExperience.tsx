import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Cormorant_Garamond, Great_Vibes, Lora } from "next/font/google";
import { Heart, Mic, Upload, Image as ImageIcon } from "lucide-react";
import { getBlob, getDownloadURL, ref } from "firebase/storage";
import { getWeddingStorage, getWeddingGuest } from "@/lib/wedding/firebase";
import { brideInvitation, groomInvitation } from "@/lib/wedding/invitations";
import {
  MEMORY_PUBLIC_ALBUMS,
  memoryCanonicalUrl,
  memoryPath,
} from "@/lib/wedding/memoryRoutes";
import {
  drawStyledPhoto,
  MEMORY_EVENTS,
  MEMORY_HASHTAG,
  PHOTO_LIMIT,
  saveWish,
  saveFavorite,
  readFavoriteIds,
  readGuestPhotoCount,
  readMorePhotos,
  subscribePhotos,
  subscribeWishes,
  subscribeVoices,
  subscribePublicSettings,
  type MemoryPhoto,
  type MemoryWish,
  type MemoryVoice,
  type MemorySettings,
  type PhotoCursor,
} from "@/lib/wedding/memories";
import {
  listUploadJobs,
  type LocalPhotoDraft,
  type UploadJob,
} from "@/lib/wedding/memoriesQueue";
import {
  approveCameraPhotoDrafts,
  processUploadJob,
  readCameraPhotoDrafts,
  removeCameraPhotoDraft,
  saveCameraPhotoDraft,
  saveAudioDraft,
  savePhotoDraft,
} from "@/lib/wedding/memoriesUploads";
import type {
  UploadAttemptResult,
  UploadBatchResult,
} from "@/lib/wedding/memoriesUploadStatus";
import {
  getPhotoUploadPresentation,
  getUploadFailure,
} from "@/lib/wedding/memoriesUploadStatus";
import {
  appendMemoryRows,
  applyMemoryHead,
  applyMemoryTail,
  beginMemoryPage,
  mergeMemoryRows,
  resetMemoryPage,
} from "@/lib/wedding/memoriesPagination";
import { MemoryCamera } from "./MemoryCamera";
import { MemoryGuestHub } from "./MemoryGuestHub";
import { MemoryGuestNav } from "./MemoryGuestNav";
import { MemoryHomeUploadStatus } from "./MemoryHomeUploadStatus";
import { MemoryGuestPanel } from "./MemoryGuestPanel";
import type { PhotoStyle } from "@/lib/wedding/memoriesRender";
import styles from "./Memories.module.css";
import homeStyles from "./MemoryGuestHome.module.css";

const memoryTitle = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--memory-editorial",
  display: "swap",
});
const memoryNames = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--memory-signature",
  display: "swap",
});
const memoryText = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
  preload: false,
});

type GuestPanel = "album" | "voice" | "wish" | "salam" | "upload" | "identity";
type IdentityIntent = "camera" | "review" | "upload" | "voice" | "wish";
type QuotaState = "loading" | "ready" | "error";

const panelTitles: Record<GuestPanel, string> = {
  album: "My album",
  voice: "Voice note",
  wish: "Write a wish",
  salam: "Salam Kaut",
  upload: "Upload photos",
  identity: "Add your name",
};

const identityCopy: Record<IdentityIntent, string> = {
  camera: "Your name will appear with the photos you share.",
  review: "Enter your name to open your camera tray.",
  upload: "Your name will appear with the photos you share.",
  voice: "Your name will appear with your voice note.",
  wish: "Your name will appear with your wish in the shared gallery.",
};

const photoVisibility =
  "Anyone with the album link can view the photos you share.";

export function MemoryExperience({
  side,
  page = "guest",
}: {
  side: "bride" | "groom";
  page?: "guest" | "gallery";
}) {
  const event = MEMORY_EVENTS[side];
  const wedding = side === "bride" ? brideInvitation : groomInvitation;
  const eventId = event.id;
  const eventScopeRef = useRef(eventId);
  eventScopeRef.current = eventId;
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<MemoryPhoto[]>([]);
  const [myPhotos, setMyPhotos] = useState<MemoryPhoto[]>([]);
  const [wishes, setWishes] = useState<MemoryWish[]>([]);
  const [voices, setVoices] = useState<MemoryVoice[]>([]);
  const [settings, setSettings] = useState<MemorySettings>();
  const [queue, setQueue] = useState<UploadJob[]>([]);
  const [localPhotoDrafts, setLocalPhotoDrafts] = useState<LocalPhotoDraft[]>(
    []
  );
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [activeUploadIds, setActiveUploadIds] = useState<string[]>([]);
  const [cursor, setCursor] = useState<PhotoCursor>();
  const [hasMore, setHasMore] = useState(false);
  const [myCursor, setMyCursor] = useState<PhotoCursor>();
  const [myHasMore, setMyHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [photoView, setPhotoView] = useState<"all" | "my" | "favorites">("all");
  const [guestFilter, setGuestFilter] = useState("all");
  const [message, setMessage] = useState<{
    kind: "wish" | "voice";
    text: string;
  }>();
  const [error, setError] = useState("");
  const [cameraUploadError, setCameraUploadError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [wish, setWish] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recording, setRecording] = useState(false);
  const [microphonePending, setMicrophonePending] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [savingVoice, setSavingVoice] = useState(false);
  const [privateVoice, setPrivateVoice] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStartInTray, setCameraStartInTray] = useState(false);
  const [guestPanel, setGuestPanel] = useState<GuestPanel | null>(null);
  const [identityIntent, setIdentityIntent] = useState<IdentityIntent>();
  const [nameDraft, setNameDraft] = useState("");
  const [uploadFromAlbum, setUploadFromAlbum] = useState(false);
  const [addingFiles, setAddingFiles] = useState(false);
  const [sendingWish, setSendingWish] = useState(false);
  const [online, setOnline] = useState(true);
  const [confirmedPhotoCount, setConfirmedPhotoCount] = useState(0);
  const [quotaSnapshot, setQuotaSnapshot] = useState<{
    eventId: typeof eventId;
    state: QuotaState;
  }>();
  const [quotaAttempt, setQuotaAttempt] = useState(0);
  const [photoCount, setPhotoCount] = useState(0);
  const [guestUid, setGuestUid] = useState("");
  const guestPanelRef = useRef(guestPanel);
  guestPanelRef.current = guestPanel;
  const microphoneGenerationRef = useRef(0);
  const pageCursorRef = useRef(resetMemoryPage<PhotoCursor>());
  const myPageCursorRef = useRef(resetMemoryPage<PhotoCursor>());
  const mainRef = useRef<HTMLElement>(null);
  const surfaceTriggerRef = useRef<HTMLElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const photoBatchRef = useRef(false);
  const sendWishRef = useRef(false);
  const loadedQueueRef = useRef<typeof eventId>();
  const loadedDraftsRef = useRef<typeof eventId>();
  const photoSuccessTimer = useRef<number>();
  const recorderRef = useRef<MediaRecorder>();
  const timerRef = useRef<number>();
  const recordingTickRef = useRef<number>();
  const microphoneRequestRef = useRef(false);
  const inFlightRef = useRef(new Set<string>());
  const activeRef = useRef(true);
  const isGallery = page === "gallery";
  const cameraDrafts = localPhotoDrafts.filter(
    (draft) => draft.event === eventId && draft.uid === guestUid
  );
  const guestJobs = guestUid
    ? queue.filter(
        (job) =>
          job.side === side &&
          job.event === eventId &&
          (!job.uid || job.uid === guestUid)
      )
    : [];
  const cameraPhotoUploads = guestJobs.filter(
    (job) => job.kind === "photo" && job.uid === guestUid
  );
  const unreservedPhotoJobs = guestJobs.filter(
    (job) => job.kind === "photo" && !job.slot
  );
  const quotaState =
    quotaSnapshot?.eventId === eventId ? quotaSnapshot.state : "loading";
  const remainingPhotos = Math.max(
    0,
    PHOTO_LIMIT - photoCount - unreservedPhotoJobs.length - cameraDrafts.length
  );
  const gallerySourcePhotos = photoView === "my" ? myPhotos : photos;
  const galleryPhotos = gallerySourcePhotos
    .filter((photo) =>
      photoView === "favorites" ? favoriteIds.includes(photo.id) : true
    )
    .filter(
      (photo) => guestFilter === "all" || photo.guestName === guestFilter
    );
  useEffect(() => {
    try {
      const storedName = window.localStorage.getItem(`memories-name-${side}`);
      setName(storedName?.trim().slice(0, 100) ?? "");
      setStorageNotice("");
    } catch {
      setName("");
      setStorageNotice(
        "This browser cannot save your name between visits. The public gallery is still available."
      );
    }
    setPhotos([]);
    setMyPhotos([]);
    setWishes([]);
    setVoices([]);
    setFavoriteIds([]);
    setCursor(undefined);
    setHasMore(false);
    pageCursorRef.current = resetMemoryPage();
    setMyCursor(undefined);
    setMyHasMore(false);
    myPageCursorRef.current = resetMemoryPage();
    setPhotoView("all");
    setGuestFilter("all");
    setQueue([]);
    setProgress({});
    setActiveUploadIds([]);
    setLocalPhotoDrafts([]);
    setGuestUid("");
    setPhotoCount(0);
    loadedQueueRef.current = undefined;
    loadedDraftsRef.current = undefined;
    clearPhotoSuccess();
  }, [side, eventId]);

  useEffect(() => {
    let cancelled = false;
    setQuotaSnapshot({ eventId, state: "loading" });

    const loadQueue = async () => {
      if (loadedQueueRef.current === eventId) return;
      const jobs = await listUploadJobs(eventId);
      if (cancelled) return;
      loadedQueueRef.current = eventId;
      setQueue((rows) => [
        ...jobs.filter((job) => !rows.some((row) => row.id === job.id)),
        ...rows,
      ]);
    };
    const uidReady = getWeddingGuest().then((uid) => {
      if (!cancelled) setGuestUid(uid);
      return uid;
    });
    const loadDrafts = async () => {
      if (loadedDraftsRef.current === eventId) return;
      const drafts = await readCameraPhotoDrafts(eventId, await uidReady);
      if (cancelled) return;
      loadedDraftsRef.current = eventId;
      setLocalPhotoDrafts(drafts);
    };
    const loadCount = async () => {
      await uidReady;
      if (!navigator.onLine)
        throw new Error(
          "Connect to the internet to check your photo allowance."
        );
      const count = await readGuestPhotoCount(eventId);
      if (!navigator.onLine)
        throw new Error(
          "Connect to the internet to check your photo allowance."
        );
      if (!cancelled) setPhotoCount((current) => Math.max(current, count));
    };
    void Promise.allSettled([loadQueue(), loadDrafts(), loadCount()]).then(
      (results) => {
        if (!cancelled)
          setQuotaSnapshot({
            eventId,
            state: results.every((result) => result.status === "fulfilled")
              ? "ready"
              : "error",
          });
      }
    );
    return () => {
      cancelled = true;
    };
  }, [eventId, quotaAttempt]);

  useEffect(() => {
    const updateConnection = () => setOnline(navigator.onLine);
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);
  useEffect(() => {
    let active = true;
    const unsubs: (() => void)[] = [];
    const track = (promise: Promise<() => void>) =>
      promise
        .then((stop) => {
          if (active) unsubs.push(stop);
          else stop();
        })
        .catch((e) => {
          if (active) {
            if (page === "gallery") setGalleryLoading(false);
            setError((e as Error).message);
          }
        });
    track(
      subscribePublicSettings(eventId, setSettings, (e) =>
        setError(`Could not load couple settings: ${e.message}`)
      )
    );
    if (page === "gallery") {
      setGalleryLoading(true);
      track(
        subscribePhotos(
          eventId,
          (rows, nextCursor, more) => {
            setPhotos((current) => mergeMemoryRows(current, rows));
            pageCursorRef.current = applyMemoryHead(
              pageCursorRef.current,
              nextCursor,
              more ?? false
            );
            setCursor(pageCursorRef.current.cursor);
            setHasMore(pageCursorRef.current.hasMore);
            setGalleryLoading(false);
          },
          (e) => {
            setGalleryLoading(false);
            setError(`Could not load the public gallery: ${e.message}`);
          }
        )
      );
      track(subscribeWishes(eventId, setWishes, (e) => setError(e.message)));
      track(subscribeVoices(eventId, setVoices, (e) => setError(e.message)));
    }
    if (guestUid)
      track(
        subscribePhotos(
          eventId,
          (rows, nextCursor, more) => {
            setMyPhotos((current) => mergeMemoryRows(current, rows));
            myPageCursorRef.current = applyMemoryHead(
              myPageCursorRef.current,
              nextCursor,
              more ?? false
            );
            setMyCursor(myPageCursorRef.current.cursor);
            setMyHasMore(myPageCursorRef.current.hasMore);
          },
          (e) => setError(`Could not load your photos: ${e.message}`),
          guestUid
        )
      );
    return () => {
      active = false;
      unsubs.forEach((u) => u());
    };
  }, [eventId, guestUid, page]);
  useEffect(
    () => () => {
      window.clearTimeout(timerRef.current);
      window.clearTimeout(photoSuccessTimer.current);
      window.clearInterval(recordingTickRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* tracks are still stopped below */
        }
        recorder.stream.getTracks().forEach((t) => t.stop());
      }
    },
    []
  );
  useEffect(() => {
    if (photos.length || myPhotos.length)
      readFavoriteIds(
        eventId,
        [...photos, ...myPhotos].map((p) => p.id)
      )
        .then(setFavoriteIds)
        .catch(() => undefined);
  }, [photos, myPhotos, eventId]);
  function clearPhotoSuccess() {
    window.clearTimeout(photoSuccessTimer.current);
    setConfirmedPhotoCount(0);
  }
  function rememberSurfaceTrigger() {
    if (!guestPanelRef.current && document.activeElement instanceof HTMLElement)
      surfaceTriggerRef.current = document.activeElement;
  }
  function requireIdentity(intent: IdentityIntent) {
    if (name.trim()) return true;
    setNameDraft("");
    setIdentityIntent(intent);
    setGuestPanel("identity");
    return false;
  }
  function openCamera(reviewOnly = false) {
    if (!reviewOnly && (quotaState !== "ready" || !remainingPhotos)) return;
    if (reviewOnly && !cameraDrafts.length && !cameraPhotoUploads.length)
      return;
    rememberSurfaceTrigger();
    setError("");
    setCameraUploadError("");
    setMessage(undefined);
    clearPhotoSuccess();
    if (!requireIdentity(reviewOnly ? "review" : "camera")) return;
    setGuestPanel(null);
    setCameraStartInTray(reviewOnly);
    setCameraOpen(true);
  }
  function openPanel(panel: Exclude<GuestPanel, "identity">) {
    rememberSurfaceTrigger();
    setError("");
    setMessage(undefined);
    if (panel === "upload") {
      if (quotaState !== "ready" || !remainingPhotos || photoBatchRef.current)
        return;
      setUploadFromAlbum(guestPanelRef.current === "album");
      clearPhotoSuccess();
      if (!requireIdentity("upload")) return;
    }
    if (panel === "voice" && !requireIdentity("voice")) return;
    setGuestPanel(panel);
  }
  function closeGuestPanel() {
    setError("");
    setMessage(undefined);
    if (guestPanelRef.current === "identity" && identityIntent === "wish") {
      setGuestPanel("wish");
      return;
    }
    if (
      (guestPanelRef.current === "upload" ||
        (guestPanelRef.current === "identity" &&
          identityIntent === "upload")) &&
      uploadFromAlbum
    ) {
      setGuestPanel("album");
      return;
    }
    if (microphonePending || microphoneRequestRef.current) {
      microphoneGenerationRef.current += 1;
      microphoneRequestRef.current = false;
      setMicrophonePending(false);
    }
    if (recording) stopRecording();
    guestPanelRef.current = null;
    setGuestPanel(null);
  }
  function saveIdentity(nextName: string) {
    const savedName = nextName.trim();
    if (!savedName || savedName.length > 100) {
      setError("Enter a name between 1 and 100 characters.");
      return;
    }
    setName(savedName);
    try {
      window.localStorage.setItem(`memories-name-${side}`, savedName);
      setStorageNotice("");
    } catch {
      setStorageNotice("This browser cannot save your name between visits.");
    }
    setError("");
    if (identityIntent === "wish") {
      setGuestPanel("wish");
      void sendWish(savedName);
    } else if (identityIntent === "upload" || identityIntent === "voice") {
      setGuestPanel(identityIntent);
    } else {
      setGuestPanel(null);
      const review = identityIntent === "review";
      if (review || (quotaState === "ready" && remainingPhotos > 0)) {
        setCameraStartInTray(review);
        setCameraOpen(true);
      }
    }
  }
  async function saveCapturedPhoto(
    raw: Blob,
    photoStyle: PhotoStyle,
    previewBlob?: Blob
  ) {
    if (quotaState !== "ready" || !remainingPhotos)
      throw new Error(
        "Photo allowance is unavailable or all slots are in use."
      );
    if (!name.trim() || !guestUid)
      throw new Error("Enter your name before saving this photo.");
    const draft = await saveCameraPhotoDraft(
      side,
      eventId,
      guestUid,
      name.trim(),
      raw,
      photoStyle,
      previewBlob,
      photoCount
    );
    setLocalPhotoDrafts((rows) => [
      ...rows.filter((row) => row.id !== draft.id),
      draft,
    ]);
  }
  async function deleteCameraDraft(id: string) {
    const uid = guestUid || (await getWeddingGuest());
    const removed = await removeCameraPhotoDraft(id, eventId, uid);
    if (removed) setLocalPhotoDrafts(await readCameraPhotoDrafts(eventId, uid));
  }
  async function uploadCameraDrafts(
    ids?: string[]
  ): Promise<UploadBatchResult> {
    const selected = cameraDrafts.filter(
      (draft) => !ids || ids.includes(draft.id)
    );
    if (!selected.length) return { uploaded: 0, failed: 0, alreadyActive: 0 };
    if (photoBatchRef.current)
      return { uploaded: 0, failed: 0, alreadyActive: selected.length };
    if (quotaState !== "ready") {
      throw new Error(
        "Check your photo allowance on the home page before uploading these drafts."
      );
    }
    if (
      selected.length >
      PHOTO_LIMIT - photoCount - unreservedPhotoJobs.length
    ) {
      throw new Error(
        "There are more selected photos than available slots. Select fewer saved photos."
      );
    }
    setCameraUploadError("");
    clearPhotoSuccess();
    photoBatchRef.current = true;
    try {
      const approved = await approveCameraPhotoDrafts(
        selected.map((draft) => draft.id),
        eventId,
        guestUid
      );
      const approvedIds = new Set(approved.map((job) => job.id));
      setLocalPhotoDrafts((rows) =>
        rows.filter((draft) => !approvedIds.has(draft.id))
      );
      setQueue((rows) => [
        ...rows.filter((row) => !approvedIds.has(row.id)),
        ...approved,
      ]);
      const results = await Promise.all(approved.map((job) => uploadJob(job)));
      return {
        uploaded: results.filter((result) => result === "uploaded").length,
        failed: results.filter((result) => result === "failed").length,
        alreadyActive: results.filter((result) => result === "active").length,
      };
    } finally {
      photoBatchRef.current = false;
    }
  }
  async function processFiles(files: File[]) {
    if (!files.length || photoBatchRef.current) return;
    setError("");
    if (quotaState !== "ready" || !name.trim() || !guestUid) {
      setError("Check your photo allowance before adding photos.");
      return;
    }
    if (!remainingPhotos || files.length > remainingPhotos) {
      setError(
        `You selected ${files.length} ${
          files.length === 1 ? "photo" : "photos"
        }. Choose up to ${remainingPhotos} to upload.`
      );
      return;
    }
    clearPhotoSuccess();
    photoBatchRef.current = true;
    setAddingFiles(true);
    const jobs: UploadJob[] = [];
    const failures: string[] = [];
    try {
      for (const file of files) {
        try {
          jobs.push(await savePhotoDraft(side, eventId, name.trim(), file));
        } catch (reason) {
          failures.push(`${file.name}: ${(reason as Error).message}`);
        }
      }
      if (!activeRef.current) return;
      setQueue((rows) => [...rows, ...jobs]);
      if (failures.length) setError(failures.join(" "));
      if (navigator.onLine)
        await Promise.all(jobs.map((job) => uploadJob(job)));
    } finally {
      photoBatchRef.current = false;
      if (activeRef.current) setAddingFiles(false);
    }
  }
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);
  const uploadJob = useCallback(
    async (job: UploadJob): Promise<UploadAttemptResult> => {
      const isCurrentEvent = () =>
        activeRef.current && eventScopeRef.current === job.event;
      if (inFlightRef.current.has(job.id)) return "active";
      inFlightRef.current.add(job.id);
      if (isCurrentEvent()) {
        if (job.kind === "photo") setCameraUploadError("");
        setActiveUploadIds((ids) =>
          ids.includes(job.id) ? ids : [...ids, job.id]
        );
        setProgress((values) => ({ ...values, [job.id]: 0 }));
      }
      let result: UploadAttemptResult = "uploaded";
      let failureRecorded = false;
      try {
        await processUploadJob(job, {
          onJob: (next) => {
            failureRecorded = Boolean(next.error);
            if (isCurrentEvent()) {
              setQueue((rows) =>
                rows.some((row) => row.id === next.id)
                  ? rows.map((row) => (row.id === next.id ? next : row))
                  : [...rows, next]
              );
              const { slot } = next;
              if (next.side === side && next.kind === "photo" && slot)
                setPhotoCount((count) => Math.max(count, slot));
            }
          },
          onProgress: (id, percent) => {
            if (isCurrentEvent() && inFlightRef.current.has(id))
              setProgress((values) => ({ ...values, [id]: percent }));
          },
        });
        if (isCurrentEvent()) {
          setQueue((rows) => rows.filter((row) => row.id !== job.id));
          setProgress((values) => {
            const next = { ...values };
            delete next[job.id];
            return next;
          });
          if (job.kind === "photo") {
            void readGuestPhotoCount(eventId)
              .then((count) => {
                if (isCurrentEvent())
                  setPhotoCount((current) => Math.max(current, count));
              })
              .catch(() => undefined);
            setConfirmedPhotoCount((count) => count + 1);
            window.clearTimeout(photoSuccessTimer.current);
            photoSuccessTimer.current = window.setTimeout(
              () => setConfirmedPhotoCount(0),
              12_000
            );
          } else {
            setMessage({
              kind: "voice",
              text: job.isPrivate
                ? "Private voice note sent to the couple."
                : "Your voice note is shared in the gallery.",
            });
          }
        }
      } catch (e) {
        result = "failed";
        const failure = getUploadFailure(e);
        if (isCurrentEvent()) {
          if (!failureRecorded) setError(failure.message);
          else if (job.kind === "photo" && guestPanelRef.current === "upload")
            setError(
              "Some photos could not upload. Open My album to retry them."
            );
          if (
            job.kind === "photo" &&
            job.side === side &&
            job.event === eventId
          )
            setCameraUploadError(failure.code ? "" : failure.message);
        }
      } finally {
        inFlightRef.current.delete(job.id);
        if (isCurrentEvent())
          setActiveUploadIds((ids) => ids.filter((id) => id !== job.id));
      }
      return result;
    },
    [side, eventId]
  );
  async function retryCameraUpload(id: string): Promise<UploadAttemptResult> {
    const job = cameraPhotoUploads.find((candidate) => candidate.id === id);
    if (!job) return "failed";
    return uploadJob(job);
  }
  useEffect(() => {
    if (!guestUid || quotaState === "loading") return;
    let cancelled = false;
    const resume = () => {
      if (!navigator.onLine) return;
      void listUploadJobs(eventId)
        .then((all) => {
          if (cancelled) return;
          all
            .filter(
              (job) =>
                job.side === side &&
                (!job.uid || job.uid === guestUid) &&
                !(job.kind === "photo" && photoBatchRef.current)
            )
            .forEach((job) => void uploadJob(job));
        })
        .catch(() => {
          if (!cancelled && loadedQueueRef.current === eventId)
            setError(
              "Could not read pending uploads. Try reopening this album."
            );
        });
    };
    resume();
    window.addEventListener("online", resume);
    return () => {
      cancelled = true;
      window.removeEventListener("online", resume);
    };
  }, [side, eventId, guestUid, quotaState, uploadJob]);
  async function sendWish(savedName?: string) {
    if (sendWishRef.current) return;
    setError("");
    if (!wish.trim()) {
      setError("Write a wish before sharing it.");
      return;
    }
    if (!savedName && !requireIdentity("wish")) return;
    sendWishRef.current = true;
    setSendingWish(true);
    try {
      await saveWish(eventId, savedName ?? name.trim(), wish);
      setWish("");
      setMessage({ kind: "wish", text: "Your wish is shared in the gallery." });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      sendWishRef.current = false;
      setSendingWish(false);
    }
  }
  async function toggleFavorite(id: string) {
    try {
      const enabled = !favoriteIds.includes(id);
      await saveFavorite(eventId, id, enabled);
      setFavoriteIds((ids) =>
        enabled ? [...ids, id] : ids.filter((x) => x !== id)
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function loadMore() {
    if (!cursor || !hasMore || loadingMore) return;
    setLoadingMore(true);
    pageCursorRef.current = beginMemoryPage(pageCursorRef.current);
    try {
      const result = await readMorePhotos(eventId, cursor);
      setPhotos((current) => appendMemoryRows(current, result.rows));
      pageCursorRef.current = applyMemoryTail(
        pageCursorRef.current,
        result.cursor,
        result.hasMore
      );
      setCursor(pageCursorRef.current.cursor);
      setHasMore(pageCursorRef.current.hasMore);
    } catch (e) {
      setError(`Could not load more photos: ${(e as Error).message}`);
    } finally {
      setLoadingMore(false);
    }
  }
  async function loadMoreMyPhotos() {
    if (!myCursor || !myHasMore || loadingMore || !guestUid) return;
    setLoadingMore(true);
    myPageCursorRef.current = beginMemoryPage(myPageCursorRef.current);
    try {
      const result = await readMorePhotos(eventId, myCursor, guestUid);
      setMyPhotos((current) => appendMemoryRows(current, result.rows));
      myPageCursorRef.current = applyMemoryTail(
        myPageCursorRef.current,
        result.cursor,
        result.hasMore
      );
      setMyCursor(myPageCursorRef.current.cursor);
      setMyHasMore(myPageCursorRef.current.hasMore);
    } catch (e) {
      setError(`Could not load more of your photos: ${(e as Error).message}`);
    } finally {
      setLoadingMore(false);
    }
  }
  async function startRecording() {
    if (microphoneRequestRef.current || recording || recorderRef.current)
      return;
    microphoneRequestRef.current = true;
    const requestId = ++microphoneGenerationRef.current;
    setMicrophonePending(true);
    let stream: MediaStream | undefined;
    try {
      if (!name.trim()) return;
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      if (
        requestId !== microphoneGenerationRef.current ||
        guestPanelRef.current !== "voice"
      ) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mime = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ].find((x) => MediaRecorder.isTypeSupported(x));
      if (!mime)
        throw new Error("This browser does not support voice recording.");
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onstop = async () => {
        stream?.getTracks().forEach((t) => t.stop());
        window.clearTimeout(timerRef.current);
        window.clearInterval(recordingTickRef.current);
        if (activeRef.current) {
          setRecording(false);
          setSavingVoice(true);
        }
        try {
          const job = await saveAudioDraft(
            side,
            eventId,
            name.trim(),
            new Blob(chunks, { type: mime }),
            privateVoice
          );
          if (activeRef.current) setQueue((rows) => [...rows, job]);
          if (navigator.onLine) void uploadJob(job);
        } catch (e) {
          if (activeRef.current) setError((e as Error).message);
        } finally {
          recorderRef.current = undefined;
          if (activeRef.current) setSavingVoice(false);
        }
      };
      rec.onerror = () => {
        stream?.getTracks().forEach((track) => track.stop());
        try {
          if (rec.state !== "inactive") rec.stop();
        } catch {
          /* already stopped */
        }
        if (activeRef.current)
          setError(
            "Microphone recording failed. Check browser permissions and try again."
          );
      };
      rec.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingTickRef.current = window.setInterval(
        () => setRecordingSeconds((seconds) => Math.min(30, seconds + 1)),
        1000
      );
      timerRef.current = window.setTimeout(() => stopRecording(), 30_000);
    } catch (e) {
      stream?.getTracks().forEach((t) => t.stop());
      if (
        requestId === microphoneGenerationRef.current &&
        guestPanelRef.current === "voice"
      )
        setError((e as Error).message);
    } finally {
      if (requestId === microphoneGenerationRef.current) {
        microphoneRequestRef.current = false;
        if (activeRef.current) setMicrophonePending(false);
      }
    }
  }
  function stopRecording() {
    window.clearTimeout(timerRef.current);
    window.clearInterval(recordingTickRef.current);
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      return;
    }
    setRecording(false);
    setSavingVoice(true);
  }
  const displayDate = wedding.date.toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
  const homeHref = memoryPath(side);
  const galleryHref = memoryPath(side, "gallery");
  const { coupleNames, dateLabel } = MEMORY_PUBLIC_ALBUMS[side];
  const photoSuccess = confirmedPhotoCount
    ? `${confirmedPhotoCount} ${
        confirmedPhotoCount === 1 ? "photo" : "photos"
      } shared in the gallery.`
    : "";
  const pageTitle = `${
    isGallery ? "Wedding memories gallery" : "Share your wedding memories"
  } · ${event.name} · ${event.dateLabel}`;
  return (
    <main
      ref={mainRef}
      tabIndex={-1}
      className={`${
        isGallery
          ? `${styles.page} ${styles[event.theme]} ${homeStyles.galleryPage} ${
              memoryText.className
            }`
          : homeStyles.homePage
      } ${memoryTitle.variable} ${memoryNames.variable}`}
    >
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={`Share wedding photos and wishes with Faiz and Harissa. ${MEMORY_HASHTAG}`}
        />
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link
          rel="canonical"
          href={memoryCanonicalUrl(side, isGallery ? "gallery" : "")}
        />
      </Head>
      {isGallery && (
        <section
          className={`${styles.hero} ${styles.galleryHero}`}
          style={
            settings?.cover
              ? {
                  backgroundImage: `linear-gradient(0deg, #fffdf8e8, #fffdf8b3), url("${settings.cover}")`,
                }
              : undefined
          }
        >
          <p className={styles.eyebrow}>{MEMORY_HASHTAG}</p>
          <p className={`${styles.couple} ${memoryNames.className}`}>
            {MEMORY_PUBLIC_ALBUMS[side].coupleNames}
          </p>
          <h1 className={memoryTitle.className}>Shared memories</h1>
          <p className={`${styles.eventDetails} ${memoryTitle.className}`}>
            {MEMORY_PUBLIC_ALBUMS[side].dateLabel}
          </p>
          <p className={styles.galleryWelcome}>
            {settings?.welcome || "Share the moments you captured with us."}
          </p>
        </section>
      )}
      {isGallery ? (
        <>
          <nav className={styles.gallerySectionNav} aria-label="Gallery sections">
            <a href="#photos">Photos</a>
            <a href="#wishes">Wishes</a>
            <a href="#voice-notes">Voice notes</a>
          </nav>
          <section className={`${styles.section} ${styles.gallerySection}`} id="photos">
            <h2 className={styles.srOnly}>Photos</h2>
            <div className={styles.galleryFilters}>
              <div className={styles.galleryFilterPills} role="group" aria-label="Filter photos">
                {([
                  ["all", "All photos"],
                  ["my", "My photos"],
                  ["favorites", "Favourites"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={photoView === value}
                    onClick={() => {
                      setPhotoView(value);
                      setGuestFilter("all");
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label>
                Guest
                <select
                  value={guestFilter}
                  onChange={(e) => setGuestFilter(e.target.value)}
                >
                  <option value="all">All guests</option>
                  {Array.from(new Set(gallerySourcePhotos.map((photo) => photo.guestName)))
                    .sort()
                    .map((guest) => (
                      <option key={guest} value={guest}>
                        {guest}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            {galleryLoading ? (
              <p role="status" className={styles.muted}>
                Loading photos…
              </p>
            ) : galleryPhotos.length ? (
              <div className={styles.galleryGrid}>
                {galleryPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      side={side}
                      settings={settings}
                      onFavorite={toggleFavorite}
                      favorite={favoriteIds.includes(photo.id)}
                      compact
                    />
                  ))}
              </div>
            ) : (
              <p className={styles.muted}>
                {photos.length === 0 &&
                photoView === "all" &&
                guestFilter === "all"
                  ? "No photos yet. Be the first to share one."
                  : "No photos match these filters yet."}
              </p>
            )}
            {(photoView === "my" ? myHasMore : hasMore) && (
              <button
                className={styles.secondary}
                disabled={loadingMore}
                onClick={() =>
                  void (photoView === "my" ? loadMoreMyPhotos() : loadMore())
                }
              >
                {loadingMore ? "Loading…" : "Load more photos"}
              </button>
            )}
          </section>
          <section
            className={`${styles.section} ${styles.gallerySection}`}
            id="wishes"
          >
            <h2>Written wishes</h2>
            {wishes.length ? (
              wishes.map((entry) => (
                <article className={styles.wish} key={entry.id}>
                  <strong>{entry.guestName}</strong>
                  <p>{entry.message}</p>
                </article>
              ))
            ) : (
              <p className={styles.muted}>No written wishes yet.</p>
            )}
          </section>
          <section
            className={`${styles.section} ${styles.gallerySection}`}
            id="voice-notes"
          >
            <h2>Voice notes</h2>
            {voices.length ? (
              voices.map((voice) => (
                <VoicePlayer key={voice.id} voice={voice} />
              ))
            ) : (
              <p className={styles.muted}>No public voice notes yet.</p>
            )}
          </section>
        </>
      ) : (
        <MemoryGuestHub
          coupleNames={coupleNames}
          date={dateLabel}
          remaining={remainingPhotos}
          photoLimit={PHOTO_LIMIT}
          quotaState={quotaState}
          canReviewDrafts={
            cameraDrafts.length > 0 || cameraPhotoUploads.length > 0
          }
          draftCount={cameraDrafts.length}
          onCamera={openCamera}
          onQuotaRetry={() => setQuotaAttempt((attempt) => attempt + 1)}
          onUpload={() => openPanel("upload")}
          onVoice={() => openPanel("voice")}
          onWish={() => openPanel("wish")}
          onSalamKaut={() => openPanel("salam")}
          galleryHref={galleryHref}
        >
          <MemoryHomeUploadStatus
            jobs={guestJobs}
            activeUploadIds={activeUploadIds}
            online={online}
            confirmedPhotoCount={confirmedPhotoCount}
            message={message?.kind === "voice" ? message.text : undefined}
            onAlbum={() => openPanel("album")}
            onVoice={() => openPanel("voice")}
          />
        </MemoryGuestHub>
      )}
      <MemoryGuestNav
        homeHref={homeHref}
        galleryHref={galleryHref}
        isGallery={isGallery}
        albumOpen={guestPanel === "album"}
        hidden={cameraOpen || Boolean(guestPanel && guestPanel !== "album")}
        onAlbum={() => openPanel("album")}
      />
      {guestPanel && (
        <MemoryGuestPanel
          theme={event.theme}
          title={panelTitles[guestPanel]}
          backgroundRef={mainRef}
          className={
            guestPanel === "identity"
              ? `${homeStyles.identityPanel} ${memoryTitle.variable} ${memoryNames.variable}`
              : undefined
          }
          message={
            guestPanel === "album" || guestPanel === "upload"
              ? photoSuccess
              : guestPanel === message?.kind
              ? message.text
              : undefined
          }
          error={error}
          onClose={closeGuestPanel}
        >
          {guestPanel === "identity" && identityIntent && (
            <form
              className={homeStyles.identityForm}
              onSubmit={(event) => {
                event.preventDefault();
                saveIdentity(nameDraft);
              }}
            >
              <p
                id="memory-identity-description"
                className={homeStyles.identityDescription}
              >
                {identityCopy[identityIntent]}
              </p>
              <label className={homeStyles.identityField}>
                Your name
                <input
                  type="text"
                  autoComplete="name"
                  maxLength={100}
                  required
                  value={nameDraft}
                  aria-describedby="memory-identity-description memory-identity-hint"
                  onChange={(event) => setNameDraft(event.target.value)}
                />
              </label>
              <p id="memory-identity-hint" className={homeStyles.identityHint}>
                Your browser remembers your name for this album.
              </p>
              <button className={homeStyles.primaryAction} type="submit">
                {identityIntent === "wish"
                  ? "Save name and share wish"
                  : "Continue"}
              </button>
            </form>
          )}
          {guestPanel === "upload" && (
            <section className={styles.section}>
              <p>{photoVisibility}</p>
              {quotaState === "ready" && (
                <p>
                  You have {remainingPhotos}{" "}
                  {remainingPhotos === 1 ? "photo" : "photos"} left.
                </p>
              )}
              <button
                type="button"
                className={styles.button}
                disabled={
                  addingFiles || quotaState !== "ready" || remainingPhotos === 0
                }
                onClick={() => uploadInputRef.current?.click()}
              >
                <Upload size={17} aria-hidden="true" />
                {addingFiles ? "Adding photos…" : "Choose photos"}
              </button>
              <input
                ref={uploadInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                multiple
                onChange={(event) => {
                  const files = Array.from(event.currentTarget.files ?? []);
                  event.currentTarget.value = "";
                  void processFiles(files);
                }}
              />
              <button
                type="button"
                className={styles.secondary}
                onClick={() => openPanel("album")}
              >
                View My album
              </button>
            </section>
          )}
          {guestPanel === "album" && (
            <section className={styles.section}>
              <p className={styles.small}>{photoVisibility}</p>
              {quotaState === "ready" ? (
                <p className={styles.small}>
                  {remainingPhotos} {remainingPhotos === 1 ? "photo" : "photos"}{" "}
                  left
                </p>
              ) : quotaState === "error" ? (
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={() => setQuotaAttempt((attempt) => attempt + 1)}
                >
                  Retry photo allowance
                </button>
              ) : (
                <p role="status" className={styles.small}>
                  Checking photo allowance…
                </p>
              )}
              <button
                type="button"
                className={styles.button}
                disabled={
                  addingFiles || quotaState !== "ready" || !remainingPhotos
                }
                onClick={() => openPanel("upload")}
              >
                <Upload size={17} aria-hidden="true" /> Add existing photos
              </button>
              {myPhotos.length ? (
                <div className={styles.galleryGrid}>
                  {myPhotos.map((photo) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      side={side}
                      settings={settings}
                      onFavorite={toggleFavorite}
                      favorite={favoriteIds.includes(photo.id)}
                      compact
                    />
                  ))}
                </div>
              ) : (
                <p className={styles.muted}>
                  Your saved photos will appear here.
                </p>
              )}
              {myHasMore && (
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={loadingMore}
                  onClick={() => void loadMoreMyPhotos()}
                >
                  {loadingMore ? "Loading…" : "Load more of your photos"}
                </button>
              )}
              {cameraDrafts.length > 0 && (
                <div className={styles.queue}>
                  <strong>
                    {cameraDrafts.length} photo
                    {cameraDrafts.length === 1 ? "" : "s"} saved on this device
                  </strong>
                  <p>Review these photos before uploading them.</p>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={() => openCamera(true)}
                  >
                    Review photos
                  </button>
                </div>
              )}
              {guestJobs
                .filter((job) => job.kind === "photo")
                .map((job) => {
                  const presentation = getPhotoUploadPresentation(
                    job,
                    progress[job.id],
                    activeUploadIds.includes(job.id),
                    online
                  );
                  const photoLabel = job.slot
                    ? `Photo ${job.slot}`
                    : "Photo upload";
                  return (
                    <div className={styles.queue} key={job.id}>
                      <span>
                        {photoLabel} · {presentation.status}
                      </span>
                      {presentation.progress !== undefined && (
                        <progress
                          aria-label={`${photoLabel} progress`}
                          value={presentation.progress}
                          max="100"
                        />
                      )}
                      {presentation.error && (
                        <p className={styles.error}>{presentation.error}</p>
                      )}
                      <button
                        type="button"
                        className={styles.secondary}
                        disabled={presentation.retryDisabled}
                        onClick={() => void uploadJob(job)}
                      >
                        {presentation.retryLabel}
                      </button>
                    </div>
                  );
                })}
              <nav className={homeStyles.albumUtility} aria-label="Album links">
                <Link href="/wedding-memories">All albums</Link>
                <Link href={memoryPath(side, "qr")}>QR card</Link>
              </nav>
            </section>
          )}
          {guestPanel === "voice" && (
            <section className={styles.section}>
              <p>
                Record up to 30 seconds. Anyone with the album link can listen
                to a shared voice note. Only the couple can listen to a private
                voice note.
              </p>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={privateVoice}
                  disabled={recording || microphonePending || savingVoice}
                  onChange={(event) => setPrivateVoice(event.target.checked)}
                />
                Keep this voice note private
              </label>
              <button
                type="button"
                className={styles.button}
                disabled={microphonePending || savingVoice}
                onClick={() =>
                  void (recording ? stopRecording() : startRecording())
                }
              >
                <Mic size={17} aria-hidden="true" />
                {microphonePending
                  ? "Requesting microphone…"
                  : recording
                  ? `Stop and send (${30 - recordingSeconds}s left)`
                  : savingVoice
                  ? "Saving voice note…"
                  : "Start recording (30 seconds max)"}
              </button>
              {guestJobs
                .filter((job) => job.kind === "audio")
                .map((job) => (
                  <div className={styles.queue} key={job.id}>
                    <span>Voice note · {job.status}</span>
                    {job.error && <p className={styles.error}>{job.error}</p>}
                    <button
                      type="button"
                      className={styles.secondary}
                      disabled={!online || activeUploadIds.includes(job.id)}
                      onClick={() => void uploadJob(job)}
                    >
                      {!online
                        ? "Waiting for connection"
                        : activeUploadIds.includes(job.id)
                        ? "Sending…"
                        : "Retry voice note"}
                    </button>
                  </div>
                ))}
            </section>
          )}
          {guestPanel === "wish" && (
            <section className={styles.section}>
              <p>Anyone with the album link can read the wish you share.</p>
              <label className={styles.label}>
                Your wish
                <textarea
                  maxLength={2000}
                  value={wish}
                  disabled={sendingWish}
                  onChange={(event) => setWish(event.target.value)}
                  placeholder="A message for Faiz and Harissa"
                />
              </label>
              <p className={styles.small}>{wish.length}/2,000 characters</p>
              <button
                type="button"
                className={styles.button}
                disabled={sendingWish}
                onClick={() => void sendWish()}
              >
                {sendingWish ? "Sharing…" : "Share wish"}
              </button>
            </section>
          )}
          {guestPanel === "salam" && (
            <section className={styles.section}>
              <p>Send your doa or contribute through the existing gift page.</p>
              {settings?.bankRecipient && (
                <p>
                  <strong>Recipient:</strong> {settings.bankRecipient}
                  <br />
                  <strong>Details:</strong> {settings.bankDetails}
                </p>
              )}
              {settings?.qrUrl && (
                <img
                  className={styles.bankQr}
                  src={settings.qrUrl}
                  alt="Couple’s Salam Kaut contribution QR code"
                />
              )}
              <Link
                className={styles.button}
                href={
                  side === "bride"
                    ? "/jemputan-walimatulurus-harissa-faiz?salam=1"
                    : "/jemputan-walimatulurus-faiz-harissa?salam=1"
                }
              >
                Open Salam Kaut
              </Link>
            </section>
          )}
        </MemoryGuestPanel>
      )}
      {cameraOpen && (
        <MemoryCamera
          side={side}
          coupleNames={MEMORY_PUBLIC_ALBUMS[side].coupleNames}
          date={displayDate}
          guestName={name.trim()}
          remaining={quotaState === "ready" ? remainingPhotos : 0}
          drafts={cameraDrafts}
          approvedUploads={cameraPhotoUploads}
          uploadProgress={progress}
          activeUploadIds={activeUploadIds}
          startInTray={cameraStartInTray}
          defaults={settings}
          onClose={() => {
            setCameraOpen(false);
            setCameraStartInTray(false);
            window.requestAnimationFrame(() => {
              const trigger = surfaceTriggerRef.current;
              if (
                trigger?.isConnected &&
                mainRef.current?.contains(trigger) &&
                !trigger.matches(":disabled")
              )
                trigger.focus({ preventScroll: true });
              else mainRef.current?.focus({ preventScroll: true });
            });
          }}
          onSave={saveCapturedPhoto}
          onUpload={saveCapturedPhoto}
          onDeleteDraft={deleteCameraDraft}
          onUploadDrafts={uploadCameraDrafts}
          onRetryUpload={retryCameraUpload}
          uploadError={cameraUploadError}
        />
      )}
      {storageNotice && (
        <p role="status" className={styles.status}>
          {storageNotice}
        </p>
      )}
      {message && isGallery && !guestPanel && !cameraOpen && (
        <p role="status" className={styles.status}>
          {message.text}
        </p>
      )}
      {error && !guestPanel && !cameraOpen && (
        <p role="alert" title={error} className={styles.error}>
          {error.includes("permission") || error.includes("insufficient")
            ? "Memories are not active yet. The couple needs to publish Firebase setup first."
            : error}
        </p>
      )}
      {isGallery && (
        <footer>
          {MEMORY_HASHTAG} · Photos, wishes and shared voice notes are available
          to anyone with the album link.
        </footer>
      )}
    </main>
  );
}

function VoicePlayer({ voice }: { voice: MemoryVoice }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getDownloadURL(ref(getWeddingStorage(), voice.path))
      .then((value) => {
        if (active) { setUrl(value); setError(""); }
      })
      .catch((reason) => {
        if (active) setError(`Could not load this voice note: ${(reason as Error).message}`);
      });
    return () => {
      active = false;
    };
  }, [voice.path, attempt]);
  return (
    <article className={styles.wish}>
      <strong>{voice.guestName}</strong>
      {url && <audio controls preload="none" src={url} onError={() => setError("Audio could not play in this browser. Try downloading the note from the couple.")}/>} 
      {error && <p role="alert" className={styles.error}>{error} <button className={styles.secondary} onClick={() => setAttempt((value) => value + 1)}>Retry</button></p>}
    </article>
  );
}

function PhotoCard({
  photo,
  side,
  settings,
  onFavorite,
  favorite,
  compact = false,
}: {
  photo: MemoryPhoto;
  side: "bride" | "groom";
  settings?: MemorySettings;
  onFavorite: (id: string) => void;
  favorite: boolean;
  compact?: boolean;
}) {
  const card = useRef<HTMLElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [preview, setPreview] = useState("");
  const [loadError, setLoadError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [open, setOpen] = useState(false);
  const photoCreatedAtMillis = photo.createdAt?.toDate().getTime() ?? 0;
  const photoStyleFilm = photo.photoStyle?.film;
  const photoStyleStamp = photo.photoStyle?.stamp;
  const photoStyleCapturedAt = photo.photoStyle?.capturedAt;
  useEffect(() => {
    const node = card.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNearViewport(true);
        else if (!compact) setNearViewport(false);
      },
      { rootMargin: "250px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [photo.id, compact]);
  useEffect(() => {
    setPreview("");
    setLoadError("");
    if (!nearViewport) return;
    let active = true;
    let source = "";
    const image = new Image();
    const loadingNotice = window.setTimeout(() => {
      if (active)
        setLoadError(
          "This photo is taking longer to load. Check your connection, then retry."
        );
    }, 12000);
    getBlob(ref(getWeddingStorage(), photo.originalPath))
      .then((blob) => {
        if (!active) return;
        source = URL.createObjectURL(blob);
        image.decoding = "async";
        image.onload = () => {
          if (!active) return;
          try {
            const canvas = drawStyledPhoto(
              image,
              settings?.film ?? "none",
              settings?.stamp ?? MEMORY_HASHTAG,
              {
                maxDimension: compact ? 640 : 960,
                photoDate: photo.createdAt?.toDate(),
                coupleNames:
                  MEMORY_PUBLIC_ALBUMS[side].coupleNames,
                photoStyle: photo.photoStyle,
              }
            );
            setPreview(canvas.toDataURL("image/jpeg", 0.86));
            setLoadError("");
          } catch (error) {
            setLoadError(
              `Could not prepare the photo preview: ${(error as Error).message}`
            );
          }
          window.clearTimeout(loadingNotice);
          image.onload = null;
          image.onerror = null;
          image.src = "";
          URL.revokeObjectURL(source);
          source = "";
        };
        image.onerror = () => {
          window.clearTimeout(loadingNotice);
          if (active)
            setLoadError(
              "Could not load this photo. Check the Storage CORS setup or retry later."
            );
          image.onload = null;
          image.onerror = null;
          image.src = "";
          if (source) URL.revokeObjectURL(source);
          source = "";
        };
        image.src = source;
      })
      .catch((error) => {
        window.clearTimeout(loadingNotice);
        if (active)
          setLoadError(
            `Could not fetch this photo: ${(error as Error).message}`
          );
      });
    return () => {
      active = false;
      window.clearTimeout(loadingNotice);
      image.onload = null;
      image.onerror = null;
      image.src = "";
      if (source) URL.revokeObjectURL(source);
    };
  }, [
    nearViewport,
    retryToken,
    photo.id,
    photo.originalPath,
    photoCreatedAtMillis,
    photoStyleFilm,
    photoStyleStamp,
    photoStyleCapturedAt,
    settings?.film,
    settings?.stamp,
    side,
    compact,
  ]);
  const photoTime = photo.createdAt?.toDate();
  return (
    <article
      ref={card}
      className={`${styles.photoCard} ${compact ? styles.galleryPhotoCard : ""}`}
    >
      {preview ? (
        <button
          className={`${styles.photoOpen} ${compact ? styles.galleryPhotoOpen : ""}`}
          onClick={() => setOpen(true)}
          aria-label={`Open photo shared by ${photo.guestName}`}
        >
          <img
            src={preview}
            alt={`Photo shared by ${photo.guestName}`}
            loading="lazy"
          />
        </button>
      ) : (
        <div
          className={`${styles.placeholder} ${compact ? styles.galleryPhotoPlaceholder : ""}`}
          aria-live="polite"
        >
          {loadError ? (
            compact ? (
              <>
                <span title={loadError}>Preview unavailable.</span>
                <span className={styles.srOnly}>{loadError}</span>
                <button
                  className={styles.secondary}
                  onClick={() => setRetryToken((value) => value + 1)}
                  aria-label={`Retry loading photo shared by ${photo.guestName}`}
                >
                  Retry photo
                </button>
              </>
            ) : (
              <>
                <span>{loadError}</span>
                <button
                  className={styles.secondary}
                  onClick={() => setRetryToken((value) => value + 1)}
                >
                  Retry photo
                </button>
              </>
            )
          ) : (
            <>
              <span className={styles.srOnly}>Loading photo preview</span>
              <ImageIcon aria-hidden="true" />
            </>
          )}
        </div>
      )}
      {(!compact || Boolean(preview)) && (
        <div className={`${styles.photoInfo} ${compact ? styles.galleryPhotoInfo : ""}`}>
          <strong>{photo.guestName}</strong>
          <button
            aria-label={`${favorite ? "Remove from" : "Add to"} favourites`}
            aria-pressed={favorite}
            onClick={() => onFavorite(photo.id)}
          >
            <Heart fill={favorite ? "currentColor" : "none"} />
          </button>
        </div>
      )}
      {!compact && photoTime && (
        <time className={styles.photoTime} dateTime={photoTime.toISOString()}>
          {new Intl.DateTimeFormat("en-MY", {
            dateStyle: "medium",
            timeZone: "Asia/Kuala_Lumpur",
          }).format(photoTime)}
        </time>
      )}
      {open && (
        <PhotoLightbox
          photo={photo}
          side={side}
          settings={settings}
          onClose={() => setOpen(false)}
        />
      )}
    </article>
  );
}

function PhotoLightbox({
  photo,
  side,
  settings,
  onClose,
}: {
  photo: MemoryPhoto;
  side: "bride" | "groom";
  settings?: MemorySettings;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = `photo-title-${photo.id}`;
  const photoTime = photo.createdAt?.toDate();
  const photoDateLabel = photoTime
    ? new Intl.DateTimeFormat("en-MY", {
        dateStyle: "medium",
        timeZone: "Asia/Kuala_Lumpur",
      }).format(photoTime)
    : "";
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = () =>
      dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(focusables() ?? []);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    closeRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [photo.id]);
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    getBlob(ref(getWeddingStorage(), photo.originalPath))
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((reason) => {
        if (active)
          setError(`Could not load this photo: ${(reason as Error).message}`);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.originalPath]);
  async function downloadOriginal() {
    try {
      const blob = await getBlob(ref(getWeddingStorage(), photo.originalPath));
      saveBlob(blob, `${photo.id}-original.${extensionFor(photo.contentType)}`);
    } catch (reason) {
      setError(`Original download failed: ${(reason as Error).message}`);
    }
  }
  async function downloadStyled() {
    let objectUrl = "";
    try {
      const blob = await getBlob(ref(getWeddingStorage(), photo.originalPath));
      objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const photoDate = photo.createdAt?.toDate();
      const canvas = drawStyledPhoto(
        image,
        settings?.film ?? "none",
        settings?.stamp ?? MEMORY_HASHTAG,
        {
          photoDate,
          coupleNames: MEMORY_PUBLIC_ALBUMS[side].coupleNames,
          photoStyle: photo.photoStyle,
        }
      );
      const styled = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("Could not render styled image.")),
          "image/jpeg",
          0.92
        )
      );
      saveBlob(styled, `${photo.id}-styled.jpg`);
    } catch (reason) {
      setError(`Styled download failed: ${(reason as Error).message}`);
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }
  return (
    <div
      className={styles.lightbox}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.lightboxDialog}
        data-overlay-layer="photo-lightbox"
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.srOnly}>
          Photo shared by {photo.guestName}
        </h2>
        <button
          ref={closeRef}
          className={styles.lightboxClose}
          onClick={onClose}
          aria-label="Close photo preview"
        >
          ×
        </button>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {url ? (
          <img src={url} alt={`Full-size photo shared by ${photo.guestName}`} />
        ) : (
          !error && <p role="status">Loading full photo…</p>
        )}
        <p className={styles.lightboxMetadata}>
          {photo.guestName}{photoDateLabel ? ` · ${photoDateLabel}` : ""}
        </p>
        <div className={styles.lightboxActions}>
          <button
            className={styles.button}
            onClick={() => void downloadOriginal()}
          >
            Download original
          </button>
          <button
            className={styles.secondary}
            onClick={() => void downloadStyled()}
          >
            Download styled photo
          </button>
        </div>
      </div>
    </div>
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function extensionFor(contentType: string) {
  return contentType === "image/png"
    ? "png"
    : contentType === "image/webp"
    ? "webp"
    : "jpg";
}
