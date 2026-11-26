import { getBlob, ref } from "firebase/storage";
import { useCallback, useEffect, useState } from "react";
import { getWeddingStorage } from "./firebase";
import { renderWeddingPhoto, type PhotoFilm } from "./memoriesRender";
import {
  resolveWeddingPhotoTime,
  resolveWeddingPhotoTimeFallback,
} from "./memoriesPhotoTime";

export type SharedPhotoAssetRequest = {
  originalPath: string;
  uploadKey?: string;
  coupleNames: string;
  film: PhotoFilm;
  recordedAt?: number;
  sharedAt?: number;
};

export type StyledPhotoAsset = {
  blob: Blob;
  width: number;
  height: number;
  time?: number;
  timeSource: "capture" | "recorded" | "shared" | "unknown";
};

type PhotoVariant = "thumbnail" | "full";
type AssetState = {
  key?: string;
  attempt?: number;
  asset?: StyledPhotoAsset;
  src?: string;
  status: "loading" | "ready" | "error";
};

const thumbnailSize = 400;
const fullSize = 4096;
const megabyte = 1024 * 1024;

class PhotoCache<T> {
  private entries = new Map<string, { value: T; bytes: number }>();
  private bytes = 0;

  constructor(private countLimit: number, private byteLimit: number) {}

  get(key: string) {
    const entry = this.entries.get(key);
    if (entry) {
      this.entries.delete(key);
      this.entries.set(key, entry);
    }
    return entry?.value;
  }

  delete(key: string) {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.entries.delete(key);
    this.bytes -= entry.bytes;
  }

  set(key: string, value: T, bytes: number) {
    if (bytes > this.byteLimit) return;
    this.delete(key);
    this.entries.set(key, { value, bytes });
    this.bytes += bytes;
    while (this.entries.size > this.countLimit || this.bytes > this.byteLimit) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.delete(oldest);
    }
  }
}

type Original = { blob: Blob; captureTime?: number };
const originals = new PhotoCache<Original>(12, 32 * megabyte);
const thumbnails = new PhotoCache<StyledPhotoAsset>(72, 8 * megabyte);
const fullPhotos = new PhotoCache<StyledPhotoAsset>(4, 24 * megabyte);
const pendingOriginals = new Map<string, Promise<Original>>();
const pendingAssets = new Map<string, Promise<StyledPhotoAsset>>();
function makePhotoQueue(workerLimit: number, fullLimit: number) {
  const queue: Record<PhotoVariant, (() => void)[]> = {
    thumbnail: [],
    full: [],
  };
  let activeWorkers = 0;
  let activeFull = 0;

  function runNext() {
    while (activeWorkers < workerLimit) {
      const full = activeFull < fullLimit ? queue.full.shift() : undefined;
      const next = full ?? queue.thumbnail.shift();
      if (!next) return;
      activeWorkers++;
      if (full) activeFull++;
      next();
    }
  }

  return function schedule<T>(variant: PhotoVariant, work: () => Promise<T>) {
    return new Promise<T>((resolve, reject) => {
      queue[variant].push(() => {
        void work()
          .then(resolve, reject)
          .finally(() => {
            activeWorkers--;
            if (variant === "full") activeFull--;
            runNext();
          });
      });
      runNext();
    });
  };
}

// Keep slow Storage reads out of the canvas queue, where only one full image
// can render at a time.
const scheduleRead = makePhotoQueue(3, 3);
const scheduleRender = makePhotoQueue(2, 1);

function originalKey({ originalPath, uploadKey }: SharedPhotoAssetRequest) {
  return JSON.stringify([originalPath, uploadKey]);
}

export function getStyledPhotoKey(
  request: SharedPhotoAssetRequest,
  variant: PhotoVariant
) {
  return JSON.stringify([
    originalKey(request),
    request.coupleNames,
    request.film,
    request.recordedAt,
    request.sharedAt,
    variant,
  ]);
}

