import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import weddingFonts from "@/styles/WeddingFonts.module.css";
import { Mic, Upload } from "lucide-react";
import { getWeddingGuest } from "@/lib/wedding/firebase";
import type { WeddingEventId } from "@/lib/wedding/invitations";
import {
  MEMORY_PUBLIC_ALBUMS,
  memoryCanonicalUrl,
  memoryPath,
} from "@/lib/wedding/memoryRoutes";
import {
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
  canResumePhotoUpload,
  getPhotoUploadState,
  getUploadFailure,
  hasLocalPhotoMedia,
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
import { MemoryAlbum, type AlbumTab } from "./MemoryAlbum";
import {
  MemoryAlbumUploads,
  MemoryAlbumUploadSummary,
  type AlbumUploadItem,
} from "./MemoryAlbumUploads";
import {
  MemoryGallery,
  MemoryGalleryPhotos,
  type GalleryFilters,
  type GalleryStatus,
  type GalleryTab,
} from "./MemoryGallery";
import { MemoryGalleryPhoto } from "./MemoryGalleryPhoto";
import {
  MemoryGalleryVoices,
  MemoryGalleryWishes,
} from "./MemoryGalleryMessages";
import { MemoryGuestHub } from "./MemoryGuestHub";
import { MemoryGuestNav } from "./MemoryGuestNav";
import { MemoryHomeUploadStatus } from "./MemoryHomeUploadStatus";
import { MemoryGuestPanel } from "./MemoryGuestPanel";
import type { PhotoStyle } from "@/lib/wedding/memoriesRender";
import styles from "./Memories.module.css";
import homeStyles from "./MemoryGuestHome.module.css";
import galleryStyles from "./MemoryGallery.module.css";

type GuestPanel = "voice" | "wish" | "upload" | "identity";
type IdentityIntent = "camera" | "review" | "upload" | "voice" | "wish";
type QuotaState = "loading" | "ready" | "error";

const panelTitles: Record<GuestPanel, string> = {
  voice: "Voice note",
  wish: "Write a wish",
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
  page?: "guest" | "gallery" | "my-album";
}) {
  const router = useRouter();
  const event = MEMORY_EVENTS[side];
  const eventId = event.id;
  const eventScopeRef = useRef(eventId);
  eventScopeRef.current = eventId;
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<MemoryPhoto[]>([]);
  const [myPhotos, setMyPhotos] = useState<MemoryPhoto[]>([]);
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
  const [galleryTab, setGalleryTab] = useState<GalleryTab>("photos");
  const [visitedTabs, setVisitedTabs] = useState<GalleryTab[]>([]);
  const [galleryFilters, setGalleryFilters] = useState<GalleryFilters>({
    scope: "all",
    guest: null,
  });
  const [photoStatus, setPhotoStatus] = useState<GalleryStatus>("loading");
  const [myPhotoStatus, setMyPhotoStatus] = useState<GalleryStatus>("loading");
  const [photoAttempt, setPhotoAttempt] = useState(0);
  const [myPhotoAttempt, setMyPhotoAttempt] = useState(0);
  const [personalPhotosRequested, setPersonalPhotosRequested] = useState(false);
  const [photoPageError, setPhotoPageError] = useState<"public" | "personal">();
  const [favoriteError, setFavoriteError] = useState(false);
  const [favoriteLoadError, setFavoriteLoadError] = useState(false);
  const [favoriteLoadPending, setFavoriteLoadPending] = useState(false);
  const [favoriteAttempt, setFavoriteAttempt] = useState(0);
  const [favoritePendingIds, setFavoritePendingIds] = useState<string[]>([]);
  const favoriteReads = useRef(new Set<string>());
  const favoriteWrites = useRef(new Set<string>());
  const favoriteVersions = useRef(new Map<string, number>());
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
  const [cameraStartDraftId, setCameraStartDraftId] = useState<string>();
  const [guestPanel, setGuestPanel] = useState<GuestPanel | null>(null);
  const [identityIntent, setIdentityIntent] = useState<IdentityIntent>();
  const [nameDraft, setNameDraft] = useState("");
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
  const [uploadStorageStatus, setUploadStorageStatus] =
    useState<GalleryStatus>("loading");
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
  const completedUploads = useRef(new Set<string>());
  const activeRef = useRef(true);
  const previousPage = useRef(page);
  const isGallery = page === "gallery";
  const isAlbum = page === "my-album";
  const albumTab: AlbumTab =
    router.query.tab === "uploads" ? "uploads" : "photos";
  const albumHref = memoryPath(side, "my-album");
  const cameraDrafts = localPhotoDrafts.filter(
    (draft) => draft.event === eventId && draft.uid === guestUid
  );
  const guestJobs = guestUid
    ? queue.filter(
        (job) =>
          job.side === side &&
          job.event === eventId &&
          belongsToGuest(job, guestUid, name)
      )
    : [];
  const sharedPhotoKeys = new Set(
    myPhotos.map((photo) => photo.uploadKey).filter(Boolean)
  );
  const photoJobs = guestJobs.filter(
    (job) => job.kind === "photo" && !sharedPhotoKeys.has(job.uploadKey)
  );
  const cameraPhotoUploads = photoJobs.filter((job) => job.uid === guestUid);
  const unreservedPhotoJobs = guestJobs.filter(
    (job) => job.kind === "photo" && !job.slot
  );
  const quotaState =
    quotaSnapshot?.eventId === eventId ? quotaSnapshot.state : "loading";
  const remainingPhotos = Math.max(
    0,
    PHOTO_LIMIT - photoCount - unreservedPhotoJobs.length - cameraDrafts.length
  );
  const wantsPublicPhotos = isGallery && visitedTabs.includes("photos");
  const wantsPersonalPhotos = isAlbum || personalPhotosRequested;
  const wishesFeed = useGalleryCollection(
    eventId,
    isGallery && visitedTabs.includes("wishes"),
    subscribeWishes
  );
  const voicesFeed = useGalleryCollection(
    eventId,
    isGallery && visitedTabs.includes("voice-notes"),
    subscribeVoices
  );
  const showPersonalPhotos = galleryFilters.scope === "my";
  const showFavorites = galleryFilters.scope === "favorites";
  const gallerySourcePhotos = showPersonalPhotos ? myPhotos : photos;
  const galleryGuests = Array.from(
    new Set([
      ...gallerySourcePhotos.map((photo) => photo.guestName),
      ...(galleryFilters.guest ? [galleryFilters.guest] : []),
    ])
  ).sort((a, b) => a.localeCompare(b));
  const galleryPhotos = gallerySourcePhotos.filter(
    (photo) =>
      (!showFavorites || favoriteIds.includes(photo.id)) &&
      (galleryFilters.guest === null ||
        photo.guestName === galleryFilters.guest)
  );
  const hasUnreadFavorites =
    showFavorites &&
    photos.some((photo) => !favoriteReads.current.has(photo.id));
  const personalPhotoStatus =
    (!guestUid && quotaState === "error") ||
    (!online && myPhotoStatus === "ready" && myPhotos.length === 0)
      ? "error"
      : myPhotoStatus;
  const galleryPhotoStatus = showPersonalPhotos
    ? personalPhotoStatus
    : showFavorites &&
      (favoriteLoadError || (!guestUid && quotaState === "error"))
    ? "error"
    : showFavorites && (!guestUid || favoriteLoadPending || hasUnreadFavorites)
    ? "loading"
    : photoStatus;
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
    setFavoriteIds([]);
    setCursor(undefined);
    setHasMore(false);
    pageCursorRef.current = resetMemoryPage();
    setMyCursor(undefined);
    setMyHasMore(false);
    myPageCursorRef.current = resetMemoryPage();
    favoriteReads.current.clear();
    favoriteWrites.current.clear();
    favoriteVersions.current.clear();
    setFavoritePendingIds([]);
    setFavoriteLoadError(false);
    setFavoriteError(false);
    setGalleryFilters({ scope: "all", guest: null });
    setQueue([]);
    completedUploads.current.clear();
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
    setUploadStorageStatus("loading");

    const loadQueue = async () => {
      if (loadedQueueRef.current === eventId) return;
      const jobs = await listUploadJobs(eventId);
      if (cancelled) return;
      loadedQueueRef.current = eventId;
      setQueue((rows) => [
        ...jobs.filter(
          (job) =>
            !completedUploads.current.has(job.id) &&
            !rows.some((row) => row.id === job.id)
        ),
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
    const localData = Promise.allSettled([loadQueue(), loadDrafts()]);
    void localData.then((results) => {
      if (!cancelled)
        setUploadStorageStatus(
          results.every((result) => result.status === "fulfilled")
            ? "ready"
            : "error"
        );
    });
    void Promise.allSettled([localData, loadCount()]).then((results) => {
      if (!cancelled)
        setQuotaSnapshot({
          eventId,
          state:
            results[0].status === "fulfilled" &&
            results[0].value.every((result) => result.status === "fulfilled") &&
            results[1].status === "fulfilled"
              ? "ready"
              : "error",
        });
    });
    return () => {
      cancelled = true;
    };
  }, [eventId, quotaAttempt]);

  useEffect(() => {
    if (isAlbum) setPersonalPhotosRequested(true);
  }, [isAlbum]);

  useEffect(() => {
    if (previousPage.current === page) return;
    previousPage.current = page;
    setGuestPanel(null);
    setCameraOpen(false);
    microphoneGenerationRef.current += 1;
    microphoneRequestRef.current = false;
    setMicrophonePending(false);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    const focus = window.requestAnimationFrame(() =>
      mainRef.current?.focus({ preventScroll: true })
    );
    return () => window.cancelAnimationFrame(focus);
  }, [page]);

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
    if (!isGallery) return;
    const selectFromLocation = () => {
      const hash = window.location.hash;
      const next =
        hash === "#wishes"
          ? "wishes"
          : hash === "#voice-notes"
          ? "voice-notes"
          : "photos";
      setGalleryTab(next);
      setVisitedTabs((tabs) => (tabs.includes(next) ? tabs : [...tabs, next]));
    };
    selectFromLocation();
    router.events.on("hashChangeComplete", selectFromLocation);
    window.addEventListener("hashchange", selectFromLocation);
    return () => {
      router.events.off("hashChangeComplete", selectFromLocation);
      window.removeEventListener("hashchange", selectFromLocation);
    };
  }, [isGallery, router.events]);

  useEffect(() => {
    return observeGalleryFeed(
      (onSettings, onError) =>
        subscribePublicSettings(eventId, onSettings, onError),
      setSettings,
      (reason) => {
        console.warn("Could not load Wedding Memories settings", reason);
        if (previousPage.current !== "gallery")
          setError("Could not load the couple’s settings.");
      }
    );
  }, [eventId]);

  useEffect(() => {
    if (!wantsPublicPhotos) return;
    setPhotoStatus("loading");
    return watchPhotos(
      eventId,
      undefined,
      pageCursorRef,
      setPhotos,
      setCursor,
      setHasMore,
      setPhotoStatus
    );
  }, [eventId, wantsPublicPhotos, photoAttempt]);

  useEffect(() => {
    if (!guestUid || !wantsPersonalPhotos) return;
    setMyPhotoStatus("loading");
    return watchPhotos(
      eventId,
      guestUid,
      myPageCursorRef,
      setMyPhotos,
      setMyCursor,
      setMyHasMore,
      setMyPhotoStatus
    );
  }, [eventId, guestUid, wantsPersonalPhotos, myPhotoAttempt]);
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
    if (!guestUid) return;
    const reads = favoriteReads.current;
    const ids = Array.from(
      new Set([...photos, ...myPhotos].map((photo) => photo.id))
    ).filter((id) => !reads.has(id));
    if (!ids.length) return;
    let active = true;
    const versions = ids.map((id) => favoriteVersions.current.get(id));
    setFavoriteLoadPending(true);
    setFavoriteLoadError(false);
    void readFavoriteIds(eventId, ids)
      .then((favorites) => {
        if (!active) return;
        const loaded = new Set(favorites);
        ids.forEach((id) => reads.add(id));
        setFavoriteIds((current) => {
          const next = new Set(current);
          ids.forEach((id, index) => {
            if (
              favoriteWrites.current.has(id) ||
              favoriteVersions.current.get(id) !== versions[index]
            )
              return;
            if (loaded.has(id)) next.add(id);
            else next.delete(id);
          });
          return Array.from(next);
        });
      })
      .catch((reason) => {
        if (!active) return;
        console.warn("Could not read Wedding Memories favourites", reason);
        setFavoriteLoadError(true);
      })
      .finally(() => {
        if (active) setFavoriteLoadPending(false);
      });
    return () => {
      active = false;
    };
  }, [photos, myPhotos, eventId, guestUid, favoriteAttempt]);

  function changeGalleryTab(tab: GalleryTab) {
    if (tab === galleryTab) return;
    const tabs = document.getElementById("memory-gallery-tabs");
    if (tabs && window.scrollY > 0) {
      const top = tabs.getBoundingClientRect().top;
      // Once the old panel is scrolled, start the new one just beneath its tabs.
      if (top <= parseFloat(getComputedStyle(tabs).top || "0")) {
        const header = tabs.previousElementSibling;
        if (header)
          window.scrollTo(
            0,
            header.getBoundingClientRect().bottom + window.scrollY - top
          );
      }
    }
    setGalleryTab(tab);
    setVisitedTabs((tabs) => (tabs.includes(tab) ? tabs : [...tabs, tab]));
    void router.push(`#${tab}`, undefined, { shallow: true, scroll: false });
  }

  function contributeFromGallery() {
    if (quotaState === "ready" && remainingPhotos > 0) openCamera();
    else void router.push(memoryPath(side));
  }

  function retryPersonalPhotos() {
    if (!guestUid) setQuotaAttempt((attempt) => attempt + 1);
    setMyPhotoAttempt((attempt) => attempt + 1);
  }

  function retryGalleryPhotos() {
    if (!guestUid && showFavorites) setQuotaAttempt((attempt) => attempt + 1);
    else if (showPersonalPhotos) retryPersonalPhotos();
    else if (showFavorites && favoriteLoadError)
      setFavoriteAttempt((attempt) => attempt + 1);
    else setPhotoAttempt((attempt) => attempt + 1);
  }
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
  function openCamera(reviewOnly = false, draftId?: string) {
    if (!reviewOnly && (quotaState !== "ready" || !remainingPhotos)) return;
    if (reviewOnly && !cameraDrafts.length && !cameraPhotoUploads.length)
      return;
    rememberSurfaceTrigger();
    setError("");
    setCameraUploadError("");
    setMessage(undefined);
    clearPhotoSuccess();
    setCameraStartDraftId(draftId);
    if (!requireIdentity(reviewOnly ? "review" : "camera")) return;
    setGuestPanel(null);
    setCameraStartInTray(reviewOnly);
    setCameraOpen(true);
  }
  function openAlbumUploads() {
    setGuestPanel(null);
    setError("");
    void router.push(`${albumHref}?tab=uploads`);
  }

  function changeAlbumTab(tab: AlbumTab) {
    if (tab === albumTab) return;
    void router.replace(
      tab === "uploads" ? `${albumHref}?tab=uploads` : albumHref,
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  }

  function openPanel(panel: Exclude<GuestPanel, "identity">) {
    rememberSurfaceTrigger();
    setError("");
    setMessage(undefined);
    if (panel === "upload") {
      if (quotaState !== "ready" || !remainingPhotos || photoBatchRef.current)
        return;
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
      (draft) => (!ids || ids.includes(draft.id)) && hasLocalPhotoMedia(draft)
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
      if (completedUploads.current.has(job.id)) return "uploaded";
      if (inFlightRef.current.has(job.id)) return "active";
      inFlightRef.current.add(job.id);
      if (isCurrentEvent()) {
        if (job.kind === "photo") setCameraUploadError("");
        setActiveUploadIds((ids) =>
          ids.includes(job.id) ? ids : [...ids, job.id]
        );
      }
      let result: UploadAttemptResult = "uploaded";
      let failureRecorded = false;
      try {
        await processUploadJob(job, {
          onJob: (next) => {
            failureRecorded = Boolean(next.error);
            if (isCurrentEvent()) {
              if (next.kind === "photo" && next.status !== "Uploading photo") {
                setProgress((values) => {
                  if (values[next.id] === undefined) return values;
                  const nextProgress = { ...values };
                  delete nextProgress[next.id];
                  return nextProgress;
                });
              }
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
        completedUploads.current.add(job.id);
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
          if (!failureRecorded)
            setError(
              job.kind === "photo"
                ? "Couldn’t upload this photo. Open My album to try again."
                : failure.message
            );
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
    const job = guestJobs.find(
      (candidate) => candidate.id === id && candidate.kind === "photo"
    );
    if (
      !job ||
      !getPhotoUploadState(
        job,
        undefined,
        inFlightRef.current.has(id),
        navigator.onLine
      ).canRetry
    )
      return inFlightRef.current.has(id) ? "active" : "failed";
    return uploadJob(job);
  }
  useEffect(() => {
    if (!guestUid || quotaState === "loading") return;
    let cancelled = false;
    const resume = () => {
      if (!navigator.onLine) return;
      void listUploadJobs(eventId)
        .then(async (all) => {
          if (cancelled) return;
          const resumable = all.filter(
            (job) =>
              job.side === side &&
              belongsToGuest(job, guestUid, name) &&
              !completedUploads.current.has(job.id) &&
              (job.kind === "audio" || canResumePhotoUpload(job))
          );
          let next = 0;
          await Promise.all(
            Array.from({ length: Math.min(3, resumable.length) }, async () => {
              while (
                !cancelled &&
                navigator.onLine &&
                next < resumable.length
              ) {
                const job = resumable[next++];
                await uploadJob(job);
              }
            })
          );
        })
        .catch(() => {
          if (!cancelled && loadedQueueRef.current === eventId)
            setError(
              "Could not read pending uploads. Try reopening this album."
            );
        });
    };
    resume();
    const reconnect = () => {
      if (quotaState === "error") setQuotaAttempt((attempt) => attempt + 1);
      resume();
    };
    window.addEventListener("online", reconnect);
    return () => {
      cancelled = true;
      window.removeEventListener("online", reconnect);
    };
  }, [side, eventId, guestUid, name, quotaState, uploadJob]);
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
    const writes = favoriteWrites.current;
    if (writes.has(id) || !guestUid) return false;
    const enabled = !favoriteIds.includes(id);
    favoriteVersions.current.set(
      id,
      (favoriteVersions.current.get(id) ?? 0) + 1
    );
    writes.add(id);
    setFavoritePendingIds(Array.from(writes));
    setFavoriteError(false);
    try {
      await saveFavorite(eventId, id, enabled);
      if (!activeRef.current || eventScopeRef.current !== eventId) return;
      setFavoriteIds((ids) =>
        enabled
          ? Array.from(new Set([...ids, id]))
          : ids.filter((favoriteId) => favoriteId !== id)
      );
      return true;
    } catch (reason) {
      console.warn("Could not save Wedding Memories favourite", reason);
      if (activeRef.current && eventScopeRef.current === eventId) {
        setFavoriteError(true);
      }
      return false;
    } finally {
      writes.delete(id);
      if (activeRef.current && eventScopeRef.current === eventId)
        setFavoritePendingIds(Array.from(writes));
    }
  }

  async function loadMorePhotos(personal = false) {
    const nextCursor = personal ? myCursor : cursor;
    if (
      !nextCursor ||
      loadingMore ||
      !(personal ? myHasMore && guestUid : hasMore)
    )
      return;
    const scope = personal ? "personal" : "public";
    const tracker = personal ? myPageCursorRef : pageCursorRef;
    const setRows = personal ? setMyPhotos : setPhotos;
    const setNextCursor = personal ? setMyCursor : setCursor;
    const setMore = personal ? setMyHasMore : setHasMore;
    setLoadingMore(true);
    setPhotoPageError(undefined);
    tracker.current = beginMemoryPage(tracker.current);
    try {
      const result = await readMorePhotos(
        eventId,
        nextCursor,
        personal ? guestUid : undefined
      );
      if (!activeRef.current || eventScopeRef.current !== eventId) return;
      setRows((current) => appendMemoryRows(current, result.rows));
      tracker.current = applyMemoryTail(
        tracker.current,
        result.cursor,
        result.hasMore
      );
      setNextCursor(tracker.current.cursor);
      setMore(tracker.current.hasMore);
    } catch (reason) {
      console.warn("Could not load more Wedding Memories photos", reason);
      if (activeRef.current && eventScopeRef.current === eventId)
        setPhotoPageError(scope);
    } finally {
      if (activeRef.current && eventScopeRef.current === eventId)
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
  const homeHref = memoryPath(side);
  const galleryHref = memoryPath(side, "gallery");
  const { coupleNames, dateLabel } = MEMORY_PUBLIC_ALBUMS[side];
  const photoSuccess = confirmedPhotoCount
    ? `${confirmedPhotoCount} ${
        confirmedPhotoCount === 1 ? "photo" : "photos"
      } shared in the gallery.`
    : "";
  const pageTitle = `${
    isAlbum
      ? "My album"
      : isGallery
      ? "Wedding memories gallery"
      : "Share your wedding memories"
  } · ${event.name} · ${event.dateLabel}`;
  const albumUploads: AlbumUploadItem[] = isAlbum
    ? [
        ...cameraDrafts.map((draft): AlbumUploadItem => {
          const detail = hasLocalPhotoMedia(draft)
            ? {
                group: "draft" as const,
                status: "Saved on this device",
                detail: "Review this photo before sharing it.",
              }
            : getPhotoUploadState(draft, undefined, false, online);
          return {
            ...detail,
            id: draft.id,
            createdAt: draft.createdAt,
            preview: getUploadThumbnail(draft),
            canReview: true,
          };
        }),
        ...photoJobs.map(
          (job): AlbumUploadItem => ({
            ...getPhotoUploadState(
              job,
              progress[job.id],
              activeUploadIds.includes(job.id),
              online
            ),
            id: job.id,
            createdAt: job.createdAt,
            preview: getUploadThumbnail(job),
            fileName:
              typeof File !== "undefined" && job.blob instanceof File
                ? job.blob.name
                : undefined,
          })
        ),
      ]
    : [];
  return (
    <main
      ref={mainRef}
      tabIndex={-1}
      className={`${
        isGallery
          ? `${homeStyles.galleryPage} ${galleryStyles.page}`
          : homeStyles.homePage
      } ${weddingFonts.memory}`}
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
          href={memoryCanonicalUrl(side, page === "guest" ? "" : page)}
        />
      </Head>
      {isAlbum ? (
        <MemoryAlbum
          name={name}
          remaining={remainingPhotos}
          photoLimit={PHOTO_LIMIT}
          quotaState={quotaState}
          addingFiles={addingFiles}
          tab={albumTab}
          uploadCount={albumUploads.length}
          photoStatus={personalPhotoStatus}
          photoCount={myPhotos.length}
          hasMore={myHasMore}
          loadingMore={loadingMore}
          loadMoreFailed={photoPageError === "personal"}
          favoriteError={favoriteError}
          onTabChange={changeAlbumTab}
          onCamera={() => openCamera()}
          onAdd={() => openPanel("upload")}
          onQuotaRetry={() => setQuotaAttempt((attempt) => attempt + 1)}
          onPhotoRetry={retryPersonalPhotos}
          onLoadMore={() => void loadMorePhotos(true)}
          uploadSummary={
            <MemoryAlbumUploadSummary
              items={albumUploads}
              current={albumTab === "uploads"}
              onOpen={() => changeAlbumTab("uploads")}
            />
          }
          uploads={
            <MemoryAlbumUploads
              items={albumUploads}
              loading={uploadStorageStatus === "loading"}
              loadFailed={uploadStorageStatus === "error"}
              onLoadRetry={() => setQuotaAttempt((attempt) => attempt + 1)}
              onReview={(id) => openCamera(true, id)}
              onRetry={(id) => void retryCameraUpload(id)}
              onViewPhotos={() => changeAlbumTab("photos")}
            />
          }
          success={photoSuccess}
          qrHref={memoryPath(side, "qr")}
        >
          {myPhotos.map((photo) => (
            <MemoryGalleryPhoto
              key={photo.id}
              photo={photo}
              side={side}
              settings={settings}
              onFavorite={toggleFavorite}
              favorite={favoriteIds.includes(photo.id)}
              variant="album"
              favoritePending={
                !guestUid ||
                (!favoriteLoadError && !favoriteReads.current.has(photo.id)) ||
                favoritePendingIds.includes(photo.id)
              }
              backgroundRef={mainRef}
            />
          ))}
        </MemoryAlbum>
      ) : isGallery ? (
        <MemoryGallery
          coupleNames={coupleNames}
          hashtag={MEMORY_HASHTAG}
          cover={settings?.cover}
          welcome={settings?.welcome}
          tab={galleryTab}
          onTabChange={changeGalleryTab}
          theme={event.theme}
          backgroundRef={mainRef}
        >
          {galleryTab === "photos" && (
            <MemoryGalleryPhotos
              filters={galleryFilters}
              onFiltersChange={(next) => {
                if (next.scope === "my") setPersonalPhotosRequested(true);
                setGalleryFilters(next);
              }}
              guests={galleryGuests}
              count={galleryPhotos.length}
              status={galleryPhotoStatus}
              hasMore={showPersonalPhotos ? myHasMore : hasMore}
              loadingMore={loadingMore}
              loadMoreFailed={
                photoPageError === (showPersonalPhotos ? "personal" : "public")
              }
              favoriteError={favoriteError}
              theme={event.theme}
              backgroundRef={mainRef}
              fontClassName={weddingFonts.memory}
              onRetry={retryGalleryPhotos}
              onLoadMore={() => void loadMorePhotos(showPersonalPhotos)}
              onContribute={contributeFromGallery}
            >
              {galleryPhotos.map((photo) => (
                <MemoryGalleryPhoto
                  key={photo.id}
                  photo={photo}
                  side={side}
                  settings={settings}
                  onFavorite={toggleFavorite}
                  favorite={favoriteIds.includes(photo.id)}
                  allowViewerFavorite={!showFavorites}
                  favoritePending={
                    !guestUid ||
                    (!favoriteLoadError &&
                      !favoriteReads.current.has(photo.id)) ||
                    favoritePendingIds.includes(photo.id)
                  }
                  backgroundRef={mainRef}
                />
              ))}
            </MemoryGalleryPhotos>
          )}
          {galleryTab === "wishes" && (
            <MemoryGalleryWishes
              wishes={wishesFeed.rows}
              status={wishesFeed.status}
              onRetry={wishesFeed.retry}
              onContribute={() => openPanel("wish")}
            />
          )}
          {galleryTab === "voice-notes" && (
            <MemoryGalleryVoices
              voices={voicesFeed.rows}
              status={voicesFeed.status}
              suspendPlayback={Boolean(guestPanel) || cameraOpen}
              onRetry={voicesFeed.retry}
              onContribute={() => openPanel("voice")}
            />
          )}
        </MemoryGallery>
      ) : (
        <MemoryGuestHub
          coupleNames={coupleNames}
          date={dateLabel}
          hashtag={MEMORY_HASHTAG}
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
          galleryHref={galleryHref}
        >
          <MemoryHomeUploadStatus
            jobs={guestJobs}
            activeUploadIds={activeUploadIds}
            online={online}
            confirmedPhotoCount={confirmedPhotoCount}
            message={message?.kind === "voice" ? message.text : undefined}
            onAlbum={openAlbumUploads}
            onVoice={() => openPanel("voice")}
          />
        </MemoryGuestHub>
      )}
      <MemoryGuestNav
        homeHref={homeHref}
        galleryHref={galleryHref}
        isGallery={isGallery}
        albumHref={albumHref}
        isAlbum={isAlbum}
        hidden={cameraOpen || Boolean(guestPanel)}
      />
      {guestPanel && (
        <MemoryGuestPanel
          theme={event.theme}
          title={panelTitles[guestPanel]}
          backgroundRef={mainRef}
          className={
            guestPanel === "identity"
              ? `${homeStyles.identityPanel} ${weddingFonts.memory}`
              : undefined
          }
          message={
            guestPanel === "upload"
              ? photoSuccess
              : guestPanel === message?.kind
              ? message.text
              : undefined
          }
          error={isGallery ? guestFacingGalleryError(error) : error}
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
                onClick={openAlbumUploads}
              >
                View My album
              </button>
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
        </MemoryGuestPanel>
      )}
      {cameraOpen && (
        <MemoryCamera
          coupleNames={coupleNames}
          remaining={quotaState === "ready" ? remainingPhotos : 0}
          photoLimit={PHOTO_LIMIT}
          quotaKnown={quotaState === "ready"}
          backgroundRef={mainRef}
          drafts={cameraDrafts}
          approvedUploads={cameraPhotoUploads}
          uploadProgress={progress}
          activeUploadIds={activeUploadIds}
          startInTray={cameraStartInTray}
          startDraftId={cameraStartDraftId}
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
        <p role="alert" className={styles.error}>
          {isGallery
            ? guestFacingGalleryError(error)
            : error.includes("permission") || error.includes("insufficient")
            ? "Memories are not active yet. The couple needs to publish Firebase setup first."
            : error}
        </p>
      )}
    </main>
  );
}

type GallerySubscription<T> = (
  eventId: WeddingEventId,
  onRows: (rows: T[]) => void,
  onError: (reason: Error) => void
) => Promise<() => void>;

function observeGalleryFeed<T>(
  subscribe: (
    onRows: (rows: T) => void,
    onError: (reason: Error) => void
  ) => Promise<() => void>,
  onRows: (rows: T) => void,
  onError: (reason: Error) => void
) {
  let active = true;
  let stop: (() => void) | undefined;
  const fail = (reason: Error) => {
    if (active) onError(reason);
  };
  void subscribe((rows) => {
    if (active) onRows(rows);
  }, fail)
    .then((unsubscribe) => {
      if (active) stop = unsubscribe;
      else unsubscribe();
    })
    .catch(fail);
  return () => {
    active = false;
    stop?.();
  };
}

function useGalleryCollection<T>(
  eventId: WeddingEventId,
  enabled: boolean,
  subscribe: GallerySubscription<T>
) {
  const [rows, setRows] = useState<T[]>([]);
  const [status, setStatus] = useState<GalleryStatus>("loading");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    setStatus("loading");
    return observeGalleryFeed(
      (onRows, onError) => subscribe(eventId, onRows, onError),
      (next: T[]) => {
        setRows(next);
        setStatus("ready");
      },
      (reason) => {
        console.warn(
          "Could not retrieve a Wedding Memories collection",
          reason
        );
        setStatus("error");
      }
    );
  }, [eventId, enabled, subscribe, attempt]);
  return { rows, status, retry: () => setAttempt((value) => value + 1) };
}

function watchPhotos(
  eventId: WeddingEventId,
  uid: string | undefined,
  tracker: { current: ReturnType<typeof resetMemoryPage<PhotoCursor>> },
  setRows: React.Dispatch<React.SetStateAction<MemoryPhoto[]>>,
  setCursor: (cursor: PhotoCursor | undefined) => void,
  setMore: (more: boolean) => void,
  setStatus: (status: GalleryStatus) => void
) {
  return observeGalleryFeed(
    (onRows, onError) =>
      subscribePhotos(
        eventId,
        (rows, cursor, more) => onRows({ rows, cursor, more }),
        onError,
        uid
      ),
    ({
      rows,
      cursor,
      more,
    }: {
      rows: MemoryPhoto[];
      cursor?: PhotoCursor;
      more?: boolean;
    }) => {
      setRows((current) => mergeMemoryRows(current, rows));
      tracker.current = applyMemoryHead(tracker.current, cursor, more ?? false);
      setCursor(tracker.current.cursor);
      setMore(tracker.current.hasMore);
      setStatus("ready");
    },
    (reason) => {
      console.warn("Could not retrieve Wedding Memories photos", reason);
      setStatus("error");
    }
  );
}

function belongsToGuest(job: UploadJob, guestUid: string, name: string) {
  return job.uid
    ? job.uid === guestUid
    : Boolean(name.trim() && job.name === name.trim());
}

function getUploadThumbnail(job: UploadJob) {
  if (job.previewBlob instanceof Blob && job.previewBlob.size > 0)
    return job.previewBlob;
  // Older records can lack a thumbnail. Avoid decoding large originals in rows.
  return hasLocalPhotoMedia(job) && job.blob.size <= 512 * 1024
    ? job.blob
    : undefined;
}

function guestFacingGalleryError(error: string) {
  if (/blob\/file|object store|indexeddb/i.test(error))
    return "Could not save this contribution on your device. Try again.";
  if (/firebase|storage\/|firestore|insufficient permissions/i.test(error))
    return "Could not complete that action. Check your connection and try again.";
  return error;
}
