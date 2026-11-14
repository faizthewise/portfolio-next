import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Cormorant_Garamond, Great_Vibes, Lora } from "next/font/google";
import { Heart, Camera, Mic, Upload, Image as ImageIcon } from "lucide-react";
import { getBlob, getDownloadURL, ref } from "firebase/storage";
import { getWeddingStorage, getWeddingGuest } from "@/lib/wedding/firebase";
import { brideInvitation, groomInvitation } from "@/lib/wedding/invitations";
import {
  MEMORY_PUBLIC_ALBUMS,
  memoryCanonicalUrl,
  memoryPath,
} from "@/lib/wedding/memoryRoutes";
import {
  drawStyledPhoto,
  MEMORY_EVENTS,
  MEMORY_HASHTAG,
  PHOTO_LIMIT,
  saveWish,
  saveFavorite,
  readFavoriteIds,
  readGuestPhotoCount,
  readMorePhotos,
  subscribePhotos,
  subscribeWishes,
  subscribeVoices,
  readSettings,
  subscribePublicSettings,
  type MemoryPhoto,
  type MemoryWish,
  type MemoryVoice,
  type MemorySettings,
  type PhotoCursor,
} from "@/lib/wedding/memories";
import type { WeddingEventId } from "@/lib/wedding/invitations";
import { listUploadJobs, type UploadJob } from "@/lib/wedding/memoriesQueue";
import {
  processUploadJob,
  saveAudioDraft,
  savePhotoDraft,
} from "@/lib/wedding/memoriesUploads";
import {
  appendMemoryRows,
  applyMemoryHead,
  applyMemoryTail,
  beginMemoryPage,
  mergeMemoryRows,
  resetMemoryPage,
} from "@/lib/wedding/memoriesPagination";
import styles from "./Memories.module.css";