function getOriginal(
  request: SharedPhotoAssetRequest,
  variant: PhotoVariant
): Promise<Original> {
  const key = originalKey(request);
  const cached = originals.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = pendingOriginals.get(key);
  if (pending) return pending;

  const read = scheduleRead(variant, async () => {
    const blob = await getBlob(ref(getWeddingStorage(), request.originalPath));
    const { time: captureTime } = await resolveWeddingPhotoTime(blob);
    const original = { blob, captureTime };
    originals.set(key, original, blob.size);
    return original;
  }).finally(() => pendingOriginals.delete(key));
  pendingOriginals.set(key, read);
  return read;
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

async function renderAsset(
  request: SharedPhotoAssetRequest,
  variant: PhotoVariant,
  original: Original
): Promise<StyledPhotoAsset> {
  const image = new Image();
  const source = URL.createObjectURL(original.blob);
  let canvas: HTMLCanvasElement | undefined;
  try {
    image.decoding = "async";
    image.src = source;
    try {
      await withTimeout(image.decode(), 6000);
    } catch (error) {
      originals.delete(originalKey(request));
      throw error;
    }
    const resolvedTime =
      original.captureTime === undefined
        ? resolveWeddingPhotoTimeFallback(request.recordedAt, request.sharedAt)
        : { time: original.captureTime, timeSource: "capture" as const };
    const thumbnail = variant === "thumbnail";
    canvas = renderWeddingPhoto(image, {
      film: request.film,
      coupleNames: request.coupleNames,
      time: resolvedTime.time,
      thumbnail,
      maxDimension: thumbnail ? thumbnailSize : fullSize,
    });
    const { width, height } = canvas;
    const blob = await encodePhoto(canvas, thumbnail ? 0.84 : 0.92);
    return { blob, width, height, ...resolvedTime };
  } finally {
    image.removeAttribute("src");
    URL.revokeObjectURL(source);
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

function encodePhoto(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode Wedding Memories photo"));
      },
      "image/jpeg",
      quality
    );
  });
}

function derivativeCache(variant: PhotoVariant) {
  return variant === "thumbnail" ? thumbnails : fullPhotos;
}

export function getStyledPhotoAsset(
  request: SharedPhotoAssetRequest,
  variant: PhotoVariant
): Promise<StyledPhotoAsset> {
  const key = getStyledPhotoKey(request, variant);
  const cache = derivativeCache(variant);
  const cached = cache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = pendingAssets.get(key);
  if (pending) return pending;

  // A caller can retry after its deadline while the original read stays shared
  // until Firebase settles it. Only available originals enter the canvas queue.
  const job = withTimeout(getOriginal(request, variant), 12000)
    .then((original) =>
      scheduleRender(variant, () => renderAsset(request, variant, original))
    )
    .then((asset) => {
      cache.set(key, asset, asset.blob.size);
      return asset;
    })
    .finally(() => pendingAssets.delete(key));
  pendingAssets.set(key, job);
  return job;
}

export function useStyledPhotoAsset(
  request: SharedPhotoAssetRequest | undefined,
  variant: PhotoVariant
): Pick<AssetState, "asset" | "src" | "status"> & { retry: () => void } {
  const [state, setState] = useState<AssetState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const { originalPath, uploadKey, coupleNames, film, recordedAt, sharedAt } =
    request ?? {};

  const key = request ? getStyledPhotoKey(request, variant) : undefined;
  const retry = useCallback(() => {
    if (!key) return;
    derivativeCache(variant).delete(key);
    setAttempt((value) => value + 1);
  }, [key, variant]);

  useEffect(() => {
    if (!key || !originalPath || coupleNames === undefined || !film) return;
    let active = true;
    let url: string | undefined;
    void getStyledPhotoAsset(
      { originalPath, uploadKey, coupleNames, film, recordedAt, sharedAt },
      variant
    )
      .then((asset) => {
        if (!active) return;
        url = URL.createObjectURL(asset.blob);
        setState({ key, attempt, status: "ready", src: url, asset });
      })
      .catch((reason) => {
        if (!active) return;
        console.warn("Could not prepare Wedding Memories photo", reason);
        setState({ key, attempt, status: "error" });
      });
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [
    attempt,
    coupleNames,
    film,
    key,
    originalPath,
    recordedAt,
    sharedAt,
    uploadKey,
    variant,
  ]);

  if (state.key !== key || state.attempt !== attempt) {
    setState({ key, attempt, status: "loading" });
    return { status: "loading", retry };
  }
  return { asset: state.asset, src: state.src, status: state.status, retry };
}
