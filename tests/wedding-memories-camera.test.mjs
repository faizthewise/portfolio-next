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
  PHOTO_FILM_PRESETS,
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

function makeAnimationHost() {
  let clock = 0;
  let nextFrame = 0;
  let nextTimer = 0;
  const frames = new Map();
  const timers = new Map();
  const cancelledFrames = [];
  return {
    frames,
    timers,
    cancelledFrames,
    requestAnimationFrame(callback) {
      const handle = ++nextFrame;
      frames.set(handle, callback);
      return handle;
    },
    cancelAnimationFrame(handle) { cancelledFrames.push(handle); },
    setTimeout(callback, delay) {
      const handle = ++nextTimer;
      timers.set(handle, { callback, due: clock + delay });
      return handle;
    },
    clearTimeout(handle) { timers.delete(handle); },
    now() { return clock; },
    advance(milliseconds) {
      const target = clock + milliseconds;
      while (true) {
        const next = [...timers.entries()]
          .filter(([, timer]) => timer.due <= target)
          .sort((a, b) => a[1].due - b[1].due)[0];
        if (!next) break;
        const [handle, timer] = next;
        timers.delete(handle);
        clock = timer.due;
        timer.callback();
      }
      clock = target;
    },
    fireFrame(handle, timestamp) { frames.get(handle)?.(timestamp); },
  };
}

function makeDecodedVideo() {
  let next = 0;
  const callbacks = new Map();
  const cancelled = [];
  return {
    source: {
      currentTime: 0,
      requestVideoFrameCallback(callback) {
        const handle = ++next;
        callbacks.set(handle, callback);
        return handle;
      },
      cancelVideoFrameCallback(handle) { cancelled.push(handle); },
    },
    callbacks,
    cancelled,
  };
}

test("rVFC renders repeated mediaTime callbacks and stays cadence-driven while healthy", () => {
  const host = makeAnimationHost();
  const video = makeDecodedVideo();
  const frames = [];
  const dispose = scheduleVideoFrames(video.source, (time) => frames.push(time), host);
  video.callbacks.get(1)(0, { mediaTime: 1 / 30 });
  host.advance(150);
  video.callbacks.get(2)(150, { mediaTime: 1 / 30 });
  assert.deepEqual(frames, [1 / 30, 1 / 30], "rVFC delivery is the signal even if mediaTime repeats");
  assert.equal(host.frames.size, 0, "healthy rVFC does not start a parallel animation loop");
  host.advance(199);
  assert.equal(host.frames.size, 0);
  dispose();
  assert.equal(host.timers.size, 0);
  video.callbacks.get(3)?.(400, { mediaTime: 2 / 30 });
  assert.equal(frames.length, 2, "late callbacks after disposal are ignored");
});

test("missing rVFC delivery triggers paced rAF and draws with a static currentTime", () => {
  const host = makeAnimationHost();
  const video = makeDecodedVideo();
  const frames = [];
  const dispose = scheduleVideoFrames(video.source, (time) => frames.push(time), host);
  host.advance(199);
  assert.equal(host.frames.size, 0);
  host.advance(1);
  assert.deepEqual(video.cancelled, [1]);
  host.fireFrame(1, 200);
  host.fireFrame(2, 216);
  host.fireFrame(3, 232);
  assert.deepEqual(frames, [0, 0], "rAF fallback does not require currentTime to advance");
  dispose();
  assert.deepEqual(host.cancelledFrames, [4]);
  assert.equal(host.timers.size, 0);
  video.callbacks.get(1)(264, { mediaTime: 0.25 });
  assert.equal(video.callbacks.size, 1, "a late decoded-frame callback cannot restart its chain");
  host.fireFrame(4, 264);
  assert.deepEqual(frames, [0, 0]);
});

test("one rVFC frame followed by a stall falls back without waiting on a changed media clock", () => {
  const host = makeAnimationHost();
  const video = makeDecodedVideo();
  const frames = [];
  const dispose = scheduleVideoFrames(video.source, (time) => frames.push(time), host);
  video.callbacks.get(1)(0, { mediaTime: 0.04 });
  assert.deepEqual(frames, [0.04]);
  host.advance(200);
  assert.deepEqual(video.cancelled, [2]);
  host.fireFrame(1, 200);
  assert.deepEqual(frames, [0.04, 0]);
  dispose();
});

