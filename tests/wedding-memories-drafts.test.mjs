import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import { before, test } from "node:test";
import "fake-indexeddb/auto";
import ts from "typescript";

const require = createRequire(process.cwd() + "/package.json");
const DATABASE = "wedding-memories-queue-v2";
const event = "faiz-harissa";
const otherEvent = "faiz-harissa-groom";
const guestUid = "camera-draft-guest";
const otherUid = "another-camera-guest";
const calls = { auth: 0, reserve: 0, upload: 0, uploadedSlots: [] };
const firebase = {
  getWeddingGuest: async () => {
    calls.auth++;
    return guestUid;
  },
};
const memoryApi = {
  reservePhoto: async () => {
    calls.reserve++;
    return { uid: guestUid, slot: 1 };
  },
  uploadPhoto: async (_event, slot) => {
    calls.upload++;
    calls.uploadedSlots.push(slot);
  },
  recordVoice: async () => {},
};
const modules = new Map();

function transpile(path) {
  if (modules.has(path)) return modules.get(path);
  const output = ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  modules.set(path, module.exports);
  const localRequire = (name) => {
    if (name === "@/lib/wedding/firebase") return firebase;
    if (name === "@/lib/wedding/memories") return memoryApi;
    if (name === "@/lib/wedding/memoriesRender") return {};
    if (name === "@/lib/wedding/memoriesUploadStatus")
      return transpile("src/lib/wedding/memoriesUploadStatus.ts");
    if (name === "@/lib/wedding/memoriesQueue")
      return transpile("src/lib/wedding/memoriesQueue.ts");
    return require(name);
  };
  new Function("require", "module", "exports", output)(
    localRequire,
    module,
    module.exports
  );
  modules.set(path, module.exports);
  return module.exports;
}

const queue = transpile("src/lib/wedding/memoriesQueue.ts");
const uploads = transpile("src/lib/wedding/memoriesUploads.ts");
const validPhoto = new Blob(
  [new Uint8Array([0xff, 0xd8, 0xff, 0xd9])],
  { type: "image/jpeg" }
);

function photo(side = "bride", eventId = event, uid = guestUid) {
  return {
    ...queue.createPhotoJob(
      side,
      eventId,
      "Local guest",
      validPhoto,
      { film: "fp2", stamp: "#LocalOnly", capturedAt: Date.now() },
      uid,
      new Blob([new Uint8Array([1, 2, 3])], { type: "image/jpeg" })
    ),
  };
}

function resetCalls() {
  calls.auth = 0;
  calls.reserve = 0;
  calls.upload = 0;
  calls.uploadedSlots = [];
}

before(async () => {
  await new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DATABASE);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Queue database is unexpectedly open."));
  });
});

test("v1 jobs migrate unchanged while held photo drafts stay invisible to the uploader queue", async () => {
  const legacy = {
    id: "legacy-photo",
    event,
    side: "bride",
    kind: "photo",
    uploadKey: "legacy-key",
    name: "Legacy guest",
    blob: validPhoto,
    createdAt: 1,
    status: "Needs retry",
  };
  await new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("jobs", { keyPath: "id" });
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction("jobs", "readwrite");
      transaction.objectStore("jobs").put(legacy);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => reject(transaction.error);
    };
    request.onerror = () => reject(request.error);
  });
  const migrated = await queue.listUploadJobs(event);
  assert.deepEqual(migrated.map((job) => job.id), ["legacy-photo"]);
  assert.equal(migrated[0].status, "Needs retry");

  const held = photo();
  await queue.saveLocalPhotoDraft(held, 0);
  assert.deepEqual(
    (await queue.listUploadJobs(event)).map((job) => job.id),
    ["legacy-photo"]
  );
  assert.deepEqual(
    (await queue.listLocalPhotoDrafts(event, guestUid)).map((job) => job.id),
    [held.id]
  );
});

test("stale and deleted held drafts cannot reach Firebase or be recreated", async () => {
  await queue.clearUploadQueueForTests();
  resetCalls();
  const held = photo();
  await queue.saveLocalPhotoDraft(held, 0);
  await assert.rejects(
    uploads.processUploadJob({ ...held, awaitingApproval: false }),
    /waiting for your approval/
  );
  assert.deepEqual(calls, { auth: 0, reserve: 0, upload: 0, uploadedSlots: [] });
  assert.equal((await queue.listUploadJobs(event)).length, 0);

  assert.equal(await queue.deleteLocalPhotoDraft(held.id, event, guestUid), true);
  await assert.rejects(
    uploads.processUploadJob(held),
    /not in the approved upload queue/
  );
  assert.deepEqual(calls, { auth: 0, reserve: 0, upload: 0, uploadedSlots: [] });
  assert.equal((await queue.listUploadJobs(event)).length, 0);
});

