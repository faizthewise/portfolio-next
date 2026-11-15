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
};

/** Uses decoded video frames when available and avoids repainting duplicate frames in the rAF fallback. */
export function scheduleVideoFrames(
  video: VideoFrameSource,
  render: VideoFrameCallback,
  animationHost?: FrameAnimationHost
) {
  let disposed = false;
  let lastMediaTime = Number.NaN;
  let handle = 0;
  const useVideoFrames = typeof video.requestVideoFrameCallback === "function";

  const deliver = (mediaTime: number) => {
    if (disposed || mediaTime === lastMediaTime) return;
    lastMediaTime = mediaTime;
    render(mediaTime);
  };

  if (useVideoFrames) {
    const request = video.requestVideoFrameCallback!.bind(video);
    const onFrame = (_now: number, metadata: { mediaTime: number }) => {
      if (disposed) return;
      deliver(metadata.mediaTime);
      if (!disposed) handle = request(onFrame);
    };
    handle = request(onFrame);
    return () => {
      disposed = true;
      video.cancelVideoFrameCallback?.(handle);
    };
  }

  const host = animationHost ?? window;
  const onAnimationFrame = () => {
    if (disposed) return;
    deliver(video.currentTime);
    if (!disposed) handle = host.requestAnimationFrame(onAnimationFrame);
  };
  handle = host.requestAnimationFrame(onAnimationFrame);
  return () => {
    disposed = true;
    host.cancelAnimationFrame(handle);
  };
}