test("no-rVFC fallback is paced near 30fps and tears down synchronously", () => {
  const host = makeAnimationHost();
  const video = { currentTime: 0 };
  const frames = [];
  let dispose;
  dispose = scheduleVideoFrames(video, (time) => {
    frames.push(time);
    dispose();
  }, host);
  host.fireFrame(1, 0);
  assert.deepEqual(frames, [0]);
  assert.deepEqual(host.cancelledFrames, [1]);
  assert.equal(host.frames.size, 1, "cleanup inside render does not schedule another RAF");

  const host2 = makeAnimationHost();
  const staticFrames = [];
  const cleanup = scheduleVideoFrames(video, (time) => staticFrames.push(time), host2);
  host2.fireFrame(1, 0);
  host2.fireFrame(2, 16);
  host2.fireFrame(3, 32);
  host2.fireFrame(4, 48);
  assert.deepEqual(staticFrames, [0, 0], "static currentTime still redraws at the paced cadence");
  cleanup();
  assert.deepEqual(host2.cancelledFrames, [5]);
});

test("disposing an rVFC scheduler during render cancels its watchdog and reschedules nothing", () => {
  const host = makeAnimationHost();
  const video = makeDecodedVideo();
  let dispose;
  dispose = scheduleVideoFrames(video.source, () => dispose(), host);
  video.callbacks.get(1)(0, { mediaTime: 1 / 30 });
  assert.equal(video.callbacks.size, 1, "render cleanup stops the next rVFC request");
  assert.equal(host.timers.size, 0, "render cleanup clears the watchdog");
  assert.deepEqual(video.cancelled, []);
});

test("disposing before the first rVFC frame clears the watchdog and ignores its stale timer", () => {
  const host = makeAnimationHost();
  const video = makeDecodedVideo();
  const dispose = scheduleVideoFrames(video.source, () => assert.fail("must not render"), host);
  const staleWatchdog = [...host.timers.values()][0].callback;
  dispose();
  assert.equal(host.timers.size, 0);
  assert.deepEqual(video.cancelled, [1]);
  staleWatchdog();
  assert.equal(host.frames.size, 0, "a timer already queued at cleanup cannot start fallback");
});

function makeMockWebGL({ failCompile = false } = {}) {
  const calls = [];
  const uploads = [];
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
    texImage2D(...args) {
      calls.push(["texImage2D", ...args]);
      uploads.push(args.at(-1)?.pixelVersion);
    },
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
  return { canvas, gl, calls, listeners, uploads };
}

test("WebGL live preview reuses its texture and refreshes it with each live video frame", () => {
  const mock = makeMockWebGL();
  const preview = createCameraWebGLPreview(mock.canvas);
  assert.ok(preview);
  const video = { videoWidth: 640, videoHeight: 480, pixelVersion: 1 };
  const frame = getCameraFrameGeometry(390, 844);
  preview.render(video, frame, "fp2");
  video.pixelVersion = 2;
  preview.render(video, frame, "fv5");
  video.pixelVersion = 3;
  video.videoWidth = 1280;
  video.videoHeight = 720;
  preview.render(video, frame, "fv5");
  assert.equal(mock.calls.filter(([name]) => name === "createProgram").length, 1);
  assert.equal(mock.calls.filter(([name]) => name === "createBuffer").length, 1);
  assert.equal(mock.calls.filter(([name]) => name === "createTexture").length, 1);
  assert.equal(mock.calls.filter(([name]) => name === "texImage2D").length, 3);
  assert.equal(mock.calls.filter(([name]) => name === "texSubImage2D").length, 0);
  assert.deepEqual(mock.uploads, [1, 2, 3], "each draw uploads the current video buffer into the existing texture");
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
    () => preview.render({ videoWidth: 640, videoHeight: 480 }, getCameraFrameGeometry(640, 480), "fs16"),
    /context was lost/
  );
  preview.dispose();
  assert.ok(CAMERA_FILM_FRAGMENT_SHADER.includes("filmTone"));
  assert.deepEqual(PHOTO_FILM_PRESETS.map((preset) => preset.id), ["none", "fp2", "fs16", "fv5"]);
  for (const index of [1, 2, 3])
    assert.ok(CAMERA_FILM_FRAGMENT_SHADER.includes(`u_film == ${index}`));
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
