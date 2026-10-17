import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { getWeddingFirestore, getWeddingGuest } from "./firebase";
import { GiftItem, reserveGift } from "./data";
import { registryProducts, RegistryProduct } from "./registry";

export default function useRegistry() {
  const [reservations, setReservations] = useState<Record<string, GiftItem>>(
    {}
  );
  const [guestId, setGuestId] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const pending = useRef(false);

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;
    void getWeddingGuest()
      .then((uid) => {
        if (disposed) return;
        setGuestId(uid);
        unsubscribe = onSnapshot(
          collection(
            getWeddingFirestore(),
            "weddings",
            "faiz-harissa",
            "gifts"
          ),
          (snapshot) => {
            const saved = new Map(
              snapshot.docs.map((item) => [item.id, item.data()])
            );
            setReservations(
              Object.fromEntries(
                registryProducts.map((product) => {
                  const owner = saved.get(product.reservationId)?.claimedBy;
                  return [
                    product.reservationId,
                    {
                      id: product.reservationId,
                      name: product.name,
                      claimed: !!owner,
                      claimedBy: typeof owner === "string" ? owner : "",
                    },
                  ];
                })
              )
            );
            setReady(true);
            setError("");
          },
          () => {
            setReady(false);
            setError(
              "Status hadiah belum dapat disemak. Muat semula halaman untuk mencuba lagi."
            );
          }
        );
      })
      .catch(() => {
        if (!disposed)
          setError(
            "Status hadiah belum dapat disemak. Muat semula halaman untuk mencuba lagi."
          );
      });
    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, []);

  const toggleReservation = async (product: RegistryProduct) => {
    const gift = reservations[product.reservationId];
    if (!ready || !gift || pending.current) return false;
    pending.current = true;
    setPendingId(product.reservationId);
    try {
      await reserveGift(gift);
      return true;
    } finally {
      pending.current = false;
      setPendingId(null);
    }
  };

  return { reservations, guestId, ready, error, pendingId, toggleReservation };
}
