import { Heart, Image as ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { MemoryPhoto } from "@/lib/wedding/memories";
import {
  useStyledPhotoAsset,
  type SharedPhotoAssetRequest,
} from "@/lib/wedding/memoriesPhotoAssets";
import styles from "./MemoryGalleryPhoto.module.css";

type PhotoProps = {
  photo: MemoryPhoto;
  request: SharedPhotoAssetRequest;
  onFavorite: (id: string) => void | Promise<boolean | void>;
  favorite: boolean;
  favoritePending?: boolean;
  onOpen: (button: HTMLButtonElement) => void;
};

export function MemoryGalleryPhoto({
  photo,
  request,
  onFavorite,
  favorite,
  favoritePending = false,
  onOpen,
}: PhotoProps) {
  const card = useRef<HTMLElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [failedSource, setFailedSource] = useState<string>();
  const { src, status, retry } = useStyledPhotoAsset(
    nearViewport ? request : undefined,
    "thumbnail"
  );

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

  const imageFailed = !!src && src === failedSource;
  return (
    <article ref={card} className={styles.card}>
      <div className={styles.tile}>
        {src && !imageFailed ? (
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
            {status === "error" || imageFailed ? (
              <div className={styles.previewError}>
                <p role="status">Photo unavailable</p>
                <button
                  type="button"
                  className={styles.retry}
                  onClick={retry}
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
    </article>
  );
}
