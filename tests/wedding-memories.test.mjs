import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { initializeApp, deleteApp } from "firebase/app";
import { randomUUID } from "node:crypto";
import { connectAuthEmulator, getAuth, signInAnonymously } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
  doc,
  collection,
  getDocs,
  getDoc,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
} from "firebase/storage";

if (
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PROJECT_ID !== "demo-wedding"
)
  throw new Error("Memories security tests are restricted to demo-wedding.");
if (
  !process.env.FIRESTORE_EMULATOR_HOST ||
  !process.env.FIREBASE_AUTH_EMULATOR_HOST
)
  throw new Error(
    "Run these tests with the local Auth and Firestore emulators."
  );
const storageHost =
  process.env.FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
const [firestoreHost, firestorePort] =
  process.env.FIRESTORE_EMULATOR_HOST.split(":");
const [authHost, authPort] = process.env.FIREBASE_AUTH_EMULATOR_HOST.split(":");
const [bucketHost, bucketPort] = storageHost.split(":");
for (const host of [firestoreHost, authHost, bucketHost])
  if (!["localhost", "127.0.0.1"].includes(host))
    throw new Error(
      "Memories emulator tests only allow loopback emulator hosts."
    );
const event = "faiz-harissa";
const root = `weddings/${event}/memoryAlbums/main`;
const unique = `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
const apps = [];
function app(name) {
  const value = initializeApp(
    {
      projectId: "demo-wedding",
      storageBucket: "demo-wedding.appspot.com",
      apiKey: "fake-api-key",
    },
    name
  );
  apps.push(value);
  return value;
}
let guestApp,
  guestAuth,
  guestDb,
  guestStorage,
  uid,
  otherApp,
  otherAuth,
  otherDb,
  otherStorage,
  anonymousDb,
  anonymousStorage,
  ownerDb;

before(async () => {
  guestApp = app(`memory-guest-${unique}`);
  guestAuth = getAuth(guestApp);
  connectAuthEmulator(guestAuth, `http://${authHost}:${authPort}`, {
    disableWarnings: true,
  });
  const credential = await signInAnonymously(guestAuth);
  uid = credential.user.uid;
  guestDb = getFirestore(guestApp);
  connectFirestoreEmulator(guestDb, firestoreHost, Number(firestorePort));
  guestStorage = getStorage(guestApp);
  connectStorageEmulator(guestStorage, bucketHost, Number(bucketPort));
  otherApp = app(`memory-other-${unique}`);
  otherAuth = getAuth(otherApp);
  connectAuthEmulator(otherAuth, `http://${authHost}:${authPort}`, {
    disableWarnings: true,
  });
  await signInAnonymously(otherAuth);
  otherDb = getFirestore(otherApp);
  connectFirestoreEmulator(otherDb, firestoreHost, Number(firestorePort));
  otherStorage = getStorage(otherApp);
  connectStorageEmulator(otherStorage, bucketHost, Number(bucketPort));
  const anonymousApp = app(`memory-unauthenticated-${unique}`);
  anonymousDb = getFirestore(anonymousApp);
  connectFirestoreEmulator(anonymousDb, firestoreHost, Number(firestorePort));
  anonymousStorage = getStorage(anonymousApp);
  connectStorageEmulator(anonymousStorage, bucketHost, Number(bucketPort));
  ownerDb = getFirestore(app(`memory-owner-${unique}`));
  connectFirestoreEmulator(ownerDb, firestoreHost, Number(firestorePort), {
    mockUserToken: { sub: `owner-${unique}`, owner: true },
  });
});
after(async () => {
  await Promise.all(apps.map((value) => deleteApp(value)));
});

async function reserve(slot, eventId = event) {
  const reservation = doc(
    guestDb,
    `weddings/${eventId}/memoryAlbums/main/reservations/${uid}_${slot}`
  );
  await setDoc(reservation, {
    uid,
    slot,
    guestName: "Test Guest",
    uploadKey: randomUUID(),
    createdAt: serverTimestamp(),
  });
}

test("initial reservation transaction can read absent slots, and the twenty first slot is denied", async () => {
  const reservationRefs = Array.from({ length: 20 }, (_, i) =>
    doc(guestDb, `${root}/reservations/${uid}_${i + 1}`)
  );
  const selected = await runTransaction(guestDb, async (tx) => {
    const snapshots = await Promise.all(reservationRefs.map((r) => tx.get(r)));
    const index = snapshots.findIndex((s) => !s.exists());
    assert.notEqual(index, -1);
    tx.set(reservationRefs[index], {
      uid,
      slot: index + 1,
      guestName: "Test Guest",
      uploadKey: randomUUID(),
      createdAt: serverTimestamp(),
    });
    return index + 1;
  });
  assert.equal(selected, 1);
  for (let slot = 2; slot <= 20; slot++) await reserve(slot);
  await assert.rejects(
    runTransaction(guestDb, async (tx) => {
      const snapshots = await Promise.all(
        reservationRefs.map((r) => tx.get(r))
      );
      assert.ok(snapshots.every((s) => s.exists()));
      tx.set(doc(guestDb, `${root}/reservations/${uid}_21`), {
        uid,
        slot: 21,
        guestName: "Test Guest",
        createdAt: serverTimestamp(),
      });
    }),
    (error) => error.code === "permission-denied"
  );
  await reserve(1, "faiz-harissa-groom");
  assert.equal(
    (
      await getDoc(
        doc(
          guestDb,
          "weddings/faiz-harissa-groom/memoryAlbums/main/reservations/" +
            uid +
            "_1"
        )
      )
    ).exists(),
    true
  );
});

