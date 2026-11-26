import { Lock, Mic, Pause, Play, Square, Users } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  ContributionActions,
  ContributionPrimary,
  ContributionSecondary,
} from "./MemoryContributionSheet";
import {
  VOICE_LIMIT_SECONDS,
  type useMemoryVoiceRecorder,
  type VoiceRecording,
} from "./useMemoryVoiceRecorder";
import styles from "./MemoryVoiceContribution.module.css";

type Props = {
  recorder: ReturnType<typeof useMemoryVoiceRecorder>;
  coupleNames: string;
  isPrivate: boolean;
  busy?: boolean;
  destinationLocked?: boolean;
  active?: boolean;
  onVisibilityChange: (isPrivate: boolean) => void;
  onRecordAgain: () => void;
  onShare: () => void;
};

function formatTime(seconds: number) {
  const wholeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = String(Math.floor(wholeSeconds / 60)).padStart(2, "0");
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function RecordingControl({
  recorder,
  disabled,
}: {
  recorder: Props["recorder"];
  disabled: boolean;
}) {
  const { elapsedMs, levels, phase, start, stop } = recorder;
  const recording = phase === "recording";
  const requesting = phase === "requesting";
  const finalizing = phase === "finalizing";
  const elapsed = Math.min(elapsedMs / 1000, VOICE_LIMIT_SECONDS);
  const remaining = Math.ceil(VOICE_LIMIT_SECONDS - elapsed);
  const status = recording
    ? "Recording"
    : requesting
    ? "Waiting for microphone access…"
    : finalizing
    ? "Getting your recording ready…"
    : "";
  const instructionId = useId();
  const liveLevels = recording ? levels : [];
  const barCount = Math.max(18, liveLevels.length);
  const bars = Array.from({ length: barCount }, (_, index) => {
    const level = liveLevels[index + liveLevels.length - barCount] ?? 0;
    return 2 + Math.sqrt(Math.min(1, Math.max(0, level))) * 30;
  });

  return (
    <div className={styles.recorder}>
      <p className={styles.recordingStatus} aria-hidden="true">
        {recording && (
          <span className={styles.recordingDot} aria-hidden="true" />
        )}
        {status}
      </p>
      <p className={styles.timer}>
        <span className={styles.screenReaderOnly}>Elapsed time </span>
        {formatTime(elapsed)}
      </p>
      <div className={styles.waveform} aria-hidden="true">
        {bars.map((height, index) => (
          <span key={index} style={{ height: `${height}px` }} />
        ))}
      </div>
      <div className={styles.recordingRing}>
        <button
          type="button"
          className={styles.recordingButton}
          aria-label={recording ? "Stop recording" : "Start recording"}
          aria-describedby={instructionId}
          disabled={disabled || requesting || finalizing}
          onClick={recording ? stop : start}
        >
          {recording ? (
            <Square size={21} fill="currentColor" aria-hidden="true" />
          ) : (
            <Mic size={29} aria-hidden="true" />
          )}
        </button>
      </div>
      <div className={styles.instructions} id={instructionId}>
        {!requesting && !finalizing && (
          <p>{recording ? "Tap to stop" : "Tap to record"}</p>
        )}
        <p className={styles.durationInfo}>
          {recording
            ? `${remaining} ${remaining === 1 ? "second" : "seconds"} remaining`
            : `Up to ${VOICE_LIMIT_SECONDS} seconds`}
        </p>
      </div>
    </div>
  );
}

function RecordingPlayback({
  recording,
  active,
}: {
  recording: VoiceRecording;
  active: boolean;
}) {
  const playerRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const [seekEnd, setSeekEnd] = useState(0);

  useEffect(() => {
    const player = playerRef.current;
    if (!active) player?.pause();
    return () => player?.pause();
  }, [active]);

  const duration = mediaDuration || recording.durationMs / 1000;
  const canSeek = !failed && seekEnd > 0;

  function syncPlayback(player: HTMLAudioElement) {
    if (Number.isFinite(player.duration) && player.duration > 0) {
      setMediaDuration(player.duration);
    }
    setCurrentTime(player.currentTime);
    setSeekEnd(
      player.seekable.length > 0
        ? player.seekable.end(player.seekable.length - 1)
        : 0
    );
  }

  function togglePlayback() {
    const player = playerRef.current;
    if (!player || !active) return;
    if (!player.paused) {
      player.pause();
      return;
    }

    setFailed(false);
    if (player.error) player.load();
    void player.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setFailed(true);
      }
    });
  }

  function seek(seconds: number) {
    const player = playerRef.current;
    if (!player || !canSeek) return;
    try {
      player.currentTime = seconds;
      setCurrentTime(player.currentTime);
    } catch {
      setSeekEnd(0);
    }
  }

  const progress = Math.min(currentTime, duration);
  const displayTime =
    duration < 1
      ? (seconds: number) =>
          `${Math.min(999, Math.round(seconds * 1000)) / 1000} s`
      : formatTime;
  const durationText = displayTime(duration);
  const progressText = displayTime(progress);

  return (
    <section className={styles.review}>
      <div className={styles.reviewHeading}>
        <h3>Your message</h3>
        <span>
          <span className={styles.screenReaderOnly}>Duration </span>
          {durationText}
        </span>
      </div>
      <div className={styles.player}>
        <audio
          ref={playerRef}
          src={recording.url}
          preload="metadata"
          onLoadedMetadata={(event) => syncPlayback(event.currentTarget)}
          onDurationChange={(event) => syncPlayback(event.currentTarget)}
          onProgress={(event) => syncPlayback(event.currentTarget)}
          onTimeUpdate={(event) => syncPlayback(event.currentTarget)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={(event) => {
            setPlaying(false);
            syncPlayback(event.currentTarget);
          }}
          onError={() => {
            setPlaying(false);
            setFailed(true);
          }}
        />
        <button
          type="button"
          className={styles.playButton}
          disabled={!active}
          aria-label={playing ? "Pause message" : "Play message"}
          onClick={togglePlayback}
        >
          {playing ? (
            <Pause size={17} fill="currentColor" aria-hidden="true" />
          ) : (
            <Play size={17} fill="currentColor" aria-hidden="true" />
          )}
        </button>
        <div className={styles.playbackProgress}>
          {canSeek ? (
            <input
              type="range"
              className={styles.seek}
              min={0}
              max={Math.min(duration, seekEnd)}
              step="any"
              value={Math.min(progress, seekEnd)}
              disabled={!active}
              aria-label="Seek within your message"
              aria-valuetext={`${progressText} of ${durationText}`}
              onChange={(event) => seek(event.currentTarget.valueAsNumber)}
            />
          ) : (
            <progress
              className={styles.progress}
              aria-label="Message playback progress"
              max={duration || 1}
              value={progress}
            />
          )}
          <div className={styles.playbackTimes} aria-hidden="true">
            <span>{progressText}</span>
            <span>{durationText}</span>
          </div>
        </div>
      </div>
      {failed && (
        <p className={styles.playbackError} role="alert">
          Your message couldn&apos;t be played. Try playing it again or record a
          new message.
        </p>
      )}
    </section>
  );
}

