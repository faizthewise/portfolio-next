import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import type { MemoryPhoto } from "@/lib/wedding/memories";
import styles from "./MemoryGalleryPhoto.module.css";

type PhotoProps = {
  photo: MemoryPhoto;
  thumbnail: Blob;
  onFavorite: (id: string) => void | Promise<boolean | void>;
  favorite: boolean;
  favoritePending?: boolean;
  onOpen: (button: HTMLButtonElement) => void;
};

export function MemoryGalleryPhoto({
  photo,
  thumbnail,
  onFavorite,
  favorite,
  favoritePending = false,
  onOpen,
}: PhotoProps) {
  const [source, setSource] = useState<{ blob: Blob; url: string }>();
  const [attempt, setAttempt] = useState(0);
  const [failedSource, setFailedSource] = useState<string>();
  useEffect(() => {
    const url = URL.createObjectURL(thumbnail);
    setSource({ blob: thumbnail, url });
    return () => URL.revokeObjectURL(url);
  }, [thumbnail, attempt]);

  if (source?.blob !== thumbnail) return null;
  const src = source.url;
  const imageFailed = src === failedSource;
  return (
    <article className={styles.card}>
      <div className={styles.tile}>
        {!imageFailed ? (
          <>
            <button
              type="button"
              className={styles.open}
              onClick={(event) => onOpen(event.currentTarget)}
              aria-label={`Open photo shared by ${photo.guestName}`}
            >
              {/* The thumbnail is a client-derived image from protected Storage. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                decoding="async"
                onError={() => setFailedSource(src)}
              />
            </button>
            <button
              type="button"
              className={styles.tileHeart}
              aria-label={`Favourite photo shared by ${photo.guestName}`}
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
            <div className={styles.previewError}>
              <p role="status">Photo unavailable</p>
              <button
                type="button"
                className={styles.retry}
                onClick={() => setAttempt((current) => current + 1)}
                aria-label={`Retry loading photo shared by ${photo.guestName}`}
              >
                Retry photo
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
