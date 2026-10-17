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
async function configureFund(
  slug,
  targetCents,
  { doubleTarget = false, doubleTotal = false, total = 0 } = {}
) {
  const response = await fetch(
    `http://${host}:${port}/v1/projects/demo-wedding/databases/(default)/documents/weddings/faiz-harissa/gift-funds/${slug}`,
    {
      method: "PATCH",
      headers: {
        Authorization: "Bearer owner",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields: {
          targetCents: doubleTarget
            ? { doubleValue: targetCents }
            : { integerValue: String(targetCents) },
          contributedCents: doubleTotal
            ? { doubleValue: total }
            : { integerValue: String(total) },
        },
      }),
    }
  );
  assert.equal(response.ok, true, await response.text());
}

test("console-created whole-number doubles accept contributions while fractional sen and overfunding remain blocked", async () => {
  for (const [slug, options] of [
    ["double-target", { doubleTarget: true }],
    ["double-total", { doubleTotal: true }],
    ["double-both", { doubleTarget: true, doubleTotal: true }],
  ]) {
    await configureFund(slug, 209900, options);
    await contributeToGift(alice, "alice", slug, `${slug}-first`, 10000);
    await contributeToGift(alice, "alice", slug, `${slug}-first`, 10000);
    assert.equal(
      (await getDoc(ref(alice, "gift-funds", slug))).data().contributedCents,
      10000
    );
    await denied(contributeToGift(bob, "bob", slug, `${slug}-fraction`, 1.5));
    await contributeToGift(bob, "bob", slug, `${slug}-final`, 199900);
    await denied(contributeToGift(alice, "alice", slug, `${slug}-over`, 1));
    assert.equal(
      (await getDoc(ref(alice, "gift-funds", slug))).data().contributedCents,
      209900
    );
  }
  await configureFund("fractional-target", 209900.5, { doubleTarget: true });
  await denied(
    contributeToGift(
      alice,
      "alice",
      "fractional-target",
      "fractional-target-receipt",
      100
    )
  );
  await configureFund("fractional-total", 209900, {
    doubleTotal: true,
    total: 0.5,
  });
  await denied(
    contributeToGift(
      alice,
      "alice",
      "fractional-total",
      "fractional-total-receipt",
      100
    )
  );
});
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

async function contributeToGift(
  db,
  uid,
  giftId,
  id,
  amountCents,
  reference = `wedding-${giftId}`
) {
  const receipt = ref(db, "contributions", id);
  if ((await getDoc(receipt)).exists()) return;
  const batch = writeBatch(db);
  batch.set(receipt, {
    uid,
    giftId,
    reference,
    amountCents,
    createdAt: serverTimestamp(),
  });
  batch.set(
    ref(db, "gift-funds", giftId),
    {
      contributedCents: increment(amountCents),
      lastContributionId: id,
    },
    { merge: true }
  );
  await batch.commit();
}

