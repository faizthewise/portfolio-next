import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = fs.readFileSync("src/lib/wedding/memoriesUploadStatus.ts", "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const module = { exports: {} };
new Function("module", "exports", output)(module, module.exports);
const { getPhotoUploadPresentation, getUploadFailure } = module.exports;

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
  assert.equal(presentation.error, "storage/unauthorized: Object write was denied.");
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
  assert.equal(presentation.error, "storage/retry-limit-exceeded: The network request failed.");
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
