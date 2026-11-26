import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

const mod = { exports: {} };
const output = ts.transpileModule(
  fs.readFileSync("src/lib/wedding/memoriesPhotoTime.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }
).outputText;
new Function("module", "exports", output)(mod, mod.exports);
const { resolveWeddingPhotoTime } = mod.exports;

function exif(date, offset) {
  const bytes = Buffer.alloc(84);
  bytes.write("II");
  bytes.writeUInt16LE(42, 2);
  bytes.writeUInt32LE(8, 4);
  bytes.writeUInt16LE(1, 8);
  bytes.writeUInt16LE(0x8769, 10);
  bytes.writeUInt16LE(4, 12);
  bytes.writeUInt32LE(1, 14);
  bytes.writeUInt32LE(26, 18);
  bytes.writeUInt16LE(offset ? 2 : 1, 26);
  bytes.writeUInt16LE(0x9003, 28);
  bytes.writeUInt16LE(2, 30);
  bytes.writeUInt32LE(20, 32);
  bytes.writeUInt32LE(54, 36);
  bytes.write(date, 54);
  if (offset) {
    bytes.writeUInt16LE(0x9011, 40);
    bytes.writeUInt16LE(2, 42);
    bytes.writeUInt32LE(7, 44);
    bytes.writeUInt32LE(74, 48);
    bytes.write(offset, 74);
  }
  return bytes;
}

function jpeg(payload) {
  const header = Buffer.from([0xff, 0xd8, 0xff, 0xe1, 0, 0]);
  header.writeUInt16BE(payload.length + 8, 4);
  return new Blob([
    header,
    Buffer.from("Exif\0\0"),
    payload,
    Buffer.from([0xff, 0xd9]),
  ]);
}

function png(payload) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(payload.length);
  return new Blob([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    length,
    Buffer.from("eXIf"),
    payload,
    Buffer.alloc(4),
  ]);
}

function webp(payload) {
  const length = Buffer.alloc(4);
  length.writeUInt32LE(payload.length);
  return new Blob([
    Buffer.from("RIFF"),
    Buffer.alloc(4),
    Buffer.from("WEBPEXIF"),
    length,
    payload,
  ]);
}

test("explicit EXIF offset wins over the recorded and shared dates in supported files", async () => {
  const metadata = exif("2026:11:26 11:35:00", "+07:00");
  for (const blob of [jpeg(metadata), png(metadata), webp(metadata)]) {
    assert.deepEqual(await resolveWeddingPhotoTime(blob, 1000, 2000), {
      time: Date.parse("2026-11-26T04:35:00Z"),
      timeSource: "capture",
    });
  }
});

test("dates without explicit offsets, impossible dates and malformed EXIF use proven fallbacks", async () => {
  const ambiguous = jpeg(exif("2026:11:26 11:35:00"));
  const impossible = jpeg(exif("2026:02:31 11:35:00", "+08:00"));
  const malformed = jpeg(Buffer.from("invalid"));
  assert.deepEqual(await resolveWeddingPhotoTime(ambiguous, 1000, 2000), {
    time: 1000,
    timeSource: "recorded",
  });
  assert.deepEqual(await resolveWeddingPhotoTime(impossible, undefined, 2000), {
    time: 2000,
    timeSource: "shared",
  });
  assert.deepEqual(await resolveWeddingPhotoTime(malformed, NaN, undefined), {
    timeSource: "unknown",
  });
});
