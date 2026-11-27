import { Camera, ImagePlus, Images, Upload } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { MemoryContentTabs } from "./MemoryContentTabs";
import { MemoryPhotoGridLoading, MemoryPhotoGridRetry } from "./MemoryGallery";
import styles from "./MemoryAlbum.module.css";
import galleryStyles from "./MemoryGallery.module.css";
import homeStyles from "./MemoryGuestHome.module.css";

export type AlbumTab = "photos" | "uploads";

type AlbumProps = {
  name: string;
  remaining: number;
  photoLimit: number;
  quotaState: "loading" | "ready" | "error";
  addingFiles: boolean;
  tab: AlbumTab;
  uploadCount: number;
  photoStatus: "loading" | "ready" | "error";
  photoCount: number;
  photoPreviewFailed: boolean;
  onRetryPhotoPreviews: () => void;
  hasMore: boolean;
  loadingMore: boolean;
  loadMoreFailed: boolean;
  favoriteError: boolean;
  onTabChange: (tab: AlbumTab) => void;
  onCamera: () => void;
  onAdd: () => void;
  onQuotaRetry: () => void;
  onPhotoRetry: () => void;
  onLoadMore: () => void;
  uploads: ReactNode;
  uploadSummary?: ReactNode;
  success?: string;
  qrHref: string;
  children: ReactNode;
};

type ContributionProps = Pick<
  AlbumProps,
  "addingFiles" | "onCamera" | "onAdd"
> & {
  canContribute: boolean;
};

function ContributionActions({
  addingFiles,
  onCamera,
  onAdd,
  canContribute,
}: ContributionProps) {
  return (
    <div className={styles.actions}>
      <button
        type="button"
        className={homeStyles.primaryAction}
        disabled={!canContribute}
        onClick={onCamera}
      >
        <Camera size={18} aria-hidden="true" />
        Take a photo
      </button>
      <button
        type="button"
        className={homeStyles.secondaryAction}
        disabled={!canContribute || addingFiles}
        onClick={onAdd}
      >
        <ImagePlus size={18} aria-hidden="true" />
        {addingFiles ? "Adding photos…" : "Add photos"}
      </button>
    </div>
  );
}

function AlbumPhotos({
  photoStatus,
  photoCount,
  photoPreviewFailed,
  onRetryPhotoPreviews,
  hasMore,
  loadingMore,
  loadMoreFailed,
  favoriteError,
  onPhotoRetry,
  onLoadMore,
  children,
  ...contribution
}: Pick<
  AlbumProps,
  | "photoStatus"
  | "photoCount"
  | "photoPreviewFailed"
  | "onRetryPhotoPreviews"
  | "hasMore"
  | "loadingMore"
  | "loadMoreFailed"
  | "favoriteError"
  | "onPhotoRetry"
  | "onLoadMore"
  | "children"
> &
  ContributionProps) {
  return (
    <section aria-labelledby="album-memories">
      <div className={`${galleryStyles.toolbar} ${styles.photoHeading}`}>
        <h2 id="album-memories">Your memories</h2>
        <p role="status">
          {photoStatus === "ready" &&
            `${photoCount} shared ${photoCount === 1 ? "photo" : "photos"}${
              hasMore ? " loaded" : ""
            }`}
        </p>
      </div>

      {photoStatus === "loading" && photoCount === 0 && (
        <MemoryPhotoGridLoading>Loading your photos…</MemoryPhotoGridLoading>
      )}

      {photoStatus === "error" && (
        <div className={galleryStyles.state}>
          <div role="alert">
            <h3>Couldn&apos;t load your album</h3>
            <p>Please try again.</p>
          </div>
          <button
            type="button"
            className={homeStyles.textAction}
            onClick={onPhotoRetry}
          >
            Try again
          </button>
        </div>
      )}

      {favoriteError && (
        <p className={galleryStyles.feedback} role="alert">
          Favourites could not be updated. Please try again.
        </p>
      )}

      {photoCount > 0 && <div className={galleryStyles.grid}>{children}</div>}

      {photoStatus === "ready" && photoPreviewFailed && (
        <MemoryPhotoGridRetry onRetry={onRetryPhotoPreviews} />
      )}

      {photoStatus === "ready" &&
        photoCount === 0 &&
        !hasMore &&
        !loadingMore &&
        !photoPreviewFailed && (
          <div className={galleryStyles.state}>
            <h3>Your story starts here.</h3>
            <p>
              {contribution.canContribute
                ? "Capture your first little moment from today."
                : "Your photos will appear here once they’re shared."}
            </p>
            {contribution.canContribute && (
              <ContributionActions {...contribution} />
            )}
          </div>
        )}

      {photoStatus === "ready" && (hasMore || loadingMore) && (
        <div className={galleryStyles.pagination}>
          {loadMoreFailed && (
            <p className={galleryStyles.feedback} role="alert">
              Couldn&apos;t load more photos. Please try again.
            </p>
          )}
          <button
            type="button"
            className={`${homeStyles.secondaryAction} ${galleryStyles.loadMore}`}
            aria-disabled={loadingMore}
            onClick={() => {
              if (!loadingMore) onLoadMore();
            }}
          >
            {loadingMore
              ? "Loading photos…"
              : loadMoreFailed
              ? "Try loading more photos"
              : "Load more photos"}
          </button>
          {loadingMore && (
            <span className={galleryStyles.visuallyHidden} role="status">
              Loading more photos…
            </span>
          )}
        </div>
      )}
    </section>
  );
}

