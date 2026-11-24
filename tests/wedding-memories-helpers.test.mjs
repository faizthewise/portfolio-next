import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { test, after } from "node:test";
import "fake-indexeddb/auto";
import ts from "typescript";
import { initializeApp, deleteApp } from "firebase/app";
import * as firestore from "firebase/firestore";
import * as storage from "firebase/storage";

if (
  process.env.FIRESTORE_EMULATOR_HOST !== "127.0.0.1:8088" ||
  process.env.FIREBASE_STORAGE_EMULATOR_HOST !== "127.0.0.1:9199"
) {
  throw new Error(
    "Run memories helper tests against demo-wedding loopback Firestore and Storage emulators only."
  );
}
const require = createRequire(process.cwd() + "/package.json");
const apps = [];
const baseUid = `helper-${Date.now()}-${randomUUID()}`;
const ownerUid = `${baseUid}-owner`;
const eventId = "faiz-harissa";
const root = `weddings/${eventId}/memoryAlbums/main`;
let loseReservationResponse = false;
let failPhotoMetadata = false;
let failVoicePublish = false;
function client(name, claims = {}) {
  const app = initializeApp(
    {
      projectId: "demo-wedding",
      apiKey: "fake",
      storageBucket: "demo-wedding.appspot.com",
    },
    name
  );
  apps.push(app);
  const db = firestore.getFirestore(app);
  firestore.connectFirestoreEmulator(db, "127.0.0.1", 8088, {
    mockUserToken: { sub: name, ...claims },
  });
  const bucket = storage.getStorage(app);
  storage.connectStorageEmulator(bucket, "127.0.0.1", 9199, {
    mockUserToken: { sub: name, ...claims },
  });
  return { db, storage: bucket };
}
const alice = client(baseUid);
const bob = client(`${baseUid}-other`);
const owner = client(ownerUid, { owner: true });
const adapterFirestore = {
  ...firestore,
  runTransaction: async (...args) => {
    const result = await firestore.runTransaction(...args);
    if (loseReservationResponse) {
      loseReservationResponse = false;
      throw new Error("simulated lost reservation response");
    }
    return result;
  },
  setDoc: async (reference, data, options) => {
    if (failPhotoMetadata && reference.path.includes("/photos/")) {
      failPhotoMetadata = false;
      throw new Error("simulated lost photo metadata response");
    }
    return firestore.setDoc(reference, data, options);
  },
  updateDoc: async (reference, data) => {
    if (failVoicePublish && reference.path.includes("/voice")) {
      failVoicePublish = false;
      throw new Error("simulated lost voice publish response");
    }
    return firestore.updateDoc(reference, data);
  },
};
const modules = new Map();
function transpile(path) {
  const output = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (name === "@/lib/wedding/firebase")
      return {
        getWeddingFirestore: () => alice.db,
        getWeddingStorage: () => alice.storage,
        getWeddingGuest: async () => baseUid,
        getWeddingOwnerFirestore: () => owner.db,
        getWeddingOwnerStorage: () => owner.storage,
      };
    if (name === "@/lib/wedding/invitations") return {};
    if (name === "@/lib/wedding/memoriesQueue")
      return transpile("src/lib/wedding/memoriesQueue.ts");
    if (name === "@/lib/wedding/memoriesRender")
      return transpile("src/lib/wedding/memoriesRender.ts");
    if (name === "@/lib/wedding/memoriesUploadStatus")
      return transpile("src/lib/wedding/memoriesUploadStatus.ts");
    if (name === "@/lib/wedding/memoryRoutes")
      return transpile("src/lib/wedding/memoryRoutes.ts");
    if (name === "@/lib/wedding/memories")
      return transpile("src/lib/wedding/memories.ts");
    if (name === "firebase/firestore") return adapterFirestore;
    if (name === "firebase/storage")
      return {
        ...storage,
        getBlob: async (ref) => new Blob([await storage.getBytes(ref)]),
      };
    return require(name);
  };
  new Function("require", "module", "exports", output)(
    localRequire,
    module,
    module.exports
  );
  return module.exports;
}
const queue = transpile("src/lib/wedding/memoriesQueue.ts");
const data = transpile("src/lib/wedding/memories.ts");
const uploads = transpile("src/lib/wedding/memoriesUploads.ts");
const renderer = transpile("src/lib/wedding/memoriesRender.ts");
const image = new Blob(
  [fs.readFileSync("public/images/arched-invitation-garden-v1.webp")],
  { type: "image/webp" }
);
const deny = (promise) =>
  assert.rejects(promise, (error) =>
    /permission-denied|unauthorized/.test(error.code)
  );

