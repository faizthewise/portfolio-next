import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { test } from "node:test";

const source = fs.readFileSync("src/lib/wedding/memoriesCamera.ts", "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiled = { exports: {} };
new Function("module", "exports", code)(compiled, compiled.exports);
const { acquireCameraStream, CaptureGate } = compiled.exports;
const renderSource = fs.readFileSync("src/lib/wedding/memoriesRender.ts", "utf8");
const renderCode = ts.transpileModule(renderSource, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const renderModule = { exports: {} };
new Function("module", "exports", renderCode)(renderModule, renderModule.exports);
const {
  getCameraFrameGeometry,
  renderCameraFrame,
  renderCameraFrameInto,
} = renderModule.exports;

test("a camera permission that resolves after close stops every late track", async () => {
  let resolveRequest;
  let active = true;
  let stopped = 0;
  const stream = {
    getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }],
  };
  const pending = acquireCameraStream(
    () => new Promise((resolve) => (resolveRequest = resolve)),
    { video: true, audio: false },
    () => active
  );
  active = false;
  resolveRequest(stream);
  assert.equal(await pending, undefined);
  assert.equal(stopped, 2);
});

test("shutter/save gates reject duplicate concurrent operations", async () => {
  const gate = new CaptureGate();
  let finish;
  let executions = 0;
  const pending = gate.run(
    () => new Promise((resolve) => {
      executions++;
      finish = resolve;
    })
  );
  assert.equal(gate.isBusy, true);
  assert.equal(await gate.run(async () => { executions++; }), false);
  assert.equal(executions, 1);
  finish();
  assert.equal(await pending, true);
  assert.equal(gate.isBusy, false);
  assert.equal(await gate.run(async () => { executions++; }), true);
  assert.equal(executions, 2);
});

test("immersive live, frozen-review, and saved frames use the current viewport crop", () => {
  const cases = [
    [375, 667, 405, 720, 900, 1600],
    [390, 844, 333, 720, 739, 1600],
    [844, 390, 720, 333, 1600, 739],
    [1440, 900, 720, 450, 1600, 1000],
  ];
  const drawCalls = [];
  const previousDocument = globalThis.document;
  const makeCanvas = (width, height) => {
    const context = {
      save() {},
      restore() {},
      clearRect() {},
      drawImage(...args) { drawCalls.push({ width, height, args }); },
    };
    return { width, height, getContext: () => context };
  };
  globalThis.document = { createElement: () => makeCanvas(1, 1) };
  const frozenFrame = { width: 1600, height: 900 };
  try {
    const options = {
      film: "none",
      stamp: "",
      capturedAt: 1730000000000,
      coupleNames: "Harissa & Faiz",
      includeStamp: false,
    };
    for (const [width, height, previewWidth, previewHeight, captureWidth, captureHeight] of cases) {
      const frame = getCameraFrameGeometry(width, height);
      assert.equal(frame.aspectRatio, width / height);
      assert.equal(frame.previewWidth, previewWidth);
      assert.equal(frame.previewHeight, previewHeight);
      assert.equal(frame.captureWidth, captureWidth);
      assert.equal(frame.captureHeight, captureHeight);
      assert.ok(Math.max(frame.previewWidth, frame.previewHeight) <= 720);
      assert.equal(Math.max(frame.captureWidth, frame.captureHeight), 1600);

      const preview = makeCanvas(frame.previewWidth, frame.previewHeight);
      renderCameraFrameInto(frozenFrame, preview, frame, options);
      const saved = renderCameraFrame(frozenFrame, frame, options);
      const previewCall = drawCalls.at(-2);
      const savedCall = drawCalls.at(-1);
      assert.equal(previewCall.args[0], frozenFrame);
      assert.equal(savedCall.args[0], frozenFrame);
      assert.deepEqual(previewCall.args.slice(1, 5), savedCall.args.slice(1, 5));
      assert.equal(saved.width, captureWidth);
      assert.equal(saved.height, captureHeight);
    }
    const firstPortraitCrop = drawCalls[0].args.slice(1, 5);
    const lastLandscapeCrop = drawCalls.at(-1).args.slice(1, 5);
    assert.notDeepEqual(firstPortraitCrop, lastLandscapeCrop);
  } finally {
    globalThis.document = previousDocument;
  }
});