test("capacity counts local and approved unreserved photos and deleting a draft frees a slot", async () => {
  await queue.clearUploadQueueForTests();
  const first = photo();
  await queue.saveLocalPhotoDraft(first, 19);
  const second = photo();
  await assert.rejects(queue.saveLocalPhotoDraft(second, 19), /All 20 photo slots/);
  assert.equal((await queue.listLocalPhotoDrafts(event, guestUid)).length, 1);

  await queue.deleteLocalPhotoDraft(first.id, event, guestUid);
  const approved = {
    ...photo(),
    id: "approved-unreserved",
    uploadKey: "stable-approved-key",
  };
  await queue.saveUploadJob(approved);
  await assert.rejects(queue.saveLocalPhotoDraft(second, 19), /All 20 photo slots/);
  await queue.removeUploadJob(approved.id);
  await queue.saveLocalPhotoDraft(second, 19);
  assert.equal((await queue.listLocalPhotoDrafts(event, guestUid)).length, 1);
});

test("capacity transactions serialize concurrent captures at the final slot", async () => {
  await queue.clearUploadQueueForTests();
  const first = photo();
  const second = photo();
  const results = await Promise.allSettled([
    queue.saveLocalPhotoDraft(first, 19),
    queue.saveLocalPhotoDraft(second, 19),
  ]);
  assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  assert.equal((await queue.listLocalPhotoDrafts(event, guestUid)).length, 1);
});

test("draft reads, deletes, and atomic approval stay scoped to event and UID", async () => {
  await queue.clearUploadQueueForTests();
  const mine = photo();
  const otherAccount = photo("bride", event, otherUid);
  const otherCelebration = photo("groom", otherEvent, guestUid);
  await Promise.all([
    queue.saveLocalPhotoDraft(mine, 0),
    queue.saveLocalPhotoDraft(otherAccount, 0),
    queue.saveLocalPhotoDraft(otherCelebration, 0),
  ]);
  assert.deepEqual(
    (await queue.listLocalPhotoDrafts(event, guestUid)).map((row) => row.id),
    [mine.id]
  );
  assert.deepEqual(await uploads.readCameraPhotoDrafts(event, ""), []);
  assert.equal(await queue.deleteLocalPhotoDraft(otherAccount.id, event, guestUid), false);
  await assert.rejects(
    queue.approveLocalPhotoDrafts([mine.id, otherAccount.id], event, guestUid),
    /another event or browser account/
  );
  assert.equal((await queue.listUploadJobs(event)).length, 0);
  assert.deepEqual(
    (await queue.listLocalPhotoDrafts(event)).map((row) => row.id).sort(),
    [mine.id, otherAccount.id].sort()
  );
});

test("approval atomically moves the stable job once and processor uses durable queue progress", async () => {
  await queue.clearUploadQueueForTests();
  resetCalls();
  const held = photo();
  await queue.saveLocalPhotoDraft(held, 0);
  const moved = await queue.approveLocalPhotoDrafts([held.id], event, guestUid);
  assert.equal(moved.length, 1);
  assert.equal(moved[0].id, held.id);
  assert.equal(moved[0].uid, guestUid);
  assert.equal(moved[0].uploadKey, held.uploadKey);
  assert.equal((await queue.listLocalPhotoDrafts(event, guestUid)).length, 0);
  assert.equal((await queue.approveLocalPhotoDrafts([held.id], event, guestUid)).length, 0);
  assert.equal((await queue.listUploadJobs(event)).length, 1);

  const durable = {
    ...moved[0],
    slot: 7,
    status: "Reserved photo 7",
    uploadKey: "preserved-reservation-key",
  };
  await queue.saveUploadJob(durable);
  const staleArgument = { ...held, slot: undefined, uploadKey: "stale-key" };
  await uploads.processUploadJob(staleArgument);
  assert.equal(calls.auth, 1);
  assert.equal(calls.reserve, 0);
  assert.deepEqual(calls.uploadedSlots, [7]);
  assert.equal((await queue.listUploadJobs(event)).length, 0);
});