test("shared gift contributions keep independent totals, references and private immutable receipts", async () => {
  await configureFund("vacuum", 209900);
  await configureFund("future-gift", 100000);
  await Promise.all([
    contributeToGift(alice, "alice", "vacuum", "vacuum-a", 1050),
    contributeToGift(bob, "bob", "vacuum", "vacuum-b", 2000),
  ]);
  await contributeToGift(alice, "alice", "vacuum", "vacuum-a", 1050);
  assert.equal(
    (await getDoc(ref(bob, "gift-funds", "vacuum"))).data().contributedCents,
    3050
  );
  await contributeToGift(alice, "alice", "future-gift", "future-a", 500);
  assert.equal(
    (await getDoc(ref(bob, "gift-funds", "future-gift"))).data()
      .contributedCents,
    500
  );
  assert.equal(
    (await getDoc(ref(alice, "contributions", "vacuum-a"))).data().reference,
    "wedding-vacuum"
  );
  await denied(getDoc(ref(bob, "contributions", "vacuum-a")));
  await denied(
    getDocs(collection(bob, "weddings", "faiz-harissa", "contributions"))
  );
  await denied(getDoc(ref(anonymous, "gift-funds", "vacuum")));
  await denied(
    updateDoc(ref(alice, "contributions", "vacuum-a"), { amountCents: 1 })
  );
  await denied(deleteDoc(ref(alice, "contributions", "vacuum-a")));
  await denied(
    contributeToGift(
      alice,
      "alice",
      "vacuum",
      "bad-reference",
      100,
      "wedding-other"
    )
  );
  await denied(contributeToGift(alice, "bob", "vacuum", "wrong-owner", 100));
  await denied(contributeToGift(alice, "alice", "vacuum", "zero-fund", 0));
  await denied(contributeToGift(alice, "alice", "vacuum", "negative-fund", -1));
  await denied(
    contributeToGift(alice, "alice", "vacuum", "fraction-fund", 1.5)
  );
  await denied(
    contributeToGift(alice, "alice", "vacuum", "huge-fund", 100000001)
  );
  await denied(contributeToGift(alice, "alice", "Bad ID", "invalid-gift", 100));
  await denied(
    setDoc(ref(alice, "contributions", "unpaired-gift"), {
      uid: "alice",
      giftId: "vacuum",
      reference: "wedding-vacuum",
      amountCents: 100,
      createdAt: serverTimestamp(),
    })
  );
  await denied(
    updateDoc(ref(alice, "gift-funds", "vacuum"), { contributedCents: 999999 })
  );
  const forged = writeBatch(alice);
  forged.set(ref(alice, "contributions", "forged-total"), {
    uid: "alice",
    giftId: "vacuum",
    reference: "wedding-vacuum",
    amountCents: 100,
    createdAt: serverTimestamp(),
  });
  forged.set(ref(alice, "gift-funds", "vacuum"), {
    contributedCents: 999999,
    lastContributionId: "forged-total",
  });
  await denied(forged.commit());
  assert.equal(
    (await getDoc(ref(alice, "gift-funds", "vacuum"))).data().contributedCents,
    3050
  );
});

test("gift targets cap concurrent contributions and cannot be raised or created by guests", async () => {
  await configureFund("capped-gift", 1000);
  const outcomes = await Promise.allSettled([
    contributeToGift(alice, "alice", "capped-gift", "cap-a", 600),
    contributeToGift(bob, "bob", "capped-gift", "cap-b", 600),
  ]);
  assert.equal(
    outcomes.filter((result) => result.status === "fulfilled").length,
    1
  );
  const failedIndex = outcomes.findIndex(
    (result) => result.status === "rejected"
  );
  assert.equal(outcomes[failedIndex].reason.code, "permission-denied");
  assert.equal(
    (
      await getDoc(
        ref(
          failedIndex === 0 ? alice : bob,
          "contributions",
          failedIndex === 0 ? "cap-a" : "cap-b"
        )
      )
    ).exists(),
    false
  );
  await contributeToGift(alice, "alice", "capped-gift", "cap-final", 400);
  await contributeToGift(alice, "alice", "capped-gift", "cap-final", 400);
  assert.equal(
    (await getDoc(ref(alice, "gift-funds", "capped-gift"))).data()
      .contributedCents,
    1000
  );
  await denied(contributeToGift(bob, "bob", "capped-gift", "cap-over", 1));
  await denied(
    updateDoc(ref(alice, "gift-funds", "capped-gift"), { targetCents: 2000 })
  );
  const forged = writeBatch(alice);
  forged.set(ref(alice, "contributions", "raise-cap"), {
    uid: "alice",
    giftId: "capped-gift",
    reference: "wedding-capped-gift",
    amountCents: 100,
    createdAt: serverTimestamp(),
  });
  forged.set(ref(alice, "gift-funds", "capped-gift"), {
    targetCents: 2000,
    contributedCents: 1100,
    lastContributionId: "raise-cap",
  });
  await denied(forged.commit());
  await denied(
    setDoc(ref(alice, "gift-funds", "guest-created"), {
      targetCents: 1000,
      contributedCents: 0,
    })
  );
  await denied(
    contributeToGift(
      alice,
      "alice",
      "unconfigured",
      "unconfigured-receipt",
      100
    )
  );
});
