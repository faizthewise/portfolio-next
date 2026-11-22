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
