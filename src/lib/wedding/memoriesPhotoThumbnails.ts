import { useEffect, useRef, useState } from "react";
import {
  getPhotoOriginalKey,
  getStyledPhotoAsset,
  getStyledPhotoKey,
  isMissingPhotoObject,
  type SharedPhotoAssetRequest,
  type StyledPhotoAsset,
} from "./memoriesPhotoAssets";

type ThumbnailResult =
  | { status: "ready"; asset: StyledPhotoAsset }
  | { status: "missing" | "error" };

const workers = 3;
const batchTimeout = 20_000;

export function usePhotoThumbnails(
  requests: SharedPhotoAssetRequest[],
  onMissing: (originalKey: string) => void
) {
  const [results, setResults] = useState<ReadonlyMap<string, ThumbnailResult>>(
    () => new Map()
  );
  // Firestore can emit identical rows again as snapshot metadata changes.
  const entries = requests.map((request) => ({
    key: getStyledPhotoKey(request, "thumbnail"),
    request,
  }));
  const latestEntries = useRef(entries);
  latestEntries.current = entries;
  const signature = JSON.stringify(entries.map(({ key }) => key));

  useEffect(() => {
    const entries = latestEntries.current;
    const pending = entries.filter(({ key }) => !results.has(key));
    if (pending.length === 0) return;

    let active = true;
    let next = 0;
    const batch = new Map<string, ThumbnailResult>();

    function publish() {
      if (!active) return;
      active = false;
      window.clearTimeout(deadline);
      const verified = new Map<string, ThumbnailResult>();
      for (const { key, request } of entries) {
        const result = results.get(key) ??
          batch.get(key) ?? { status: "error" };
        verified.set(key, result);
        if (batch.get(key)?.status === "missing") {
          onMissing(getPhotoOriginalKey(request));
        }
      }
      setResults(verified);
    }

    async function prepare() {
      while (active && next < pending.length) {
        const { key, request } = pending[next++];
        try {
          const asset = await getStyledPhotoAsset(request, "thumbnail");
          if (active) batch.set(key, { status: "ready", asset });
        } catch (error) {
          if (active) {
            batch.set(key, {
              status: isMissingPhotoObject(error) ? "missing" : "error",
            });
          }
        }
      }
    }

    const deadline = window.setTimeout(publish, batchTimeout);
    void Promise.all(
      Array.from({ length: Math.min(workers, pending.length) }, prepare)
    ).then(publish);
    return () => {
      active = false;
      window.clearTimeout(deadline);
    };
  }, [signature, results, onMissing]);

  return {
    results,
    checking: entries.some(({ key }) => !results.has(key)),
    failed: entries.some(({ key }) => results.get(key)?.status === "error"),
    retry: () =>
      setResults(
        (current) =>
          new Map(
            Array.from(current).filter(
              ([, result]) => result.status !== "error"
            )
          )
      ),
  };
}
