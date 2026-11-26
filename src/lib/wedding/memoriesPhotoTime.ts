export type WeddingPhotoTime = {
  time?: number;
  timeSource: "capture" | "recorded" | "shared" | "unknown";
};

const jpegHeaderLimit = 256 * 1024;
const exifLimit = 65535;
const exifPointer = 0x8769;
const dateTimeOriginal = 0x9003;
const offsetTimeOriginal = 0x9011;
const decoder = new TextDecoder("ascii");

function validTime(value?: number): value is number {
  return typeof value === "number" && value > 0 && value <= 8.64e15;
}

export async function resolveWeddingPhotoTime(
  blob: Blob,
  recordedAt?: number,
  sharedAt?: number
): Promise<WeddingPhotoTime> {
  const capture = await readCaptureTime(blob).catch(() => undefined);
  if (validTime(capture)) return { time: capture, timeSource: "capture" };
  return resolveWeddingPhotoTimeFallback(recordedAt, sharedAt);
}

export function resolveWeddingPhotoTimeFallback(
  recordedAt?: number,
  sharedAt?: number
): WeddingPhotoTime {
  if (validTime(recordedAt))
    return { time: recordedAt, timeSource: "recorded" };
  if (validTime(sharedAt)) return { time: sharedAt, timeSource: "shared" };
  return { timeSource: "unknown" };
}

async function readCaptureTime(blob: Blob) {
  const header = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  if (header[0] === 0xff && header[1] === 0xd8) {
    return jpegCaptureTime(
      new Uint8Array(await blob.slice(0, jpegHeaderLimit).arrayBuffer())
    );
  }
  const png =
    header[0] === 137 && decoder.decode(header.subarray(1, 4)) === "PNG";
  const webp =
    decoder.decode(header.subarray(0, 4)) === "RIFF" &&
    decoder.decode(header.subarray(8, 12)) === "WEBP";
  if (!png && !webp) return undefined;

  let offset = png ? 8 : 12;
  // Read chunk headers without copying the compressed image payload.
  for (let number = 0; number < 128 && offset + 8 <= blob.size; number++) {
    const bytes = await blob.slice(offset, offset + 8).arrayBuffer();
    const size = new DataView(bytes).getUint32(png ? 0 : 4, webp);
    const type = decoder.decode(new Uint8Array(bytes, png ? 4 : 0, 4));
    const end = offset + 8 + size;
    if (end > blob.size || type === "IEND") return undefined;
    if ((png && type === "eXIf") || (webp && type === "EXIF")) {
      if (size > exifLimit) return undefined;
      const exif = new Uint8Array(
        await blob.slice(offset + 8, end).arrayBuffer()
      );
      return parseExif(withoutExifPrefix(exif));
    }
    offset = end + (png ? 4 : size % 2);
  }
  return undefined;
}

function withoutExifPrefix(bytes: Uint8Array) {
  return decoder.decode(bytes.subarray(0, 6)) === "Exif\0\0"
    ? bytes.subarray(6)
    : bytes;
}

function jpegCaptureTime(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9 || offset + 2 > bytes.length) break;
    const size = view.getUint16(offset);
    const end = offset + size;
    if (size < 2 || end > bytes.length) break;
    if (marker === 0xe1) {
      const segment = bytes.subarray(offset + 2, end);
      const exif = withoutExifPrefix(segment);
      if (exif !== segment) {
        const capture = parseExif(exif);
        if (capture !== undefined) return capture;
      }
    }
    offset = end;
  }
  return undefined;
}

function parseExif(bytes: Uint8Array) {
  if (bytes.length < 8) return undefined;
  const order = decoder.decode(bytes.subarray(0, 2));
  if (order !== "II" && order !== "MM") return undefined;
  const little = order === "II";
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint16(2, little) !== 42) return undefined;

  function entry(directory: number, tag: number) {
    if (directory < 8 || directory + 2 > bytes.length) return undefined;
    const count = view.getUint16(directory, little);
    if (directory + 2 + count * 12 > bytes.length) return undefined;
    for (
      let position = directory + 2;
      position < directory + 2 + count * 12;
      position += 12
    ) {
      if (view.getUint16(position, little) === tag) return position;
    }
    return undefined;
  }

  function ascii(directory: number, tag: number, expected: number) {
    const position = entry(directory, tag);
    if (
      position === undefined ||
      view.getUint16(position + 2, little) !== 2 ||
      view.getUint32(position + 4, little) !== expected
    )
      return undefined;
    const start = view.getUint32(position + 8, little);
    if (start + expected > bytes.length || bytes[start + expected - 1] !== 0)
      return undefined;
    return decoder.decode(bytes.subarray(start, start + expected - 1));
  }

  const pointer = entry(view.getUint32(4, little), exifPointer);
  if (
    pointer === undefined ||
    view.getUint16(pointer + 2, little) !== 4 ||
    view.getUint32(pointer + 4, little) !== 1
  )
    return undefined;
  const exif = view.getUint32(pointer + 8, little);
  const date = ascii(exif, dateTimeOriginal, 20);
  const offset = ascii(exif, offsetTimeOriginal, 7);
  if (!date || !offset) return undefined;
  const parts = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(date);
  if (!parts || !/^[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)$/.test(offset))
    return undefined;
  const [, year, month, day, hour, minute, second] = parts;
  const wallTime = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
  const utc = new Date(`${wallTime}Z`);
  if (
    !Number.isFinite(utc.getTime()) ||
    !utc.toISOString().startsWith(wallTime)
  )
    return undefined;
  return Date.parse(`${wallTime}${offset}`);
}
