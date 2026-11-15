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
const {
  acquireCameraStream,
  CaptureGate,
  getCameraCaptureConstraints,
  scheduleVideoFrames,
} = compiled.exports;
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
  renderPhotoStampLayer,
  createCameraWebGLPreview,
  CAMERA_FILM_FRAGMENT_SHADER,
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

test("camera asks for modest 1280x720 media at up to thirty frames per second", () => {
  assert.deepEqual(getCameraCaptureConstraints("environment"), {
    video: {
      facingMode: { ideal: "environment" },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
    },
    audio: false,
  });
});

test("video frame scheduler uses decoded frames, skips duplicates, and cancels cleanly", () => {
  let callbackId = 0;
  const callbacks = new Map();
  let cancelled = 0;
  const video = {
    currentTime: 0,
    requestVideoFrameCallback(callback) {
      const id = ++callbackId;
      callbacks.set(id, callback);
      return id;
    },
    cancelVideoFrameCallback(id) {
      cancelled = id;
    },
  };
  const mediaTimes = [];
  const dispose = scheduleVideoFrames(video, (time) => mediaTimes.push(time));
  const first = callbacks.get(1);
  first(0, { mediaTime: 1 / 30 });
  callbacks.get(2)(34, { mediaTime: 1 / 30 });
  callbacks.get(3)(67, { mediaTime: 2 / 30 });
  assert.deepEqual(mediaTimes, [1 / 30, 2 / 30]);
  dispose();
  assert.equal(cancelled, 4);
  callbacks.get(4)(100, { mediaTime: 3 / 30 });
  assert.deepEqual(mediaTimes, [1 / 30, 2 / 30], "no render runs after cancellation");
});

test("rAF scheduler fallback draws only when currentTime advances and ignores late callbacks", () => {
  const pending = new Map();
  let id = 0;
  let cancelled = 0;
  const animationHost = {
    requestAnimationFrame(callback) {
      const handle = ++id;
      pending.set(handle, callback);
      return handle;
    },
    cancelAnimationFrame(handle) { cancelled = handle; },
  };
  const video = { currentTime: 0 };
  const frames = [];
  const dispose = scheduleVideoFrames(video, (time) => frames.push(time), animationHost);
  pending.get(1)(16);
  pending.get(2)(32);
  video.currentTime = 1 / 30;
  pending.get(3)(48);
  assert.deepEqual(frames, [0, 1 / 30]);
  dispose();
  assert.equal(cancelled, 4);
  pending.get(4)(64);
  assert.deepEqual(frames, [0, 1 / 30]);
});

test("scheduler does not enqueue another callback when cleanup happens inside render", () => {
  const decodedCallbacks = new Map();
  let decodedId = 0;
  let decodedCancelled = 0;
  const decodedVideo = {
    currentTime: 0,
    requestVideoFrameCallback(callback) {
      const handle = ++decodedId;
      decodedCallbacks.set(handle, callback);
      return handle;
    },
    cancelVideoFrameCallback(handle) { decodedCancelled = handle; },
  };
  let cancelDecoded;
  cancelDecoded = scheduleVideoFrames(decodedVideo, () => cancelDecoded());
  decodedCallbacks.get(1)(0, { mediaTime: 1 / 30 });
  assert.equal(decodedCallbacks.size, 1);
  assert.equal(decodedCancelled, 1);

  const rafCallbacks = new Map();
  let rafId = 0;
  let rafCancelled = 0;
  const host = {
    requestAnimationFrame(callback) {
      const handle = ++rafId;
      rafCallbacks.set(handle, callback);
      return handle;
    },
    cancelAnimationFrame(handle) { rafCancelled = handle; },
  };
  let cancelRaf;
  cancelRaf = scheduleVideoFrames({ currentTime: 1 }, () => cancelRaf(), host);
  rafCallbacks.get(1)(16);
  assert.equal(rafCallbacks.size, 1);
  assert.equal(rafCancelled, 1);
});

function makeMockWebGL({ failCompile = false } = {}) {
  const calls = [];
  let lost = false;
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    ARRAY_BUFFER: 5, STATIC_DRAW: 6, TEXTURE_2D: 7, TEXTURE_WRAP_S: 8,
    TEXTURE_WRAP_T: 9, CLAMP_TO_EDGE: 10, TEXTURE_MIN_FILTER: 11,
    TEXTURE_MAG_FILTER: 12, LINEAR: 13, UNPACK_FLIP_Y_WEBGL: 14,
    TEXTURE0: 15, RGBA: 16, UNSIGNED_BYTE: 17, FLOAT: 18,
    TRIANGLE_STRIP: 19,
    createShader(type) { calls.push(["createShader", type]); return { type }; },
    shaderSource(shader, source) { calls.push(["shaderSource", shader.type, source]); },
    compileShader() { calls.push(["compileShader"]); },
    getShaderParameter() { return !failCompile; },
    getShaderInfoLog() { return "scripted compile error"; },
    deleteShader(shader) { calls.push(["deleteShader", shader]); },
    createProgram() { calls.push(["createProgram"]); return {}; },
    attachShader() { calls.push(["attachShader"]); },
    linkProgram() { calls.push(["linkProgram"]); },
    getProgramParameter() { return true; },
    getProgramInfoLog() { return "scripted link error"; },
    deleteProgram() { calls.push(["deleteProgram"]); },
    createBuffer() { calls.push(["createBuffer"]); return {}; },
    deleteBuffer() { calls.push(["deleteBuffer"]); },
    createTexture() { calls.push(["createTexture"]); return {}; },
    deleteTexture() { calls.push(["deleteTexture"]); },
    bindBuffer() {}, bufferData() {}, bindTexture() {}, texParameteri() {},
    pixelStorei() {}, useProgram() {}, enableVertexAttribArray() {},
    vertexAttribPointer() {}, getAttribLocation(_program, name) { return name === "a_position" ? 0 : 1; },
    getUniformLocation(_program, name) { return name; },
    uniform1i(...args) { calls.push(["uniform1i", ...args]); },
    uniform4fv(...args) { calls.push(["uniform4fv", ...args]); },
    activeTexture() {}, viewport() {},
    texImage2D(...args) { calls.push(["texImage2D", ...args]); },
    texSubImage2D(...args) { calls.push(["texSubImage2D", ...args]); },
    drawArrays(...args) { calls.push(["drawArrays", ...args]); },
    readPixels() { calls.push(["readPixels"]); throw new Error("GPU path must not read pixels"); },
    isContextLost() { return lost; },
    set lost(value) { lost = value; },
    get calls() { return calls; },
  };
  const listeners = new Map();
  const canvas = {
    width: 720,
    height: 450,
    getContext(name) { return name === "webgl" || name === "experimental-webgl" ? gl : null; },
    addEventListener(name, callback) { listeners.set(name, callback); },
    removeEventListener(name) { listeners.delete(name); },
    fire(name, event) { listeners.get(name)?.(event); },
  };
  return { canvas, gl, calls, listeners };
}

