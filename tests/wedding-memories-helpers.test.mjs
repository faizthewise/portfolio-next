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
const image = new Blob(
  [fs.readFileSync("public/images/arched-invitation-garden-v1.webp")],
  { type: "image/webp" }
);
const deny = (promise) =>
  assert.rejects(promise, (error) =>
    /permission-denied|unauthorized/.test(error.code)
  );

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
  const draft = await uploads.savePhotoDraft(
    "bride",
    eventId,
    "Helper guest",
    image
  );
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
  const draft = await uploads.savePhotoDraft(
    "bride",
    eventId,
    "Helper guest",
    image
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
  await data.updateSettings(eventId, { welcome: "Welcome", cover: "", film: "warm", stamp: longStamp, bankRecipient: "", bankDetails: "", qrUrl: "" });
  assert.equal((await firestore.getDoc(firestore.doc(owner.db, `${root}/public/settings`))).data().film, "warm");
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
      getContext: () => ({ drawImage() {}, fillText(value) { stampLines.push(value); }, fillRect() {}, measureText(value) { return { width: value.length * 8 }; }, createLinearGradient() { return { addColorStop() {} }; } }),
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
  assert.match(stamps, /Harissa & Faiz/);
  assert.match(stamps, /2026/);
  assert.ok(
    stampLines.every((line) => line.length * 8 <= 90),
    "each rendered stamp line must fit within 90% of the 100px canvas width"
  );
});
