import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera as CameraIcon, SwitchCamera, RefreshCw, Image as GalleryIcon, Info, Trash2, Upload, X } from "lucide-react";
import { MEMORY_HASHTAG } from "@/lib/wedding/memories";
import {
  PHOTO_FILM_PRESETS,
  getCameraFrameGeometry,
  getPhotoDimensions,
  createCameraWebGLPreview,
  renderCameraFrame,
  renderCameraFrameInto,
  renderPhotoCanvas,
  resolvePhotoFilm,
  type CameraWebGLPreview,
  type PhotoFilm,
  type PhotoStyle,
} from "@/lib/wedding/memoriesRender";
import { acquireCameraStream, CaptureGate, getCameraCaptureConstraints, scheduleVideoFrames, stopCameraStream } from "@/lib/wedding/memoriesCamera";
import type { MemorySettings } from "@/lib/wedding/memories";
import { validatePhotoBytes, type LocalPhotoDraft } from "@/lib/wedding/memoriesQueue";
import type { UploadJob } from "@/lib/wedding/memoriesQueue";
import {
  getPhotoUploadPresentation,
  type UploadAttemptResult,
  type UploadBatchResult,
} from "@/lib/wedding/memoriesUploadStatus";
import styles from "./Memories.module.css";

export function MemoryCamera({
  side,
  coupleNames,
  date,
  remaining,
  drafts,
  approvedUploads,
  uploadProgress,
  activeUploadIds,
  startInTray = false,
  defaults,
  onClose,
  onSave,
  onUpload,
  onDeleteDraft,
  onUploadDrafts,
  onRetryUpload,
  uploadError,
}: {
  side: "bride" | "groom";
  coupleNames: string;
  date: string;
  guestName: string;
  remaining: number;
  drafts: LocalPhotoDraft[];
  approvedUploads: UploadJob[];
  uploadProgress: Record<string, number>;
  activeUploadIds: string[];
  startInTray?: boolean;
  defaults?: MemorySettings;
  onClose: () => void;
  onSave: (raw: Blob, style: PhotoStyle, previewBlob?: Blob) => Promise<void>;
  onUpload: (file: File, style: PhotoStyle, previewBlob?: Blob) => Promise<void>;
  onDeleteDraft: (id: string) => Promise<void>;
  onUploadDrafts: (ids?: string[]) => Promise<UploadBatchResult>;
  onRetryUpload: (id: string) => Promise<UploadAttemptResult>;
  uploadError: string;
}) {
  const [mounted, setMounted] = useState(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <CameraSurface
      side={side}
      coupleNames={coupleNames}
      date={date}
      remaining={remaining}
      drafts={drafts}
      approvedUploads={approvedUploads}
      uploadProgress={uploadProgress}
      activeUploadIds={activeUploadIds}
      startInTray={startInTray}
      defaults={defaults}
      onClose={() => onCloseRef.current()}
      onSave={onSave}
      onUpload={onUpload}
      onDeleteDraft={onDeleteDraft}
      onUploadDrafts={onUploadDrafts}
      onRetryUpload={onRetryUpload}
      uploadError={uploadError}
    />,
    document.body
  );
}

