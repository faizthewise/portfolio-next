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
const {
  canResumePhotoUpload,
  getHomeUploadCounts,
  getPhotoUploadState,
  getUploadFailure,
} = module.exports;

const photo = new Blob(["fixture"], { type: "image/png" });
const status = (phase) => ({ status: phase, blob: photo });

test("home counts use the same actual photo phases as Album", () => {
  const counts = getHomeUploadCounts(
    [
      { id: "active", kind: "photo", ...status("Checking photo") },
      { id: "stale", kind: "photo", ...status("Checking photo") },
      { id: "pending", kind: "photo", ...status("Saved on this device") },
      { id: "missing", kind: "photo", status: "Uploading photo" },
      { id: "voice", kind: "audio", status: "Needs retry" },
    ],
    ["active"],
    true
  );
  assert.deepEqual(counts, {
    active: { photo: 1, audio: 0 },
    failed: { photo: 2, audio: 1 },
    waiting: { photo: 0, audio: 0 },
    ready: { photo: 1, audio: 0 },
  });
});

test("a durable Checking photo phase only looks active with a live task", () => {
  const job = status("Checking photo");
  const active = getPhotoUploadState(job, 34, true, true);
  assert.deepEqual(active, {
    group: "active",
    status: "Preparing your photo…",
  });
  const stale = getPhotoUploadState(job, 34, false, true);
  assert.equal(stale.group, "attention");
  assert.equal(stale.status, "Upload interrupted");
  assert.equal(stale.canRetry, true);
  assert.equal(stale.progress, undefined);
  assert.equal(canResumePhotoUpload(job), true);
});

test("confirmed transfer bytes enter an indeterminate acknowledgement stage", () => {
  assert.deepEqual(
    getPhotoUploadState(status("Uploading photo"), 41, true, true),
    {
      group: "active",
      status: "Uploading…",
      progress: 41,
    }
  );
  for (const args of [
    ["Uploading photo", 100],
    ["Confirming photo upload", undefined],
  ]) {
    assert.deepEqual(
      getPhotoUploadState(status(args[0]), args[1], true, true),
      {
        group: "active",
        status: "Confirming upload…",
      }
    );
  }
});

test("failed jobs keep safe guest copy and diagnostics without automatic permission retries", () => {
  const failure = getUploadFailure(
    Object.assign(new Error("denied at secret path"), {
      code: "storage/unauthorized",
    })
  );
  const job = {
    ...status("Needs retry"),
    error: failure.message,
    errorCode: failure.code,
  };
  const display = getPhotoUploadState(job, 40, false, true);
  assert.equal(display.status, "Couldn’t upload");
  assert.equal(display.canRetry, true);
  assert.equal(display.progress, undefined);
  assert.ok(!JSON.stringify(display).includes("secret path"));
  assert.equal(failure.code, "storage/unauthorized");
  assert.equal(canResumePhotoUpload(job), false);
});

test("offline and missing-media states stay separate from recoverable failures", () => {
  const network = {
    ...status("Needs retry"),
    errorCode: "storage/retry-limit-exceeded",
  };
  assert.equal(
    getPhotoUploadState(network, 52, false, false).status,
    "Waiting for connection"
  );
  assert.equal(
    getPhotoUploadState(status("Uploading photo"), 52, true, false).canRetry,
    undefined
  );
  assert.equal(canResumePhotoUpload(network), true);
  const missing = { status: "Checking photo" };
  const display = getPhotoUploadState(missing, undefined, false, true);
  assert.equal(display.status, "Photo unavailable");
  assert.equal(display.canRetry, undefined);
  assert.ok(!display.detail.includes("Saved on this device"));
  assert.equal(canResumePhotoUpload(missing), false);
});
