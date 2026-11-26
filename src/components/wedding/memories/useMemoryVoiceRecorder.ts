import { useCallback, useEffect, useRef, useState } from "react";
import { AUDIO_MAX_SECONDS } from "@/lib/wedding/memories";

export const VOICE_LIMIT_SECONDS = AUDIO_MAX_SECONDS;
const limitMs = VOICE_LIMIT_SECONDS * 1000;
const maxBytes = 4 * 1024 * 1024;
const recorderTimeoutMs = 5000;
const waveformSamples = 18;
const audioTypes = [
  "audio/webm;codecs=opus",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/webm",
];

const interrupted =
  "Your recording was interrupted. Tap the microphone to try again.";
const invalid =
  "We couldn't save any playable audio. Please record your message again.";
const unavailable =
  "Voice recording isn't available in this browser. Try another browser or device.";

export type VoicePhase =
  | "idle"
  | "requesting"
  | "recording"
  | "finalizing"
  | "review";

export type VoiceRecording = {
  blob: Blob;
  url: string;
  durationMs: number;
};

type Capture = {
  tracks?: MediaStreamTrack[];
  recorder?: MediaRecorder;
  audioContext?: AudioContext;
  startedAt?: number;
  durationMs?: number;
  timeout?: number;
  monitor?: number;
  removeTrackListeners?: () => void;
  releasePreview?: () => void;
};

function releaseCapture(capture: Capture) {
  window.clearInterval(capture.monitor);
  window.clearTimeout(capture.timeout);
  capture.releasePreview?.();
  capture.releasePreview = undefined;
  capture.removeTrackListeners?.();
  capture.removeTrackListeners = undefined;
  if (capture.recorder) {
    const recorder = capture.recorder;
    recorder.onstart = null;
    recorder.ondataavailable = null;
    recorder.onstop = null;
    recorder.onerror = null;
    if (recorder.state !== "inactive") {
      try {
        recorder.stop();
      } catch {
        // The recording may already have ended.
      }
    }
    capture.recorder = undefined;
  }
  capture.tracks?.forEach((track) => track.stop());
  capture.tracks = undefined;
  if (capture.audioContext && capture.audioContext.state !== "closed") {
    void capture.audioContext.close().catch(() => undefined);
  }
  capture.audioContext = undefined;
}

function recordingError(reason: unknown) {
  const name = (reason as { name?: string } | null)?.name;
  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Please allow microphone access in your browser settings and try again.";
    case "NotFoundError":
    case "DevicesNotFoundError":
      return "No microphone was found. Connect a microphone and try again.";
    case "NotReadableError":
    case "TrackStartError":
      return "Your microphone couldn't be opened. Check whether another app is using it and try again.";
    default:
      return "The microphone couldn't start. Check your microphone and try again.";
  }
}

function amplitudeMonitor(capture: Capture, stream: MediaStream) {
  if (typeof window.AudioContext !== "function") return;

  try {
    const context = new AudioContext();
    capture.audioContext = context;
    const analyser = context.createAnalyser();
    analyser.fftSize = 1024;
    context.createMediaStreamSource(stream).connect(analyser);
    if (context.state === "suspended") {
      void context.resume().catch(() => undefined);
    }
    const samples = new Uint8Array(analyser.fftSize);
    return () => {
      if (context.state !== "running") return;
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (let index = 0; index < samples.length; index++) {
        energy += ((samples[index] - 128) / 128) ** 2;
      }
      return Math.sqrt(energy / samples.length);
    };
  } catch {
    // Recording remains available when audio analysis is unsupported.
    return undefined;
  }
}

