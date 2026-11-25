import { getBlob, ref } from "firebase/storage";
import { Download, Heart, Image as ImageIcon, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { getWeddingStorage } from "@/lib/wedding/firebase";
import { MEMORY_PUBLIC_ALBUMS } from "@/lib/wedding/memoryRoutes";
import {
  drawStyledPhoto,
  MEMORY_HASHTAG,
  type MemoryPhoto,
  type MemorySettings,
} from "@/lib/wedding/memories";
import styles from "./MemoryGalleryPhoto.module.css";

type PhotoProps = {
  photo: MemoryPhoto;
  side: "bride" | "groom";
  settings?: MemorySettings;
  onFavorite: (id: string) => void | Promise<boolean | void>;
  favorite: boolean;
  variant?: "gallery" | "album";
  favoritePending?: boolean;
  allowViewerFavorite?: boolean;
  backgroundRef?: RefObject<HTMLElement>;
};

const previewCache = new Map<string, string>();
const pendingPhotoReads = new Map<string, Promise<Blob>>();
const previewCacheLimit = 36;
const historyMarker = "weddingMemoriesPhoto";
const dateFormat = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeZone: "Asia/Kuala_Lumpur",
});

function photoBlob(path: string) {
  const pending = pendingPhotoReads.get(path);
  if (pending) return pending;
  const request = withTimeout(
    Promise.resolve().then(() => getBlob(ref(getWeddingStorage(), path))),
    12000
  ).finally(() => pendingPhotoReads.delete(path));
  pendingPhotoReads.set(path, request);
  return request;
}

function withTimeout<T>(operation: Promise<T>, milliseconds: number) {
  let timer: number;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = window.setTimeout(
      () => reject(new Error("Photo request timed out")),
      milliseconds
    );
  });
  return Promise.race([operation, deadline]).finally(() =>
    window.clearTimeout(timer)
  );
}

function renderPhoto(
  image: HTMLImageElement,
  { photo, side, settings }: Pick<PhotoProps, "photo" | "side" | "settings">,
  maxDimension?: number
) {
  return drawStyledPhoto(
    image,
    settings?.film ?? "none",
    settings?.stamp ?? MEMORY_HASHTAG,
    {
      maxDimension,
      photoDate: photo.createdAt?.toDate(),
      coupleNames: MEMORY_PUBLIC_ALBUMS[side].coupleNames,
      photoStyle: photo.photoStyle,
    }
  );
}

