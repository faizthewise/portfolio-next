import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getWeddingFirestore, getWeddingGuest } from "./firebase";
import { recordGiftContribution } from "./contributions";

export default function useGiftContributions() {
  const [totals, setTotals] = useState<Record<string, number>>({});
  const [targets, setTargets] = useState<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void getWeddingGuest()
      .then(() => {
        if (disposed) return;
        unsubscribe = onSnapshot(
          collection(
            getWeddingFirestore(),
            "weddings",
            "faiz-harissa",
            "gift-funds"
          ),
          (snapshot) => {
            setTotals(
              Object.fromEntries(
                snapshot.docs.map((item) => [
                  item.id,
                  item.data().contributedCents ?? 0,
                ])
              )
            );
            setTargets(
              Object.fromEntries(
                snapshot.docs
                  .filter((item) => {
                    const target = item.data().targetCents;
                    return Number.isSafeInteger(target) && target > 0;
                  })
                  .map((item) => [item.id, item.data().targetCents])
              )
            );
            setReady(true);
            setError(false);
          },
          () => {
            setReady(false);
            setError(true);
          }
        );
      })
      .catch(() => {
        if (!disposed) setError(true);
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  const record = async (slug: string, amount: string, id: string) => {
    if (!ready || pending.current) return false;
    pending.current = true;
    setSaving(true);
    try {
      await recordGiftContribution(slug, amount, id);
      return true;
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };
  return { totals, targets, ready, error, saving, record };
}
