import { ChevronRight, CloudUpload, ImageIcon } from "lucide-react";
import { useEffect, useState } from "react";
import styles from "./MemoryAlbumUploads.module.css";

export type AlbumUploadItem = {
  id: string;
  group: "attention" | "draft" | "active" | "waiting";
  status: string;
  detail?: string;
  progress?: number;
  createdAt: number;
  preview?: Blob;
  fileName?: string;
  canRetry?: boolean;
  canReview?: boolean;
};

const uploadGroups = [
  {
    id: "attention",
    heading: "Needs attention",
    summary: (count: number) =>
      `${count} ${count === 1 ? "needs" : "need"} attention`,
  },
  {
    id: "draft",
    heading: "Ready to share",
    summary: (count: number) => `${count} ready to share`,
  },
  {
    id: "active",
    heading: "Uploading",
    summary: (count: number) => `${count} uploading`,
  },
  {
    id: "waiting",
    heading: "Waiting",
    summary: (count: number) => `${count} waiting`,
  },
] as const;

const uploadDate = new Intl.DateTimeFormat("en-MY", {
  timeZone: "Asia/Kuala_Lumpur",
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function MemoryAlbumUploadSummary({
  items,
  onOpen,
  current = false,
}: {
  items: AlbumUploadItem[];
  onOpen: () => void;
  current?: boolean;
}) {
  if (items.length === 0) return null;

  const summary = uploadGroups
    .map(({ id, summary }) => {
      const count = items.filter((item) => item.group === id).length;
      return count ? summary(count) : "";
    })
    .filter(Boolean)
    .join(" · ");

  const content = (
    <>
      <CloudUpload aria-hidden="true" size={20} />
      <span className={styles.summaryCopy}>
        <strong>{current ? "Upload status" : "View uploads"}</strong>
        <span aria-live={current ? "polite" : undefined}>{summary}</span>
      </span>
    </>
  );

  if (current) return <div className={styles.summary}>{content}</div>;

  return (
    <button
      className={`${styles.summary} ${styles.summaryButton}`}
      type="button"
      onClick={onOpen}
    >
      {content}
      <ChevronRight aria-hidden="true" size={18} />
    </button>
  );
}

function UploadThumbnail({ preview }: { preview?: Blob }) {
  const [source, setSource] = useState<{ blob: Blob; url: string }>();
  const [brokenUrl, setBrokenUrl] = useState<string>();

  useEffect(() => {
    if (!preview) return;
    const url = URL.createObjectURL(preview);
    setSource({ blob: preview, url });
    return () => URL.revokeObjectURL(url);
  }, [preview]);

  const url = source?.blob === preview ? source?.url : undefined;

  return (
    <span className={styles.thumbnail} aria-hidden="true">
      {url && url !== brokenUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- The thumbnail is a local Blob URL.
        <img
          alt=""
          src={url}
          loading="lazy"
          onError={() => setBrokenUrl(url)}
        />
      ) : (
        <ImageIcon size={21} />
      )}
    </span>
  );
}

function UploadRow({
  item,
  onReview,
  onRetry,
}: {
  item: AlbumUploadItem;
  onReview: (id: string) => void;
  onRetry: (id: string) => void;
}) {
  const date = new Date(item.createdAt);
  const hasDate = item.createdAt > 0 && Number.isFinite(date.getTime());
  const identifier = hasDate
    ? uploadDate.format(date)
    : "Photo · date unavailable";
  const actionLabel = item.fileName
    ? `${identifier} · ${item.fileName}`
    : identifier;
  const progress =
    item.progress !== undefined && item.progress >= 0 && item.progress <= 100
      ? item.progress
      : undefined;

  return (
    <li className={styles.row}>
      <UploadThumbnail preview={item.preview} />
      <div className={styles.rowCopy}>
        <p className={styles.identifier}>
          {hasDate ? (
            <time dateTime={date.toISOString()}>{identifier}</time>
          ) : (
            identifier
          )}
        </p>
        <p className={styles.rowStatus}>
          {item.group === "active" && progress === undefined && (
            <span className={styles.spinner} aria-hidden="true" />
          )}
          {item.status}
        </p>
        {item.detail && <p className={styles.detail}>{item.detail}</p>}
        {item.group === "active" && progress !== undefined && (
          <progress
            className={styles.progress}
            aria-label={`Transfer progress for ${identifier}`}
            value={progress}
            max={100}
          />
        )}
      </div>
      {(item.canReview || item.canRetry) && (
        <div className={styles.actions}>
          {item.canReview && (
            <button
              className={styles.action}
              type="button"
              aria-label={`Review photo · ${actionLabel}`}
              onClick={() => onReview(item.id)}
            >
              Review photo
            </button>
          )}
          {item.canRetry && (
            <button
              className={styles.action}
              type="button"
              aria-label={`Retry upload · ${actionLabel}`}
              onClick={() => onRetry(item.id)}
            >
              Retry upload
            </button>
          )}
        </div>
      )}
    </li>
  );
}

export function MemoryAlbumUploads({
  items,
  loading,
  loadFailed,
  onLoadRetry,
  onReview,
  onRetry,
  onViewPhotos,
}: {
  items: AlbumUploadItem[];
  loading: boolean;
  loadFailed: boolean;
  onLoadRetry: () => void;
  onReview: (id: string) => void;
  onRetry: (id: string) => void;
  onViewPhotos: () => void;
}) {
  return (
    <div className={styles.uploads}>
      <header className={styles.header}>
        <h2>Your uploads</h2>
        <p>Keep track of your memories.</p>
      </header>
      {loading && (
        <div className={styles.message} role="status">
          <span className={styles.thumbnail} aria-hidden="true">
            <span className={styles.spinner} />
          </span>
          <p>Loading your uploads…</p>
        </div>
      )}
      {!loading && loadFailed && (
        <div className={styles.message}>
          <p role="status">Couldn’t load your uploads. Please try again.</p>
          <button className={styles.action} type="button" onClick={onLoadRetry}>
            Try again
          </button>
        </div>
      )}
      {!loading && !loadFailed && items.length === 0 && (
        <div className={styles.empty}>
          <h3>All caught up.</h3>
          <p>There are no pending uploads.</p>
          <button
            className={styles.action}
            type="button"
            onClick={onViewPhotos}
          >
            View my photos
          </button>
        </div>
      )}
      {uploadGroups.map(({ id, heading }) => {
        const groupItems = items.filter((item) => item.group === id);
        if (groupItems.length === 0) return null;
        return (
          <section key={id} className={styles.group}>
            <h3>{heading}</h3>
            <ul className={styles.list}>
              {groupItems.map((item) => (
                <UploadRow
                  key={item.id}
                  item={item}
                  onReview={onReview}
                  onRetry={onRetry}
                />
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
