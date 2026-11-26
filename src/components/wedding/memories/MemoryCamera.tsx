import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MEMORY_HASHTAG, type MemorySettings } from "@/lib/wedding/memories";
import { resolveWeddingPhotoTime } from "@/lib/wedding/memoriesPhotoTime";
import {
  createCameraWebGLPreview,
  getCameraFrameGeometry,
  getPhotoDimensions,
  renderCameraFrame,
  renderCameraFrameInto,
  renderWeddingPhoto,
  resolvePhotoFilm,
  type CameraWebGLPreview,
  type PhotoFilm,
  type PhotoStyle,
} from "@/lib/wedding/memoriesRender";
import {
  acquireCameraStream,
  CaptureGate,
  getCameraCaptureConstraints,
  scheduleVideoFrames,
  stopCameraStream,
} from "@/lib/wedding/memoriesCamera";
import {
  validatePhotoBytes,
  type LocalPhotoDraft,
  type UploadJob,
} from "@/lib/wedding/memoriesQueue";
import type {
  UploadAttemptResult,
  UploadBatchResult,
} from "@/lib/wedding/memoriesUploadStatus";
import {
  MemoryCameraDeck,
  MemoryCameraState,
  MemoryCameraToolbar,
} from "./MemoryCameraControls";
import { MemoryCameraFilm } from "./MemoryCameraFilm";
import { MemoryCameraTray } from "./MemoryCameraTray";
import styles from "./MemoryCameraControls.module.css";

type CameraProps = {
  coupleNames: string;
  remaining: number;
  photoLimit: number;
  quotaKnown: boolean;
  drafts: LocalPhotoDraft[];
  approvedUploads: UploadJob[];
  uploadProgress: Record<string, number>;
  activeUploadIds: string[];
  startInTray?: boolean;
  startDraftId?: string;
  defaults?: MemorySettings;
  backgroundRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  onSave: (raw: Blob, style: PhotoStyle, previewBlob?: Blob) => Promise<void>;
  onUpload: (
    file: File,
    style: PhotoStyle,
    previewBlob?: Blob
  ) => Promise<void>;
  onDeleteDraft: (id: string) => Promise<void>;
  onUploadDrafts: (ids?: string[]) => Promise<UploadBatchResult>;
  onRetryUpload: (id: string) => Promise<UploadAttemptResult>;
  uploadError: string;
};

type Facing = "environment" | "user";
type CameraProblem = "denied" | "unavailable" | "paused";
type UnsavedPhoto = { raw: Blob; style: PhotoStyle; preview?: Blob };

const firstFrameTimeoutMs = 15000;
const saveNoticeMs = 2100;
const saveError = "Couldn’t save this photo on your device. Retry saving it.";

export function MemoryCamera(props: CameraProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<CameraSurface {...props} />, document.body);
}