test("camera frame crop, filters, and preview/final crop geometry stay consistent", () => {
  const full = renderer.getPhotoCrop(4000, 2000);
  assert.deepEqual(full, { x: 0, y: 0, width: 4000, height: 2000 });
  const cameraCrop = renderer.getPhotoCrop(4000, 3000, 4 / 5);
  assert.deepEqual(cameraCrop, { x: 800, y: 0, width: 2400, height: 3000 });
  const original = new Uint8ClampedArray([100, 120, 140, 255]);
  assert.notDeepEqual(
    Array.from(renderer.applyPhotoFilter(original.slice(), "warm")),
    Array.from(original)
  );
  assert.notDeepEqual(
    Array.from(renderer.applyPhotoFilter(original.slice(), "soft")),
    Array.from(original)
  );
  assert.deepEqual(
    Array.from(renderer.applyPhotoFilter(original.slice(), "none")),
    Array.from(original)
  );
  assert.deepEqual(
    Array.from(renderer.applyPhotoFilter(original.slice(), "warm")),
    [113, 124, 124, 255]
  );
  assert.deepEqual(
    Array.from(renderer.applyPhotoFilter(original.slice(), "soft")),
    [107, 124, 140, 255]
  );
  const legacyPatch = new Uint8ClampedArray([184, 122, 98, 173]);
  for (const [film, expected] of [
    ["classic-chrome", [174, 125, 106, 173]],
    ["classic-neg", [192, 121, 93, 173]],
    ["nostalgic-neg", [185, 124, 97, 173]],
    ["acros", [137, 137, 137, 173]],
    ["warm", [200, 126, 86, 173]],
    ["soft", [179, 129, 110, 173]],
  ]) {
    assert.deepEqual(
      Array.from(renderer.applyPhotoFilter(legacyPatch.slice(), film)),
      expected,
      `${film} keeps the original saved-photo rendering`
    );
  }

  const renderLogs = [];
  const video = { videoWidth: 4000, videoHeight: 3000 };
  const makeCanvas = (width, height) => {
    const log = { width, height, commands: [], saves: 0, restores: 0 };
    renderLogs.push(log);
    let font = "700 10px monospace";
    let fillStyle = "";
    let shadowColor = "";
    const context = {
      save() { log.saves++; log.commands.push({ type: "save" }); },
      restore() { log.restores++; log.commands.push({ type: "restore" }); },
      clearRect(...args) { log.commands.push({ type: "clearRect", args }); },
      drawImage(...args) { log.commands.push({ type: "drawImage", args }); },
      set font(value) { font = value; log.commands.push({ type: "font", value }); },
      get font() { return font; },
      set fillStyle(value) { fillStyle = value; log.commands.push({ type: "fillStyle", value }); },
      set shadowColor(value) { shadowColor = value; log.commands.push({ type: "shadowColor", value }); },
      set shadowBlur(value) { log.commands.push({ type: "shadowBlur", value }); },
      set textAlign(value) { log.commands.push({ type: "textAlign", value }); },
      set textBaseline(value) { log.commands.push({ type: "textBaseline", value }); },
      translate(x, y) { log.commands.push({ type: "translate", x, y }); },
      rotate(angle) { log.commands.push({ type: "rotate", angle }); },
      measureText(value) {
        return { width: Array.from(value).length * Number.parseFloat(font.match(/([\d.]+)px/)[1]) * 0.6 };
      },
      fillText(value, x, y) { log.commands.push({ type: "fillText", value, x, y, font, fillStyle, shadowColor }); },
      getImageData(_x, _y, width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; },
      putImageData() {},
    };
    return { width, height, getContext: () => context };
  };
  const capturedAt = Date.parse("2026-11-14T16:27:00Z");
  const style = {
    film: "none",
    stamp: "#guestChoice",
    capturedAt,
    coupleNames: "Harissa & Faiz",
  };
  const previousDocument = globalThis.document;
  globalThis.document = { createElement: () => makeCanvas(900, 1600) };
  try {
    const portraitPreview = makeCanvas(360, 640);
    renderer.renderPhotoCanvasInto(video, portraitPreview, style);
    renderer.renderPhotoCanvas(video, {
      ...style,
      aspectRatio: 9 / 16,
      outputWidth: 900,
      outputHeight: 1600,
    });
    renderer.renderPhotoCanvasInto(video, makeCanvas(640, 360), {
      ...style,
      aspectRatio: 16 / 9,
    });
    renderer.renderPhotoCanvasInto(video, makeCanvas(640, 360), {
      ...style,
      stamp: "x".repeat(100),
      aspectRatio: 16 / 9,
    });
    renderer.renderPhotoCanvasInto(video, makeCanvas(360, 640), {
      ...style,
      stamp: "",
      aspectRatio: 9 / 16,
    });
  } finally {
    globalThis.document = previousDocument;
  }

  const caption = "* HARISSA & FAIZ | 15 NOV 2026 12:27 AM";
  assert.equal(renderer.formatPhotoStampDate(capturedAt), "15 NOV 2026 12:27 AM");
  assert.equal(renderer.formatPhotoStampCaption(style.coupleNames, capturedAt), caption);
  const portraitPreview = renderLogs[0];
  const portraitFull = renderLogs[1];
  const portraitCommands = portraitPreview.commands;
  assert.ok(portraitCommands.some((command) => command.type === "rotate" && command.angle === Math.PI / 2));
  assert.ok(portraitCommands.some((command) => command.type === "fillStyle" && command.value === "#df7137"));
  assert.ok(portraitCommands.some((command) => command.type === "font" && command.value.includes("'Courier New'")));
  assert.ok(portraitCommands.some((command) => command.type === "shadowColor"));
  assert.ok(portraitCommands.some((command) => command.type === "fillText" && command.value === "*"));
  assert.ok(!portraitCommands.some((command) => ["fillRect", "createLinearGradient"].includes(command.type)));
  const drawn = portraitCommands.filter((command) => command.type === "fillText");
  assert.ok(drawn.map((command) => command.value).join("").includes(caption));
  assert.ok(drawn.map((command) => command.value).join("").includes("#guestChoice"));
  assert.ok(
    drawn[1].x - drawn[0].x > 5,
    "per-character tracking should be visible at preview scale"
  );
  assert.equal(portraitPreview.saves, portraitPreview.restores);

  const makeMetricContext = (log) => {
    let font = "700 10px monospace";
    return {
      save() {}, restore() {},
      set font(value) { font = value; log.font = value; },
      measureText(value) {
        return { width: Array.from(value).length * Number.parseFloat(font.match(/([\d.]+)px/)[1]) * 0.6 };
      },
    };
  };
  const metricStyle = { stamp: "#guestChoice", capturedAt, coupleNames: "Harissa & Faiz" };
  const portraitLayout = renderer.getPhotoStampLayout(makeMetricContext({}), 360, 640, metricStyle);
  const portraitFullLayout = renderer.getPhotoStampLayout(makeMetricContext({}), 900, 1600, metricStyle);
  const normalizedLayout = (layout, width, height) => {
    const norm = (value) => Number(value.toFixed(4));
    return {
      bounds: [layout.bounds.x / width, layout.bounds.y / height, layout.bounds.width / width, layout.bounds.height / height].map(norm),
      reservedLeft: norm(layout.reservedLeft / width),
      reservedBottom: norm(layout.reservedBottom / height),
      main: layout.mainPositions.map(({ x, y, rotated }) => [norm(x / width), norm(y / height), rotated]),
      custom: layout.customPositions.map(({ x, y, rotated }) => [norm(x / width), norm(y / height), rotated]),
    };
  };
  assert.equal(portraitLayout.orientation, "portrait");
  assert.ok(portraitLayout.reservedLeft > 0);
  assert.ok(portraitLayout.reservedBottom < 120, "portrait only reserves modest safe-edge space below");
  assert.deepEqual(normalizedLayout(portraitLayout, 360, 640), normalizedLayout(portraitFullLayout, 900, 1600));
  assert.ok(Math.abs(
    portraitLayout.mainPositions[0].y +
      portraitLayout.mainLines[0].length * portraitLayout.fontSize * 0.6 +
      (portraitLayout.mainLines[0].length - 1) * portraitLayout.letterSpacing -
      (640 - portraitLayout.edgeInset)
  ) < 0.1);

  const boundaryAspect = 414 / 450;
  const roundedPreview = renderer.getPhotoStampLayout(
    makeMetricContext({}),
    662,
    720,
    { ...metricStyle, aspectRatio: boundaryAspect }
  );
  const roundedCapture = renderer.getPhotoStampLayout(
    makeMetricContext({}),
    1472,
    1600,
    { ...metricStyle, aspectRatio: boundaryAspect }
  );
  assert.equal(roundedPreview.orientation, "landscape");
  assert.equal(roundedCapture.orientation, "landscape");
  assert.deepEqual(
    normalizedLayout(roundedPreview, 662, 720).main.map(([x, y, rotated]) => [x, y, rotated]),
    normalizedLayout(roundedCapture, 1472, 1600).main.map(([x, y, rotated]) => [x, y, rotated])
  );
  assert.equal(
    renderer.getPhotoStampLayout(makeMetricContext({}), 662, 720, {
      ...metricStyle,
      aspectRatio: 0.919,
    }).orientation,
    "portrait"
  );
  for (const viewportWidth of [413.95, 414, 414.05]) {
    const frame = renderer.getCameraFrameGeometry(viewportWidth, 450);
    const canonicalStampAspect = frame.captureWidth / frame.captureHeight;
    const styleForFrame = {
      ...metricStyle,
      aspectRatio: frame.aspectRatio,
      stampAspectRatio: canonicalStampAspect,
    };
    const previewLayout = renderer.getPhotoStampLayout(
      makeMetricContext({}),
      frame.previewWidth,
      frame.previewHeight,
      styleForFrame
    );
    const captureLayout = renderer.getPhotoStampLayout(
      makeMetricContext({}),
      frame.captureWidth,
      frame.captureHeight,
      styleForFrame
    );
    const thumbnailScale = 720 / Math.max(frame.captureWidth, frame.captureHeight);
    const thumbnailLayout = renderer.getPhotoStampLayout(
      makeMetricContext({}),
      Math.round(frame.captureWidth * thumbnailScale),
      Math.round(frame.captureHeight * thumbnailScale),
      { ...metricStyle, stampAspectRatio: canonicalStampAspect }
    );
    assert.equal(previewLayout.orientation, "landscape");
    assert.equal(captureLayout.orientation, previewLayout.orientation);
    assert.equal(thumbnailLayout.orientation, captureLayout.orientation);
  }

  const landscapeLayout = renderer.getPhotoStampLayout(
    makeMetricContext({}),
    640,
    360,
    metricStyle
  );
  const longStamp = renderer.getPhotoStampLayout(
    makeMetricContext({}),
    320,
    180,
    { ...metricStyle, stamp: "#" + "LongStamp".repeat(11), aspectRatio: 16 / 9 }
  );
  const blankStamp = renderer.getPhotoStampLayout(
    makeMetricContext({}),
    640,
    360,
    { ...metricStyle, stamp: "" }
  );
  assert.equal(landscapeLayout.orientation, "landscape");
  assert.equal(landscapeLayout.reservedLeft, 0);
  assert.ok(landscapeLayout.reservedBottom >= landscapeLayout.bounds.height);
  assert.ok(
    landscapeLayout.customBounds.y + landscapeLayout.customBounds.height < landscapeLayout.mainBounds.y,
    "the secondary stamp block sits completely above the main event line"
  );
  const expectedMainWidth = Math.max(
    ...landscapeLayout.mainLines.map((line) =>
      Array.from(line).length * landscapeLayout.fontSize * 0.6 +
      Math.max(0, Array.from(line).length - 1) * landscapeLayout.letterSpacing
    )
  );
  assert.ok(
    Math.abs(landscapeLayout.mainBounds.width - expectedMainWidth) < 0.001,
    "main bounds use the main font metrics, not the secondary font"
  );
  assert.ok(longStamp.customLines.every((line) => line.length > 0));
  assert.ok(
    longStamp.customLines.every(
      (line) =>
        line.length * longStamp.secondaryFontSize * 0.6 +
          (line.length - 1) * longStamp.secondaryLetterSpacing <=
          320 - longStamp.edgeInset * 2
    ),
    "wrapped custom text stays inside its bounded axis"
  );
  assert.deepEqual(blankStamp.customLines, []);
  assert.ok(blankStamp.mainLines.join(" ").includes(caption));
  const squareLongStamp = renderer.getPhotoStampLayout(
    makeMetricContext({}),
    1200,
    1200,
    { ...metricStyle, stamp: "#" + "LongStamp".repeat(11) }
  );
  assert.equal(squareLongStamp.orientation, "landscape");
  assert.equal(squareLongStamp.mainLines.length, 1, "the main caption remains readable on a square image");
  assert.ok(squareLongStamp.customLines.length > 1, "a long custom stamp wraps within the square image axis");
  assert.ok(
    squareLongStamp.customBounds.y + squareLongStamp.customBounds.height < squareLongStamp.mainBounds.y,
    "square custom text does not collide with the event caption"
  );
  assert.equal(portraitFull.commands.filter((command) => command.type === "fillText").length, drawn.length);

});