export function MemoryAlbum({
  name,
  remaining,
  photoLimit,
  quotaState,
  addingFiles,
  tab,
  uploadCount,
  onTabChange,
  onCamera,
  onAdd,
  onQuotaRetry,
  uploads,
  uploadSummary,
  success,
  qrHref,
  ...photos
}: AlbumProps) {
  const guestName = name.trim();
  const initials = guestName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase();
  const contribution = {
    canContribute: quotaState === "ready" && remaining > 0,
    addingFiles,
    onCamera,
    onAdd,
  };
  const tabs = [
    { id: "photos", label: "Photos", Icon: Images },
    { id: "uploads", label: "Uploads", Icon: Upload, badge: uploadCount },
  ] as const;

  return (
    <div className={styles.album}>
      <header className={styles.header}>
        <div>
          <h1 className={`${homeStyles.heroTitle} ${styles.title}`}>
            My album
          </h1>
          <p className={homeStyles.galleryDescription}>
            Little moments, seen through your eyes.
          </p>
        </div>
        {initials && (
          <span className={styles.initials}>
            <span aria-hidden="true">{initials}</span>
            <span className={galleryStyles.visuallyHidden}>{guestName}</span>
          </span>
        )}
      </header>

      <section className={styles.camera} aria-labelledby="album-camera">
        <div className={homeStyles.cameraHeading}>
          <h2 className={homeStyles.sectionTitle} id="album-camera">
            Your camera
          </h2>
          <p className={homeStyles.allowance} role="status">
            {quotaState === "ready" &&
              `${remaining} ${remaining === 1 ? "shot" : "shots"} left`}
            {quotaState === "loading" && "Checking shots…"}
            {quotaState === "error" && "Shot count unavailable"}
          </p>
        </div>
        <div className={homeStyles.exposureMeter} aria-hidden="true">
          {Array.from({ length: photoLimit }, (_, index) => (
            <span
              key={index}
              className={
                quotaState === "ready" && index < remaining
                  ? homeStyles.availableExposure
                  : homeStyles.exposure
              }
            />
          ))}
        </div>
        <ContributionActions {...contribution} />
        {quotaState === "error" && (
          <button
            type="button"
            className={homeStyles.textAction}
            onClick={onQuotaRetry}
          >
            Retry shot count
          </button>
        )}
        {quotaState === "ready" && remaining === 0 && (
          <p className={homeStyles.cameraNote}>
            All {photoLimit} {photoLimit === 1 ? "shot is" : "shots are"} in
            use.
          </p>
        )}
      </section>

      {uploadSummary}
      {success && (
        <p className={styles.success} role="status">
          {success}
        </p>
      )}

      <MemoryContentTabs<AlbumTab>
        id="memory-album"
        label="Album content"
        tabs={tabs}
        active={tab}
        onChange={onTabChange}
        sticky={false}
      >
        {tab === "photos" ? (
          <AlbumPhotos {...photos} {...contribution} />
        ) : (
          uploads
        )}
      </MemoryContentTabs>

      <footer className={styles.footer}>
        <p>Photos you share can be viewed by anyone with the album link.</p>
        <nav className={homeStyles.albumUtility} aria-label="Album links">
          <Link href="/wedding-memories">All albums</Link>
          <Link href={qrHref}>QR card</Link>
        </nav>
      </footer>
    </div>
  );
}
