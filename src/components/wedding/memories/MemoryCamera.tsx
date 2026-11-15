import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera as CameraIcon, SwitchCamera, Check, RefreshCw, Upload, X } from "lucide-react";
import { MEMORY_HASHTAG } from "@/lib/wedding/memories";
import {
  PHOTO_FILM_PRESETS,
  getCameraFrameGeometry,
  getPhotoDimensions,
  getPhotoStampLayout,
  createCameraWebGLPreview,
  renderCameraFrame,
  renderCameraFrameInto,
  renderPhotoCanvas,
  renderPhotoStampLayer,
  resolvePhotoFilm,
  type CameraWebGLPreview,
  type PhotoFilm,
  type PhotoStyle,
} from "@/lib/wedding/memoriesRender";
import { acquireCameraStream, CaptureGate, getCameraCaptureConstraints, scheduleVideoFrames, stopCameraStream } from "@/lib/wedding/memoriesCamera";
import type { MemorySettings } from "@/lib/wedding/memories";
import styles from "./Memories.module.css";

type ReviewFrame = { raw: Blob; style: PhotoStyle };

export function MemoryCamera({
  side,
  coupleNames,
  date,
  guestName,
  remaining,
  defaults,
  onClose,
  onSave,
  onUpload,
}: {
  side: "bride" | "groom";
  coupleNames: string;
  date: string;
  guestName: string;
  remaining: number;
  defaults?: MemorySettings;
  onClose: () => void;
  onSave: (raw: Blob, style: PhotoStyle) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
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
      guestName={guestName}
      remaining={remaining}
      defaults={defaults}
      onClose={() => onCloseRef.current()}
      onSave={onSave}
      onUpload={onUpload}
    />,
    document.body
  );
}

