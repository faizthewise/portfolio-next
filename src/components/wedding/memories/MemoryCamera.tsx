import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera as CameraIcon, SwitchCamera, Check, RefreshCw, Upload, X } from "lucide-react";
import { MEMORY_HASHTAG } from "@/lib/wedding/memories";
import {
  PHOTO_FILM_PRESETS,
  getPhotoDimensions,
  renderPhotoCanvas,
  renderPhotoCanvasInto,
  resolvePhotoFilm,
  type PhotoFilm,
  type PhotoStyle,
} from "@/lib/wedding/memoriesRender";
import { acquireCameraStream, CaptureGate, stopCameraStream } from "@/lib/wedding/memoriesCamera";
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
    resolvePhotoFilm(defaults?.film ?? "classic-chrome")
  );
  const [stamp] = useState(defaults?.stamp ?? MEMORY_HASHTAG);
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(true);
  const [busy, setBusy] = useState(false);
  const [review, setReview] = useState<ReviewFrame | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream>();
  const requestActive = useRef(true);
  const shutterGate = useRef(new CaptureGate());
  const saveGate = useRef(new CaptureGate());
  const dialog = useRef<HTMLElement>(null);
  const presetButtons = useRef(new Map<string, HTMLButtonElement>());
  const isGarden = side === "bride";
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const releaseStream = useCallback(() => {
    stopCameraStream(streamRef.current);
    streamRef.current = undefined;
    setReady(false);
  }, []);

  useEffect(() => {
    presetButtons.current.get(film)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [film]);

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
      { video: { facingMode: { ideal: facing } }, audio: false },
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
    if (!ready || review || !video.current || !canvas.current) return;
    const videoElement = video.current;
    const target = canvas.current;
    const paint = () => {
      const dimensions = getPhotoDimensions(videoElement);
      if (!dimensions.width || !dimensions.height) return;
      try {
        renderPhotoCanvasInto(
          videoElement,
          target,
          {
            film,
            stamp,
            capturedAt: Date.now(),
            coupleNames,
            aspectRatio: 4 / 5,
          },
          undefined
        );
      } catch (reason) {
        setError(`Camera preview failed: ${(reason as Error).message}`);
        releaseStream();
      }
    };
    paint();
    const timer = window.setInterval(paint, 120);
    return () => window.clearInterval(timer);
  }, [ready, review, film, stamp, coupleNames, releaseStream]);

  useEffect(() => {
    if (!review || !canvas.current) return;
    let active = true;
    const image = new Image();
    const source = URL.createObjectURL(review.raw);
    image.onload = () => {
      if (!active || !canvas.current) return;
      try {
        renderPhotoCanvasInto(
          image,
          canvas.current,
          { ...review.style, film, coupleNames, aspectRatio: 4 / 5 },
          undefined
        );
        setError("");
      } catch (reason) {
        setError(`Photo preview failed: ${(reason as Error).message}`);
      }
    };
    image.onerror = () => {
      if (active) setError("Could not prepare the photo review. Retake the photo or choose an existing one.");
    };
    image.src = source;
    return () => {
      active = false;
      image.src = "";
      URL.revokeObjectURL(source);
    };
  }, [review, film, coupleNames]);

  const shutter = async () => {
    if (!video.current || !ready || !remaining) return;
    setError("");
    setStatus("");
    await shutterGate.current.run(async () => {
      setBusy(true);
      try {
        const capturedAt = Date.now();
        const rawCanvas = renderPhotoCanvas(video.current!, {
          film: "none",
          stamp: "",
          capturedAt,
          coupleNames,
          aspectRatio: 4 / 5,
          outputWidth: 960,
          outputHeight: 1200,
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
    if (!review) return;
    await saveGate.current.run(async () => {
      setBusy(true);
      setError("");
      try {
        const style = { ...review.style, film };
        await onSave(review.raw, style);
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
    <div className={`${styles.cameraScreen} ${isGarden ? styles.cameraGarden : styles.cameraSongket}`}>
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
        <div className={styles.cameraStage}>
          <video
            ref={video}
            className={styles.cameraSource}
            autoPlay
            muted
            playsInline
            onLoadedMetadata={() => {
              if (video.current?.videoWidth && video.current.videoHeight)
                setReady(true);
            }}
            onError={() => {
              setError("Camera video failed. Choose an existing photo or reopen the camera.");
              releaseStream();
            }}
          />
          <canvas
            ref={canvas}
            className={styles.cameraPreviewCanvas}
            width={360}
            height={450}
            aria-label={review ? "Preview of the photo with its selected style" : "Live camera preview with selected style and photo stamp"}
          />
          {!ready && !review && (
            <p className={styles.cameraStageMessage} role="status">
              {pending ? "Opening camera…" : "Camera preview unavailable"}
            </p>
          )}
          {review && <span className={styles.reviewTag}>Review photo</span>}
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
              <button type="button" className={styles.cameraShutter} disabled={busy} onClick={() => void usePhoto()}>
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
          <p className={styles.cameraHelp}>JPG, PNG, or WebP · up to 12 MB each. Your filter and wedding stamp appear in the saved photo.</p>
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