test("film presets are distinct, deterministic, alpha-safe, and preserve tonal detail", () => {
  const ids = renderer.PHOTO_FILM_PRESETS.map((preset) => preset.id);
  assert.deepEqual(ids, ["none", "fp2", "fs16", "fv5"]);
  for (const legacy of ["classic-chrome", "classic-neg", "nostalgic-neg", "acros", "warm", "soft"])
    assert.equal(renderer.resolvePhotoFilm(legacy), "fp2");
  assert.equal(renderer.resolvePhotoFilm("fs16"), "fs16");
  const colors = new Uint8ClampedArray([
    24, 40, 75, 255,
    88, 54, 38, 255,
    184, 122, 98, 192,
    205, 218, 226, 255,
  ]);
  const looks = ids.map((film) => Array.from(renderer.applyPhotoFilter(colors.slice(), film)));
  assert.equal(new Set(looks.map((look) => look.join(","))).size, ids.length);
  for (const [index, film] of ids.entries()) {
    assert.deepEqual(looks[index], Array.from(renderer.applyPhotoFilter(colors.slice(), film)));
    for (let pixel = 0; pixel < colors.length; pixel += 4)
      assert.equal(looks[index][pixel + 3], colors[pixel + 3]);
  }
  const chromaticPatch = [184, 122, 98, 255];
  const patchChroma = ([red, green, blue]) => Math.max(red, green, blue) - Math.min(red, green, blue);
  assert.ok(
    patchChroma(Array.from(renderer.applyPhotoFilter(new Uint8ClampedArray(chromaticPatch), "fp2")).slice(0, 3)) >
      patchChroma(chromaticPatch),
    "FP2 enriches color while protecting midtone skin"
  );
  assert.ok(
    patchChroma(Array.from(renderer.applyPhotoFilter(new Uint8ClampedArray(chromaticPatch), "fs16")).slice(0, 3)) <
      patchChroma(chromaticPatch),
    "FS16 keeps color more natural"
  );
  assert.ok(
    patchChroma(Array.from(renderer.applyPhotoFilter(new Uint8ClampedArray(chromaticPatch), "fv5")).slice(0, 3)) >
      patchChroma(Array.from(renderer.applyPhotoFilter(new Uint8ClampedArray(chromaticPatch), "fp2")).slice(0, 3)),
    "FV5 is the most saturated of the new looks"
  );
  const fs16Dark = Array.from(renderer.applyPhotoFilter(new Uint8ClampedArray([20, 20, 20, 255]), "fs16"));
  assert.ok(fs16Dark[1] > fs16Dark[0] && fs16Dark[1] > fs16Dark[2], "FS16 adds a restrained green-cyan shadow fade");
  const fs16Highlight = Array.from(renderer.applyPhotoFilter(new Uint8ClampedArray([250, 250, 250, 255]), "fs16"));
  assert.ok(Math.max(...fs16Highlight.slice(0, 3)) - Math.min(...fs16Highlight.slice(0, 3)) <= 1,
    "FS16 leaves white fabric nearly neutral");

  const grayRamp = new Uint8ClampedArray(256 * 4);
  for (let value = 0; value < 256; value++) {
    grayRamp[value * 4] = value;
    grayRamp[value * 4 + 1] = value;
    grayRamp[value * 4 + 2] = value;
    grayRamp[value * 4 + 3] = 255;
  }
  for (const film of ids) {
    const first = renderer.applyPhotoFilter(grayRamp.slice(), film);
    const second = renderer.applyPhotoFilter(grayRamp.slice(), film);
    assert.deepEqual(first, second, `${film} should not add frame-varying texture`);
    const luminance = [];
    for (let value = 0; value < 256; value++) {
      const index = value * 4;
      const gray = Math.round(
        first[index] * 0.2126 + first[index + 1] * 0.7152 + first[index + 2] * 0.0722
      );
      luminance.push(gray);
      assert.equal(first[index + 3], 255);
      if (value) assert.ok(gray >= luminance[value - 1], `${film} tone curve is monotonic`);
    }
    assert.ok(new Set(luminance.slice(0, 26)).size >= 12, `${film} keeps shadow detail`);
    assert.ok(new Set(luminance.slice(230)).size >= 12, `${film} keeps highlight detail`);
  }
});

