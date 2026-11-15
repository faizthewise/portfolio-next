export type CameraConstraints = MediaStreamConstraints;
export type MediaStreamRequest = (
  constraints: CameraConstraints
) => Promise<MediaStream>;

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
