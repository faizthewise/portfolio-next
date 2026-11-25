import { useEffect, useRef, useState, type RefObject } from "react";
import { Image as GalleryIcon, Trash2, Upload, X } from "lucide-react";
import { MEMORY_HASHTAG } from "@/lib/wedding/memories";
import type { LocalPhotoDraft, UploadJob } from "@/lib/wedding/memoriesQueue";
import { renderPhotoCanvas } from "@/lib/wedding/memoriesRender";
import {
  getPhotoUploadState,
  hasLocalPhotoMedia,
} from "@/lib/wedding/memoriesUploadStatus";
import styles from "./MemoryCameraTray.module.css";

type MemoryCameraTrayProps = {
  drafts: LocalPhotoDraft[];
  approvedUploads: UploadJob[];
  selectedDraft?: LocalPhotoDraft;
  coupleNames: string;
  remaining: number;
  busy: boolean;
  uploading: boolean;
  online: boolean;
  uploadProgress: Record<string, number>;
  activeUploadIds: string[];
  error?: string;
  status?: string;
  panelRef: RefObject<HTMLElement>;
  closeRef: RefObject<HTMLButtonElement>;
  selectedBackRef: RefObject<HTMLButtonElement>;
  onClose: () => void;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onUpload: (ids?: string[]) => void;
  onRetryUpload: (id: string) => void;
  onPickPhoto: () => void;
};