test("permission failure stays retryable with the same reservation and reports progress", async () => {
  await queue.clearUploadQueueForTests();
  resetCalls();
  const held = photo();
  await queue.saveLocalPhotoDraft(held, 0);
  const [approved] = await queue.approveLocalPhotoDrafts([held.id], event, guestUid);
  const originalReserve = memoryApi.reservePhoto;
  const originalUpload = memoryApi.uploadPhoto;
  const seenPhases = [];
  const reportedProgress = [];
  const uploadKeys = [];
  try {
    memoryApi.reservePhoto = async () => {
      calls.reserve++;
      throw Object.assign(new Error("The photo slot was denied."), {
        code: "permission-denied",
      });
    };
    memoryApi.uploadPhoto = async () => {
      calls.upload++;
    };
    await assert.rejects(
      uploads.processUploadJob(approved, { onJob: (job) => seenPhases.push(job.status) }),
      /photo slot was denied/
    );
    let saved = (await queue.listUploadJobs(event))[0];
    assert.equal(saved.id, approved.id);
    assert.equal(saved.uploadKey, approved.uploadKey);
    assert.equal(saved.status, "Needs retry");
    assert.equal(saved.errorCode, "permission-denied");
    assert.equal(calls.upload, 0);
    assert.deepEqual(seenPhases.slice(0, 3), [
      "Checking photo",
      "Checking account",
      "Reserving photo slot",
    ]);

    memoryApi.reservePhoto = async (_event, _name, uploadKey) => {
      calls.reserve++;
      uploadKeys.push(uploadKey);
      return { uid: guestUid, slot: 4 };
    };
    memoryApi.uploadPhoto = async (
      _event,
      slot,
      _uid,
      _name,
      _blob,
      onProgress,
      uploadKey,
      _style,
      onPhase
    ) => {
      calls.upload++;
      calls.uploadedSlots.push(slot);
      uploadKeys.push(uploadKey);
      await onPhase("Confirming photo upload");
      await onPhase("Uploading photo");
      onProgress(40);
      onProgress(100);
      await onPhase("Confirming photo upload");
    };
    await uploads.processUploadJob(saved, {
      onJob: (job) => seenPhases.push(job.status),
      onProgress: (_id, percent) => reportedProgress.push(percent),
    });
    saved = await queue.getUploadJob(approved.id);
    assert.equal(saved, undefined);
    assert.equal(calls.reserve, 2);
    assert.equal(calls.upload, 1);
    assert.deepEqual(calls.uploadedSlots, [4]);
    assert.deepEqual(uploadKeys, [approved.uploadKey, approved.uploadKey]);
    assert.deepEqual(reportedProgress, [40, 100]);
    assert.deepEqual(seenPhases.slice(-3), [
      "Confirming photo upload",
      "Uploading photo",
      "Confirming photo upload",
    ]);
  } finally {
    memoryApi.reservePhoto = originalReserve;
    memoryApi.uploadPhoto = originalUpload;
  }
});

test("a failed phase write reports the live failure even if IndexedDB keeps the old phase", async () => {
  await queue.clearUploadQueueForTests();
  resetCalls();
  const held = photo();
  await queue.saveLocalPhotoDraft(held, 0);
  const [approved] = await queue.approveLocalPhotoDrafts([held.id], event, guestUid);
  const put = IDBObjectStore.prototype.put;
  const seen = [];
  IDBObjectStore.prototype.put = function (job, ...args) {
    const request = put.call(this, job, ...args);
    if (this.name === "jobs" && ["Checking account", "Needs retry"].includes(job.status)) {
      const transaction = this.transaction;
      request.addEventListener("success", () => transaction.abort(), { once: true });
    }
    return request;
  };
  try {
    await assert.rejects(uploads.processUploadJob(approved, { onJob: (job) => seen.push(job.status) }));
  } finally {
    IDBObjectStore.prototype.put = put;
  }
  const durable = await queue.getUploadJob(approved.id);
  assert.deepEqual(seen, ["Checking photo", "Needs retry"]);
  assert.equal(durable.status, "Checking photo");
  assert.equal(durable.uploadKey, approved.uploadKey);
  assert.deepEqual(await durable.blob.arrayBuffer(), await validPhoto.arrayBuffer());
  assert.equal(calls.reserve, 0);
  await uploads.processUploadJob(durable);
  assert.equal(calls.reserve, 1);
  assert.equal(calls.upload, 1);
  assert.equal(await queue.getUploadJob(approved.id), undefined);
});

