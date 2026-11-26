import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { MemoryPhoto } from "@/lib/wedding/memories";
import {
  getStyledPhotoAsset,
  getPhotoOriginalKey,
  isMissingPhotoObject,
  useStyledPhotoAsset,
  type SharedPhotoAssetRequest,
} from "@/lib/wedding/memoriesPhotoAssets";
import { formatPhotoStampDate } from "@/lib/wedding/memoriesRender";
import { MemoryPhotoViewer } from "./MemoryPhotoViewer";

export type ViewerItem = {
  photo: MemoryPhoto;
  request: SharedPhotoAssetRequest;
};

type ViewerSession = {
  items: ViewerItem[];
  hasMore: boolean;
  index: number;
  scope: string;
  url: string;
  token: string;
  opener: HTMLButtonElement;
  historyEntry: boolean;
};

const historyMarker = "weddingMemoriesPhoto";
const filmstripRadius = 3;
const dateSources = {
  capture: "Captured",
  recorded: "Photo time",
  shared: "Shared",
  unknown: "",
};

export function useMemoryPhotoViewer({
  scope,
  backgroundRef,
  favoriteIds,
  isFavoritePending,
  onFavorite,
  missingPhotoKeys,
  onMissing,
}: {
  scope: string;
  backgroundRef: RefObject<HTMLElement>;
  favoriteIds: string[];
  isFavoritePending: (id: string) => boolean;
  onFavorite: (id: string) => Promise<boolean | void>;
  missingPhotoKeys: ReadonlySet<string>;
  onMissing: (originalKey: string) => void;
}) {
  const [current, setCurrent] = useState<ViewerSession>();
  const lastSession = useRef<ViewerSession>();
  const sessionOpen = useRef(false);
  const backPending = useRef(false);
  const scrollRestoration = useRef<ScrollRestoration>();
  const nextToken = useRef(0);
  const visible = useMemo(() => {
    if (!current || current.scope !== scope) return undefined;
    let position = 0;
    const items = current.items.filter((item, index) => {
      if (missingPhotoKeys.has(getPhotoOriginalKey(item.request))) return false;
      if (index < current.index) position++;
      return true;
    });
    if (items.length === current.items.length) return current;
    if (!items.length) {
      return { ...current, items: [current.items[current.index]], index: 0 };
    }
    return { ...current, items, index: Math.min(position, items.length - 1) };
  }, [current, missingPhotoKeys, scope]);

  function retainScroll() {
    if (scrollRestoration.current !== undefined) return;
    scrollRestoration.current = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
  }

  function restoreScroll() {
    const previous = scrollRestoration.current;
    if (previous === undefined) return;
    window.history.scrollRestoration = previous;
    scrollRestoration.current = undefined;
  }

  useEffect(() => {
    if (!visible && sessionOpen.current) {
      sessionOpen.current = false;
      backPending.current = false;
      restoreScroll();
      setCurrent(undefined);
    }
  }, [visible]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      const session = lastSession.current;
      if (!session || session.scope !== scope) return;
      backPending.current = false;
      const sameLocation = window.location.href === session.url;
      if (sameLocation && event.state?.[historyMarker] === session.token) {
        event.stopImmediatePropagation();
        retainScroll();
        sessionOpen.current = true;
        setCurrent(session);
      } else if (sessionOpen.current) {
        if (sameLocation) event.stopImmediatePropagation();
        sessionOpen.current = false;
        setCurrent(undefined);
        // The browser's same-page popstate scroll runs after this event.
        window.requestAnimationFrame(() => {
          if (!sessionOpen.current) restoreScroll();
        });
      }
    };
    window.addEventListener("popstate", onPop, true);
    return () => window.removeEventListener("popstate", onPop, true);
  }, [scope]);

  useEffect(() => restoreScroll, []);

  function open(
    items: ViewerItem[],
    index: number,
    hasMore: boolean,
    opener: HTMLButtonElement
  ) {
    if (sessionOpen.current || !items[index]) return;
    retainScroll();
    const token = `${Date.now()}-${++nextToken.current}`;
    const url = window.location.href;
    let historyEntry = false;
    try {
      window.history.pushState(
        { ...window.history.state, [historyMarker]: token },
        "",
        url
      );
      historyEntry = true;
    } catch {
      // The viewer can still open if the browser rejects a same-page step.
    }
    const session = {
      items,
      index,
      hasMore,
      opener,
      scope,
      url,
      token,
      historyEntry,
    };
    lastSession.current = session;
    sessionOpen.current = true;
    setCurrent(session);
  }

  function close() {
    if (!visible || backPending.current) return;
    if (
      visible.historyEntry &&
      window.history.state?.[historyMarker] === visible.token
    ) {
      backPending.current = true;
      window.history.back();
    } else {
      sessionOpen.current = false;
      setCurrent(undefined);
      restoreScroll();
    }
  }

  function change(index: number) {
    const session = lastSession.current;
    if (
      !sessionOpen.current ||
      !visible ||
      session?.token !== visible.token ||
      !visible.items[index] ||
      index === visible.index
    )
      return;
    const next = { ...visible, index };
    lastSession.current = next;
    setCurrent(next);
  }

  return {
    open,
    viewer: visible && (
      <SharedPhotoViewer
        key={visible.token}
        session={visible}
        backgroundRef={backgroundRef}
        favoriteIds={favoriteIds}
        isFavoritePending={isFavoritePending}
        onFavorite={onFavorite}
        knownMissing={missingPhotoKeys.has(
          getPhotoOriginalKey(visible.items[visible.index].request)
        )}
        onMissing={onMissing}
        onChange={change}
        onClose={close}
      />
    ),
  };
}