after(async () => {
  await Promise.all(apps.map(deleteApp));
});

test("invalid photo consumes no reservation; offline draft survives reload and lost reservation response", async () => {
  await queue.clearUploadQueueForTests();
  const malformed = new Blob([new Uint8Array([1, 2, 3, 4])], {
    type: "image/jpeg",
  });
  await assert.rejects(
    uploads.savePhotoDraft("bride", eventId, "Helper guest", malformed),
    /does not match/
  );
  assert.equal((await queue.listUploadJobs(eventId)).length, 0);
  const missing = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      firestore.getDoc(
        firestore.doc(alice.db, `${root}/reservations/${baseUid}_${i + 1}`)
      )
    )
  );
  assert.ok(missing.every((doc) => !doc.exists()));
  const photoStyle = {
    film: "nostalgic-neg",
    stamp: "#GuestChoice",
    capturedAt: Date.parse("2026-11-14T16:27:00Z"),
  };
  const draft = await uploads.savePhotoDraft(
    "bride",
    eventId,
    "Helper guest",
    image,
    photoStyle
  );
  assert.deepEqual(draft.photoStyle, photoStyle);
  assert.deepEqual(
    new Uint8Array(
      await (await queue.listUploadJobs(eventId))[0].blob.arrayBuffer()
    ),
    new Uint8Array(await image.arrayBuffer())
  );
  loseReservationResponse = true;
  await assert.rejects(
    uploads.processUploadJob(draft),
    /lost reservation response/
  );
  const reloaded = (await queue.listUploadJobs(eventId))[0];
  assert.ok(reloaded.uid);
  assert.equal(reloaded.slot, undefined);
  await uploads.processUploadJob(reloaded);
  assert.equal((await queue.listUploadJobs(eventId)).length, 0);
  const savedPhoto = await firestore.getDoc(
    firestore.doc(alice.db, `${root}/photos/${baseUid}_1`)
  );
  assert.deepEqual(savedPhoto.data().photoStyle, photoStyle);
  const reservations = await Promise.all(
    Array.from({ length: 20 }, (_, i) =>
      firestore.getDoc(
        firestore.doc(alice.db, `${root}/reservations/${baseUid}_${i + 1}`)
      )
    )
  );
  assert.equal(reservations.filter((doc) => doc.exists()).length, 1);
});