export function MemoryGalleryPhoto({
  photo,
  side,
  settings,
  onFavorite,
  favorite,
  variant = "gallery",
  favoritePending = false,
  allowViewerFavorite = true,
  backgroundRef,
}: PhotoProps) {
  const card = useRef<HTMLElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [preview, setPreview] = useState("");
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [open, setOpen] = useState(false);
  const [historyEntry, setHistoryEntry] = useState<{
    url: string;
    id: string;
  }>();
  const historyClosePending = useRef(false);

  const cacheKey = JSON.stringify([
    side,
    photo.originalPath,
    photo.uploadKey,
    photo.createdAt?.toDate().getTime(),
    photo.photoStyle?.film ?? settings?.film,
    photo.photoStyle?.stamp ?? settings?.stamp,
    photo.photoStyle?.capturedAt,
  ]);
  const renderArgs = useRef({ photo, side, settings });
  renderArgs.current = { photo, side, settings };

  useEffect(() => {
    const node = card.current;
    if (!node || nearViewport) return;
    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNearViewport(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [nearViewport]);

  useEffect(() => {
    if (!nearViewport) return;
    const cached = previewCache.get(cacheKey);
    setFailed(false);
    setPreview(cached || "");
    if (cached) {
      previewCache.delete(cacheKey);
      previewCache.set(cacheKey, cached);
      return;
    }

    let active = true;
    let objectUrl = "";
    const image = new Image();
    const args = renderArgs.current;

    async function preparePreview() {
      try {
        const blob = await photoBlob(args.photo.originalPath);
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        image.decoding = "async";
        image.src = objectUrl;
        await withTimeout(image.decode(), 4000);
        if (!active) return;
        const result = renderPhoto(image, args, 400).toDataURL(
          "image/jpeg",
          0.84
        );
        previewCache.set(cacheKey, result);
        if (previewCache.size > previewCacheLimit) {
          const oldest = previewCache.keys().next().value;
          if (oldest) previewCache.delete(oldest);
        }
        setPreview(result);
      } catch (reason) {
        if (active) {
          console.warn(
            "Could not prepare Wedding Memories photo preview",
            reason
          );
          setFailed(true);
        }
      } finally {
        releaseImage();
      }
    }

    function releaseImage() {
      if (!objectUrl) return;
      image.removeAttribute("src");
      URL.revokeObjectURL(objectUrl);
      objectUrl = "";
    }

    void preparePreview();
    return () => {
      active = false;
      releaseImage();
    };
  }, [attempt, cacheKey, nearViewport]);

  useEffect(() => {
    if (!historyEntry) return;
    const onPopState = (event: PopStateEvent) => {
      historyClosePending.current = false;
      if (event.state?.[historyMarker] === historyEntry.id) {
        setOpen(true);
        return;
      }
      // Leave a same-URL dialog step without rerouting.
      if (open && window.location.href === historyEntry.url)
        event.stopImmediatePropagation();
      setOpen(false);
    };
    window.addEventListener("popstate", onPopState, true);
    return () => window.removeEventListener("popstate", onPopState, true);
  }, [historyEntry, open]);

  function showPhoto() {
    if (!window.history.state?.[historyMarker]) {
      const url = window.location.href;
      const id = photo.id;
      try {
        window.history.pushState({ [historyMarker]: id }, "", url);
        setHistoryEntry({ url, id });
      } catch {
        // The dialog remains available if this browser rejects a history step.
      }
    }
    setOpen(true);
  }

  function closePhoto() {
    if (
      historyEntry &&
      window.history.state?.[historyMarker] === historyEntry.id
    ) {
      if (historyClosePending.current) return;
      historyClosePending.current = true;
      window.history.back();
    } else {
      setOpen(false);
    }
  }

  const photoLabel = `Photo shared by ${photo.guestName}`;
  const favoriteLabel = `Favourite photo shared by ${photo.guestName}`;
  return (
    <article ref={card} className={styles.card}>
      <div className={styles.tile}>
        {preview ? (
          <>
            <button
              ref={opener}
              type="button"
              className={styles.open}
              onClick={showPhoto}
              aria-label={`Open photo shared by ${photo.guestName}`}
            >
              {/* The thumbnail is a client-derived image from protected Storage. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" decoding="async" />
            </button>
            <button
              type="button"
              className={styles.tileHeart}
              aria-label={favoriteLabel}
              aria-pressed={favorite}
              disabled={favoritePending}
              onClick={() => onFavorite(photo.id)}
            >
              <span>
                <Heart
                  size={17}
                  fill={favorite ? "currentColor" : "none"}
                  aria-hidden="true"
                />
              </span>
            </button>
          </>
        ) : (
          <div className={styles.placeholder}>
            {failed ? (
              <div className={styles.previewError}>
                <p role="status">Photo unavailable</p>
                <button
                  type="button"
                  className={styles.retry}
                  onClick={() => setAttempt((value) => value + 1)}
                  aria-label={`Retry loading photo shared by ${photo.guestName}`}
                >
                  Retry photo
                </button>
              </div>
            ) : (
              <ImageIcon size={22} aria-hidden="true" />
            )}
          </div>
        )}
      </div>
      {open && (
        <PhotoViewer
          key={photo.originalPath}
          photo={photo}
          side={side}
          settings={settings}
          variant={variant}
          opener={opener}
          backgroundRef={backgroundRef}
          photoLabel={photoLabel}
          favoriteLabel={favoriteLabel}
          favorite={favorite}
          favoritePending={favoritePending}
          onFavorite={allowViewerFavorite ? onFavorite : undefined}
          onClose={closePhoto}
        />
      )}
    </article>
  );
}

function PhotoViewer({
  photo,
  side,
  settings,
  variant,
  opener,
  backgroundRef,
  photoLabel,
  favoriteLabel,
  favorite,
  favoritePending,
  onFavorite,
  onClose,
}: Omit<PhotoProps, "onFavorite"> & {
  opener: RefObject<HTMLButtonElement>;
  photoLabel: string;
  favoriteLabel: string;
  onFavorite?: PhotoProps["onFavorite"];
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const openRef = useRef(false);
  const titleId = useId();
  const [source, setSource] = useState<{ url: string; blob: Blob }>();
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [downloadError, setDownloadError] = useState("");
  const [favoriteError, setFavoriteError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const photoTime = photo.createdAt?.toDate();

  useEffect(() => {
    const modal = dialog.current;
    if (!modal) return;
    const { body, documentElement } = document;
    const trigger = opener.current;
    const background = backgroundRef?.current;
    const position = body.style.position;
    const inset = body.style.inset;
    const width = body.style.width;
    const { scrollX, scrollY } = window;
    const scrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    modal.showModal();
    openRef.current = true;
    body.style.position = "fixed";
    body.style.inset = `${-scrollY}px auto auto ${-scrollX}px`;
    body.style.width = `${documentElement.clientWidth}px`;
    closeButton.current?.focus({ preventScroll: true });

    return () => {
      openRef.current = false;
      modal.close();
      body.style.position = position;
      body.style.inset = inset;
      body.style.width = width;
      const behavior = documentElement.style.scrollBehavior;
      documentElement.style.scrollBehavior = "auto";
      window.scrollTo(scrollX, scrollY);
      documentElement.style.scrollBehavior = behavior;
      window.history.scrollRestoration = scrollRestoration;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
      else background?.focus({ preventScroll: true });
    };
  }, [backgroundRef, opener]);

  useEffect(() => {
    let active = true;
    let url = "";
    setSource(undefined);
    setLoadFailed(false);
    photoBlob(photo.originalPath)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setSource({ url, blob });
      })
      .catch((reason) => {
        if (!active) return;
        console.warn("Could not load Wedding Memories original photo", reason);
        setLoadFailed(true);
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [loadAttempt, photo.originalPath]);

  async function download(kind: "original" | "styled") {
    if (!source || downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      if (kind === "original") {
        saveBlob(
          source.blob,
          `${photo.id}-original.${extensionFor(photo.contentType)}`
        );
      } else {
        const image = new Image();
        image.src = source.url;
        await withTimeout(image.decode(), 4000);
        if (!openRef.current) return;
        const canvas = renderPhoto(image, { photo, side, settings });
        const styled = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (blob) =>
              blob
                ? resolve(blob)
                : reject(new Error("Could not render styled photo")),
            "image/jpeg",
            0.92
          )
        );
        if (openRef.current) saveBlob(styled, `${photo.id}-styled.jpg`);
      }
    } catch (reason) {
      console.warn("Could not download Wedding Memories photo", reason);
      if (openRef.current) setDownloadError("This download failed. Try again.");
    } finally {
      if (openRef.current) setDownloading(false);
    }
  }

  async function updateFavorite() {
    setFavoriteError(false);
    const result = await onFavorite?.(photo.id);
    if (result === false && openRef.current) setFavoriteError(true);
  }

  return createPortal(
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      className={styles.viewer}
      data-overlay-layer="photo-lightbox"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          onClose();
          return;
        }
        if (event.key !== "Tab") return;
        const buttons = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            "button:enabled"
          )
        );
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement
        );
        if (
          index < 0 ||
          (event.shiftKey ? index === 0 : index === buttons.length - 1)
        ) {
          event.preventDefault();
          (event.shiftKey ? buttons[buttons.length - 1] : buttons[0])?.focus();
        }
      }}
    >
      <header className={styles.viewerHeader}>
        <div>
          <h2 id={titleId}>{photoLabel}</h2>
          {photoTime && (
            <time dateTime={photoTime.toISOString()}>
              {dateFormat.format(photoTime)}
            </time>
          )}
          {variant === "album" && <p className={styles.shared}>Shared</p>}
        </div>
        {onFavorite && (
          <button
            type="button"
            className={styles.iconButton}
            aria-label={favoriteLabel}
            aria-pressed={favorite}
            disabled={favoritePending}
            onClick={() => void updateFavorite()}
          >
            <Heart
              size={20}
              fill={favorite ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
        )}
        <button
          ref={closeButton}
          type="button"
          className={styles.iconButton}
          aria-label="Close photo viewer"
          onClick={onClose}
        >
          <X size={23} aria-hidden="true" />
        </button>
      </header>
      <div className={styles.viewerImage}>
        {loadFailed ? (
          <div className={styles.viewerError}>
            <p role="alert">This photo could not load.</p>
            <button
              type="button"
              onClick={() => setLoadAttempt((value) => value + 1)}
            >
              Retry photo
            </button>
          </div>
        ) : source ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={source.url}
            alt={photoLabel}
            onError={() => {
              console.warn("Could not display Wedding Memories original photo");
              setLoadFailed(true);
            }}
          />
        ) : (
          <p role="status">Loading photo…</p>
        )}
      </div>
      <footer className={styles.viewerFooter}>
        {favoriteError && (
          <p role="alert">Could not update this favourite. Try again.</p>
        )}
        {downloadError && <p role="alert">{downloadError}</p>}
        {downloading && <p role="status">Preparing download…</p>}
        <div className={styles.viewerActions}>
          <button
            type="button"
            disabled={!source || downloading}
            onClick={() => void download("original")}
          >
            <Download size={16} aria-hidden="true" /> Download original
          </button>
          <button
            type="button"
            disabled={!source || downloading || loadFailed}
            onClick={() => void download("styled")}
          >
            Download styled photo
          </button>
        </div>
      </footer>
    </dialog>,
    document.body
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
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}
