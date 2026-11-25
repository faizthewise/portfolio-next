import { Image as ImageIcon, ImagePlus, SwitchCamera, X } from "lucide-react";
import { useEffect, useState, type ReactNode, type RefObject } from "react";

import styles from "./MemoryCameraControls.module.css";

export function MemoryCameraToolbar({
  remaining,
  photoLimit,
  quotaKnown = true,
  closeDisabled,
  onClose,
}: {
  remaining: number;
  photoLimit: number;
  quotaKnown?: boolean;
  closeDisabled?: boolean;
  onClose: () => void;
}) {
  const segmentCount = Math.min(photoLimit, 24);
  const availableSegments =
    photoLimit > 0 ? Math.round((remaining / photoLimit) * segmentCount) : 0;

  return (
    <header className={styles.toolbar}>
      <button
        className={styles["icon-button"]}
        type="button"
        aria-label="Close camera"
        disabled={closeDisabled}
        onClick={onClose}
      >
        <X size={24} aria-hidden="true" />
      </button>
      <div className={styles.allowance}>
        <p aria-live="polite">
          {quotaKnown
            ? `${remaining} ${remaining === 1 ? "shot" : "shots"} left`
            : "Shot count unavailable"}
        </p>
        {quotaKnown && segmentCount > 0 && (
          <div className={styles.segments} aria-hidden="true">
            {Array.from({ length: segmentCount }, (_, index) => (
              <span key={index} data-available={index < availableSegments} />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

function LatestPhoto({ photo }: { photo?: Blob }) {
  const [preview, setPreview] = useState<{ photo: Blob; url: string }>();

  useEffect(() => {
    if (!photo) return;

    const url = URL.createObjectURL(photo);
    setPreview({ photo, url });
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  return preview && preview.photo === photo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={preview.url} alt="" onError={() => setPreview(undefined)} />
  ) : (
    <ImageIcon size={22} aria-hidden="true" />
  );
}

export function MemoryCameraDeck({
  canCapture,
  busy,
  canSwitch,
  switching,
  reviewCount,
  latestPhoto,
  reviewRef,
  onReview,
  onPickPhoto,
  canPickPhoto,
  onCapture,
  onSwitch,
  children,
}: {
  canCapture: boolean;
  busy: boolean;
  canSwitch: boolean;
  switching: boolean;
  reviewCount: number;
  latestPhoto?: Blob;
  reviewRef: RefObject<HTMLButtonElement>;
  onReview: () => void;
  onPickPhoto: () => void;
  canPickPhoto: boolean;
  onCapture: () => void;
  onSwitch: () => void;
  children: ReactNode;
}) {
  const hasPhotos = reviewCount > 0;

  return (
    <div className={styles.deck}>
      <div className={styles.film}>{children}</div>
      <div className={styles["capture-row"]}>
        <button
          ref={reviewRef}
          className={styles["photo-button"]}
          type="button"
          disabled={busy || (!hasPhotos && !canPickPhoto)}
          aria-label={
            hasPhotos
              ? `Review ${reviewCount} ${
                  reviewCount === 1 ? "photo" : "photos"
                }`
              : undefined
          }
          onClick={hasPhotos ? onReview : onPickPhoto}
        >
          <span className={styles.thumbnail}>
            {hasPhotos ? (
              <>
                <LatestPhoto photo={latestPhoto} />
                <span className={styles.count} aria-hidden="true">
                  {reviewCount}
                </span>
              </>
            ) : (
              <ImagePlus size={22} aria-hidden="true" />
            )}
          </span>
          <span>{hasPhotos ? "Review" : "Add photo"}</span>
        </button>
        <button
          className={styles.shutter}
          type="button"
          aria-label="Take a photo"
          disabled={!canCapture || busy || switching}
          onClick={onCapture}
        />
        <button
          className={styles["switch-button"]}
          type="button"
          aria-label="Switch camera"
          disabled={!canSwitch || busy || switching}
          onClick={onSwitch}
        >
          <SwitchCamera size={23} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function MemoryCameraState({
  state,
  status,
  error,
  onRetry,
  onDiscard,
  onExit,
  hasPhotos,
  onReview,
}: {
  state:
    | "opening"
    | "switching"
    | "ready"
    | "denied"
    | "unavailable"
    | "paused"
    | "exhausted";
  status?: string;
  error?: string;
  onRetry?: () => void;
  onDiscard?: () => void;
  onExit: () => void;
  hasPhotos: boolean;
  onReview: () => void;
}) {
  const opening = state === "opening" || state === "switching";
  const cameraProblem =
    state === "denied" || state === "unavailable" || state === "paused";
  const exhausted = state === "exhausted";

  const contextualError = cameraProblem && !onDiscard ? error : undefined;
  const feedbackError = contextualError ? undefined : error;

  let message: string | undefined;
  if (opening)
    message = state === "opening" ? "Opening camera…" : "Switching camera…";
  if (cameraProblem) {
    if (state === "denied") message = "Camera access is needed";
    else if (state === "paused") message = "Camera paused";
    else message = "Camera preview unavailable";
  }
  if (exhausted) message = "You’ve reached your photo limit";

  return (
    <>
      {message && (
        <div className={styles["state-overlay"]} data-exhausted={exhausted}>
          <div className={styles["state-panel"]}>
            <p className={styles["state-title"]} role="status">
              {message}
            </p>
            {contextualError ? (
              <p className={styles["state-detail"]} role="alert">
                {contextualError}
              </p>
            ) : (
              state === "denied" && (
                <p className={styles["state-detail"]}>
                  Allow camera access in your browser settings to take photos.
                </p>
              )
            )}
            {exhausted && hasPhotos && (
              <p className={styles["state-detail"]}>
                Review your photos and share your favourites.
              </p>
            )}
            {(cameraProblem || exhausted) && (
              <div className={styles["state-actions"]}>
                {cameraProblem && onRetry && !onDiscard && (
                  <button type="button" onClick={onRetry}>
                    {state === "paused" ? "Resume camera" : "Try again"}
                  </button>
                )}
                {exhausted && hasPhotos ? (
                  <button type="button" onClick={onReview}>
                    Review photos
                  </button>
                ) : (
                  <button type="button" onClick={onExit}>
                    Return to wedding memories
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      <div
        className={styles.feedback}
        data-recoverable={Boolean(error && onDiscard)}
      >
        <p
          className={
            feedbackError ? styles["feedback-message"] : styles["live-region"]
          }
          role="alert"
        >
          {feedbackError}
        </p>
        <p
          className={
            status && !error
              ? styles["feedback-message"]
              : styles["live-region"]
          }
          role="status"
        >
          {error ? "" : status}
        </p>
        {error && onDiscard && (
          <div className={styles["state-actions"]}>
            {onRetry && (
              <button type="button" onClick={onRetry}>
                Retry save
              </button>
            )}
            <button type="button" onClick={onDiscard}>
              Discard photo
            </button>
          </div>
        )}
      </div>
    </>
  );
}
