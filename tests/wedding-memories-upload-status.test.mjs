import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = fs.readFileSync(
  "src/lib/wedding/memoriesUploadStatus.ts",
  "utf8"
);
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const module = { exports: {} };
new Function("module", "exports", output)(module, module.exports);
const { getHomeUploadCounts, getPhotoUploadPresentation, getUploadFailure } =
  module.exports;

test("home status reports actual active jobs and keeps mixed failed jobs actionable", () => {
  const counts = getHomeUploadCounts(
    [
      {
        id: "retry-active",
        kind: "photo",
        status: "Needs retry",
        error: "Network error",
      },
      { id: "retry-photo", kind: "photo", status: "Needs retry" },
      {
        id: "retry-audio",
        kind: "audio",
        status: "Preparing voice note",
        errorCode: "storage/unknown",
      },
      { id: "pending", kind: "photo", status: "Uploading photo" },
    ],
    ["retry-active", "unlisted-job"],
    true
  );
  assert.deepEqual(counts, {
    active: { photo: 1, audio: 0 },
    failed: { photo: 1, audio: 1 },
    waiting: { photo: 0, audio: 0 },
    ready: { photo: 1, audio: 0 },
  });
});

test("home status shows in-flight uploads waiting offline alongside prior failures", () => {
  const counts = getHomeUploadCounts(
    [
      { id: "pending", kind: "photo", status: "Uploading photo" },
      { id: "retry-active", kind: "photo", status: "Needs retry" },
      { id: "retry", kind: "audio", status: "Needs retry" },
    ],
    ["retry-active"],
    false
  );
  assert.deepEqual(counts, {
    active: { photo: 0, audio: 0 },
    failed: { photo: 0, audio: 1 },
    waiting: { photo: 2, audio: 0 },
    ready: { photo: 0, audio: 0 },
  });
});

test("upload presentation keeps Firebase permission codes and messages visible", () => {
  const failure = getUploadFailure(
    Object.assign(new Error("Object write was denied."), {
      code: "storage/unauthorized",
    })
  );
  const presentation = getPhotoUploadPresentation(
    { status: "Needs retry", error: failure.message, errorCode: failure.code },
    undefined,
    false,
    true
  );
  assert.equal(
    presentation.error,
    "storage/unauthorized: Object write was denied."
  );
  assert.equal(presentation.status, "Needs retry");
  assert.equal(presentation.retryDisabled, false);
});

test("active upload presentation reports live progress and prevents duplicate retry", () => {
  const presentation = getPhotoUploadPresentation(
    { status: "Uploading photo" },
    40,
    true,
    true
  );
  assert.equal(presentation.progress, 40);
  assert.equal(presentation.status, "Uploading photo");
  assert.equal(presentation.retryLabel, "Uploading…");
  assert.equal(presentation.retryDisabled, true);
});

test("offline approved uploads wait for connection and retain the last error", () => {
  const presentation = getPhotoUploadPresentation(
    {
      status: "Needs retry",
      error: "The network request failed.",
      errorCode: "storage/retry-limit-exceeded",
    },
    18,
    false,
    false
  );
  assert.equal(presentation.status, "Waiting for an internet connection");
  assert.equal(
    presentation.error,
    "storage/retry-limit-exceeded: The network request failed."
  );
  assert.equal(presentation.retryDisabled, true);
  assert.equal(presentation.retryLabel, "Waiting for connection");
});

test("a failed upload becomes retryable once online and clamps progress", () => {
  const presentation = getPhotoUploadPresentation(
    { status: "Needs retry" },
    140,
    false,
    true
  );
  assert.equal(presentation.progress, 100);
  assert.equal(presentation.retryDisabled, false);
  assert.equal(presentation.retryLabel, "Retry upload");
});
