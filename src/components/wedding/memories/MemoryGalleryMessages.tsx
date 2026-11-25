import { getDownloadURL, ref } from "firebase/storage";
import { Mic, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getWeddingStorage } from "@/lib/wedding/firebase";
import type { MemoryVoice, MemoryWish } from "@/lib/wedding/memories";
import styles from "./MemoryGalleryMessages.module.css";

type MessageProps = {
  status: "loading" | "ready" | "error";
  onRetry: () => void;
  onContribute: () => void;
};

const dateFormat = new Intl.DateTimeFormat("en-MY", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Asia/Kuala_Lumpur",
});

function Attribution({
  guestName,
  createdAt,
}: Pick<MemoryWish, "guestName" | "createdAt">) {
  const initials = guestName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0])
    .join("")
    .toLocaleUpperCase();
  const date = createdAt?.toDate();
  return (
    <div className={styles.attribution}>
      <span aria-hidden="true" className={styles.initials}>
        {initials}
      </span>
      <div>
        <strong>{guestName}</strong>
        {date && Number.isFinite(date.getTime()) && (
          <time dateTime={date.toISOString()}>{dateFormat.format(date)}</time>
        )}
      </div>
    </div>
  );
}

function MessageState({
  title,
  description,
  action,
  onAction,
}: {
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className={styles.state}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && (
        <button type="button" className={styles.action} onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

export function MemoryGalleryWishes({
  wishes,
  status,
  onRetry,
  onContribute,
}: MessageProps & { wishes: readonly MemoryWish[] }) {
  return (
    <section
      className={styles.section}
      aria-labelledby="gallery-wishes-heading"
    >
      <header className={styles.intro}>
        <h2 id="gallery-wishes-heading">Words to keep</h2>
        <p>A little love from our favourite people.</p>
      </header>
      {status === "loading" && (
        <p role="status" className={styles.loading}>
          Loading wishes…
        </p>
      )}
      {status === "error" && (
        <MessageState
          title="We couldn’t load the wishes"
          description="Please try again."
          action="Retry"
          onAction={onRetry}
        />
      )}
      {status === "ready" &&
        (wishes.length ? (
          <>
            <div className={styles.cards}>
              {wishes.map((wish) => (
                <figure key={wish.id} className={styles.wish}>
                  <span aria-hidden="true" className={styles.quote}>
                    “
                  </span>
                  <blockquote>{wish.message}</blockquote>
                  <figcaption>
                    <Attribution {...wish} />
                  </figcaption>
                </figure>
              ))}
            </div>
            <button
              type="button"
              className={styles.contribute}
              onClick={onContribute}
            >
              Leave a wish
            </button>
          </>
        ) : (
          <MessageState
            title="Every love story needs a few words."
            description="Be the first to leave a heartfelt wish for the newlyweds."
            action="Write a wish"
            onAction={onContribute}
          />
        ))}
    </section>
  );
}

type PlaybackStatus =
  | "idle"
  | "loading"
  | "paused"
  | "playing"
  | "buffering"
  | "error"
  | "unavailable"
  | "unsupported";
type Playback = {
  status: PlaybackStatus;
  elapsed?: number;
  duration?: number;
  range?: { start: number; end: number };
};
const idle: Playback = { status: "idle" };
const startTimeout = 15000;

function releasePlayback(audio: HTMLAudioElement) {
  audio.pause();
  audio.removeAttribute("src");
  audio.load();
}

function formatTime(seconds: number) {
  if (seconds > 0 && seconds < 1)
    return `0:00.${Math.max(1, Math.floor(seconds * 10))}`;
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function readPlayback(
  audio: HTMLAudioElement,
  ended = false
): Omit<Playback, "status"> {
  if (audio.readyState < HTMLMediaElement.HAVE_METADATA) return {};
  const elapsed = audio.currentTime;
  const duration =
    Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : ended && elapsed > 0
      ? elapsed
      : undefined;
  // One range control can represent a contiguous interval without promising
  // that the browser can seek across gaps or an unbounded live timeline.
  const seekable = audio.seekable;
  const range =
    duration && seekable.length === 1 && seekable.end(0) > seekable.start(0)
      ? { start: seekable.start(0), end: Math.min(duration, seekable.end(0)) }
      : undefined;
  return {
    elapsed,
    duration,
    range: range && range.end > range.start ? range : undefined,
  };
}

export function MemoryGalleryVoices(
  props: MessageProps & {
    voices: readonly MemoryVoice[];
    suspendPlayback?: boolean;
  }
) {
  const {
    voices,
    status,
    onRetry,
    onContribute,
    suspendPlayback = false,
  } = props;
  return (
    <section className={styles.section} aria-labelledby="gallery-voice-heading">
      <header className={styles.intro}>
        <h2 id="gallery-voice-heading">Voices we&apos;ll treasure</h2>
        <p>Messages that bring us back to this day.</p>
      </header>
      {status === "loading" && (
        <p role="status" className={styles.loading}>
          Loading voice notes…
        </p>
      )}
      {status === "error" && (
        <MessageState
          title="We couldn’t load the voice notes"
          description="Please try again."
          action="Retry"
          onAction={onRetry}
        />
      )}
      {status === "ready" &&
        (voices.length ? (
          <>
            <VoiceNotes voices={voices} suspendPlayback={suspendPlayback} />
            <button
              type="button"
              className={styles.contribute}
              onClick={onContribute}
            >
              <Mic size={17} aria-hidden="true" /> Record a message
            </button>
          </>
        ) : (
          <MessageState
            title="Let your voice become a memory."
            description="Leave a little message for the newlyweds to listen to long after today."
            action="Record a message"
            onAction={onContribute}
          />
        ))}
    </section>
  );
}

function VoiceNotes({
  voices,
  suspendPlayback,
}: {
  voices: readonly MemoryVoice[];
  suspendPlayback: boolean;
}) {
  const player = useRef<HTMLAudioElement>(null);
  const active = useRef<{ id: string; path: string; source?: string }>();
  const session = useRef({ request: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [playbacks, setPlaybacks] = useState<Record<string, Playback>>({});

  function setPlayback(
    id: string,
    status: PlaybackStatus,
    time?: Omit<Playback, "status">
  ) {
    setPlaybacks((previous) => ({
      ...previous,
      [id]: { ...previous[id], ...time, status },
    }));
  }

  useEffect(() => {
    const audio = player.current;
    const playbackSession = session.current;
    return () => {
      playbackSession.request++;
      active.current = undefined;
      clearTimeout(timer.current);
      if (audio) releasePlayback(audio);
    };
  }, []);

  useEffect(() => {
    const record = active.current;
    if (
      !record ||
      voices.some(({ id, path }) => id === record.id && path === record.path)
    )
      return;
    session.current.request++;
    active.current = undefined;
    clearTimeout(timer.current);
    if (player.current) releasePlayback(player.current);
    setPlaybacks((previous) => ({ ...previous, [record.id]: idle }));
  }, [voices]);

  useEffect(() => {
    const record = active.current;
    const audio = player.current;
    if (!suspendPlayback || !record || !audio) return;
    session.current.request++;
    clearTimeout(timer.current);
    audio.pause();
    if (!record.source) active.current = undefined;
    setPlaybacks((previous) => ({
      ...previous,
      [record.id]: record.source
        ? { ...previous[record.id], status: "paused" }
        : idle,
    }));
  }, [suspendPlayback]);

  function hasSource(audio: HTMLAudioElement) {
    const source = active.current?.source;
    return Boolean(source && audio.currentSrc === source);
  }

  function fail(
    audio: HTMLAudioElement,
    status: "error" | "unavailable" | "unsupported",
    error: unknown
  ) {
    const record = active.current;
    if (!record) return;
    console.warn("[Wedding Memories] Voice playback failed", {
      id: record.id,
      error,
    });
    session.current.request++;
    active.current = undefined;
    clearTimeout(timer.current);
    releasePlayback(audio);
    setPlayback(record.id, status);
  }

  function watchForStall(audio: HTMLAudioElement) {
    clearTimeout(timer.current);
    const attempt = session.current.request;
    timer.current = setTimeout(() => {
      if (attempt === session.current.request)
        fail(audio, "error", new Error("Voice playback timed out."));
    }, startTimeout);
  }

  async function play(voice: MemoryVoice) {
    const audio = player.current;
    if (!audio || suspendPlayback) return;
    if (active.current?.id === voice.id && !audio.paused) {
      audio.pause();
      return;
    }
    const resume =
      active.current?.id === voice.id && Boolean(active.current.source);
    const attempt = ++session.current.request;
    if (!resume) {
      if (active.current) {
        const previous = active.current;
        setPlayback(previous.id, "idle", {
          elapsed: undefined,
          duration: undefined,
          range: undefined,
        });
        releasePlayback(audio);
      }
      active.current = { id: voice.id, path: voice.path };
    }
    setPlayback(
      voice.id,
      "loading",
      resume
        ? undefined
        : { elapsed: undefined, duration: undefined, range: undefined }
    );
    watchForStall(audio);
    try {
      if (!resume) {
        const url = await getDownloadURL(ref(getWeddingStorage(), voice.path));
        if (attempt !== session.current.request || !active.current) return;
        audio.src = url;
        active.current.source = audio.src;
      }
      await audio.play();
    } catch (error) {
      if (attempt !== session.current.request) return;
      if (
        (error as Error)?.name === "NotAllowedError" &&
        active.current?.source
      ) {
        clearTimeout(timer.current);
        setPlayback(voice.id, "paused", readPlayback(audio));
        return;
      }
      const code = (error as { code?: string })?.code;
      fail(
        audio,
        code === "storage/object-not-found"
          ? "unavailable"
          : (error as Error)?.name === "NotSupportedError"
          ? "unsupported"
          : "error",
        error
      );
    }
  }

  function sync(
    audio: HTMLAudioElement,
    status?: PlaybackStatus,
    ended = false
  ) {
    if (!active.current || !hasSource(audio)) return;
    const id = active.current.id;
    const time = readPlayback(audio, ended);
    setPlaybacks((previous) => ({
      ...previous,
      [id]: {
        ...previous[id],
        ...time,
        duration: time.duration ?? previous[id]?.duration,
        status: status ?? previous[id]?.status ?? "idle",
      },
    }));
  }

  return (
    <div className={styles.cards}>
      <audio
        ref={player}
        hidden
        preload="none"
        onLoadedMetadata={(event) => sync(event.currentTarget)}
        onDurationChange={(event) => sync(event.currentTarget)}
        onProgress={(event) => sync(event.currentTarget)}
        onTimeUpdate={(event) => sync(event.currentTarget)}
        onPlaying={(event) => {
          if (!hasSource(event.currentTarget)) return;
          clearTimeout(timer.current);
          sync(event.currentTarget, "playing");
        }}
        onWaiting={(event) => {
          if (event.currentTarget.paused || !hasSource(event.currentTarget))
            return;
          sync(event.currentTarget, "buffering");
          watchForStall(event.currentTarget);
        }}
        onPause={(event) => {
          if (!event.currentTarget.paused || !hasSource(event.currentTarget))
            return;
          clearTimeout(timer.current);
          sync(event.currentTarget, "paused");
        }}
        onEnded={(event) => {
          if (!hasSource(event.currentTarget)) return;
          clearTimeout(timer.current);
          sync(event.currentTarget, "paused", true);
        }}
        onError={(event) => {
          const audio = event.currentTarget;
          if (!hasSource(audio) || !audio.error) return;
          fail(
            audio,
            audio.error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
              ? "unsupported"
              : "error",
            audio.error
          );
        }}
      />
      {voices.map((voice) => {
        const playback = playbacks[voice.id] ?? idle;
        const { status, elapsed, duration, range } = playback;
        const busy = status === "loading" || status === "buffering";
        const playing = status === "playing" || status === "buffering";
        const error =
          status === "error" ||
          status === "unavailable" ||
          status === "unsupported";
        return (
          <article key={voice.id} className={styles.voice}>
            <Attribution {...voice} />
            {error ? (
              <div className={styles.playError}>
                <p role="alert">
                  <strong>
                    {status === "unavailable"
                      ? "This message is no longer available"
                      : "Unable to play this message"}
                  </strong>
                  {status === "unsupported" && (
                    <span>Try opening the album in a different browser.</span>
                  )}
                </p>
                {status === "error" && (
                  <button
                    type="button"
                    className={styles.action}
                    onClick={() => void play(voice)}
                  >
                    Retry
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.player}>
                <button
                  type="button"
                  className={styles.play}
                  disabled={status === "loading"}
                  aria-label={`${playing ? "Pause" : "Play"} voice note from ${
                    voice.guestName
                  }`}
                  onClick={() => void play(voice)}
                >
                  {playing ? (
                    <Pause size={19} aria-hidden="true" />
                  ) : (
                    <Play size={19} aria-hidden="true" />
                  )}
                </button>
                <div className={styles.timeline}>
                  {range ? (
                    <input
                      type="range"
                      min={range.start}
                      max={range.end}
                      value={Math.max(
                        range.start,
                        Math.min(elapsed ?? range.start, range.end)
                      )}
                      step={0.1}
                      aria-label={`Seek voice note from ${voice.guestName}`}
                      aria-valuetext={formatTime(elapsed ?? range.start)}
                      onChange={(event) => {
                        const audio = player.current;
                        if (!audio || active.current?.id !== voice.id) return;
                        audio.currentTime = Number(event.currentTarget.value);
                        sync(audio);
                      }}
                    />
                  ) : duration ? (
                    <progress
                      aria-label="Playback progress"
                      max={duration}
                      value={elapsed ?? 0}
                    />
                  ) : (
                    <span aria-hidden="true" className={styles.track} />
                  )}
                  <div className={styles.timing}>
                    {elapsed !== undefined && (
                      <span aria-label="Elapsed time">
                        {formatTime(elapsed)}
                      </span>
                    )}
                    {busy && (
                      <span role="status">
                        {status === "buffering"
                          ? "Buffering…"
                          : "Loading audio…"}
                      </span>
                    )}
                    {duration !== undefined && (
                      <span aria-label="Duration">{formatTime(duration)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