test("reserved slot accepts original photo bytes once, rejects overwrite and denies another guest", async () => {
  const slot = 1;
  const reservationSnap = await getDoc(
    doc(guestDb, `${root}/reservations/${uid}_1`)
  );
  const uploadKey = reservationSnap.data().uploadKey;
  const path = `weddings/${event}/memoryAlbums/main/photos/${uid}/${slot}/original`;
  const file = ref(guestStorage, path);
  await uploadBytes(file, new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
    contentType: "image/jpeg",
    customMetadata: { uid, slot: String(slot), event, uploadKey },
  });
  await assert.rejects(
    uploadBytes(file, new Uint8Array([1, 2, 3]), {
      contentType: "image/jpeg",
      customMetadata: { uid, slot: String(slot), event, uploadKey },
    })
  );
  await assert.rejects(
    uploadBytes(ref(otherStorage, path), new Uint8Array([1]), {
      contentType: "image/jpeg",
      customMetadata: { uid, slot: String(slot), event },
    })
  );
  assert.deepEqual(
    Array.from(new Uint8Array(await getBytes(file))),
    [255, 216, 255, 217]
  );
  const reservation = reservationSnap.data();
  await setDoc(doc(guestDb, `${root}/photos/${uid}_${slot}`), {
    uid,
    slot,
    guestName: reservation.guestName,
    uploadKey,
    originalPath: `weddings/${event}/memoryAlbums/main/photos/${uid}/${slot}/original`,
    contentType: "image/jpeg",
    size: 4,
    createdAt: serverTimestamp(),
    status: "complete",
  });
  const gallery = await getDocs(query(collection(otherDb, `${root}/photos`), where("status", "==", "complete"), where("uid", "==", uid), orderBy("createdAt", "desc"), limit(24)));
  assert.equal(gallery.size, 1);
});

test("private voice metadata and bytes stay hidden from other guests", async () => {
  const voiceId = `${uid}_${randomUUID()}`;
  const uploadKey = voiceId.slice(uid.length + 1);
  const privatePath = `weddings/${event}/memoryAlbums/main/privateAudio/${voiceId}`;
  const privateDoc = doc(guestDb, `${root}/voicePrivate/${voiceId}`);
  await setDoc(privateDoc, {
    uid,
    guestName: "Test Guest",
    uploadKey,
    path: privatePath,
    contentType: "audio/webm",
    createdAt: serverTimestamp(),
    status: "pending",
  });
  await uploadBytes(ref(guestStorage, privatePath), new Uint8Array([1, 2, 3]), {
    contentType: "audio/webm",
    customMetadata: { uid, event, private: "true", uploadKey },
  });
  assert.equal((await getDoc(privateDoc)).exists(), true);
  assert.deepEqual(
    Array.from(new Uint8Array(await getBytes(ref(guestStorage, privatePath)))),
    [1, 2, 3]
  );
  await assert.rejects(getDoc(doc(otherDb, `${root}/voicePrivate/${voiceId}`)));
  await assert.rejects(getDoc(doc(anonymousDb, `${root}/voicePrivate/${voiceId}`)));
  await assert.rejects(getBytes(ref(otherStorage, privatePath)));
  await assert.rejects(getBytes(ref(anonymousStorage, privatePath)));
  assert.equal(
    (await getDoc(doc(ownerDb, `${root}/voicePrivate/${voiceId}`))).exists(),
    true
  );
  const publicId = `${uid}_${randomUUID()}`;
  const publicUploadKey = publicId.slice(uid.length + 1);
  const publicPath = `weddings/${event}/memoryAlbums/main/publicAudio/${publicId}`;
  await setDoc(doc(guestDb, `${root}/voicePublic/${publicId}`), {
    uid,
    guestName: "Test Guest",
    uploadKey: publicUploadKey,
    path: publicPath,
    contentType: "audio/webm",
    createdAt: serverTimestamp(),
    status: "pending",
  });
  await uploadBytes(ref(guestStorage, publicPath), new Uint8Array([1, 2, 3]), {
    contentType: "audio/webm",
    customMetadata: {
      uid,
      event,
      private: "false",
      uploadKey: publicUploadKey,
    },
  });
  await assert.rejects(getBytes(ref(otherStorage, publicPath)));
  const { updateDoc } = await import("firebase/firestore");
  await updateDoc(doc(guestDb, `${root}/voicePublic/${publicId}`), {
    status: "complete",
  });
  assert.deepEqual(
    Array.from(new Uint8Array(await getBytes(ref(otherStorage, publicPath)))),
    [1, 2, 3]
  );
});