export function MemoryCameraTray({
  drafts,
  approvedUploads,
  selectedDraft,
  coupleNames,
  remaining,
  busy,
  uploading,
  online,
  uploadProgress,
  activeUploadIds,
  error,
  status,
  panelRef,
  closeRef,
  selectedBackRef,
  onClose,
  onSelect,
  onDelete,
  onUpload,
  onRetryUpload,
  onPickPhoto,
}: MemoryCameraTrayProps) {
  const orderedDrafts = [...drafts].sort(
    (first, second) => second.createdAt - first.createdAt
  );
  const availableDrafts = drafts.filter(hasLocalPhotoMedia);
  const selectedMediaAvailable =
    selectedDraft && hasLocalPhotoMedia(selectedDraft);
  return (
    <div
      className={styles["draft-backdrop"]}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={panelRef}
        className={styles["draft-tray"]}
        aria-labelledby="camera-drafts-title"
      >
        <header className={styles["draft-header"]}>
          <div>
            <h2 id="camera-drafts-title">Photos</h2>
            <p>
              {availableDrafts.length} saved on this device ·{" "}
              {approvedUploads.length} in the upload queue
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            className={styles["tray-close"]}
            aria-label="Back to camera"
            onClick={onClose}
          >
            <X aria-hidden="true" />
          </button>
        </header>
        <div className={styles["draft-body"]}>
          {selectedDraft ? (
            <div className={styles["selected-draft"]}>
              <DraftPhotoPreview
                key={selectedDraft.id}
                draft={selectedDraft}
                coupleNames={coupleNames}
              />
              {selectedMediaAvailable && (
                <p>
                  This photo stays on this device until you upload it. Anyone
                  with the album link can then see it.
                </p>
              )}
              <div className={styles["draft-actions"]}>
                <button
                  ref={selectedBackRef}
                  type="button"
                  className={styles["tray-button"]}
                  disabled={busy}
                  onClick={() => onSelect(null)}
                >
                  Back to photos
                </button>
                <button
                  type="button"
                  className={styles["tray-button-primary"]}
                  disabled={busy || uploading || !selectedMediaAvailable}
                  onClick={() => onUpload([selectedDraft.id])}
                >
                  <Upload aria-hidden="true" /> Upload this photo
                </button>
                <button
                  type="button"
                  className={styles["tray-danger"]}
                  disabled={busy}
                  onClick={() => onDelete(selectedDraft.id)}
                >
                  <Trash2 aria-hidden="true" /> Delete photo
                </button>
              </div>
            </div>
          ) : (
            <>
              {drafts.length ? (
                <div className={styles["draft-grid"]}>
                  {orderedDrafts.map((draft, index) => (
                    <article className={styles["draft-card"]} key={draft.id}>
                      <button
                        type="button"
                        className={styles["draft-preview-button"]}
                        aria-label={`Preview saved photo ${index + 1}`}
                        onClick={() => onSelect(draft.id)}
                      >
                        <LocalDraftThumbnail draft={draft} />
                      </button>
                      <button
                        type="button"
                        className={styles["draft-delete"]}
                        aria-label={`Delete saved photo ${index + 1}`}
                        disabled={busy}
                        onClick={() => onDelete(draft.id)}
                      >
                        <Trash2 aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className={styles["draft-empty"]}>
                  {remaining > 0
                    ? "No local drafts to review. Add a photo from your device or go back to the camera."
                    : "No local drafts to review. You have no photos left to add."}
                </p>
              )}
              {drafts.length > 0 && (
                <p>Anyone with the album link can see photos you upload.</p>
              )}
              {availableDrafts.length < drafts.length && (
                <p>Some photos are unavailable on this device.</p>
              )}
              <div className={styles["draft-actions"]}>
                <button
                  type="button"
                  className={styles["tray-button"]}
                  disabled={busy || remaining <= 0}
                  onClick={onPickPhoto}
                >
                  <GalleryIcon aria-hidden="true" /> Add from device
                </button>
                <button
                  type="button"
                  className={styles["tray-button-primary"]}
                  disabled={busy || uploading || availableDrafts.length === 0}
                  onClick={() => onUpload(availableDrafts.map(({ id }) => id))}
                >
                  <Upload aria-hidden="true" />
                  {availableDrafts.length < drafts.length
                    ? "Upload available photos"
                    : "Upload all photos"}
                </button>
              </div>
            </>
          )}
          {approvedUploads.length > 0 && (
            <section
              className={styles["upload-queue"]}
              aria-labelledby="camera-uploads-title"
            >
              <h3 id="camera-uploads-title">Uploads</h3>
              {!online && (
                <p className={styles["upload-offline"]} role="status">
                  You’re offline. Reconnect to resume waiting uploads or retry a
                  photo.
                </p>
              )}
              {approvedUploads.map((job) => {
                const active = activeUploadIds.includes(job.id);
                const presentation = getPhotoUploadState(
                  job,
                  uploadProgress[job.id],
                  active,
                  online
                );
                return (
                  <article className={styles["upload-card"]} key={job.id}>
                    <div className={styles["upload-thumb"]}>
                      <UploadJobThumbnail job={job} />
                    </div>
                    <div className={styles["upload-details"]}>
                      <strong>
                        {job.slot ? `Photo ${job.slot}` : "Photo upload"}
                      </strong>
                      <span>{presentation.status}</span>
                      {presentation.group === "active" && (
                        <progress
                          value={presentation.progress}
                          max="100"
                          aria-label={
                            job.slot
                              ? `Upload progress for photo ${job.slot}`
                              : "Photo upload progress"
                          }
                        />
                      )}
                      {presentation.detail && (
                        <p
                          className={
                            presentation.group === "attention"
                              ? styles["upload-error"]
                              : undefined
                          }
                        >
                          {presentation.detail}
                        </p>
                      )}
                    </div>
                    {presentation.canRetry && (
                      <button
                        type="button"
                        className={styles["tray-button"]}
                        disabled={busy}
                        onClick={() => onRetryUpload(job.id)}
                      >
                        Retry upload
                      </button>
                    )}
                  </article>
                );
              })}
            </section>
          )}
          {error && (
            <p className={styles["tray-error"]} role="alert">
              {error}
            </p>
          )}
          {status && (
            <p className={styles["tray-status"]} role="status">
              {status}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

export function LocalDraftThumbnail({ draft }: { draft: LocalPhotoDraft }) {
  return <PhotoBlobThumbnail blob={getThumbnailBlob(draft)} />;
}

export function UploadJobThumbnail({ job }: { job: UploadJob }) {
  return <PhotoBlobThumbnail blob={getThumbnailBlob(job)} />;
}

function getThumbnailBlob({
  blob,
  previewBlob,
}: {
  blob?: Blob;
  previewBlob?: Blob;
}) {
  return hasLocalPhotoMedia({ blob: previewBlob }) ? previewBlob : blob;
}

function createPhotoUrl(blob?: Blob) {
  if (!(blob instanceof Blob) || blob.size === 0) return;
  try {
    return URL.createObjectURL(blob);
  } catch {
    return undefined;
  }
}

function PhotoPlaceholder() {
  return (
    <span className={styles["photo-placeholder"]} aria-hidden="true">
      <GalleryIcon size={20} />
    </span>
  );
}

function PhotoBlobThumbnail({ blob }: { blob?: Blob }) {
  const [source, setSource] = useState<{ blob?: Blob; url: string }>();
  const [brokenUrl, setBrokenUrl] = useState<string>();
  useEffect(() => {
    const url = createPhotoUrl(blob);
    if (!url) return;
    setSource({ blob, url });
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  const url = source?.blob === blob ? source?.url : undefined;
  if (!url || url === brokenUrl) return <PhotoPlaceholder />;
  // Thumbnails use a temporary object URL and are already sized locally.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      aria-hidden="true"
      onError={() => setBrokenUrl(url)}
    />
  );
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
  const mediaAvailable = hasLocalPhotoMedia(draft);
  useEffect(() => {
    if (!mediaAvailable) return;
    const objectUrl = createPhotoUrl(draft.blob);
    if (!objectUrl) {
      setError("Could not open this saved photo.");
      return;
    }
    setError("");
    let active = true;
    const image = new Image();
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
        console.error("Could not render the saved photo preview", reason);
        setError("Could not open this saved photo.");
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
  }, [
    draft.blob,
    draft.createdAt,
    draft.photoStyle,
    coupleNames,
    mediaAvailable,
  ]);
  const previewError = mediaAvailable
    ? error
    : "This photo is unavailable on this device.";
  return (
    <div className={styles["draft-full-preview"]}>
      <canvas
        ref={canvas}
        hidden={Boolean(previewError)}
        aria-label="Stamped photo preview"
      />
      {previewError && (
        <>
          <PhotoPlaceholder />
          <p role="alert">{previewError}</p>
        </>
      )}
    </div>
  );
}
