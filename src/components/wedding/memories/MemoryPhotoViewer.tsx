import { ChevronLeft, ChevronRight, Download, Heart, X } from "lucide-react";
import { useEffect, useId, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";

import styles from "./MemoryPhotoViewer.module.css";

type MemoryPhotoViewerProps = {
  photoId: string;
  guestName: string;
  dateLabel?: string;
  position: number;
  count: number;
  hasMore: boolean;
  photoStatus: "loading" | "ready" | "error" | "missing";
  imageUrl?: string;
  onImageError: () => void;
  onRetry: () => void;
  onClose: () => void;
  opener: HTMLElement;
  backgroundRef: RefObject<HTMLElement>;
  favorite: boolean;
  favoritePending: boolean;
  onFavorite?: () => void;
  favoriteError?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  filmstrip: {
    id: string;
    label: string;
    src?: string;
    onSelect: () => void;
  }[];
  downloadPending: boolean;
  downloadError?: string;
  onDownload: () => void;
};

const SWIPE_DISTANCE = 48;
const SWIPE_AXIS_RATIO = 1.5;

function browserIsZoomed() {
  return (window.visualViewport?.scale ?? 1) > 1.01;
}

export function MemoryPhotoViewer({
  photoId,
  guestName,
  dateLabel,
  position,
  count,
  hasMore,
  photoStatus,
  imageUrl,
  onImageError,
  onRetry,
  onClose,
  opener,
  backgroundRef,
  favorite,
  favoritePending,
  onFavorite,
  favoriteError,
  onPrevious,
  onNext,
  filmstrip,
  downloadPending,
  downloadError,
  onDownload,
}: MemoryPhotoViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const thumbnails = useRef<HTMLDivElement>(null);
  const activeThumbnail = useRef<HTMLButtonElement>(null);
  const touchStart = useRef<{
    id: number;
    photoId: string;
    x: number;
    y: number;
  }>();
  const dialogTitleId = useId();
  const loadedCount = hasMore ? " loaded" : "";
  const ready = photoStatus === "ready" && Boolean(imageUrl);

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;

    const { body, documentElement } = document;
    const { position, inset, width } = body.style;
    const { scrollX, scrollY } = window;
    const background = backgroundRef.current;
    const viewportWidth = documentElement.clientWidth;

    modal.showModal();
    body.style.position = "fixed";
    body.style.inset = `${-scrollY}px auto auto ${-scrollX}px`;
    body.style.width = `${viewportWidth}px`;
    closeButton.current?.focus({ preventScroll: true });

    return () => {
      modal.close();
      body.style.position = position;
      body.style.inset = inset;
      body.style.width = width;
      const behavior = documentElement.style.scrollBehavior;
      documentElement.style.scrollBehavior = "auto";
      window.scrollTo(scrollX, scrollY);
      documentElement.style.scrollBehavior = behavior;
      (opener.isConnected ? opener : background)?.focus({
        preventScroll: true,
      });
    };
  }, [backgroundRef, opener]);

  useEffect(() => {
    const strip = thumbnails.current;
    const active = activeThumbnail.current;
    if (!strip || !active || !strip.clientWidth) return;
    const viewport = strip.getBoundingClientRect();
    const thumbnail = active.getBoundingClientRect();
    if (thumbnail.left < viewport.left) {
      strip.scrollLeft += thumbnail.left - viewport.left - 4;
    } else if (thumbnail.right > viewport.right) {
      strip.scrollLeft += thumbnail.right - viewport.right + 4;
    }
  }, [filmstrip, photoId]);

  return createPortal(
    <dialog
      ref={dialog}
      className={styles.viewer}
      aria-labelledby={dialogTitleId}
      data-overlay-layer="photo-lightbox"
      onTouchStartCapture={(event) => {
        if (event.touches.length > 1) touchStart.current = undefined;
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
          return;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          onPrevious?.();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          onNext?.();
        }
      }}
    >
      <header className={styles.header}>
        <button
          ref={closeButton}
          className={styles["icon-button"]}
          type="button"
          aria-label="Close photo viewer"
          onClick={onClose}
        >
          <X size={23} aria-hidden="true" />
        </button>
        <div className={styles.attribution}>
          <h2 id={dialogTitleId} className={styles["screen-reader-only"]}>
            Photo viewer
          </h2>
          <p title={guestName}>Shared by {guestName}</p>
          {dateLabel && <span title={dateLabel}>{dateLabel}</span>}
        </div>
        {onFavorite && (
          <button
            className={styles["icon-button"]}
            type="button"
            aria-label="Favourite photo"
            aria-pressed={favorite}
            aria-disabled={favoritePending}
            onClick={favoritePending ? undefined : onFavorite}
          >
            <Heart
              size={22}
              fill={favorite ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        )}
      </header>

      <div
        className={styles.navigation}
        role="group"
        aria-label="Photo navigation"
      >
        {count > 1 && (
          <button
            className={styles["icon-button"]}
            type="button"
            aria-label="Previous photo"
            aria-disabled={!onPrevious}
            onClick={onPrevious}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        {count > 0 && (
          <p className={styles.counter} role="status">
            <span aria-hidden="true">
              {position} / {count}
              {loadedCount}
            </span>
            <span className={styles["screen-reader-only"]}>
              Photo {position} of {count}
              {loadedCount}
            </span>
          </p>
        )}
        {count > 1 && (
          <button
            className={styles["icon-button"]}
            type="button"
            aria-label="Next photo"
            aria-disabled={!onNext}
            onClick={onNext}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        )}
      </div>

      <div
        className={styles.stage}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          touchStart.current =
            event.touches.length === 1 && !browserIsZoomed()
              ? {
                  id: touch.identifier,
                  photoId,
                  x: touch.clientX,
                  y: touch.clientY,
                }
              : undefined;
        }}
        onTouchMove={(event) => {
          if (event.touches.length > 1 || browserIsZoomed()) {
            touchStart.current = undefined;
          }
        }}
        onTouchCancel={() => {
          touchStart.current = undefined;
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = undefined;
          if (
            !start ||
            start.photoId !== photoId ||
            event.touches.length ||
            browserIsZoomed()
          )
            return;
          const touch = Array.from(event.changedTouches).find(
            ({ identifier }) => identifier === start.id
          );
          if (!touch) return;
          const x = touch.clientX - start.x;
          const y = touch.clientY - start.y;
          if (
            Math.abs(x) < SWIPE_DISTANCE ||
            Math.abs(x) < SWIPE_AXIS_RATIO * Math.abs(y)
          )
            return;
          if (x < 0) onNext?.();
          else onPrevious?.();
        }}
      >
        {ready ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photoId}
            src={imageUrl}
            alt={`Photograph shared by ${guestName}`}
            draggable={false}
            onError={onImageError}
          />
        ) : photoStatus === "missing" ? (
          <div className={styles["load-error"]}>
            <p role="status">This photo is no longer available.</p>
            <button type="button" onClick={onClose}>
              Back to photos
            </button>
          </div>
        ) : photoStatus === "error" ? (
          <div className={styles["load-error"]}>
            <p role="alert">This photo could not load.</p>
            <button
              type="button"
              onClick={() => {
                closeButton.current?.focus({ preventScroll: true });
                onRetry();
              }}
            >
              Retry photo
            </button>
          </div>
        ) : (
          <p role="status">Loading photo…</p>
        )}
      </div>

      {count > 1 && filmstrip.some(({ src }) => Boolean(src)) && (
        <div
          ref={thumbnails}
          className={styles.filmstrip}
          role="group"
          aria-label="Photo thumbnails"
        >
          {filmstrip.map(({ id, label, src, onSelect }) =>
            src ? (
              <button
                key={id}
                ref={id === photoId ? activeThumbnail : undefined}
                type="button"
                aria-label={label}
                aria-current={id === photoId ? "true" : undefined}
                onClick={onSelect}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" draggable={false} />
              </button>
            ) : null
          )}
        </div>
      )}

      <footer className={styles.footer}>
        {favoriteError && <p role="alert">{favoriteError}</p>}
        {downloadError && <p role="alert">{downloadError}</p>}
        <span className={styles["screen-reader-only"]} role="status">
          {downloadPending ? "Preparing photo…" : ""}
        </span>
        {photoStatus !== "missing" && (
          <button
            className={styles.download}
            type="button"
            aria-disabled={!ready || downloadPending}
            onClick={ready && !downloadPending ? onDownload : undefined}
          >
            <Download size={19} aria-hidden="true" />
            {downloadPending ? "Preparing photo…" : "Download photo"}
          </button>
        )}
      </footer>
    </dialog>,
    document.body
  );
}
