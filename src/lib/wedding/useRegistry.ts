import { useEffect, useRef, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";

import { getWeddingFirestore, getWeddingGuest } from "./firebase";
import { GiftItem, reserveGift, createGift } from "./data";
import { registryProducts, RegistryProduct } from "./registry";

export default function useRegistry() {
  const [products, setProducts] = useState(registryProducts);
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
            const customProducts: RegistryProduct[] = snapshot.docs
              .filter(
                (item) =>
                  item.id.startsWith("custom-") &&
                  !registryProducts.some(
                    (product) => product.reservationId === item.id
                  ) &&
                  typeof item.data().name === "string" &&
                  !!item.data().claimedBy
              )
              .map((item) => ({
                slug: item.id,
                reservationId: item.id,
                name: item.data().name,
                category: "Hadiah tetamu",
                custom: true,
              }));
            const allProducts = [...registryProducts, ...customProducts];
            setProducts(allProducts);
            setReservations(
              Object.fromEntries(
                allProducts.map((product) => {
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

  const addCustomGift = async (name: string, id: string) => {
    if (!ready || pending.current) return false;
    pending.current = true;
    setPendingId(id);
    try {
      await createGift(name, id);
      return true;
    } finally {
      pending.current = false;
      setPendingId(null);
    }
  };

  return {
    products,
    reservations,
    guestId,
    ready,
    error,
    pendingId,
    toggleReservation,
    addCustomGift,
  };
}
