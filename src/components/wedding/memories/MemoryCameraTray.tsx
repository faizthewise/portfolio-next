import { useEffect, useRef, useState, type RefObject } from "react";
import { Image as GalleryIcon, Trash2, Upload, X } from "lucide-react";
import { MEMORY_HASHTAG } from "@/lib/wedding/memories";
import type { LocalPhotoDraft, UploadJob } from "@/lib/wedding/memoriesQueue";
import { renderPhotoCanvas } from "@/lib/wedding/memoriesRender";
import { getPhotoUploadPresentation } from "@/lib/wedding/memoriesUploadStatus";
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
              {drafts.length} saved on this device · {approvedUploads.length} in
              the upload queue
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
              <p>
                This photo stays on this device until you upload it. Anyone with
                the album link can then see it.
              </p>
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
                  disabled={busy || uploading}
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
                  disabled={busy || uploading || drafts.length === 0}
                  onClick={() => onUpload()}
                >
                  <Upload aria-hidden="true" /> Upload all photos
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
                  Waiting for an internet connection. Approved photos will retry
                  when you are online.
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
                  <article className={styles["upload-card"]} key={job.id}>
                    <div className={styles["upload-thumb"]}>
                      <UploadJobThumbnail job={job} />
                    </div>
                    <div className={styles["upload-details"]}>
                      <strong>
                        {job.slot ? `Photo ${job.slot}` : "Photo upload"}
                      </strong>
                      <span>{presentation.status}</span>
                      {active && (
                        <progress
                          value={presentation.progress ?? 0}
                          max="100"
                          aria-label={
                            job.slot
                              ? `Upload progress for photo ${job.slot}`
                              : "Photo upload progress"
                          }
                        />
                      )}
                      {presentation.error && (
                        <p className={styles["upload-error"]} role="alert">
                          {online
                            ? "This photo could not upload. Use Retry upload to try again."
                            : "This photo could not upload. You can retry once you are back online."}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className={styles["tray-button"]}
                      disabled={busy || presentation.retryDisabled}
                      onClick={() => onRetryUpload(job.id)}
                    >
                      {presentation.retryLabel}
                    </button>
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
  return <PhotoBlobThumbnail blob={draft.previewBlob ?? draft.blob} />;
}

export function UploadJobThumbnail({ job }: { job: UploadJob }) {
  return <PhotoBlobThumbnail blob={job.previewBlob ?? job.blob} />;
}

function PhotoBlobThumbnail({ blob }: { blob: Blob }) {
  const [source, setSource] = useState("");
  useEffect(() => {
    const url = URL.createObjectURL(blob);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  // Thumbnails use a temporary object URL and are already sized locally.
  // eslint-disable-next-line @next/next/no-img-element
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
  }, [draft.blob, draft.createdAt, draft.photoStyle, coupleNames]);
  return (
    <div className={styles["draft-full-preview"]}>
      <canvas ref={canvas} aria-label="Stamped photo preview" />
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
