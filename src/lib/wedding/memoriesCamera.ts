export type CameraConstraints = MediaStreamConstraints;
export type MediaStreamRequest = (
  constraints: CameraConstraints
) => Promise<MediaStream>;

export function getCameraCaptureConstraints(
  facing: "environment" | "user"
): CameraConstraints {
  return {
    video: {
      facingMode: { ideal: facing },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
    audio: false,
  };
}

export async function acquireCameraStream(
  request: MediaStreamRequest,
  constraints: CameraConstraints,
  isCurrent: () => boolean
): Promise<MediaStream | undefined> {
  const stream = await request(constraints);
  if (isCurrent()) return stream;
  stopCameraStream(stream);
  return undefined;
}

export function stopCameraStream(stream?: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export class CaptureGate {
  private busy = false;

  get isBusy() {
    return this.busy;
  }

  async run(operation: () => Promise<void>) {
    if (this.busy) return false;
    this.busy = true;
    try {
      await operation();
      return true;
    } finally {
      this.busy = false;
    }
  }
}

export type VideoFrameCallback = (mediaTime: number) => void;
export type VideoFrameSource = {
  currentTime: number;
  requestVideoFrameCallback?: (
    callback: (_now: number, metadata: { mediaTime: number }) => void
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};
export type FrameAnimationHost = {
  requestAnimationFrame: (callback: FrameRequestCallback) => number;
  cancelAnimationFrame: (handle: number) => void;
  setTimeout: (callback: () => void, delay: number) => number;
  clearTimeout: (handle: number) => void;
};

export const VIDEO_FRAME_WATCHDOG_MS = 200;
export const VIDEO_FRAME_FALLBACK_INTERVAL_MS = 32;

/** Prefers decoded frames, then permanently falls back to a paced animation loop if delivery stalls. */
export function scheduleVideoFrames(
  video: VideoFrameSource,
  render: VideoFrameCallback,
  animationHost?: FrameAnimationHost
) {
  const host = animationHost ?? window;
  let disposed = false;
  let usingAnimationFrames = typeof video.requestVideoFrameCallback !== "function";
  let videoFrameHandle: number | null = null;
  let animationFrameHandle: number | null = null;
  let watchdogHandle: number | null = null;
  let lastAnimationRender = Number.NEGATIVE_INFINITY;

  const clearWatchdog = () => {
    if (watchdogHandle === null) return;
    host.clearTimeout(watchdogHandle);
    watchdogHandle = null;
  };

  const onAnimationFrame = (timestamp: number) => {
    if (disposed || !usingAnimationFrames) return;
    try {
      if (timestamp - lastAnimationRender >= VIDEO_FRAME_FALLBACK_INTERVAL_MS) {
        lastAnimationRender = timestamp;
        render(video.currentTime);
      }
    } finally {
      if (!disposed && usingAnimationFrames)
        animationFrameHandle = host.requestAnimationFrame(onAnimationFrame);
    }
  };

  const startAnimationFallback = () => {
    if (disposed || usingAnimationFrames) return;
    usingAnimationFrames = true;
    clearWatchdog();
    if (videoFrameHandle !== null) {
      video.cancelVideoFrameCallback?.(videoFrameHandle);
      videoFrameHandle = null;
    }
    animationFrameHandle = host.requestAnimationFrame(onAnimationFrame);
  };

  if (usingAnimationFrames) {
    animationFrameHandle = host.requestAnimationFrame(onAnimationFrame);
  } else {
    const request = video.requestVideoFrameCallback!.bind(video);
    const armWatchdog = () => {
      clearWatchdog();
      watchdogHandle = host.setTimeout(
        startAnimationFallback,
        VIDEO_FRAME_WATCHDOG_MS
      );
    };
    const onVideoFrame = (_now: number, metadata: { mediaTime: number }) => {
      if (disposed || usingAnimationFrames) return;
      videoFrameHandle = null;
      clearWatchdog();
      try {
        // Treat callback delivery as the signal; don't require mediaTime to be unique.
        render(metadata.mediaTime);
      } finally {
        if (!disposed && !usingAnimationFrames) {
          queueVideoFrame();
        }
      }
    };
    const queueVideoFrame = () => {
      try {
        videoFrameHandle = request(onVideoFrame);
        armWatchdog();
      } catch {
        startAnimationFallback();
      }
    };
    queueVideoFrame();
  }

  return () => {
    if (disposed) return;
    disposed = true;
    clearWatchdog();
    if (videoFrameHandle !== null) {
      video.cancelVideoFrameCallback?.(videoFrameHandle);
      videoFrameHandle = null;
    }
    if (animationFrameHandle !== null) {
      host.cancelAnimationFrame(animationFrameHandle);
      animationFrameHandle = null;
    }
  };
}