function CameraSurface({
  coupleNames,
  remaining,
  photoLimit,
  quotaKnown,
  drafts,
  approvedUploads,
  uploadProgress,
  activeUploadIds,
  startInTray = false,
  startDraftId,
  defaults,
  backgroundRef,
  onClose,
  onSave,
  onUpload,
  onDeleteDraft,
  onUploadDrafts,
  onRetryUpload,
  uploadError,
}: CameraProps) {
  const [film, setFilm] = useState<PhotoFilm>(
    resolvePhotoFilm(defaults?.film ?? "fp2")
  );
  const [stamp] = useState(defaults?.stamp ?? MEMORY_HASHTAG);
  const [facing, setFacing] = useState<Facing>("environment");
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(!startInTray);
  const [switching, setSwitching] = useState(false);
  const [canSwitch, setCanSwitch] = useState(false);
  const [cameraProblem, setCameraProblem] = useState<CameraProblem>();
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(!startInTray);
  const [draftTrayOpen, setDraftTrayOpen] = useState(startInTray);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(
    startDraftId ?? null
  );
  const [filmOpen, setFilmOpen] = useState(false);
  const [trayError, setTrayError] = useState("");
  const [trayStatus, setTrayStatus] = useState("");
  const [online, setOnline] = useState(() => navigator.onLine);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [unsaved, setUnsaved] = useState<UnsavedPhoto>();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [gpuUnavailable, setGpuUnavailable] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);

  const video = useRef<HTMLVideoElement>(null);
  const gpuCanvas = useRef<HTMLCanvasElement>(null);
  const fallbackCanvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLElement>(null);
  const filmTrigger = useRef<HTMLButtonElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const trayToggle = useRef<HTMLButtonElement>(null);
  const trayClose = useRef<HTMLButtonElement>(null);
  const selectedDraftBack = useRef<HTMLButtonElement>(null);
  const trayPanel = useRef<HTMLElement>(null);
  const streamRef = useRef<MediaStream>();
  const actualFacing = useRef<Facing>();
  const requestActive = useRef(false);
  const switchRequested = useRef(false);
  const firstFrameTimer = useRef<number>();
  const saveTimer = useRef<number>();
  const shutterGate = useRef(new CaptureGate());
  const gpuRenderer = useRef<CameraWebGLPreview | null>(null);
  const fallbackActiveRef = useRef(false);
  const uploadBatchPending = useRef(false);
  const latest = [...drafts, ...approvedUploads].reduce<UploadJob | undefined>(
    (previous, item) =>
      !previous || item.createdAt > previous.createdAt ? item : previous,
    undefined
  );
  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId);
  const photoCount = drafts.length + approvedUploads.length;

  const frame = useMemo(
    () =>
      viewport.width && viewport.height
        ? getCameraFrameGeometry(viewport.width, viewport.height)
        : null,
    [viewport]
  );
  const fallbackFrame = useMemo(
    () =>
      viewport.width && viewport.height
        ? getCameraFrameGeometry(viewport.width, viewport.height, 360)
        : null,
    [viewport]
  );

  const releaseStream = useCallback(() => {
    if (firstFrameTimer.current !== undefined) {
      window.clearTimeout(firstFrameTimer.current);
      firstFrameTimer.current = undefined;
    }
    const source = streamRef.current;
    const element = video.current;
    streamRef.current = undefined;
    if (element && source && element.srcObject === source) {
      element.pause();
      element.srcObject = null;
    }
    stopCameraStream(source);
    setReady(false);
  }, []);

  const setFallbackMode = useCallback((active: boolean) => {
    if (fallbackActiveRef.current === active) return;
    fallbackActiveRef.current = active;
    setFallbackActive(active);
  }, []);

  const reportCameraFailure = useCallback(
    (reason: unknown) => {
      requestActive.current = false;
      releaseStream();
      setPending(false);
      setSwitching(false);
      if (switchRequested.current) {
        switchRequested.current = false;
        setError("Couldn’t switch cameras. Try again.");
      }
      const name = (reason as { name?: string } | undefined)?.name;
      setCameraProblem(
        name === "NotAllowedError" || name === "SecurityError"
          ? "denied"
          : "unavailable"
      );
      console.warn("Could not open the Wedding Memories camera", reason);
    },
    [releaseStream]
  );

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      window.clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    const node = gpuCanvas.current;
    if (!node) return;
    const renderer = createCameraWebGLPreview(node, () =>
      setGpuUnavailable(true)
    );
    gpuRenderer.current = renderer;
    setGpuUnavailable(!renderer);
    return () => {
      renderer?.dispose();
      if (gpuRenderer.current === renderer) gpuRenderer.current = null;
    };
  }, []);

  useEffect(() => {
    const node = stage.current;
    if (!node) return;
    const measure = () => {
      const { width, height } = node.getBoundingClientRect();
      if (width > 0 && height > 0)
        setViewport((current) =>
          current.width === width && current.height === height
            ? current
            : { width, height }
        );
    };
    measure();
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measure)
        : null;
    observer?.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const background = backgroundRef.current;
    const wasInert = background?.inert ?? false;
    const previousOverflow = document.body.style.overflow;
    if (background) background.inert = true;
    document.body.style.overflow = "hidden";
    dialog.current?.focus({ preventScroll: true });
    return () => {
      if (background) background.inert = wasInert;
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus({ preventScroll: true });
    };
  }, [backgroundRef]);

  useEffect(() => {
    if (!cameraEnabled) {
      setPending(false);
      return;
    }
    if (document.visibilityState === "hidden") {
      setPending(false);
      setSwitching(false);
      setCameraProblem("paused");
      return;
    }
    let current = true;
    let activeTrack: MediaStreamTrack | undefined;
    requestActive.current = true;
    setPending(true);
    setCameraProblem(undefined);
    setCanSwitch(false);
    const request = navigator.mediaDevices?.getUserMedia?.bind(
      navigator.mediaDevices
    );
    if (!request) {
      reportCameraFailure(new Error("getUserMedia is unavailable"));
      return;
    }
    const onTrackEnded = () => {
      if (current && requestActive.current)
        reportCameraFailure(new Error("Camera track ended"));
    };
    firstFrameTimer.current = window.setTimeout(() => {
      if (current && requestActive.current)
        reportCameraFailure(new Error("Timed out waiting for a camera frame"));
    }, firstFrameTimeoutMs);

    const isCurrent = () => current && requestActive.current;
    void Promise.resolve()
      .then(() =>
        isCurrent()
          ? acquireCameraStream(
              request,
              getCameraCaptureConstraints(facing),
              isCurrent
            )
          : undefined
      )
      .then((stream) => {
        if (!stream) return;
        const element = video.current;
        streamRef.current = stream;
        activeTrack = stream.getVideoTracks()[0];
        if (!element || !activeTrack) {
          reportCameraFailure(new Error("Camera stream has no video track"));
          return;
        }
        const reportedFacing = activeTrack.getSettings?.().facingMode;
        actualFacing.current =
          reportedFacing === "environment" || reportedFacing === "user"
            ? reportedFacing
            : undefined;
        activeTrack.addEventListener("ended", onTrackEnded);
        element.srcObject = stream;
        void element.play().catch((reason) => {
          if (current && requestActive.current && streamRef.current === stream)
            reportCameraFailure(reason);
        });
        const enumerateDevices = navigator.mediaDevices.enumerateDevices?.bind(
          navigator.mediaDevices
        );
        void enumerateDevices?.()
          .then((devices) => {
            if (
              current &&
              requestActive.current &&
              streamRef.current === stream
            )
              setCanSwitch(
                devices.filter(({ kind }) => kind === "videoinput").length > 1
              );
          })
          .catch((reason) =>
            console.warn("Could not list alternate cameras", reason)
          );
      })
      .catch((reason) => {
        if (current && requestActive.current) reportCameraFailure(reason);
      });
    return () => {
      current = false;
      requestActive.current = false;
      activeTrack?.removeEventListener("ended", onTrackEnded);
      releaseStream();
    };
  }, [facing, attempt, cameraEnabled, releaseStream, reportCameraFailure]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden" || !cameraEnabled) return;
      requestActive.current = false;
      releaseStream();
      setPending(false);
      setSwitching(false);
      switchRequested.current = false;
      setCameraProblem("paused");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [cameraEnabled, releaseStream]);

  useEffect(() => {
    if (
      !ready ||
      !frame ||
      !video.current ||
      draftTrayOpen ||
      film === "none"
    ) {
      setFallbackMode(false);
      return;
    }
    const videoElement = video.current;
    const fallback = fallbackCanvas.current;
    const drawFallback = () => {
      if (!fallback || !fallbackFrame) return;
      renderCameraFrameInto(videoElement, fallback, fallbackFrame, {
        film,
        stamp: "",
        capturedAt: Date.now(),
        coupleNames,
        aspectRatio: frame.aspectRatio,
        stampAspectRatio: frame.captureWidth / frame.captureHeight,
        includeStamp: false,
      });
      setFallbackMode(true);
    };
    const render = () => {
      if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const dimensions = getPhotoDimensions(videoElement);
      if (!dimensions.width || !dimensions.height) return;
      try {
        if (gpuUnavailable || !gpuRenderer.current) drawFallback();
        else {
          gpuRenderer.current.render(
            videoElement,
            frame,
            resolvePhotoFilm(film)
          );
          setFallbackMode(false);
        }
      } catch {
        setGpuUnavailable(true);
        try {
          drawFallback();
        } catch (reason) {
          reportCameraFailure(reason);
        }
      }
    };
    return scheduleVideoFrames(videoElement, render);
  }, [
    ready,
    draftTrayOpen,
    film,
    coupleNames,
    frame,
    fallbackFrame,
    gpuUnavailable,
    reportCameraFailure,
    setFallbackMode,
  ]);

  useEffect(() => {
    if (!draftTrayOpen) return;
    const focus = window.requestAnimationFrame(() =>
      (selectedDraftId ? selectedDraftBack : trayClose).current?.focus()
    );
    return () => window.cancelAnimationFrame(focus);
  }, [draftTrayOpen, selectedDraftId]);

  function markFrameReady() {
    const element = video.current;
    if (
      !requestActive.current ||
      !streamRef.current ||
      element?.srcObject !== streamRef.current ||
      element.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
      !element.videoWidth ||
      !element.videoHeight
    )
      return;
    window.clearTimeout(firstFrameTimer.current);
    firstFrameTimer.current = undefined;
    setReady(true);
    setPending(false);
    setSwitching(false);
    switchRequested.current = false;
  }

  function openCameraAgain() {
    setError("");
    setCameraEnabled(true);
    setPending(true);
    setAttempt((value) => value + 1);
  }

  function switchCamera() {
    if (!canSwitch || pending || shutterGate.current.isBusy || unsaved) return;
    const next =
      (actualFacing.current ?? facing) === "environment"
        ? "user"
        : "environment";
    releaseStream();
    setPending(true);
    setSwitching(true);
    switchRequested.current = true;
    setError("");
    if (next === facing) setAttempt((value) => value + 1);
    else setFacing(next);
  }

  function closeCamera() {
    if (shutterGate.current.isBusy) return;
    if (
      unsaved &&
      !window.confirm(
        "This photo hasn’t been saved. Close the camera and discard it?"
      )
    )
      return;
    onClose();
  }

  function clearFeedback() {
    window.clearTimeout(saveTimer.current);
    setStatus("");
    setError("");
  }

  function announceSaved() {
    setStatus("Photo saved");
    saveTimer.current = window.setTimeout(() => setStatus(""), saveNoticeMs);
  }

  async function persistCapture(photo: UnsavedPhoto) {
    try {
      await onSave(photo.raw, photo.style, photo.preview);
      setUnsaved(undefined);
      announceSaved();
    } catch (reason) {
      console.warn("Could not save a Wedding Memories camera draft", reason);
      setUnsaved(photo);
      setError(saveError);
    }
  }

  async function shutter() {
    const element = video.current;
    if (!element || !frame || !ready || !remaining || unsaved || draftTrayOpen)
      return;
    await shutterGate.current.run(async () => {
      clearFeedback();
      setBusy(true);
      const capturedAt = Date.now();
      const style = { film, stamp, capturedAt };
      try {
        // Use the actual measured viewport. Film and stamp are retained as metadata.
        const raw = await canvasToBlob(
          renderCameraFrame(element, frame, {
            film: "none",
            stamp: "",
            capturedAt,
            coupleNames,
            includeStamp: false,
          })
        );
        const preview = await prepareOptionalPreview(raw, style, coupleNames);
        await persistCapture({ raw, style, preview });
      } catch (reason) {
        console.warn("Could not capture a Wedding Memories photo", reason);
        setError("Couldn’t take this photo. Try again.");
      } finally {
        setBusy(false);
      }
    });
  }

  async function retrySave() {
    if (!unsaved) return;
    await shutterGate.current.run(async () => {
      clearFeedback();
      setBusy(true);
      try {
        await persistCapture(unsaved);
      } finally {
        setBusy(false);
      }
    });
  }

  async function chooseFile(file?: File) {
    if (!file || remaining <= 0 || unsaved) return;
    await shutterGate.current.run(async () => {
      setTrayError("");
      setTrayStatus("");
      clearFeedback();
      const invalid = await validatePhotoBytes(file).catch(
        () => "Couldn’t open this photo. Choose another file."
      );
      if (invalid) {
        if (draftTrayOpen) setTrayError(invalid);
        else setError(invalid);
        return;
      }
      setBusy(true);
      try {
        const style = { film, stamp, capturedAt: Date.now() };
        const preview = await prepareOptionalPreview(file, style, coupleNames);
        await onUpload(file, style, preview);
        if (draftTrayOpen) setTrayStatus("Photo saved on this device.");
        else announceSaved();
      } catch (reason) {
        console.warn(
          "Could not save a photo picked for Wedding Memories",
          reason
        );
        const message =
          "Couldn’t save this photo on your device. Choose it again to retry.";
        if (draftTrayOpen) setTrayError(message);
        else setError(message);
      } finally {
        setBusy(false);
      }
    });
  }

  async function uploadDrafts(ids?: string[]) {
    if (uploadBatchPending.current) return;
    setTrayError("");
    setTrayStatus("");
    uploadBatchPending.current = true;
    setUploading(true);
    try {
      const result = await onUploadDrafts(ids);
      setSelectedDraftId(null);
      if (result.failed > 0)
        setTrayStatus(
          "Some photos need attention. Review the upload details below."
        );
      else if (result.alreadyActive > 0 && result.uploaded === 0)
        setTrayStatus("These photos are already uploading.");
      else if (result.uploaded > 0)
        setTrayStatus(
          `${result.uploaded} photo${
            result.uploaded === 1 ? " is" : "s are"
          } uploaded.`
        );
      else setTrayStatus("No new photos were added to the upload queue.");
    } catch (reason) {
      console.warn("Could not approve Wedding Memories photo uploads", reason);
      setTrayError(
        "Couldn’t start the upload. Your saved photos are still available."
      );
    } finally {
      uploadBatchPending.current = false;
      setUploading(false);
    }
  }

  async function retryPhotoUpload(id: string) {
    setTrayError("");
    setTrayStatus("");
    try {
      const result = await onRetryUpload(id);
      if (result === "uploaded") setTrayStatus("Photo uploaded successfully.");
      else if (result === "active")
        setTrayStatus("This photo is already uploading.");
      else
        setTrayStatus(
          "Upload needs attention. See the details for this photo."
        );
    } catch (reason) {
      console.warn("Could not retry a Wedding Memories photo upload", reason);
      setTrayError(
        "Couldn’t retry this upload. Check your connection and try again."
      );
    }
  }

  async function deleteDraft(id: string) {
    if (!window.confirm("Delete this unshared photo from this device?")) return;
    setTrayError("");
    setTrayStatus("");
    setBusy(true);
    try {
      await onDeleteDraft(id);
      setSelectedDraftId(null);
      setTrayStatus("Photo deleted from this device.");
    } catch (reason) {
      console.warn("Could not delete a Wedding Memories camera draft", reason);
      setTrayError("Couldn’t delete this photo. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function openDraftTray() {
    if (shutterGate.current.isBusy) return;
    setFilmOpen(false);
    setTrayError("");
    setTrayStatus("");
    setDraftTrayOpen(true);
  }

  function closeDraftTray() {
    if (shutterGate.current.isBusy) return;
    setSelectedDraftId(null);
    setDraftTrayOpen(false);
    if (quotaKnown && remaining > 0 && !cameraEnabled) {
      setPending(true);
      setCameraEnabled(true);
    }
    setTrayError("");
    setTrayStatus("");
    window.requestAnimationFrame(() =>
      (trayToggle.current && !trayToggle.current.disabled
        ? trayToggle.current
        : dialog.current
      )?.focus({ preventScroll: true })
    );
  }

  const canCapture = Boolean(
    frame &&
      ready &&
      !pending &&
      !busy &&
      !unsaved &&
      quotaKnown &&
      remaining > 0
  );
  const cameraState = switching
    ? "switching"
    : pending
    ? "opening"
    : quotaKnown && remaining === 0
    ? "exhausted"
    : cameraProblem ?? (ready ? "ready" : "unavailable");

  return (
    <div className={styles.screen}>
      <section
        ref={dialog}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={
          draftTrayOpen ? "Camera photo review" : "Wedding Memories camera"
        }
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            if (selectedDraftId) setSelectedDraftId(null);
            else if (draftTrayOpen) closeDraftTray();
            else if (filmOpen) {
              setFilmOpen(false);
              filmTrigger.current?.focus({ preventScroll: true });
            } else closeCamera();
          }
          if (event.key !== "Tab") return;
          const focusScope = draftTrayOpen
            ? trayPanel.current
            : event.currentTarget;
          const buttons = Array.from(
            focusScope?.querySelectorAll<HTMLElement>(
              'button:not(:disabled), a[href], input:not(:disabled), [tabindex]:not([tabindex="-1"])'
            ) ?? []
          ).filter(
            (node) => node.tabIndex >= 0 && node.getClientRects().length > 0
          );
          const index = buttons.indexOf(document.activeElement as HTMLElement);
          if (
            index < 0 ||
            (event.shiftKey ? index === 0 : index === buttons.length - 1)
          ) {
            event.preventDefault();
            (event.shiftKey ? buttons.at(-1) : buttons[0])?.focus();
          }
        }}
      >
        <div className={styles.capture} hidden={draftTrayOpen}>
          <MemoryCameraToolbar
            remaining={remaining}
            photoLimit={photoLimit}
            quotaKnown={quotaKnown}
            closeDisabled={busy}
            onClose={closeCamera}
          />
          <div className={styles.stage} ref={stage}>
            <video
              ref={video}
              className={styles.source}
              autoPlay
              muted
              playsInline
              aria-hidden="true"
              style={{ visibility: ready ? "visible" : "hidden" }}
              onLoadedData={markFrameReady}
              onCanPlay={markFrameReady}
              onError={() => {
                if (requestActive.current && streamRef.current)
                  reportCameraFailure(video.current?.error);
              }}
            />
            <canvas
              ref={gpuCanvas}
              className={styles.preview}
              width={frame?.previewWidth ?? 1}
              height={frame?.previewHeight ?? 1}
              hidden={
                !ready || film === "none" || fallbackActive || gpuUnavailable
              }
              aria-hidden="true"
            />
            <canvas
              ref={fallbackCanvas}
              className={styles.preview}
              width={fallbackFrame?.previewWidth ?? 1}
              height={fallbackFrame?.previewHeight ?? 1}
              hidden={!ready || !fallbackActive || film === "none"}
              aria-hidden="true"
            />
            <MemoryCameraState
              state={cameraState}
              status={status}
              error={error}
              onRetry={
                unsaved
                  ? busy
                    ? undefined
                    : () => void retrySave()
                  : cameraState === "unavailable" || cameraState === "paused"
                  ? openCameraAgain
                  : undefined
              }
              onDiscard={
                unsaved && !busy
                  ? () => {
                      setUnsaved(undefined);
                      setError("");
                    }
                  : undefined
              }
              onExit={closeCamera}
              hasPhotos={photoCount > 0}
              onReview={openDraftTray}
            />
          </div>
          <MemoryCameraDeck
            canCapture={canCapture}
            busy={busy}
            canSwitch={canSwitch && !pending && !unsaved}
            switching={switching}
            reviewCount={photoCount}
            latestPhoto={latest?.previewBlob ?? latest?.blob}
            reviewRef={trayToggle}
            onReview={openDraftTray}
            onPickPhoto={() => fileInput.current?.click()}
            canPickPhoto={quotaKnown && remaining > 0 && !unsaved}
            onCapture={() => void shutter()}
            onSwitch={switchCamera}
          >
            <MemoryCameraFilm
              film={film}
              open={filmOpen}
              disabled={busy}
              onOpenChange={setFilmOpen}
              onSelect={(next) => {
                setFilm(next);
                setFilmOpen(false);
              }}
              triggerRef={filmTrigger}
            />
          </MemoryCameraDeck>
        </div>
        {draftTrayOpen && (
          <MemoryCameraTray
            drafts={drafts}
            approvedUploads={approvedUploads}
            selectedDraft={selectedDraft}
            coupleNames={coupleNames}
            remaining={remaining}
            busy={busy}
            uploading={uploading}
            online={online}
            uploadProgress={uploadProgress}
            activeUploadIds={activeUploadIds}
            error={
              trayError ||
              (uploadError
                ? "An upload needs attention. Review its status below."
                : undefined)
            }
            status={trayStatus}
            panelRef={trayPanel}
            closeRef={trayClose}
            selectedBackRef={selectedDraftBack}
            onClose={closeDraftTray}
            onSelect={setSelectedDraftId}
            onDelete={(id) => void deleteDraft(id)}
            onUpload={(ids) => void uploadDrafts(ids)}
            onRetryUpload={(id) => void retryPhotoUpload(id)}
            onPickPhoto={() => fileInput.current?.click()}
          />
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          disabled={busy || !quotaKnown || remaining <= 0 || Boolean(unsaved)}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            void chooseFile(file);
          }}
        />
      </section>
    </div>
  );
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("The camera could not create a photo.")),
      "image/jpeg",
      0.92
    )
  );
}

async function prepareOptionalPreview(
  blob: Blob,
  style: PhotoStyle,
  coupleNames: string
) {
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () =>
        reject(new Error("Could not prepare the photo preview."));
      image.src = objectUrl;
    });
    const { time } = await resolveWeddingPhotoTime(blob, style.capturedAt);
    return await canvasToBlob(
      renderWeddingPhoto(image, {
        film: style.film,
        coupleNames,
        time,
        maxDimension: 320,
      })
    );
  } catch (reason) {
    console.warn(
      "Could not make a thumbnail for a Wedding Memories camera draft",
      reason
    );
    return undefined;
  } finally {
    image.onload = null;
    image.onerror = null;
    image.src = "";
    URL.revokeObjectURL(objectUrl);
  }
}