test("WebGL live preview reuses GPU resources, reallocates changed video dimensions, and never reads pixels", () => {
  const mock = makeMockWebGL();
  const preview = createCameraWebGLPreview(mock.canvas);
  assert.ok(preview);
  const video = { videoWidth: 640, videoHeight: 480 };
  const frame = getCameraFrameGeometry(390, 844);
  preview.render(video, frame, "classic-chrome");
  preview.render(video, frame, "acros");
  video.videoWidth = 1280;
  video.videoHeight = 720;
  preview.render(video, frame, "acros");
  assert.equal(mock.calls.filter(([name]) => name === "createProgram").length, 1);
  assert.equal(mock.calls.filter(([name]) => name === "createBuffer").length, 1);
  assert.equal(mock.calls.filter(([name]) => name === "createTexture").length, 1);
  assert.equal(mock.calls.filter(([name]) => name === "texImage2D").length, 2);
  assert.equal(mock.calls.filter(([name]) => name === "texSubImage2D").length, 1);
  assert.equal(mock.calls.filter(([name]) => name === "drawArrays").length, 3);
  assert.equal(mock.calls.filter(([name]) => name === "readPixels").length, 0);
  preview.dispose();
  preview.dispose();
  assert.equal(mock.calls.filter(([name]) => name === "deleteProgram").length, 1);
  assert.throws(() => preview.render(video, frame, "acros"), /disposed/);
});

test("WebGL compile/context-loss failures are observable and can fall back", () => {
  const broken = makeMockWebGL({ failCompile: true });
  assert.equal(createCameraWebGLPreview(broken.canvas), null);
  const mock = makeMockWebGL();
  let lost = 0;
  const preview = createCameraWebGLPreview(mock.canvas, () => lost++);
  assert.ok(preview);
  mock.canvas.fire("webglcontextlost", { preventDefault() {} });
  assert.equal(lost, 1);
  mock.gl.lost = true;
  assert.throws(
    () => preview.render({ videoWidth: 640, videoHeight: 480 }, getCameraFrameGeometry(640, 480), "classic-neg"),
    /context was lost/
  );
  preview.dispose();
  assert.ok(CAMERA_FILM_FRAGMENT_SHADER.includes("filmTone"));
  assert.ok(CAMERA_FILM_FRAGMENT_SHADER.includes("u_film == 4"));
  const throwingCanvas = {
    getContext() { throw new Error("context unavailable"); },
  };
  assert.equal(createCameraWebGLPreview(throwingCanvas), null);
});

test("transparent stamp helper paints only the imprint layer without pixel processing", () => {
  const commands = [];
  let font = "700 10px monospace";
  const context = {
    save() { commands.push("save"); },
    restore() { commands.push("restore"); },
    clearRect() { commands.push("clearRect"); },
    set fillStyle(value) { commands.push(["fillStyle", value]); },
    set shadowColor(value) { commands.push(["shadowColor", value]); },
    set shadowBlur(value) { commands.push(["shadowBlur", value]); },
    set textAlign(value) { commands.push(["textAlign", value]); },
    set textBaseline(value) { commands.push(["textBaseline", value]); },
    set font(value) { font = value; },
    get font() { return font; },
    translate(...args) { commands.push(["translate", ...args]); },
    rotate(...args) { commands.push(["rotate", ...args]); },
    measureText(value) { return { width: Array.from(value).length * Number.parseFloat(font.match(/([\d.]+)px/)[1]) * 0.6 }; },
    fillText(value) { commands.push(["fillText", value]); },
  };
  const canvas = { width: 360, height: 640, getContext: () => context };
  const layout = renderPhotoStampLayer(canvas, {
    film: "none",
    stamp: "#Live",
    capturedAt: 1794719714000,
    coupleNames: "Harissa & Faiz",
    aspectRatio: 9 / 16,
    stampAspectRatio: 9 / 16,
  });
  assert.equal(layout.orientation, "portrait");
  assert.equal(commands.filter((command) => command === "clearRect").length, 1);
  assert.ok(commands.some((command) => Array.isArray(command) && command[0] === "fillText"));
  assert.ok(!commands.includes("getImageData") && !commands.includes("putImageData"));
  assert.equal(commands.filter((command) => command === "save").length, commands.filter((command) => command === "restore").length);
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
