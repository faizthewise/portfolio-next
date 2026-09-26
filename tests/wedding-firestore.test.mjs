import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { initializeApp, deleteApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  runTransaction,
  increment,
} from "firebase/firestore";

// Deliberately use a demo project and require an explicit localhost emulator.
if (!process.env.FIRESTORE_EMULATOR_HOST)
  throw new Error(
    "Start the Firestore emulator and set FIRESTORE_EMULATOR_HOST."
  );
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(":");
assert.ok(["localhost", "127.0.0.1"].includes(host));
const apps = [];
function client(uid) {
  const app = initializeApp(
    { projectId: "demo-wedding" },
    uid || "unauthenticated"
  );
  apps.push(app);
  const db = getFirestore(app);
  connectFirestoreEmulator(
    db,
    host,
    Number(port),
    uid ? { mockUserToken: { sub: uid } } : {}
  );
  return db;
}
const alice = client("alice");
const bob = client("bob");
const anonymous = client();
const ref = (db, kind, id) => doc(db, "weddings", "faiz-harissa", kind, id);
const denied = (promise) =>
  assert.rejects(promise, (error) => error.code === "permission-denied");
before(async () => {
  const response = await fetch(
    `http://${host}:${port}/emulator/v1/projects/demo-wedding/databases/(default)/documents`,
    { method: "DELETE" }
  );
  assert.equal(response.ok, true);
});
after(() => Promise.all(apps.map(deleteApp)));

test("RSVPs are private, validated, and wishes are shared", async () => {
  const batch = writeBatch(alice);
  batch.set(ref(alice, "rsvps", "alice"), {
    name: "Alice",
    attendance: "Hadir, insya-Allah",
    guests: 2,
    updatedAt: serverTimestamp(),
  });
  batch.set(ref(alice, "wishes", "alice"), {
    name: "Alice",
    message: "Tahniah!",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
  assert.equal((await getDoc(ref(alice, "rsvps", "alice"))).data().guests, 2);
  await denied(getDoc(ref(bob, "rsvps", "alice")));
  await denied(getDocs(collection(alice, "weddings", "faiz-harissa", "rsvps")));
  assert.equal(
    (await getDoc(ref(bob, "wishes", "alice"))).data().message,
    "Tahniah!"
  );
  await denied(getDoc(ref(anonymous, "wishes", "alice")));
  await denied(
    updateDoc(ref(bob, "wishes", "alice"), {
      message: "Changed",
      updatedAt: serverTimestamp(),
    })
  );
  await denied(
    updateDoc(ref(alice, "rsvps", "alice"), {
      guests: 6,
      updatedAt: serverTimestamp(),
    })
  );
  await denied(
    updateDoc(ref(alice, "rsvps", "alice"), {
      phone: "extra",
      updatedAt: serverTimestamp(),
    })
  );
  await deleteDoc(ref(alice, "wishes", "alice"));
});

test("only one guest wins a concurrent reservation, and only its owner can cancel", async () => {
  const claim = (db, uid) =>
    runTransaction(db, async (transaction) => {
      const gift = ref(db, "gifts", "air-fryer");
      const snapshot = await transaction.get(gift);
      if (snapshot.data()?.claimedBy) throw new Error("Already claimed");
      transaction.set(gift, {
        name: "Air fryer",
        claimedBy: uid,
        updatedAt: serverTimestamp(),
      });
    });
  const outcomes = await Promise.allSettled([
    claim(alice, "alice"),
    claim(bob, "bob"),
  ]);
  assert.equal(
    outcomes.filter((item) => item.status === "fulfilled").length,
    1
  );
  const owner = (await getDoc(ref(alice, "gifts", "air-fryer"))).data()
    .claimedBy;
  const ownerDb = owner === "alice" ? alice : bob;
  const otherDb = owner === "alice" ? bob : alice;
  await denied(
    updateDoc(ref(otherDb, "gifts", "air-fryer"), {
      claimedBy: "",
      updatedAt: serverTimestamp(),
    })
  );
  await updateDoc(ref(ownerDb, "gifts", "air-fryer"), {
    claimedBy: "",
    updatedAt: serverTimestamp(),
  });
  await denied(
    setDoc(ref(alice, "gifts", "unknown"), {
      name: "Fake",
      claimedBy: "alice",
      updatedAt: serverTimestamp(),
    })
  );
  await setDoc(
    ref(alice, "gifts", "custom-12345678-1234-1234-1234-123456789012"),
    { name: "Toaster", claimedBy: "alice", updatedAt: serverTimestamp() }
  );
});

async function contribute(db, uid, id, amountCents) {
  const record = ref(db, "contributions", id);
  if ((await getDoc(record)).exists()) return;
  const batch = writeBatch(db);
  batch.set(record, { uid, amountCents, createdAt: serverTimestamp() });
  batch.set(
    ref(db, "gifts", "coffee"),
    {
      name: "Mesin kopi",
      contributedCents: increment(amountCents),
      lastContribution: id,
    },
    { merge: true }
  );
  await batch.commit();
}

test("contributions are atomic, retry-safe, capped, and cannot be forged independently", async () => {
  await Promise.all([
    contribute(alice, "alice", "first", 10000),
    contribute(bob, "bob", "second", 20000),
  ]);
  await contribute(alice, "alice", "first", 10000);
  assert.equal(
    (await getDoc(ref(alice, "gifts", "coffee"))).data().contributedCents,
    30000
  );
  await denied(
    updateDoc(ref(alice, "gifts", "coffee"), { contributedCents: 1 })
  );
  await denied(
    setDoc(ref(alice, "contributions", "unpaired"), {
      uid: "alice",
      amountCents: 100,
      createdAt: serverTimestamp(),
    })
  );
  await denied(contribute(alice, "alice", "overflow", 300000));
  await denied(contribute(alice, "alice", "negative", -1));
  await denied(contribute(alice, "alice", "fraction", 1.5));
  await denied(getDoc(ref(bob, "contributions", "first")));
  await denied(deleteDoc(ref(alice, "contributions", "first")));
  assert.equal(
    (await getDoc(ref(alice, "gifts", "coffee"))).data().contributedCents,
    30000
  );
});
