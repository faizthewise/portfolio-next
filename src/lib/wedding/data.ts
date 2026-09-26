import {
  collection,
  doc,
  FirestoreError,
  getDoc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { getWeddingFirestore, getWeddingGuest } from "./firebase";

export type GiftItem = {
  id: string;
  name: string;
  claimed: boolean;
  claimedBy?: string;
  contribution?: { target: number; contributed: number; duitNowQr: string };
};

export type WeddingWish = { name: string; message: string };

export const initialGifts: GiftItem[] = [
  { id: "air-fryer", name: "Air fryer", claimed: false },
  { id: "dinnerware", name: "Set pinggan mangkuk", claimed: false },
  { id: "vacuum", name: "Penyedut hampagas", claimed: false },
  { id: "bedding", name: "Set cadar king", claimed: false },
  {
    id: "coffee",
    name: "Mesin kopi",
    claimed: false,
    contribution: {
      target: 3000,
      contributed: 0,
      duitNowQr: "/images/duitnow-qr-placeholder.svg",
    },
  },
];

const records = (name: string) =>
  collection(getWeddingFirestore(), "weddings", "faiz-harissa", name);

export function subscribeWedding(
  onGifts: (gifts: GiftItem[]) => void,
  onWishes: (wishes: WeddingWish[]) => void,
  onError: (error: FirestoreError, source: "gifts" | "wishes") => void
) {
  const stopGifts = onSnapshot(
    records("gifts"),
    (snapshot) => {
      const saved = new Map(
        snapshot.docs.map((item) => [item.id, item.data()])
      );
      const gifts = initialGifts.map((gift) => {
        const value = saved.get(gift.id);
        return {
          ...gift,
          claimed: !!value?.claimedBy,
          claimedBy: value?.claimedBy ?? "",
          ...(gift.contribution && {
            contribution: {
              ...gift.contribution,
              contributed: (value?.contributedCents ?? 0) / 100,
            },
          }),
        };
      });
      snapshot.docs.forEach((item) => {
        if (!initialGifts.some((gift) => gift.id === item.id)) {
          const value = item.data();
          gifts.push({
            id: item.id,
            name: value.name,
            claimed: !!value.claimedBy,
            claimedBy: value.claimedBy,
          });
        }
      });
      onGifts(gifts);
    },
    (error) => onError(error, "gifts")
  );
  const stopWishes = onSnapshot(
    query(records("wishes"), orderBy("updatedAt", "desc"), limit(100)),
    (snapshot) =>
      onWishes(
        snapshot.docs
          .map((item) => {
            const value = item.data();
            return { name: value.name, message: value.message };
          })
          .reverse()
      ),
    (error) => onError(error, "wishes")
  );
  return () => {
    stopGifts();
    stopWishes();
  };
}

export async function saveRsvp(form: FormData) {
  const uid = await getWeddingGuest();
  const name = String(form.get("nama") ?? "").trim();
  const attendance = String(form.get("kehadiran") ?? "");
  const guests =
    attendance === "Hadir, insya-Allah" ? Number(form.get("tetamu")) : 0;
  const message = String(form.get("ucapan") ?? "").trim();
  if (
    !name ||
    name.length > 100 ||
    message.length > 2000 ||
    !["Hadir, insya-Allah", "Maaf, tidak dapat hadir"].includes(attendance) ||
    !Number.isInteger(guests) ||
    guests < 0 ||
    guests > 5
  ) {
    throw new Error("Maklumat RSVP tidak sah.");
  }
  const batch = writeBatch(getWeddingFirestore());
  batch.set(doc(records("rsvps"), uid), {
    name,
    attendance,
    guests,
    updatedAt: serverTimestamp(),
  });
  const wish = doc(records("wishes"), uid);
  if (message) batch.set(wish, { name, message, updatedAt: serverTimestamp() });
  else batch.delete(wish);
  await batch.commit();
}

export async function reserveGift(gift: GiftItem) {
  const uid = await getWeddingGuest();
  const ref = doc(records("gifts"), gift.id);
  await runTransaction(getWeddingFirestore(), async (transaction) => {
    const snapshot = await transaction.get(ref);
    const owner = snapshot.data()?.claimedBy;
    const desiredOwner = gift.claimed ? "" : uid;
    if (owner === desiredOwner) return;
    if ((owner && owner !== uid) || (gift.claimed && owner !== uid))
      throw new Error(
        "Pilihan hadiah telah berubah. Sila semak senarai terkini."
      );
    transaction.set(ref, {
      name: gift.name,
      claimedBy: desiredOwner,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function createGift(name: string, id: string) {
  if (!name.trim() || name.trim().length > 100)
    throw new Error("Nama hadiah tidak sah.");
  await reserveGift({ id, name: name.trim(), claimed: false });
}

export async function recordContribution(amount: number, id: string) {
  const uid = await getWeddingGuest();
  const cents = Math.round(amount * 100);
  if (
    !Number.isFinite(amount) ||
    cents < 1 ||
    cents > 300000 ||
    Math.abs(amount * 100 - cents) > 0.00001
  ) {
    throw new Error("Masukkan jumlah sumbangan yang sah.");
  }
  const gift = doc(records("gifts"), "coffee");
  const contribution = doc(records("contributions"), id);
  if ((await getDoc(contribution)).exists()) return;
  const batch = writeBatch(getWeddingFirestore());
  batch.set(contribution, {
    uid,
    amountCents: cents,
    createdAt: serverTimestamp(),
  });
  batch.set(
    gift,
    {
      name: "Mesin kopi",
      contributedCents: increment(cents),
      lastContribution: id,
    },
    { merge: true }
  );
  try {
    await batch.commit();
  } catch (error) {
    // A retry with the same ID must never count a payment report twice.
    if ((await getDoc(contribution)).exists()) return;
    throw error;
  }
}