export function MemoryVoiceContribution({
  recorder,
  coupleNames,
  isPrivate,
  busy = false,
  destinationLocked = false,
  active = true,
  onVisibilityChange,
  onRecordAgain,
  onShare,
}: Props) {
  const radioName = useId();
  const recording =
    recorder.phase === "review" ? recorder.recording : undefined;
  const phaseAnnouncement = {
    idle: "",
    requesting: "Waiting for microphone access…",
    recording: "Recording started.",
    finalizing: "Getting your recording ready…",
    review: "Your message is ready to review.",
  }[recorder.phase];
  const visibility = [
    {
      isPrivate: false,
      icon: Users,
      label: "Share with everyone",
      details: "Anyone with the album link",
    },
    {
      isPrivate: true,
      icon: Lock,
      label: "Just for the couple",
      details: `A private message to ${coupleNames}`,
    },
  ];

  return (
    <div className={styles.content}>
      <span className={styles.screenReaderOnly} role="status">
        {busy ? "Sharing your message…" : phaseAnnouncement}
      </span>
      {recording ? (
        <div className={styles.reviewActions}>
          <RecordingPlayback
            key={recording.url}
            recording={recording}
            active={active && !busy}
          />
          {!destinationLocked && (
            <ContributionSecondary
              disabled={!active || busy}
              onClick={onRecordAgain}
            >
              Record again
            </ContributionSecondary>
          )}
        </div>
      ) : (
        <RecordingControl recorder={recorder} disabled={!active || busy} />
      )}
      <fieldset
        className={styles.visibility}
        disabled={!active || busy || destinationLocked}
      >
        <legend>Who can listen?</legend>
        <div className={styles.visibilityOptions}>
          {visibility.map((option) => {
            const Icon = option.icon;
            const id = `${radioName}-${
              option.isPrivate ? "private" : "shared"
            }`;
            return (
              <label key={id} className={styles.visibilityOption}>
                <input
                  type="radio"
                  name={radioName}
                  checked={isPrivate === option.isPrivate}
                  aria-labelledby={`${id}-label`}
                  aria-describedby={`${id}-details`}
                  onChange={() => onVisibilityChange(option.isPrivate)}
                />
                <Icon size={18} aria-hidden="true" />
                <span>
                  <strong id={`${id}-label`}>{option.label}</strong>
                  <span id={`${id}-details`}>{option.details}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
      {recording && (
        <ContributionActions>
          <ContributionPrimary disabled={!active || busy} onClick={onShare}>
            {busy ? "Sharing your message…" : "Share message"}
          </ContributionPrimary>
        </ContributionActions>
      )}
    </div>
  );
}