function SharedPhotoViewer({
  session,
  backgroundRef,
  favoriteIds,
  isFavoritePending,
  onFavorite,
  knownMissing,
  onMissing,
  onChange,
  onClose,
}: {
  session: ViewerSession;
  backgroundRef: RefObject<HTMLElement>;
  favoriteIds: string[];
  isFavoritePending: (id: string) => boolean;
  onFavorite: (id: string) => Promise<boolean | void>;
  knownMissing: boolean;
  onMissing: (originalKey: string) => void;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const { items, index, hasMore, opener } = session;
  const { photo, request } = items[index];
  const { asset, src, status, retry } = useStyledPhotoAsset(
    knownMissing ? undefined : request,
    "full",
    onMissing
  );
  const [failedSource, setFailedSource] = useState<string>();
  const [favoriteFailure, setFavoriteFailure] = useState<string>();
  const [downloadFailure, setDownloadFailure] = useState<string>();
  const [downloading, setDownloading] = useState(false);
  const downloadGate = useRef(false);
  const releaseDownload = useRef<number>();
  const fullFailed =
    status === "error" || (Boolean(src) && failedSource === src);
  const missing = knownMissing || status === "missing";
  const photosWithNeighbors = useNeighborThumbnails(items, index, onMissing);
  const time = asset?.time ?? request.sharedAt;
  const timeSource = asset?.timeSource ?? "shared";
  const dateLabel =
    time && timeSource !== "unknown"
      ? `${dateSources[timeSource]} · ${formatPhotoStampDate(time)}`
      : undefined;

  useEffect(
    () => () => window.cancelAnimationFrame(releaseDownload.current ?? 0),
    []
  );

  async function toggleFavorite() {
    setFavoriteFailure(undefined);
    const id = photo.id;
    if ((await onFavorite(id)) === false) setFavoriteFailure(id);
  }

  function download() {
    if (!asset || !src || fullFailed || missing || downloadGate.current) return;
    downloadGate.current = true;
    setDownloading(true);
    setDownloadFailure(undefined);
    try {
      saveStyledPhoto(asset.blob, `wedding-memory-${photo.id}.jpg`);
    } catch (reason) {
      console.warn("Could not download Wedding Memories styled photo", reason);
      setDownloadFailure(photo.id);
    } finally {
      releaseDownload.current = window.requestAnimationFrame(() => {
        downloadGate.current = false;
        setDownloading(false);
      });
    }
  }

  return (
    <MemoryPhotoViewer
      photoId={photo.id}
      guestName={photo.guestName}
      dateLabel={dateLabel}
      position={index + 1}
      count={missing ? 0 : items.length}
      hasMore={hasMore}
      photoStatus={missing ? "missing" : fullFailed ? "error" : status}
      imageUrl={fullFailed ? undefined : src}
      onImageError={() => setFailedSource(src)}
      onRetry={() => {
        setFailedSource(undefined);
        retry();
      }}
      onClose={onClose}
      opener={opener}
      backgroundRef={backgroundRef}
      favorite={favoriteIds.includes(photo.id)}
      favoritePending={isFavoritePending(photo.id)}
      onFavorite={missing ? undefined : () => void toggleFavorite()}
      favoriteError={
        favoriteFailure === photo.id
          ? "Could not update this favourite. Try again."
          : undefined
      }
      onPrevious={index > 0 ? () => onChange(index - 1) : undefined}
      onNext={index < items.length - 1 ? () => onChange(index + 1) : undefined}
      filmstrip={photosWithNeighbors.map(
        ({ item, index: position, src: preview }) => ({
          id: item.photo.id,
          label: `Photo ${position + 1} shared by ${item.photo.guestName}`,
          src: preview,
          onSelect: () => onChange(position),
        })
      )}
      downloadPending={downloading}
      downloadError={
        downloadFailure === photo.id
          ? "Couldn’t download this photo. Try again."
          : undefined
      }
      onDownload={download}
    />
  );
}

function useNeighborThumbnails(
  items: ViewerItem[],
  index: number,
  onMissing: (originalKey: string) => void
) {
  const min = Math.max(
    0,
    Math.min(index - filmstripRadius, items.length - 2 * filmstripRadius - 1)
  );
  const [sources, setSources] = useState<Record<string, string>>({});
  useEffect(() => {
    if (items.length < 2) return;
    let active = true;
    const urls: string[] = [];
    setSources({});
    items
      .slice(min, min + 2 * filmstripRadius + 1)
      .forEach(({ request, photo }) => {
        void getStyledPhotoAsset(request, "thumbnail")
          .then((asset) => {
            if (!active) return;
            const url = URL.createObjectURL(asset.blob);
            urls.push(url);
            setSources((current) => ({ ...current, [photo.id]: url }));
          })
          .catch((error) => {
            if (active && isMissingPhotoObject(error))
              onMissing(getPhotoOriginalKey(request));
          });
      });
    return () => {
      active = false;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [items, min, onMissing]);
  return items.length > 1
    ? items.slice(min, min + 2 * filmstripRadius + 1).map((item, offset) => ({
        item,
        index: min + offset,
        src: sources[item.photo.id],
      }))
    : [];
}

function saveStyledPhoto(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.hidden = true;
  try {
    document.body.append(link);
    link.click();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    link.remove();
  }
  // Give download managers time to consume the URL even when navigating away.
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
}