export function useMemoryVoiceRecorder(): {
  phase: VoicePhase;
  elapsedMs: number;
  levels: readonly number[];
  recording?: VoiceRecording;
  error?: string;
  start: () => void;
  stop: () => void;
  reset: () => void;
} {
  const [phase, setPhase] = useState<VoicePhase>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [levels, setLevels] = useState<readonly number[]>([]);
  const [recording, setRecording] = useState<VoiceRecording>();
  const [error, setError] = useState<string>();
  const captureRef = useRef<Capture>();
  const reviewUrlRef = useRef<string>();

  const cleanup = useCallback(() => {
    const capture = captureRef.current;
    captureRef.current = undefined;
    if (capture) releaseCapture(capture);
    if (reviewUrlRef.current) {
      URL.revokeObjectURL(reviewUrlRef.current);
      reviewUrlRef.current = undefined;
    }
  }, []);

  const reset = useCallback(() => {
    cleanup();
    setPhase("idle");
    setElapsedMs(0);
    setLevels([]);
    setRecording(undefined);
    setError(undefined);
  }, [cleanup]);

  const fail = useCallback(
    (capture: Capture, message: string) => {
      if (captureRef.current !== capture) return;
      reset();
      setError(message);
    },
    [reset]
  );

  useEffect(() => {
    function handleVisibilityChange() {
      const capture = captureRef.current;
      if (document.visibilityState === "hidden" && capture?.recorder) {
        fail(capture, interrupted);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cleanup();
    };
  }, [cleanup, fail]);

  const stop = useCallback(() => {
    const capture = captureRef.current;
    if (
      !capture ||
      capture.startedAt === undefined ||
      capture.durationMs !== undefined ||
      capture.recorder?.state !== "recording"
    ) {
      return;
    }

    const elapsed = performance.now() - capture.startedAt;
    if (elapsed > limitMs + 500) {
      fail(capture, interrupted);
      return;
    }
    capture.durationMs = Math.min(elapsed, limitMs);
    window.clearTimeout(capture.timeout);
    window.clearInterval(capture.monitor);
    capture.timeout = window.setTimeout(
      () => fail(capture, interrupted),
      recorderTimeoutMs
    );
    setElapsedMs(capture.durationMs);
    setPhase("finalizing");
    try {
      capture.recorder.stop();
    } catch {
      fail(capture, interrupted);
    }
  }, [fail]);

  function start() {
    if (captureRef.current || reviewUrlRef.current) return;
    setError(undefined);
    const devices = navigator.mediaDevices;
    if (
      !devices?.getUserMedia ||
      typeof window.MediaRecorder?.isTypeSupported !== "function"
    ) {
      setError(unavailable);
      return;
    }
    const mime = audioTypes.find((type) => MediaRecorder.isTypeSupported(type));
    if (!mime) {
      setError(unavailable);
      return;
    }

    const capture: Capture = {};
    captureRef.current = capture;
    setPhase("requesting");

    void (async () => {
      try {
        const stream = await devices.getUserMedia({ audio: true });
        const tracks = stream.getTracks();
        if (captureRef.current !== capture) {
          tracks.forEach((track) => track.stop());
          return;
        }
        capture.tracks = tracks;
        if (document.visibilityState === "hidden") {
          fail(capture, interrupted);
          return;
        }
        if (
          !stream.getAudioTracks().some((track) => track.readyState === "live")
        ) {
          fail(
            capture,
            "No microphone was found. Connect a microphone and try again."
          );
          return;
        }

        const handleTrackEnded = () => fail(capture, interrupted);
        tracks.forEach((track) =>
          track.addEventListener("ended", handleTrackEnded)
        );
        capture.removeTrackListeners = () => {
          tracks.forEach((track) =>
            track.removeEventListener("ended", handleTrackEnded)
          );
        };

        const recorder = new MediaRecorder(stream, { mimeType: mime });
        capture.recorder = recorder;
        const samples = amplitudeMonitor(capture, stream);
        const chunks: Blob[] = [];

        recorder.onstart = () => {
          if (captureRef.current !== capture) return;
          window.clearTimeout(capture.timeout);
          capture.startedAt = performance.now();
          setPhase("recording");
          capture.timeout = window.setTimeout(stop, limitMs);
          capture.monitor = window.setInterval(() => {
            if (
              captureRef.current !== capture ||
              capture.startedAt === undefined
            )
              return;
            setElapsedMs(
              Math.min(performance.now() - capture.startedAt, limitMs)
            );
            const amplitude = samples?.();
            if (amplitude !== undefined) {
              setLevels((previous) => [
                ...previous.slice(1 - waveformSamples),
                amplitude,
              ]);
            }
          }, 80);
        };
        recorder.ondataavailable = ({ data }) => {
          if (data.size) chunks.push(data);
        };
        recorder.onerror = () => fail(capture, interrupted);

        // MediaRecorder delivers the final dataavailable event before stop.
        recorder.onstop = () => {
          if (captureRef.current !== capture) return;
          const durationMs = capture.durationMs;
          if (durationMs === undefined) {
            fail(capture, interrupted);
            return;
          }

          releaseCapture(capture);

          const blob = new Blob(chunks, { type: mime });
          if (!blob.size || durationMs <= 0) {
            fail(capture, invalid);
            return;
          }
          if (blob.size > maxBytes) {
            fail(
              capture,
              "Your recording is too large. Try a shorter message."
            );
            return;
          }

          try {
            const preview = document.createElement("audio");
            const url = URL.createObjectURL(blob);
            reviewUrlRef.current = url;
            capture.releasePreview = () => {
              preview.onloadedmetadata = null;
              preview.onerror = null;
              preview.removeAttribute("src");
              preview.load();
            };
            preview.onloadedmetadata = () => {
              if (captureRef.current !== capture) return;
              const metadataMs = preview.duration * 1000;
              if (
                metadataMs !== Infinity &&
                (!Number.isFinite(metadataMs) ||
                  metadataMs <= 0 ||
                  metadataMs > limitMs + 500)
              ) {
                fail(capture, invalid);
                return;
              }
              // Streaming containers can report Infinity even for complete clips.
              const actualMs = Number.isFinite(metadataMs)
                ? Math.min(metadataMs, limitMs)
                : durationMs;
              releaseCapture(capture);
              captureRef.current = undefined;
              setElapsedMs(actualMs);
              setRecording({ blob, url, durationMs: actualMs });
              setPhase("review");
            };
            preview.onerror = () => fail(capture, invalid);
            preview.preload = "metadata";
            capture.timeout = window.setTimeout(
              () => fail(capture, invalid),
              recorderTimeoutMs
            );
            preview.src = url;
          } catch {
            fail(capture, invalid);
          }
        };

        capture.timeout = window.setTimeout(
          () => fail(capture, "Recording couldn't start. Please try again."),
          recorderTimeoutMs
        );
        recorder.start();
      } catch (reason) {
        fail(capture, recordingError(reason));
      }
    })();
  }

  return { phase, elapsedMs, levels, recording, error, start, stop, reset };
}