test("uploaded photo bytes are reused after metadata commit response is lost", async () => {
  const photoStyle = {
    film: "soft",
    stamp: "#RecoveredLook",
    capturedAt: Date.now(),
  };
  const draft = await uploads.savePhotoDraft(
    "bride",
    eventId,
    "Helper guest",
    image,
    photoStyle
  );
  failPhotoMetadata = true;
  await assert.rejects(
    uploads.processUploadJob(draft),
    /lost photo metadata response/
  );
  const queued = (await queue.listUploadJobs(eventId))[0];
  assert.equal(queued.slot, 2);
  const original = storage.ref(
    alice.storage,
    `${root}/photos/${baseUid}/${queued.slot}/original`
  );
  assert.equal(
    (await storage.getMetadata(original)).customMetadata.uploadKey,
    queued.uploadKey
  );
  await uploads.processUploadJob(queued);
  assert.equal((await queue.listUploadJobs(eventId)).length, 0);
  const photo = await firestore.getDoc(
    firestore.doc(alice.db, `${root}/photos/${baseUid}_${queued.slot}`)
  );
  assert.equal(photo.data().status, "complete");
  assert.deepEqual(photo.data().photoStyle, photoStyle);
});

test("20-slot quota is stable across retries, and groom slots are independent", async () => {
  for (let index = 0; index < 18; index++) {
    const job = await uploads.savePhotoDraft(
      "bride",
      eventId,
      "Helper guest",
      image
    );
    await uploads.processUploadJob(job);
  }
  await assert.rejects(
    data.reservePhoto(eventId, "Helper guest", randomUUID()),
    /20/
  );
  const groom = await data.reservePhoto(
    "faiz-harissa-groom",
    "Helper guest",
    randomUUID()
  );
  assert.equal(groom.slot, 1);
});