function CameraSurface({
  side,
  coupleNames,
  date,
  remaining,
  drafts,
  approvedUploads,
  uploadProgress,
  activeUploadIds,
  startInTray,
  defaults,
  onClose,
  onSave,
  onUpload,
  onDeleteDraft,
  onUploadDrafts,
  onRetryUpload,
  uploadError,
}: {
  side: "bride" | "groom";
  coupleNames: string;
  date: string;
  remaining: number;
  drafts: LocalPhotoDraft[];
  approvedUploads: UploadJob[];
  uploadProgress: Record<string, number>;
  activeUploadIds: string[];
  startInTray: boolean;
  defaults?: MemorySettings;
  onClose: () => void;
  onSave: (raw: Blob, style: PhotoStyle, previewBlob?: Blob) => Promise<void>;
  onUpload: (file: File, style: PhotoStyle, previewBlob?: Blob) => Promise<void>;
  onDeleteDraft: (id: string) => Promise<void>;
  onUploadDrafts: (ids?: string[]) => Promise<UploadBatchResult>;
  onRetryUpload: (id: string) => Promise<UploadAttemptResult>;
  uploadError: string;
}) {
  const [film, setFilm] = useState<PhotoFilm>(
    resolvePhotoFilm(defaults?.film ?? "fp2")
  );
  const [stamp] = useState(defaults?.stamp ?? MEMORY_HASHTAG);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(!startInTray);
  const [busy, setBusy] = useState(false);
  const [uploadBatchPending, setUploadBatchPending] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(!startInTray);
  const [draftTrayOpen, setDraftTrayOpen] = useState(startInTray);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [trayError, setTrayError] = useState("");
  const [trayStatus, setTrayStatus] = useState("");
  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine
  );
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [gpuUnavailable, setGpuUnavailable] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const gpuCanvas = useRef<HTMLCanvasElement>(null);
  const fallbackCanvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream>();
  const requestActive = useRef(true);
  const shutterGate = useRef(new CaptureGate());
  const gpuRenderer = useRef<CameraWebGLPreview | null>(null);
  const fallbackActiveRef = useRef(false);
  const dialog = useRef<HTMLElement>(null);
  const lookDetails = useRef<HTMLDetailsElement>(null);
  const lookSummary = useRef<HTMLElement | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const trayToggle = useRef<HTMLButtonElement>(null);
  const trayClose = useRef<HTMLButtonElement>(null);
  const selectedDraftBack = useRef<HTMLButtonElement>(null);
  const trayPanel = useRef<HTMLElement>(null);
  const uploadBatchPendingRef = useRef(false);
  const draftTrayOpenRef = useRef(draftTrayOpen);
  const selectedDraftIdRef = useRef(selectedDraftId);
  draftTrayOpenRef.current = draftTrayOpen;
  selectedDraftIdRef.current = selectedDraftId;
  const orderedDrafts = [...drafts].sort((first, second) => second.createdAt - first.createdAt);
  const latestDraft = orderedDrafts[0];
  const latestApprovedUpload = [...approvedUploads].sort(
    (first, second) => second.createdAt - first.createdAt
  )[0];
  const photoItemCount = drafts.length + approvedUploads.length;
  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId);
  const isGarden = side === "bride";
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const frame = useMemo(
    () =>
      viewport.width && viewport.height
        ? getCameraFrameGeometry(viewport.width, viewport.height)
        : null,
    [viewport]
  );

  useEffect(() => {
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);
  const fallbackFrame = useMemo(
    () =>
      viewport.width && viewport.height
        ? getCameraFrameGeometry(viewport.width, viewport.height, 360)
        : null,
    [viewport]
  );

  const releaseStream = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = undefined;
    setReady(false);
  }, []);
  const setFallbackMode = useCallback((active: boolean) => {
    if (fallbackActiveRef.current === active) return;
    fallbackActiveRef.current = active;
    setFallbackActive(active);
  }, []);

  useEffect(() => {
    const node = gpuCanvas.current;
    if (!node) return;
    const renderer = createCameraWebGLPreview(node, () => setGpuUnavailable(true));
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
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0)
        setViewport((current) =>
          current.width === rect.width && current.height === rect.height
            ? current
            : { width: rect.width, height: rect.height }
        );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!startInTray) dialog.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (selectedDraftIdRef.current) {
          setSelectedDraftId(null);
          requestAnimationFrame(() => trayClose.current?.focus());
          return;
        }
        if (draftTrayOpenRef.current) {
          closeDraftTray();
          return;
        }
        if (lookDetails.current?.open) {
          lookDetails.current.open = false;
          lookSummary.current?.focus();
          return;
        }
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusScope = draftTrayOpenRef.current
        ? trayPanel.current
        : dialog.current;
      const nodes = Array.from(
        focusScope?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled):not([tabindex="-1"]), summary, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter(
        (node) =>
          node.tabIndex >= 0 &&
          !node.hidden &&
          node.getAttribute("aria-hidden") !== "true" &&
          node.getClientRects().length > 0
      );
      if (!nodes.length) return;
      if (!nodes.includes(document.activeElement as HTMLElement)) {
        event.preventDefault();
        (event.shiftKey ? nodes.at(-1) : nodes[0])?.focus();
        return;
      }
      if (event.shiftKey && document.activeElement === nodes[0]) {
        event.preventDefault();
        nodes.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
        event.preventDefault();
        nodes[0].focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (!cameraEnabled) {
      setPending(false);
      return;
    }
    let current = true;
    requestActive.current = true;
    setPending(true);
    setError("");
    setReady(false);
    const request = navigator.mediaDevices?.getUserMedia?.bind(
      navigator.mediaDevices
    );
    if (!request) {
      setPending(false);
      setError("Camera access is unavailable. Choose an existing photo instead.");
      return () => {
        current = false;
        requestActive.current = false;
      };
    }
    void acquireCameraStream(
      request,
      getCameraCaptureConstraints(facing),
      () => current && requestActive.current
    )
      .then((stream) => {
        if (!stream) return;
        streamRef.current = stream;
        if (video.current) {
          video.current.srcObject = stream;
          void video.current.play().catch(() => undefined);
        }
      })
      .catch((reason) => {
        if (current)
          setError(`Camera unavailable: ${reason.message || "Check camera permissions."}`);
      })
      .finally(() => {
        if (current) setPending(false);
      });
    return () => {
      current = false;
      requestActive.current = false;
      stopCameraStream(streamRef.current);
      streamRef.current = undefined;
    };
  }, [facing, retry, releaseStream, cameraEnabled]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") {
        requestActive.current = false;
        releaseStream();
        setPending(false);
        setError("Camera paused while this page was hidden. Reopen it to continue.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [releaseStream]);

  useEffect(() => {
    if (!ready || !frame || !video.current) return;
    const videoElement = video.current;
    if (draftTrayOpen || film === "none") {
      setFallbackMode(false);
      return;
    }
    const fallback = fallbackCanvas.current;
    const drawFallback = () => {
      if (!fallback || !fallbackFrame) return;
      const options = {
        film,
        stamp: "",
        capturedAt: Date.now(),
        coupleNames,
        aspectRatio: frame.aspectRatio,
        stampAspectRatio: frame.captureWidth / frame.captureHeight,
        includeStamp: false,
      };
      renderCameraFrameInto(videoElement, fallback, fallbackFrame, options);
      setFallbackMode(true);
    };
    const render = () => {
      if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
      const dimensions = getPhotoDimensions(videoElement);
      if (!dimensions.width || !dimensions.height) return;
      try {
        if (gpuUnavailable || !gpuRenderer.current) {
          drawFallback();
          return;
        }
        gpuRenderer.current.render(videoElement, frame, resolvePhotoFilm(film));
        setFallbackMode(false);
      } catch {
        setGpuUnavailable(true);
        try {
          drawFallback();
        } catch (reason) {
          setError(`Camera preview failed: ${(reason as Error).message}`);
          releaseStream();
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
    releaseStream,
    setFallbackMode,
  ]);

  useEffect(() => {
    if (draftTrayOpen)
      requestAnimationFrame(() =>
        (selectedDraftId ? selectedDraftBack : trayClose).current?.focus()
      );
  }, [draftTrayOpen, selectedDraftId]);

  const shutter = async () => {
    if (!video.current || !ready || !remaining || !frame) return;
    setError("");
    setStatus("");
    await shutterGate.current.run(async () => {
      setBusy(true);
      try {
        const capturedAt = Date.now();
        const style = { film, stamp, capturedAt };
        const rawCanvas = renderCameraFrame(video.current!, frame, {
          film: "none",
          stamp: "",
          capturedAt,
          coupleNames,
          includeStamp: false,
        });
        const raw = await canvasToBlob(rawCanvas);
        const previewBlob = await createStyledPreview(raw, style, coupleNames, 320);
        await onSave(raw, style, previewBlob);
        setStatus("Saved on this device. Review it before uploading.");
      } catch (reason) {
        setError(`Could not save this photo on this device: ${(reason as Error).message}`);
      } finally {
        setBusy(false);
      }
    });
  };

  const chooseFilter = (next: PhotoFilm) => {
    if (busy) return;
    setFilm(next);
  };

  const chooseFile = async (file?: File) => {
    if (!file) return;
    setTrayError("");
    setTrayStatus("");
    setBusy(true);
    try {
      const invalid = await validatePhotoBytes(file);
      if (invalid) throw new Error(invalid);
      const style = { film, stamp, capturedAt: Date.now() };
      const previewBlob = await createStyledPreview(file, style, coupleNames, 320);
      await onUpload(file, style, previewBlob);
      setTrayStatus("Saved on this device. Review it before uploading.");
    } catch (reason) {
      setTrayError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const uploadDrafts = async (ids?: string[]) => {
    if (uploadBatchPendingRef.current) return;
    setTrayError("");
    setTrayStatus("");
    uploadBatchPendingRef.current = true;
    setUploadBatchPending(true);
    try {
      const result = await onUploadDrafts(ids);
      setSelectedDraftId(null);
      if (result.failed > 0)
        setTrayStatus("Some photos need attention. Review the upload details below.");
      else if (result.alreadyActive > 0 && result.uploaded === 0)
        setTrayStatus("These photos are already uploading. Current progress is shown below.");
      else if (result.uploaded > 0)
        setTrayStatus(`${result.uploaded} photo${result.uploaded === 1 ? " is" : "s are"} uploaded.`);
      else
        setTrayStatus("No new photos were added to the upload queue.");
    } catch (reason) {
      setTrayError((reason as Error).message);
    } finally {
      uploadBatchPendingRef.current = false;
      setUploadBatchPending(false);
    }
  };

  const retryPhotoUpload = async (id: string) => {
    setTrayError("");
    setTrayStatus("");
    const result = await onRetryUpload(id);
    if (result === "uploaded") setTrayStatus("Photo uploaded successfully.");
    else if (result === "active") setTrayStatus("This photo is already uploading.");
    else setTrayStatus("Upload needs attention. See the error shown with this photo.");
  };

  const deleteDraft = async (id: string) => {
    setTrayError("");
    setTrayStatus("");
    setBusy(true);
    try {
      await onDeleteDraft(id);
      setSelectedDraftId(null);
      setTrayStatus("Photo deleted from this device.");
    } catch (reason) {
      setTrayError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const openDraftTray = () => {
    setTrayError("");
    setTrayStatus("");
    setDraftTrayOpen(true);
  };
  const closeDraftTray = () => {
    setSelectedDraftId(null);
    setDraftTrayOpen(false);
    setCameraEnabled(true);
    setTrayError("");
    setTrayStatus("");
    requestAnimationFrame(() => trayToggle.current?.focus());
  };

  return (
    <div className={`${styles.cameraScreen} ${isGarden ? styles.cameraGarden : styles.cameraSongket}`}>
      <section
        ref={dialog}
        className={styles.cameraDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-title"
        tabIndex={-1}
      >
        <header className={styles.cameraHeader} aria-hidden={draftTrayOpen}>
          <div className={styles.cameraHeading}>
            <h1 id="camera-title">{coupleNames}</h1>
            <p>{date}</p>
            <span className={styles.cameraRemaining} aria-live="polite">
              {remaining} {remaining === 1 ? "photo" : "photos"} left
            </span>
          </div>
          <div className={styles.cameraHeaderActions}>
            <button type="button" onClick={onClose} aria-label="Close camera">
              <X aria-hidden="true" />
            </button>
          </div>
        </header>
        <div className={styles.cameraStage} ref={stage} aria-hidden={draftTrayOpen}>
          <video
            ref={video}
            className={styles.cameraSource}
            autoPlay
            muted
            playsInline
            onLoadedData={() => {
              const element = video.current;
              if (element &&
                element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
                element.videoWidth &&
                element.videoHeight)
                setReady(true);
            }}
            onError={() => {
              setError("Camera video failed. Choose an existing photo or reopen the camera.");
              releaseStream();
            }}
          />
          <canvas
            ref={gpuCanvas}
            className={styles.cameraGpuCanvas}
            width={frame?.previewWidth ?? 1}
            height={frame?.previewHeight ?? 1}
            hidden={film === "none" || fallbackActive || gpuUnavailable}
            aria-hidden="true"
          />
          <canvas
            ref={fallbackCanvas}
            className={styles.cameraFallbackCanvas}
            width={fallbackFrame?.previewWidth ?? 1}
            height={fallbackFrame?.previewHeight ?? 1}
            hidden={!fallbackActive || film === "none"}
            aria-hidden="true"
          />
          {!ready && (
            <p className={styles.cameraStageMessage} role="status">
              {pending ? "Opening camera…" : "Camera preview unavailable"}
            </p>
          )}
        </div>
        <div className={styles.cameraControls} aria-hidden={draftTrayOpen}>
          <details ref={lookDetails} className={styles.cameraLookInfo}>
            <summary ref={(node) => { lookSummary.current = node; }}>
              <span>Film looks</span>
              <Info size={16} aria-hidden="true" />
            </summary>
            <p>{PHOTO_FILM_PRESETS.find((preset) => preset.id === film)?.description}</p>
          </details>
          <div className={styles.cameraFilters} role="group" aria-label="Photo look">
            {PHOTO_FILM_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                aria-pressed={film === preset.id}
                aria-label={preset.name}
                disabled={busy}
                onClick={() => chooseFilter(preset.id)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          {error ? (
            <p className={styles.cameraError} role="alert">{error}</p>
          ) : status ? (
            <p className={styles.cameraStatus} role="status">{status}</p>
          ) : null}
          <div className={styles.cameraCaptureActions}>
            <button
              ref={trayToggle}
              type="button"
              className={styles.cameraDraftToggle}
              aria-label={photoItemCount ? `${photoItemCount} ${photoItemCount === 1 ? "photo" : "photos"} to review or upload` : "Photos, no saved drafts or uploads"}
              onClick={openDraftTray}
            >
              <span className={styles.cameraDraftThumb}>
                {latestDraft ? (
                  <LocalDraftThumbnail draft={latestDraft} />
                ) : latestApprovedUpload ? (
                  <UploadJobThumbnail job={latestApprovedUpload} />
                ) : (
                  <GalleryIcon aria-hidden="true" />
                )}
              </span>
              <span>{photoItemCount ? `${photoItemCount} ${photoItemCount === 1 ? "photo" : "photos"}` : "Photos"}</span>
            </button>
            {!ready && !pending ? (
              <button
                type="button"
                className={`${styles.cameraShutter} ${styles.cameraReopen}`}
                aria-label="Reopen camera"
                onClick={() => setRetry((value) => value + 1)}
              >
                <RefreshCw aria-hidden="true" />
                <span>Reopen</span>
              </button>
            ) : (
              <button
                type="button"
                className={styles.cameraShutter}
                aria-label="Take photo"
                disabled={!ready || pending || busy || remaining <= 0}
                onClick={() => void shutter()}
              >
                <CameraIcon aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className={styles.cameraFlip}
              disabled={pending || busy}
              aria-label="Flip camera"
              onClick={() => {
                releaseStream();
                setFacing((value) => value === "environment" ? "user" : "environment");
              }}
            >
              <SwitchCamera aria-hidden="true" />
              <span>Flip</span>
            </button>
          </div>
          <p className={styles.srOnly}>Photo originals stay on this device until you upload them from the Photos tray.</p>
        </div>
        {draftTrayOpen && (
          <div
            className={styles.cameraDraftBackdrop}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeDraftTray();
            }}
          >
            <section ref={trayPanel} className={styles.cameraDraftTray} aria-labelledby="camera-drafts-title">
              <header className={styles.cameraDraftHeader}>
                <div>
                  <h2 id="camera-drafts-title">Photos</h2>
                  <p>
                    {drafts.length} saved on this device · {approvedUploads.length} in the upload queue
                  </p>
                </div>
                <button
                  ref={trayClose}
                  type="button"
                  className={styles.cameraTrayClose}
                  aria-label="Back to camera"
                  onClick={closeDraftTray}
                >
                  <X aria-hidden="true" />
                </button>
              </header>
              <div className={styles.cameraDraftBody}>
                {selectedDraft ? (
                  <div className={styles.cameraSelectedDraft}>
                    <DraftPhotoPreview draft={selectedDraft} coupleNames={coupleNames} />
                    <p>
                      This photo stays on this device until you upload it. Anyone
                      with the album link can then see it.
                    </p>
                    <div className={styles.cameraDraftActions}>
                      <button
                        ref={selectedDraftBack}
                        type="button"
                        className={styles.cameraTrayButton}
                        disabled={busy}
                        onClick={() => setSelectedDraftId(null)}
                      >
                        Back to photos
                      </button>
                      <button
                        type="button"
                        className={styles.cameraTrayButton}
                        disabled={busy || uploadBatchPending}
                        onClick={() => void uploadDrafts([selectedDraft.id])}
                      >
                        <Upload aria-hidden="true" /> Upload this photo
                      </button>
                      <button
                        type="button"
                        className={styles.cameraTrayDanger}
                        disabled={busy}
                        onClick={() => void deleteDraft(selectedDraft.id)}
                      >
                        <Trash2 aria-hidden="true" /> Delete photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {drafts.length ? (
                      <div className={styles.cameraDraftGrid}>
                        {orderedDrafts.map((draft, index) => (
                          <article className={styles.cameraDraftCard} key={draft.id}>
                            <button
                              type="button"
                              className={styles.cameraDraftPreviewButton}
                              aria-label={`Preview saved photo ${index + 1}`}
                              onClick={() => setSelectedDraftId(draft.id)}
                            >
                              <LocalDraftThumbnail draft={draft} />
                            </button>
                            <button
                              type="button"
                              className={styles.cameraDraftDelete}
                              aria-label={`Delete saved photo ${index + 1}`}
                              disabled={busy}
                              onClick={() => void deleteDraft(draft.id)}
                            >
                              <Trash2 aria-hidden="true" />
                            </button>
                          </article>
                        ))}
                      </div>
                    ) : (
                      <p className={styles.cameraDraftEmpty}>No local drafts to review. Add a photo from your device or go back to the camera.</p>
                    )}
                    {drafts.length > 0 && (
                      <p>Anyone with the album link can see photos you upload.</p>
                    )}
                    <div className={styles.cameraDraftActions}>
                      <button
                        type="button"
                        className={styles.cameraTrayButton}
                        disabled={busy || remaining <= 0}
                        onClick={() => fileInput.current?.click()}
                      >
                        <GalleryIcon aria-hidden="true" /> Add from device
                      </button>
                      <button
                        type="button"
                        className={styles.cameraTrayButtonPrimary}
                        disabled={busy || uploadBatchPending || drafts.length === 0}
                        onClick={() => void uploadDrafts()}
                      >
                        <Upload aria-hidden="true" /> Upload all photos
                      </button>
                    </div>
                  </>
                )}
                {approvedUploads.length > 0 && (
                  <section className={styles.cameraUploadQueue} aria-labelledby="camera-uploads-title">
                    <h3 id="camera-uploads-title">Uploads</h3>
                    {!online && (
                      <p className={styles.cameraUploadOffline} role="status">
                        Waiting for an internet connection. Approved photos will retry when you are online.
                      </p>
                    )}
                    {approvedUploads.map((job) => {
                      const active = activeUploadIds.includes(job.id);
                      const presentation = getPhotoUploadPresentation(
                        job,
                        uploadProgress[job.id],
                        active,
                        online
                      );
                      return (
                        <article className={styles.cameraUploadCard} key={job.id}>
                          <div className={styles.cameraUploadThumb}>
                            <UploadJobThumbnail job={job} />
                          </div>
                          <div className={styles.cameraUploadDetails}>
                            <strong>
                              {job.slot ? `Photo ${job.slot}` : "Photo upload"}
                            </strong>
                            <span>{presentation.status}</span>
                            {active && (
                              <progress
                                value={presentation.progress ?? 0}
                                max="100"
                                aria-label={`Upload progress for ${job.name}`}
                              />
                            )}
                            {presentation.error && (
                              <p className={styles.cameraUploadError} role="alert">
                                {presentation.error}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            className={styles.cameraTrayButton}
                            disabled={busy || presentation.retryDisabled}
                            onClick={() => void retryPhotoUpload(job.id)}
                          >
                            {presentation.retryLabel}
                          </button>
                        </article>
                      );
                    })}
                  </section>
                )}
                {uploadError && (
                  <p className={styles.cameraTrayError} role="alert">{uploadError}</p>
                )}
                {trayError && <p className={styles.cameraTrayError} role="alert">{trayError}</p>}
                {trayStatus && <p className={styles.cameraTrayStatus} role="status">{trayStatus}</p>}
              </div>
              <input
                ref={fileInput}
                className={styles.cameraFileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Choose a photo from your device"
                aria-hidden="true"
                tabIndex={-1}
                disabled={busy || remaining <= 0}
                onChange={(event) => {
                  void chooseFile(event.currentTarget.files?.[0]);
                  event.currentTarget.value = "";
                }}
              />
            </section>
          </div>
        )}
      </section>
    </div>
  );
}

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("The camera could not create a photo.")),
      "image/jpeg",
      0.92
    )
  );
}

async function createStyledPreview(
  blob: Blob,
  style: PhotoStyle,
  coupleNames: string,
  maxDimension: number
) {
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not prepare the photo preview."));
      image.src = objectUrl;
    });
    return await canvasToBlob(
      renderPhotoCanvas(image, { ...style, coupleNames, maxDimension })
    );
  } finally {
    image.onload = null;
    image.onerror = null;
    image.src = "";
    URL.revokeObjectURL(objectUrl);
  }
}

function LocalDraftThumbnail({ draft }: { draft: LocalPhotoDraft }) {
  return <PhotoBlobThumbnail blob={draft.previewBlob ?? draft.blob} />;
}

function UploadJobThumbnail({ job }: { job: UploadJob }) {
  return <PhotoBlobThumbnail blob={job.previewBlob ?? job.blob} />;
}

function PhotoBlobThumbnail({ blob }: { blob: Blob }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  return source ? <img src={source} alt="" aria-hidden="true" /> : null;
}

function DraftPhotoPreview({
  draft,
  coupleNames,
}: {
  draft: LocalPhotoDraft;
  coupleNames: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const image = new Image();
    const objectUrl = URL.createObjectURL(draft.blob);
    image.onload = () => {
      if (!active || !canvas.current) return;
      try {
        const rendered = renderPhotoCanvas(image, {
          ...(draft.photoStyle ?? {
            film: "none",
            stamp: MEMORY_HASHTAG,
            capturedAt: draft.createdAt,
          }),
          coupleNames,
          maxDimension: 1600,
        });
        canvas.current.width = rendered.width;
        canvas.current.height = rendered.height;
        const context = canvas.current.getContext("2d");
        if (!context) throw new Error("The preview canvas is unavailable.");
        context.drawImage(rendered, 0, 0);
      } catch (reason) {
        setError((reason as Error).message);
      }
    };
    image.onerror = () => {
      if (active) setError("Could not open this saved photo.");
    };
    image.src = objectUrl;
    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
      image.src = "";
      URL.revokeObjectURL(objectUrl);
    };
  }, [draft.blob, draft.createdAt, draft.photoStyle, coupleNames]);
  return (
    <div className={styles.cameraDraftFullPreview}>
      <canvas ref={canvas} aria-label="Stamped photo preview" />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