const memoryTitle = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const memoryNames = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
const memoryText = Lora({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export function MemoryExperience({
  side,
  page = "guest",
}: {
  side: "bride" | "groom";
  page?: "guest" | "gallery";
}) {
  const event = MEMORY_EVENTS[side];
  const wedding = side === "bride" ? brideInvitation : groomInvitation;
  const eventId = event.id;
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState<MemoryPhoto[]>([]);
  const [myPhotos, setMyPhotos] = useState<MemoryPhoto[]>([]);
  const [wishes, setWishes] = useState<MemoryWish[]>([]);
  const [voices, setVoices] = useState<MemoryVoice[]>([]);
  const [settings, setSettings] = useState<MemorySettings>();
  const [queue, setQueue] = useState<UploadJob[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [cursor, setCursor] = useState<PhotoCursor>();
  const [hasMore, setHasMore] = useState(false);
  const [myCursor, setMyCursor] = useState<PhotoCursor>();
  const [myHasMore, setMyHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [photoView, setPhotoView] = useState<"all" | "my" | "favorites">("all");
  const [guestFilter, setGuestFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [wish, setWish] = useState("");
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPending, setCameraPending] = useState(false);
  const [recording, setRecording] = useState(false);
  const [microphonePending, setMicrophonePending] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [privateVoice, setPrivateVoice] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [guestUid, setGuestUid] = useState("");
  const pageCursorRef = useRef(resetMemoryPage<PhotoCursor>());
  const myPageCursorRef = useRef(resetMemoryPage<PhotoCursor>());
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraRef = useRef<MediaStream>();
  const recorderRef = useRef<MediaRecorder>();
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number>();
  const recordingTickRef = useRef<number>();
  const cameraRequestRef = useRef(false);
  const microphoneRequestRef = useRef(false);
  const inFlightRef = useRef(new Set<string>());
  const activeRef = useRef(true);
  const isGallery = page === "gallery";
  useEffect(() => {
    try {
      const storedName = window.localStorage.getItem(`memories-name-${side}`);
      if (storedName) setName(storedName);
    } catch {
      setStorageNotice(
        "This browser cannot save your name between visits. The public gallery is still available."
      );
    }
    setPhotos([]);
    setMyPhotos([]);
    setWishes([]);
    setVoices([]);
    setFavoriteIds([]);
    setCursor(undefined);
    setHasMore(false);
    pageCursorRef.current = resetMemoryPage();
    setMyCursor(undefined);
    setMyHasMore(false);
    myPageCursorRef.current = resetMemoryPage();
    setPhotoView("all");
    setGuestFilter("all");
    listUploadJobs(eventId)
      .then(setQueue)
      .catch((e) => setError(e.message));
    getWeddingGuest()
      .then(setGuestUid)
      .catch((e) => setError(e.message));
    readGuestPhotoCount(eventId)
      .then(setPhotoCount)
      .catch((e) => setError(e.message));
  }, [side, eventId]);
  useEffect(() => {
    let active = true;
    const unsubs: (() => void)[] = [];
    const track = (promise: Promise<() => void>) =>
      promise
        .then((stop) => {
          if (active) unsubs.push(stop);
          else stop();
        })
        .catch((e) => {
          if (active) {
            if (page === "gallery") setGalleryLoading(false);
            setError((e as Error).message);
          }
        });
    track(
      subscribePublicSettings(eventId, setSettings, (e) =>
        setError(`Could not load couple settings: ${e.message}`)
      )
    );
    if (page === "gallery") {
      setGalleryLoading(true);
      track(
        subscribePhotos(
          eventId,
          (rows, nextCursor, more) => {
            setPhotos((current) => mergeMemoryRows(current, rows));
            pageCursorRef.current = applyMemoryHead(
              pageCursorRef.current,
              nextCursor,
              more ?? false
            );
            setCursor(pageCursorRef.current.cursor);
            setHasMore(pageCursorRef.current.hasMore);
            setGalleryLoading(false);
          },
          (e) => {
            setGalleryLoading(false);
            setError(`Could not load the public gallery: ${e.message}`);
          }
        )
      );
      track(subscribeWishes(eventId, setWishes, (e) => setError(e.message)));
      track(subscribeVoices(eventId, setVoices, (e) => setError(e.message)));
    }
    if (guestUid)
      track(
        subscribePhotos(
          eventId,
          (rows, nextCursor, more) => {
            setMyPhotos((current) => mergeMemoryRows(current, rows));
            myPageCursorRef.current = applyMemoryHead(
              myPageCursorRef.current,
              nextCursor,
              more ?? false
            );
            setMyCursor(myPageCursorRef.current.cursor);
            setMyHasMore(myPageCursorRef.current.hasMore);
          },
          (e) => setError(`Could not load your photos: ${e.message}`),
          guestUid
        )
      );
    return () => {
      active = false;
      unsubs.forEach((u) => u());
    };
  }, [eventId, guestUid, page]);
  useEffect(() => {
    if (cameraOn && videoRef.current && cameraRef.current)
      videoRef.current.srcObject = cameraRef.current;
  }, [cameraOn]);
  useEffect(
    () => () => {
      cameraRef.current?.getTracks().forEach((t) => t.stop());
      window.clearTimeout(timerRef.current);
      window.clearInterval(recordingTickRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          /* tracks are still stopped below */
        }
        recorder.stream.getTracks().forEach((t) => t.stop());
      }
    },
    []
  );
  useEffect(() => {
    if (photos.length || myPhotos.length)
      readFavoriteIds(
        eventId,
        [...photos, ...myPhotos].map((p) => p.id)
      )
        .then(setFavoriteIds)
        .catch(() => {});
  }, [photos, myPhotos, eventId]);
  useEffect(() => {
    if (!name.trim()) return;
    try {
      window.localStorage.setItem(`memories-name-${side}`, name.trim());
      setStorageNotice("");
    } catch {
      setStorageNotice(
        "This browser cannot save your name between visits. The public gallery is still available."
      );
    }
  }, [name, side]);
  const releaseCamera = () => {
    cameraRef.current?.getTracks().forEach((t) => t.stop());
    cameraRef.current = undefined;
    setCameraOn(false);
    setCameraReady(false);
  };
  async function startCamera() {
    if (cameraRequestRef.current || cameraRef.current) return;
    cameraRequestRef.current = true;
    setCameraPending(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      cameraRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOn(true);
      setError("");
    } catch (e) {
      setError(`Camera unavailable: ${(e as Error).message}`);
    } finally {
      cameraRequestRef.current = false;
      if (activeRef.current) setCameraPending(false);
    }
  }
  async function processFile(file: File | Blob) {
    setError("");
    if (!name.trim()) {
      setError("Enter your name before adding photos.");
      return;
    }
    try {
      const job = await savePhotoDraft(side, eventId, name.trim(), file);
      setQueue((current) => [...current, job]);
      void uploadJob(job);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
    };
  }, []);
  async function uploadJob(job: UploadJob) {
    if (inFlightRef.current.has(job.id)) return;
    inFlightRef.current.add(job.id);
    try {
      await processUploadJob(job, {
        onJob: (next) => {
          if (activeRef.current)
            setQueue((rows) =>
              rows.some((row) => row.id === next.id)
                ? rows.map((row) => (row.id === next.id ? next : row))
                : [...rows, next]
            );
        },
        onProgress: (id, percent) => {
          if (activeRef.current && inFlightRef.current.has(id))
            setProgress((values) => ({ ...values, [id]: percent }));
        },
      });
      if (activeRef.current) {
        setQueue((rows) => rows.filter((row) => row.id !== job.id));
        setProgress((values) => {
          const next = { ...values };
          delete next[job.id];
          return next;
        });
        if (job.kind === "photo") {
          setPhotoCount(await readGuestPhotoCount(eventId));
          setMessage("Your photo is uploaded and saved.");
        } else
          setMessage(
            job.isPrivate
              ? "Private voice note sent to the couple."
              : "Your voice note is shared in the gallery."
          );
      }
    } catch (e) {
      if (activeRef.current) setError((e as Error).message || "Upload failed.");
    } finally {
      inFlightRef.current.delete(job.id);
    }
  }
  useEffect(() => {
    const resume = () => {
      if (!navigator.onLine) return;
      listUploadJobs(eventId).then((all) =>
        all.forEach((job) => void uploadJob(job))
      );
    };
    resume();
    window.addEventListener("online", resume);
    return () => window.removeEventListener("online", resume);
  }, [side, eventId]);
  function capture() {
    if (
      !videoRef.current ||
      !cameraReady ||
      !videoRef.current.videoWidth ||
      !videoRef.current.videoHeight
    )
      return;
    const c = document.createElement("canvas");
    c.width = videoRef.current.videoWidth;
    c.height = videoRef.current.videoHeight;
    c.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    c.toBlob(
      (b) => {
        if (b) void processFile(b);
        else setError("The camera could not create a photo. Please try again.");
      },
      "image/jpeg",
      0.92
    );
    releaseCamera();
  }
  async function sendWish() {
    try {
      await saveWish(eventId, name, wish);
      setWish("");
      setMessage("Your wish is shared with the couple.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function toggleFavorite(id: string) {
    try {
      const enabled = !favoriteIds.includes(id);
      await saveFavorite(eventId, id, enabled);
      setFavoriteIds((ids) =>
        enabled ? [...ids, id] : ids.filter((x) => x !== id)
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function loadMore() {
    if (!cursor || !hasMore || loadingMore) return;
    setLoadingMore(true);
    pageCursorRef.current = beginMemoryPage(pageCursorRef.current);
    try {
      const result = await readMorePhotos(eventId, cursor);
      setPhotos((current) => appendMemoryRows(current, result.rows));
      pageCursorRef.current = applyMemoryTail(
        pageCursorRef.current,
        result.cursor,
        result.hasMore
      );
      setCursor(pageCursorRef.current.cursor);
      setHasMore(pageCursorRef.current.hasMore);
    } catch (e) {
      setError(`Could not load more photos: ${(e as Error).message}`);
    } finally {
      setLoadingMore(false);
    }
  }
  async function loadMoreMyPhotos() {
    if (!myCursor || !myHasMore || loadingMore || !guestUid) return;
    setLoadingMore(true);
    myPageCursorRef.current = beginMemoryPage(myPageCursorRef.current);
    try {
      const result = await readMorePhotos(eventId, myCursor, guestUid);
      setMyPhotos((current) => appendMemoryRows(current, result.rows));
      myPageCursorRef.current = applyMemoryTail(
        myPageCursorRef.current,
        result.cursor,
        result.hasMore
      );
      setMyCursor(myPageCursorRef.current.cursor);
      setMyHasMore(myPageCursorRef.current.hasMore);
    } catch (e) {
      setError(`Could not load more of your photos: ${(e as Error).message}`);
    } finally {
      setLoadingMore(false);
    }
  }
  async function startRecording() {
    if (
      microphoneRequestRef.current ||
      recording ||
      recorderRef.current?.state === "recording"
    )
      return;
    microphoneRequestRef.current = true;
    setMicrophonePending(true);
    let stream: MediaStream | undefined;
    try {
      if (!name.trim()) throw new Error("Enter your name before recording.");
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!activeRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      const mime = [
        "audio/webm;codecs=opus",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "audio/webm",
      ].find((x) => MediaRecorder.isTypeSupported(x));
      if (!mime)
        throw new Error("This browser does not support voice recording.");
      const rec = new MediaRecorder(stream, { mimeType: mime });
      recorderRef.current = rec;
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream?.getTracks().forEach((t) => t.stop());
        window.clearTimeout(timerRef.current);
        window.clearInterval(recordingTickRef.current);
        recorderRef.current = undefined;
        if (activeRef.current) setRecording(false);
        try {
          const job = await saveAudioDraft(
            side,
            eventId,
            name.trim(),
            new Blob(chunksRef.current, { type: mime }),
            privateVoice
          );
          if (activeRef.current) setQueue((rows) => [...rows, job]);
          void uploadJob(job);
        } catch (e) {
          if (activeRef.current) setError((e as Error).message);
        }
      };
      rec.onerror = () => {
        stream?.getTracks().forEach((track) => track.stop());
        try { if (rec.state !== "inactive") rec.stop(); } catch { /* already stopped */ }
        if (activeRef.current)
          setError(
            "Microphone recording failed. Check browser permissions and try again."
          );
      };
      rec.start();
      setRecording(true);
      setRecordingSeconds(0);
      recordingTickRef.current = window.setInterval(
        () => setRecordingSeconds((seconds) => Math.min(30, seconds + 1)),
        1000
      );
      timerRef.current = window.setTimeout(() => stopRecording(), 30_000);
    } catch (e) {
      stream?.getTracks().forEach((t) => t.stop());
      setError((e as Error).message);
    } finally {
      microphoneRequestRef.current = false;
      if (activeRef.current) setMicrophonePending(false);
    }
  }
  function stopRecording() {
    window.clearTimeout(timerRef.current);
    window.clearInterval(recordingTickRef.current);
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    try {
      recorder.stop();
    } catch {
      return;
    }
    setRecording(false);
  }
  const displayDate = wedding.date.toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kuala_Lumpur",
  });
  const pageTitle = `${isGallery ? "Wedding memories gallery" : "Share your wedding memories"} · ${event.name} · ${event.dateLabel}`;
  return (
    <main
      className={`${styles.page} ${styles[event.theme]} ${
        memoryText.className
      }`}
    >
      <Head>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={`Share wedding photos and wishes with Faiz and Harissa. ${MEMORY_HASHTAG}`}
        />
        <meta name="robots" content="noindex,nofollow" />
        <link
          rel="canonical"
          href={memoryCanonicalUrl(side, isGallery ? "gallery" : "")}
        />
      </Head>
      <header className={styles.header}>
        <Link href="/wedding-memories">← All albums</Link>
        <nav>
          <Link href={memoryPath(side, "gallery")}>Gallery</Link>
          <Link href={memoryPath(side, "qr")}>QR card</Link>
        </nav>
      </header>
      {storageNotice && (
        <p role="status" className={styles.status}>
          {storageNotice}
        </p>
      )}
      <section
        className={styles.hero}
        style={
          settings?.cover
            ? {
                backgroundImage: `linear-gradient(0deg, #fffdf8e8, #fffdf8b3), url("${settings.cover}")`,
              }
            : undefined
        }
      >
        <p className={styles.eyebrow}>
          {event.name.toUpperCase()} · {MEMORY_HASHTAG}
        </p>
        <p className={`${styles.couple} ${memoryNames.className}`}>
          {MEMORY_PUBLIC_ALBUMS[side].coupleNames}
        </p>
        <h1 className={memoryTitle.className}>
          {isGallery ? "Our shared memories" : "Help us remember this day"}
        </h1>
        <p>{settings?.welcome || "Share the moments you captured with us."}</p>
        <p className={`${styles.eventDetails} ${memoryTitle.className}`}>
          {displayDate}
          <br />
          {wedding.venue}
        </p>
      </section>
      {isGallery ? (
        <>
          <section className={styles.section}>
            <h2>Photos</h2>
            <div className={styles.galleryFilters}>
              <label>
                View
                <select
                  value={photoView}
                  onChange={(e) =>
                    setPhotoView(e.target.value as typeof photoView)
                  }
                >
                  <option value="all">All photos</option>
                  <option value="my">My photos</option>
                  <option value="favorites">Favourites</option>
                </select>
              </label>
              <label>
                Guest
                <select
                  value={guestFilter}
                  onChange={(e) => setGuestFilter(e.target.value)}
                >
                  <option value="all">All guests</option>
                  {Array.from(new Set(photos.map((photo) => photo.guestName)))
                    .sort()
                    .map((guest) => (
                      <option key={guest} value={guest}>
                        {guest}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            {galleryLoading ? (
              <p role="status" className={styles.muted}>
                Loading photos…
              </p>
            ) : (photoView === "my" ? myPhotos : photos).length ? (
              <div className={styles.grid}>
                {(photoView === "my" ? myPhotos : photos)
                  .filter((p) =>
                    photoView === "favorites"
                      ? favoriteIds.includes(p.id)
                      : true
                  )
                  .filter(
                    (p) => guestFilter === "all" || p.guestName === guestFilter
                  )
                  .map((p) => (
                    <PhotoCard
                      key={p.id}
                      photo={p}
                      side={side}
                      settings={settings}
                      onFavorite={toggleFavorite}
                      favorite={favoriteIds.includes(p.id)}
                    />
                  ))}
              </div>
            ) : (
              <p className={styles.muted}>
                No photos yet. Be the first to share one.
              </p>
            )}
            {(photoView === "my" ? myPhotos : photos).length > 0 &&
              !(photoView === "my" ? myPhotos : photos).some((p) =>
                photoView === "favorites"
                  ? favoriteIds.includes(p.id)
                  : guestFilter === "all" || p.guestName === guestFilter
              ) && (
                <p className={styles.muted}>No photos match these filters.</p>
              )}
            {(photoView === "my" ? myHasMore : hasMore) && (
              <button
                className={styles.secondary}
                disabled={loadingMore}
                onClick={() =>
                  void (photoView === "my" ? loadMoreMyPhotos() : loadMore())
                }
              >
                {loadingMore ? "Loading…" : "Load more photos"}
              </button>
            )}
          </section>
          <section className={styles.section}>
            <h2>Written wishes</h2>
            {wishes.length ? (
              wishes.map((w) => (
                <article className={styles.wish} key={w.id}>
                  <strong>{w.guestName}</strong>
                  <p>{w.message}</p>
                </article>
              ))
            ) : (
              <p className={styles.muted}>No written wishes yet.</p>
            )}
          </section>
          <section className={styles.section}>
            <h2>Voice notes</h2>
            {voices.length ? (
              voices.map((v) => <VoicePlayer key={v.id} voice={v} />)
            ) : (
              <p className={styles.muted}>No public voice notes yet.</p>
            )}
          </section>
        </>
      ) : (
        <>
          <section className={styles.section}>
            <h2>My photos</h2>
            {myPhotos.length ? (
              <div className={styles.grid}>
                {myPhotos.map((photo) => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    side={side}
                    settings={settings}
                    onFavorite={toggleFavorite}
                    favorite={favoriteIds.includes(photo.id)}
                  />
                ))}
              </div>
            ) : (
              <p className={styles.muted}>
                Your uploaded photos will appear here.
              </p>
            )}
          </section>
          <section className={styles.section}>
            <label className={styles.label}>
              Your name
              <input
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name shown in the gallery"
              />
            </label>
            <p className={styles.small}>
              20 photos per celebration. Return in this browser to find your
              photos. {photoCount} of {PHOTO_LIMIT} photo slots used.
            </p>
            <div className={styles.actions}>
              <label className={styles.button}>
                <Upload size={17} /> Choose photos
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={(e) => {
                    Array.from(e.target.files || []).forEach(
                      (f) => void processFile(f)
                    );
                    e.currentTarget.value = "";
                  }}
                />
              </label>
              <button
                className={styles.button}
                disabled={cameraPending || cameraOn}
                onClick={() => void startCamera()}
              >
                <Camera size={17} />{" "}
                {cameraPending
                  ? "Requesting camera…"
                  : cameraOn
                  ? "Camera open"
                  : "Open camera"}
              </button>
            </div>
            {cameraOn && (
              <div className={styles.camera}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  onLoadedMetadata={() =>
                    setCameraReady(
                      Boolean(
                        videoRef.current?.videoWidth &&
                          videoRef.current?.videoHeight
                      )
                    )
                  }
                />
                <button
                  className={styles.button}
                  disabled={!cameraReady}
                  onClick={capture}
                >
                  Take photo
                </button>
                <button className={styles.secondary} onClick={releaseCamera}>
                  Close camera
                </button>
              </div>
            )}
            <p className={styles.small}>
              JPG, PNG, or WebP · up to 12 MB each. Original photos are
              retained.
            </p>
            {queue.length > 0 && (
              <div className={styles.queue}>
                <h3>Upload queue</h3>
                {queue
                  .filter((x) => x.side === side && x.kind === "photo")
                  .map((item) => (
                    <div key={item.id}>
                      <span>
                        Photo {item.slot ?? "pending reservation"} ·{" "}
                        {item.status}
                      </span>
                      {progress[item.id] !== undefined && (
                        <progress value={progress[item.id]} max="100" />
                      )}
                      {item.error && (
                        <span className={styles.error}>{item.error}</span>
                      )}
                      <button
                        disabled={item.status === "Uploading"}
                        onClick={() => void uploadJob(item)}
                      >
                        Retry
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </section>
          <section className={styles.section}>
            <h2>Write a wish</h2>
            <label className={styles.label}>
              Your wish
              <textarea maxLength={2000} value={wish} onChange={(e) => setWish(e.target.value)} placeholder="A message for Faiz and Harissa" />
            </label>
            <p className={styles.small}>{wish.length}/2,000 characters</p>
            <button className={styles.button} onClick={() => void sendWish()}>
              Share wish
            </button>
          </section>
          <section className={styles.section}>
            <h2>Record a voice note</h2>
            <p>
              Record up to 30 seconds. Private notes can only be played by the
              couple in their dashboard.
            </p>
            <label className={styles.check}>
              <input
                type="checkbox"
                checked={privateVoice}
                disabled={recording || microphonePending}
                onChange={(e) => setPrivateVoice(e.target.checked)}
              />{" "}
              Keep this voice note private
            </label>
            <button
              className={styles.button}
              disabled={microphonePending}
              onClick={() =>
                void (recording ? stopRecording() : startRecording())
              }
            >
              <Mic size={17} />
              {microphonePending
                ? "Requesting microphone…"
                : recording
                ? `Stop and send (${30 - recordingSeconds}s left)`
                : "Start recording (30 seconds max)"}
            </button>
            {queue
              .filter((item) => item.side === side && item.kind === "audio")
              .map((item) => (
                <div className={styles.queue} key={item.id}>
                  <span>Voice note · {item.status}</span>
                  {item.error && (
                    <span className={styles.error}>{item.error}</span>
                  )}
                  <button
                    disabled={item.status.includes("Uploading")}
                    onClick={() => void uploadJob(item)}
                  >
                    Retry
                  </button>
                </div>
              ))}
          </section>
          <section className={styles.section}>
            <h2>Salam Kaut</h2>
            <p>
              Send your doa for the couple, or contribute through the existing
              gift page.
            </p>
            {settings?.bankRecipient && (
              <p>
                <strong>Recipient:</strong> {settings.bankRecipient}
                <br />
                <strong>Details:</strong> {settings.bankDetails}
              </p>
            )}
            {settings?.qrUrl && (
              <img
                className={styles.bankQr}
                src={settings.qrUrl}
                alt="Couple’s Salam Kaut contribution QR code"
              />
            )}
            <Link
              className={styles.button}
              href={
                side === "bride"
                  ? "/jemputan-walimatulurus-harissa-faiz?salam=1"
                  : "/jemputan-walimatulurus-faiz-harissa?salam=1"
              }
            >
              Open Salam Kaut
            </Link>
          </section>
        </>
      )}
      {message && (
        <p role="status" className={styles.status}>
          {message}
        </p>
      )}
      {error && (
        <p role="alert" title={error} className={styles.error}>
          {error.includes("permission") || error.includes("insufficient")
            ? "Memories are not active yet. The couple needs to publish Firebase setup first."
            : error}
        </p>
      )}
      <footer>
        {MEMORY_HASHTAG} · Photos are public to anyone with this link.
      </footer>
    </main>
  );
}

function VoicePlayer({ voice }: { voice: MemoryVoice }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    getDownloadURL(ref(getWeddingStorage(), voice.path))
      .then((value) => {
        if (active) { setUrl(value); setError(""); }
      })
      .catch((reason) => {
        if (active) setError(`Could not load this voice note: ${(reason as Error).message}`);
      });
    return () => {
      active = false;
    };
  }, [voice.path, attempt]);
  return (
    <article className={styles.wish}>
      <strong>{voice.guestName}</strong>
      {url && <audio controls preload="none" src={url} onError={() => setError("Audio could not play in this browser. Try downloading the note from the couple.")}/>} 
      {error && <p role="alert" className={styles.error}>{error} <button className={styles.secondary} onClick={() => setAttempt((value) => value + 1)}>Retry</button></p>}
    </article>
  );
}

function PhotoCard({
  photo,
  side,
  settings,
  onFavorite,
  favorite,
}: {
  photo: MemoryPhoto;
  side: "bride" | "groom";
  settings?: MemorySettings;
  onFavorite: (id: string) => void;
  favorite: boolean;
}) {
  const card = useRef<HTMLElement>(null);
  const [nearViewport, setNearViewport] = useState(false);
  const [preview, setPreview] = useState("");
  const [loadError, setLoadError] = useState("");
  const [retryToken, setRetryToken] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const node = card.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      setNearViewport(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setNearViewport(entry.isIntersecting),
      { rootMargin: "250px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [photo.id]);
  useEffect(() => {
    setPreview("");
    setLoadError("");
    if (!nearViewport) return;
    let active = true;
    let source = "";
    const image = new Image();
    getBlob(ref(getWeddingStorage(), photo.originalPath))
      .then((blob) => {
        if (!active) return;
        source = URL.createObjectURL(blob);
        image.decoding = "async";
        image.onload = () => {
          if (!active) return;
          try {
            const canvas = drawStyledPhoto(
              image,
              settings?.film ?? "none",
              settings?.stamp ?? MEMORY_HASHTAG,
              {
                maxDimension: 960,
                photoDate: photo.createdAt?.toDate(),
                coupleNames:
                  MEMORY_PUBLIC_ALBUMS[side].coupleNames,
              }
            );
            setPreview(canvas.toDataURL("image/jpeg", 0.86));
          } catch (error) {
            setLoadError(
              `Could not prepare the photo preview: ${(error as Error).message}`
            );
          }
          image.src = "";
          URL.revokeObjectURL(source);
          source = "";
        };
        image.onerror = () => {
          if (active)
            setLoadError(
              "Could not load this photo. Check the Storage CORS setup or retry later."
            );
          image.src = "";
          if (source) URL.revokeObjectURL(source);
          source = "";
        };
        image.src = source;
      })
      .catch((error) => {
        if (active)
          setLoadError(
            `Could not fetch this photo: ${(error as Error).message}`
          );
      });
    return () => {
      active = false;
      image.src = "";
      if (source) URL.revokeObjectURL(source);
    };
  }, [
    nearViewport,
    retryToken,
    photo.id,
    photo.originalPath,
    photo.createdAt,
    settings?.film,
    settings?.stamp,
    side,
  ]);
  const photoTime = photo.createdAt?.toDate();
  return (
    <article ref={card} className={styles.photoCard}>
      {preview ? (
        <button
          className={styles.photoOpen}
          onClick={() => setOpen(true)}
          aria-label={`Open photo shared by ${photo.guestName}`}
        >
          <img
            src={preview}
            alt={`Photo shared by ${photo.guestName}`}
            loading="lazy"
          />
        </button>
      ) : (
        <div className={styles.placeholder} aria-live="polite">
          {loadError ? (
            <><span>{loadError}</span><button className={styles.secondary} onClick={() => setRetryToken((value) => value + 1)}>Retry photo</button></>
          ) : (
            <ImageIcon aria-hidden="true" />
          )}
        </div>
      )}
      <div className={styles.photoInfo}>
        <strong>{photo.guestName}</strong>
        <button
          aria-label={`${favorite ? "Remove from" : "Add to"} favourites`}
          aria-pressed={favorite}
          onClick={() => onFavorite(photo.id)}
        >
          <Heart fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      {photoTime && (
        <time className={styles.photoTime} dateTime={photoTime.toISOString()}>
          {new Intl.DateTimeFormat("en-MY", {
            dateStyle: "medium",
            timeZone: "Asia/Kuala_Lumpur",
          }).format(photoTime)}
        </time>
      )}
      {open && (
        <PhotoLightbox
          photo={photo}
          side={side}
          settings={settings}
          onClose={() => setOpen(false)}
        />
      )}
    </article>
  );
}

function PhotoLightbox({
  photo,
  side,
  settings,
  onClose,
}: {
  photo: MemoryPhoto;
  side: "bride" | "groom";
  settings?: MemorySettings;
  onClose: () => void;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = `photo-title-${photo.id}`;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusables = () =>
      dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = Array.from(focusables() ?? []);
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    closeRef.current?.focus();
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [photo.id]);
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    getBlob(ref(getWeddingStorage(), photo.originalPath))
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setUrl(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch((reason) => {
        if (active)
          setError(`Could not load this photo: ${(reason as Error).message}`);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photo.originalPath]);
  async function downloadOriginal() {
    try {
      const blob = await getBlob(ref(getWeddingStorage(), photo.originalPath));
      saveBlob(blob, `${photo.id}-original.${extensionFor(photo.contentType)}`);
    } catch (reason) {
      setError(`Original download failed: ${(reason as Error).message}`);
    }
  }
  async function downloadStyled() {
    let objectUrl = "";
    try {
      const blob = await getBlob(ref(getWeddingStorage(), photo.originalPath));
      objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const photoDate = photo.createdAt?.toDate();
      const canvas = drawStyledPhoto(
        image,
        settings?.film ?? "none",
        settings?.stamp ?? MEMORY_HASHTAG,
        {
          photoDate,
          coupleNames: MEMORY_PUBLIC_ALBUMS[side].coupleNames,
        }
      );
      const styled = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) =>
            value
              ? resolve(value)
              : reject(new Error("Could not render styled image.")),
          "image/jpeg",
          0.92
        )
      );
      saveBlob(styled, `${photo.id}-styled.jpg`);
    } catch (reason) {
      setError(`Styled download failed: ${(reason as Error).message}`);
    } finally {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  }
  return (
    <div
      className={styles.lightbox}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={styles.lightboxDialog}
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.srOnly}>
          Photo shared by {photo.guestName}
        </h2>
        <button
          ref={closeRef}
          className={styles.lightboxClose}
          onClick={onClose}
          aria-label="Close photo preview"
        >
          ×
        </button>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {url ? (
          <img src={url} alt={`Full-size photo shared by ${photo.guestName}`} />
        ) : (
          !error && <p role="status">Loading full photo…</p>
        )}
        <div className={styles.lightboxActions}>
          <button
            className={styles.button}
            onClick={() => void downloadOriginal()}
          >
            Download original
          </button>
          <button
            className={styles.secondary}
            onClick={() => void downloadStyled()}
          >
            Download styled photo
          </button>
        </div>
      </div>
    </div>
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
  return contentType === "image/png"
    ? "png"
    : contentType === "image/webp"
    ? "webp"
    : "jpg";
}