test("public and private voice helpers persist, recover publish failures, and protect other guests", async () => {
  const audio = new Blob([new Uint8Array([1, 2, 3, 4])], {
    type: "audio/webm",
  });
  const privateJob = await uploads.saveAudioDraft(
    "bride",
    eventId,
    "Helper guest",
    audio,
    true
  );
  failVoicePublish = true;
  await assert.rejects(
    uploads.processUploadJob(privateJob),
    /lost voice publish response/
  );
  const pending = (await queue.listUploadJobs(eventId))[0];
  assert.equal(pending.bytesUploaded, true);
  await uploads.processUploadJob(pending);
  assert.equal((await queue.listUploadJobs(eventId)).length, 0);
  const voiceId = `${baseUid}_${privateJob.uploadKey}`;
  const voice = await firestore.getDoc(
    firestore.doc(owner.db, `${root}/voicePrivate/${voiceId}`)
  );
  assert.equal(voice.data().status, "complete");
  await deny(
    firestore.getDoc(firestore.doc(bob.db, `${root}/voicePrivate/${voiceId}`))
  );
  await deny(storage.getBytes(storage.ref(bob.storage, voice.data().path)));
  assert.equal(
    (await storage.getBytes(storage.ref(owner.storage, voice.data().path)))
      .byteLength,
    4
  );
  const publicJob = await uploads.saveAudioDraft(
    "bride",
    eventId,
    "Helper guest",
    audio,
    false
  );
  await uploads.processUploadJob(publicJob);
  const publicVoice = await firestore.getDoc(
    firestore.doc(
      owner.db,
      `${root}/voicePublic/${baseUid}_${publicJob.uploadKey}`
    )
  );
  assert.equal(publicVoice.data().status, "complete");
  assert.equal(
    (await storage.getBytes(storage.ref(bob.storage, publicVoice.data().path)))
      .byteLength,
    4
  );
});