async function rawAudioRow(mode, operation) {
  const db = await new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction("jobs", mode);
      const request = operation(transaction.objectStore("jobs"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    db.close();
  }
}

test("audio saves and retries without serializing a Blob into IndexedDB", async () => {
  await queue.clearUploadQueueForTests();
  const mime = "audio/webm;codecs=opus";
  const bytes = new Uint8Array([1, 3, 9, 27]);
  const recording = new Blob([bytes], { type: mime });
  const put = IDBObjectStore.prototype.put;
  const recordVoice = memoryApi.recordVoice;
  function refuseBlobRows(value, ...args) {
    if (value.blob instanceof Blob) {
      throw new DOMException("Error preparing Blob/File data to be stored in object store", "UnknownError");
    }
    return put.call(this, value, ...args);
  }
  IDBObjectStore.prototype.put = refuseBlobRows;
  try {
    const job = await uploads.saveAudioDraft("bride", event, "Local guest", recording, true);
    const row = await rawAudioRow("readonly", (store) => store.get(job.id));
    assert.equal("blob" in row, false);
    assert.equal(row.audioType, mime);
    assert.deepEqual(new Uint8Array(row.audioBytes), bytes);

    const [pending] = await queue.listUploadJobs(event);
    assert.equal(pending.blob.type, mime);
    assert.deepEqual(new Uint8Array(await pending.blob.arrayBuffer()), bytes);
    memoryApi.recordVoice = async (_event, _name, blob, isPrivate, id, onPhase) => {
      assert.equal(id, `${guestUid}_${job.uploadKey}`);
      assert.equal(isPrivate, true);
      assert.equal(blob.type, mime);
      assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
      await onPhase("metadata");
      throw new Error("Upload disconnected");
    };
    await assert.rejects(uploads.processUploadJob(pending), /Upload disconnected/);
    const retry = await queue.getUploadJob(job.id);
    assert.equal(retry.status, "Needs retry");
    assert.equal(retry.metadataSaved, true);
    assert.equal(retry.uploadKey, job.uploadKey);
    assert.equal(retry.uid, guestUid);

    memoryApi.recordVoice = async (_event, _name, blob, _isPrivate, id, onPhase) => {
      assert.equal(id, `${guestUid}_${job.uploadKey}`);
      assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
      await onPhase("bytes");
      await onPhase("complete");
    };
    await uploads.processUploadJob(retry);
    assert.equal(await queue.getUploadJob(job.id), undefined);
  } finally {
    IDBObjectStore.prototype.put = put;
    memoryApi.recordVoice = recordVoice;
  }
});

test("a legacy audio Blob row keeps its bytes, MIME and existing upload ID when replayed", async () => {
  await queue.clearUploadQueueForTests();
  const mime = "audio/mp4";
  const bytes = new Uint8Array([1, 2, 3]);
  const legacy = {
    ...queue.createAudioJob("bride", event, "Legacy guest", new Blob([bytes], { type: mime }), false),
    uid: guestUid,
    metadataSaved: true,
  };
  await rawAudioRow("readwrite", (store) => store.put(legacy));
  const recordVoice = memoryApi.recordVoice;
  try {
    const [pending] = await queue.listUploadJobs(event);
    assert.equal(pending.metadataSaved, true);
    memoryApi.recordVoice = async (_event, _name, blob, isPrivate, id, onPhase) => {
      assert.equal(id, `${guestUid}_${legacy.uploadKey}`);
      assert.equal(isPrivate, false);
      assert.equal(blob.type, mime);
      assert.deepEqual(new Uint8Array(await blob.arrayBuffer()), bytes);
      await onPhase("metadata");
      const row = await rawAudioRow("readonly", (store) => store.get(legacy.id));
      assert.equal("blob" in row, false);
      assert.equal(row.audioType, mime);
      await onPhase("bytes");
      await onPhase("complete");
    };
    await uploads.processUploadJob(pending);
    assert.equal(await queue.getUploadJob(legacy.id), undefined);
  } finally {
    memoryApi.recordVoice = recordVoice;
  }
});