function CameraSurface({
  side,
  coupleNames,
  date,
  guestName,
  remaining,
  defaults,
  onClose,
  onSave,
  onUpload,
}: {
  side: "bride" | "groom";
  coupleNames: string;
  date: string;
  guestName: string;
  remaining: number;
  defaults?: MemorySettings;
  onClose: () => void;
  onSave: (raw: Blob, style: PhotoStyle) => Promise<void>;
  onUpload: (file: File) => Promise<void>;
}) {
  const [film, setFilm] = useState<PhotoFilm>(
    resolvePhotoFilm(defaults?.film ?? "fp2")
  );
  const [stamp] = useState(defaults?.stamp ?? MEMORY_HASHTAG);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(true);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<ReviewFrame | null>(null);
  const [reviewImageLoaded, setReviewImageLoaded] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [liveStampTime, setLiveStampTime] = useState(() => Date.now());
  const [gpuUnavailable, setGpuUnavailable] = useState(false);
  const [fallbackActive, setFallbackActive] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const gpuCanvas = useRef<HTMLCanvasElement>(null);
  const fallbackCanvas = useRef<HTMLCanvasElement>(null);
  const stampCanvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream>();
  const requestActive = useRef(true);
  const shutterGate = useRef(new CaptureGate());
  const saveGate = useRef(new CaptureGate());
  const gpuRenderer = useRef<CameraWebGLPreview | null>(null);
  const fallbackActiveRef = useRef(false);
  const dialog = useRef<HTMLElement>(null);
  const presetButtons = useRef(new Map<string, HTMLButtonElement>());
  const reviewImage = useRef<{
    raw: Blob;
    image: HTMLImageElement;
    objectUrl: string;
  } | null>(null);
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
    presetButtons.current.get(film)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [film]);

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
    let timer = 0;
    const updateAtMinute = () => {
      setLiveStampTime(Date.now());
      timer = window.setTimeout(updateAtMinute, 60_000 - (Date.now() % 60_000) + 20);
    };
    timer = window.setTimeout(updateAtMinute, 60_000 - (Date.now() % 60_000) + 20);
    return () => window.clearTimeout(timer);
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
    dialog.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
      if (!nodes.length) return;
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
  }, [facing, retry, releaseStream]);

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
    if (review || film === "none") {
      setFallbackMode(false);
      return;
    }
    const fallback = fallbackCanvas.current;
    const drawFallback = () => {
      if (!fallback || !fallbackFrame) return;
      const options = {
        film,
        stamp: "",
        capturedAt: liveStampTime,
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
    review,
    film,
    coupleNames,
    frame,
    fallbackFrame,
    liveStampTime,
    gpuUnavailable,
    releaseStream,
    setFallbackMode,
  ]);

  useEffect(() => {
    if (!ready || review || !frame || !stampCanvas.current) return;
    try {
      const layout = renderPhotoStampLayer(stampCanvas.current, {
        film: "none",
        stamp,
        capturedAt: liveStampTime,
        coupleNames,
        aspectRatio: frame.aspectRatio,
        stampAspectRatio: frame.captureWidth / frame.captureHeight,
      });
      const scale = viewport.height / stampCanvas.current.height;
      const left = `${layout.reservedLeft * scale}px`;
      const bottom = `${layout.reservedBottom * scale}px`;
      if (screen.current?.style.getPropertyValue("--camera-stamp-reserve-left") !== left)
        screen.current?.style.setProperty("--camera-stamp-reserve-left", left);
      if (screen.current?.style.getPropertyValue("--camera-stamp-reserve-bottom") !== bottom)
        screen.current?.style.setProperty("--camera-stamp-reserve-bottom", bottom);
    } catch (reason) {
      setError(`Photo stamp preview failed: ${(reason as Error).message}`);
    }
  }, [ready, review, frame, viewport.height, stamp, coupleNames, liveStampTime]);

  useEffect(() => {
    const raw = review?.raw;
    let active = true;
    reviewImage.current = null;
    setReviewImageLoaded(false);
    if (!raw) return;
    const image = new Image();
    const objectUrl = URL.createObjectURL(raw);
    image.onload = () => {
      if (!active) return;
      reviewImage.current = { raw, image, objectUrl };
      setReviewImageLoaded(true);
    };
    image.onerror = () => {
      if (active) setError("Could not prepare the photo review. Retake the photo or choose an existing one.");
    };
    image.src = objectUrl;
    return () => {
      active = false;
      image.onload = null;
      image.onerror = null;
      image.src = "";
      if (reviewImage.current?.raw === raw) reviewImage.current = null;
      URL.revokeObjectURL(objectUrl);
    };
  }, [review?.raw]);

  useEffect(() => {
    const cached = reviewImage.current;
    if (
      !review ||
      !reviewImageLoaded ||
      !cached ||
      cached.raw !== review.raw ||
      !canvas.current ||
      !frame
    )
      return;
    try {
      renderCameraFrameInto(cached.image, canvas.current, frame, {
        ...review.style,
        film,
        coupleNames,
      });
      const context = canvas.current.getContext("2d");
      if (context) {
        const stampLayout = getPhotoStampLayout(
          context,
          canvas.current.width,
          canvas.current.height,
          {
            stamp: review.style.stamp,
            capturedAt: review.style.capturedAt,
            coupleNames,
            aspectRatio: frame.aspectRatio,
            stampAspectRatio: frame.captureWidth / frame.captureHeight,
          }
        );
        screen.current?.style.setProperty(
          "--camera-stamp-reserve-left",
          `${stampLayout.reservedLeft * (viewport.height / canvas.current.height)}px`
        );
        screen.current?.style.setProperty(
          "--camera-stamp-reserve-bottom",
          `${stampLayout.reservedBottom * (viewport.height / canvas.current.height)}px`
        );
      }
      setError("");
    } catch (reason) {
      setError(`Photo preview failed: ${(reason as Error).message}`);
    }
  }, [review, reviewImageLoaded, film, coupleNames, frame, viewport.height]);

  const shutter = async () => {
    if (!video.current || !ready || !remaining || !frame) return;
    setError("");
    setStatus("");
    await shutterGate.current.run(async () => {
      setBusy(true);
      try {
        const capturedAt = Date.now();
        const dimensions = getPhotoDimensions(video.current!);
        const rawCanvas = renderPhotoCanvas(video.current!, {
          film: "none",
          stamp: "",
          capturedAt,
          coupleNames,
          aspectRatio: dimensions.width / dimensions.height,
          maxDimension: 1600,
          includeStamp: false,
        });
        const raw = await canvasToBlob(rawCanvas);
        setReview({
          raw,
          style: { film, stamp, capturedAt },
        });
      } catch (reason) {
        setError(`Could not capture this photo: ${(reason as Error).message}`);
      } finally {
        setBusy(false);
      }
    });
  };

  const usePhoto = async () => {
    if (!review || !frame || !reviewImageLoaded) return;
    await saveGate.current.run(async () => {
      setBusy(true);
      setError("");
      try {
        const cached = reviewImage.current;
        if (!cached || cached.raw !== review.raw)
          throw new Error("The frozen photo is still loading. Try again shortly.");
        const croppedRaw = renderCameraFrame(cached.image, frame, {
          film: "none",
          stamp: "",
          capturedAt: review.style.capturedAt,
          coupleNames,
          includeStamp: false,
        });
        await onSave(await canvasToBlob(croppedRaw), review.style);
        setReview(null);
        setStatus("Photo saved to your album. You can take another.");
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
    if (review) setReview((current) => current && { ...current, style: { ...current.style, film: next } });
  };

  const chooseFile = async (file?: File) => {
    if (!file) return;
    setError("");
    try {
      await onUpload(file);
      setStatus("Photo added to your upload queue.");
    } catch (reason) {
      setError((reason as Error).message);
    }
  };

  return (
    <div
      ref={screen}
      className={`${styles.cameraScreen} ${isGarden ? styles.cameraGarden : styles.cameraSongket}`}
    >
      <section
        ref={dialog}
        className={styles.cameraDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="camera-title"
        tabIndex={-1}
      >
        <header className={styles.cameraHeader}>
          <div>
            <h1 id="camera-title">{coupleNames}</h1>
            <p>{date} · {guestName}</p>
            <p>{remaining} shots left</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close camera">
            <X aria-hidden="true" />
          </button>
        </header>
        <div className={styles.cameraStage} ref={stage}>
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
            hidden={film === "none" || fallbackActive || gpuUnavailable || !!review}
            aria-hidden="true"
          />
          <canvas
            ref={fallbackCanvas}
            className={styles.cameraFallbackCanvas}
            width={fallbackFrame?.previewWidth ?? 1}
            height={fallbackFrame?.previewHeight ?? 1}
            hidden={!fallbackActive || film === "none" || !!review}
            aria-hidden="true"
          />
          <canvas
            ref={canvas}
            className={styles.cameraPreviewCanvas}
            width={frame?.previewWidth ?? 1}
            height={frame?.previewHeight ?? 1}
            hidden={!review}
            aria-label={review ? "Preview of the photo with its selected style" : "Live camera preview with selected style and photo stamp"}
          />
          <canvas
            ref={stampCanvas}
            className={styles.cameraStampCanvas}
            width={frame?.previewWidth ?? 1}
            height={frame?.previewHeight ?? 1}
            hidden={!!review}
            aria-hidden="true"
          />
          {!ready && !review && (
            <p className={styles.cameraStageMessage} role="status">
              {pending ? "Opening camera…" : "Camera preview unavailable"}
            </p>
          )}
        </div>
        <div className={styles.cameraControls}>
          <div className={styles.cameraFilters} role="group" aria-label="Photo look">
            {PHOTO_FILM_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                ref={(node) => {
                  if (node) presetButtons.current.set(preset.id, node);
                  else presetButtons.current.delete(preset.id);
                }}
                aria-pressed={film === preset.id}
                aria-label={preset.name}
                disabled={busy}
                onClick={() => chooseFilter(preset.id)}
              >
                {preset.name}
              </button>
            ))}
          </div>
          <p className={styles.cameraLookDescription} aria-live="polite">
            {PHOTO_FILM_PRESETS.find((preset) => preset.id === film)?.description}
          </p>
          {error && <p className={styles.cameraError} role="alert">{error}</p>}
          {status && <p className={styles.cameraStatus} role="status">{status}</p>}
          {review ? (
            <div className={styles.cameraReviewActions}>
              <button type="button" className={styles.cameraSecondary} disabled={busy} onClick={() => setReview(null)}>
                <RefreshCw aria-hidden="true" /> Retake
              </button>
              <button type="button" className={styles.cameraShutter} disabled={busy || !reviewImageLoaded} onClick={() => void usePhoto()}>
                <Check aria-hidden="true" /> {busy ? "Saving…" : "Use photo"}
              </button>
            </div>
          ) : (
            <div className={styles.cameraCaptureActions}>
              <label className={styles.cameraUpload}>
                <Upload aria-hidden="true" />
                <span>Choose photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    void chooseFile(event.currentTarget.files?.[0]);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                className={styles.cameraShutter}
                aria-label="Take photo"
                disabled={!ready || pending || busy || remaining <= 0}
                onClick={() => void shutter()}
              >
                <CameraIcon aria-hidden="true" />
              </button>
              <button
                type="button"
                className={styles.cameraFlip}
                disabled={pending}
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
          )}
          {!review && !ready && !pending && (
            <button type="button" className={styles.cameraSecondary} onClick={() => setRetry((value) => value + 1)}>
              Reopen camera
            </button>
          )}
          <p className={styles.srOnly}>Choose a JPG, PNG, or WebP photo up to 12 MB. Your selected look and wedding stamp are applied to the saved photo.</p>
        </div>
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