test("favourites persist/removal works and complete owner ZIP contains every media variant", async () => {
  const photo = await firestore.getDoc(
    firestore.doc(owner.db, `${root}/photos/${baseUid}_1`)
  );
  await data.saveFavorite(eventId, photo.id);
  assert.deepEqual(await data.readFavoriteIds(eventId, [photo.id]), [photo.id]);
  await data.saveFavorite(eventId, photo.id, false);
  assert.deepEqual(await data.readFavoriteIds(eventId, [photo.id]), []);
  await data.saveWish(eventId, "Helper guest", "Best wishes for your new journey.");
  const longStamp = `#FaIzTheOneForHarissa ${"Unbroken".repeat(9)}`;
  const settings = { welcome: "Welcome", cover: "", stamp: longStamp, bankRecipient: "", bankDetails: "", qrUrl: "" };
  for (const film of ["none", "fp2", "fs16", "fv5", "classic-chrome", "classic-neg", "nostalgic-neg", "acros", "warm", "soft"]) {
    await data.updateSettings(eventId, { ...settings, film });
    assert.equal((await firestore.getDoc(firestore.doc(owner.db, `${root}/public/settings`))).data().film, film);
  }
  await assert.rejects(
    firestore.setDoc(firestore.doc(owner.db, `${root}/public/settings`), {
      ...settings,
      film: "sepia",
      updatedAt: firestore.serverTimestamp(),
    }),
    (error) => error.code === "permission-denied"
  );
  await assert.rejects(firestore.setDoc(firestore.doc(alice.db, `${root}/public/settings`), { welcome: "Changed" }), (error) => error.code === "permission-denied");
  assert.equal((await data.countMemories(eventId)).contributors > 0, true);
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(
        (value) => {
          this.result = value;
          this.onload({ target: this });
        },
        (error) => this.onerror(error)
      );
    }
  };
  globalThis.Image = class {
    naturalWidth = 100;
    naturalHeight = 100;
    decode() {
      return Promise.resolve();
    }
  };
  const stampLines = [];
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ save() {}, restore() {}, clearRect() {}, getImageData(_x, _y, width, height) { return { data: new Uint8ClampedArray(width * height * 4) }; }, putImageData() {}, drawImage() {}, fillText(value) { stampLines.push(value); }, fillRect() {}, measureText(value) { return { width: value.length * 8 }; }, createLinearGradient() { return { addColorStop() {} }; } }),
      toBlob: (callback) =>
        callback(new Blob(["styled"], { type: "image/jpeg" })),
    }),
  };
  const archive = await data.exportMemoryFiles(eventId, () => {});
  const JSZip = require("jszip");
  const zip = await JSZip.loadAsync(await archive.arrayBuffer());
  assert.ok(zip.file("originals/" + photo.id + ".webp"));
  assert.ok(zip.file("styled-photos/" + photo.id + ".jpg"));
  const manifest = JSON.parse(await zip.file("metadata.json").async("string"));
  assert.ok(manifest.wishes.some((wish) => wish.uid === baseUid));
  assert.ok(manifest.privateVoices.some((voice) => voice.uid === baseUid));
  assert.ok(manifest.publicVoices.some((voice) => voice.uid === baseUid));
  const stamps = stampLines.join(" ");
  assert.match(stamps.replace(/\s+/g, ""), /FaIzTheOneForHarissa/);
  const compactStamp = stamps.replace(/\s+/g, "");
  assert.match(compactStamp, /\*HARISSA&FAIZ\|15NOV2026/);
  assert.ok(
    stampLines.every((line) => line.length * 8 <= 90),
    "each rendered stamp line must fit within 90% of the 100px canvas width"
  );
});
