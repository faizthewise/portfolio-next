import {
  doc,
  getDoc,
  getDocFromServer,
  increment,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { getWeddingFirestore, getWeddingGuest } from "./firebase";
import { registryProducts } from "./registry";

// Amounts are stored as integer sen; this also rejects exponent notation and
// extra decimal places instead of silently rounding the guest's transfer.
export function contributionCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [ringgit, sen = ""] = value.trim().split(".");
  const cents = Number(ringgit) * 100 + Number(sen.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100_000_000
    ? cents
    : null;
}

export const contributionReference = (slug: string) => `wedding-${slug}`;

export class ContributionLimitError extends Error {}

export async function recordGiftContribution(
  slug: string,
  amount: string,
  id: string
) {
  const product = registryProducts.find((item) => item.slug === slug);
  const cents = contributionCents(amount);
  if (
    !product?.contribution ||
    product.contribution.qrIsPlaceholder ||
    cents === null
  )
    throw new Error("Contribution is not available.");
  const uid = await getWeddingGuest();
  const db = getWeddingFirestore();
  const receipt = doc(db, "weddings", "faiz-harissa", "contributions", id);
  const fund = doc(db, "weddings", "faiz-harissa", "gift-funds", slug);
  const matchesReceipt = (saved: {
    uid?: unknown;
    giftId?: unknown;
    amountCents?: unknown;
  }) =>
    saved.uid === uid && saved.giftId === slug && saved.amountCents === cents;
  const existing = await getDoc(receipt);
  if (existing.exists()) {
    if (matchesReceipt(existing.data())) return;
    throw new Error("Contribution details have changed.");
  }
  const current = (await getDocFromServer(fund)).data();
  if (
    !current ||
    !Number.isSafeInteger(current.targetCents) ||
    current.targetCents <= 0
  )
    throw new Error("Contribution target is not configured.");
  if (cents > current.targetCents - (current.contributedCents || 0))
    throw new ContributionLimitError(
      "Contribution exceeds the remaining target."
    );
  const batch = writeBatch(db);
  batch.set(receipt, {
    uid,
    giftId: slug,
    reference: contributionReference(slug),
    amountCents: cents,
    createdAt: serverTimestamp(),
  });
  // Atomic increments let separate guests contribute concurrently. The rules
  // require a new, matching receipt in the same batch for every increment.
  batch.set(
    fund,
    { contributedCents: increment(cents), lastContributionId: id },
    { merge: true }
  );
  try {
    await batch.commit();
  } catch (cause) {
    // A response can be lost after a successful commit. Retrying the same
    // receipt must not count the guest's transfer twice.
    const saved = await getDoc(receipt);
    if (saved.exists() && matchesReceipt(saved.data())) return;
    const latest = (await getDocFromServer(fund)).data();
    if (latest && cents > latest.targetCents - (latest.contributedCents || 0))
      throw new ContributionLimitError(
        "Contribution exceeds the remaining target."
      );
    throw cause;
  }
}
