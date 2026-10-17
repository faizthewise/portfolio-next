import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Gift, Search, X } from "lucide-react";

import RegistryProductImage from "@/components/wedding/RegistryProductImage";
import {
  invitationReturnPath,
  registryPath,
  registryProducts,
  RegistryProduct,
} from "@/lib/wedding/registry";
import useRegistry from "@/lib/wedding/useRegistry";
import garden from "@/styles/WeddingGarden.module.css";
import styles from "@/styles/WeddingRegistry.module.css";

const titleFont = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});
const namesFont = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});
type Filter = "all" | "available" | "mine";

export default function WeddingRegistry() {
  const router = useRouter();
  const { reservations, guestId, ready, error, pendingId, toggleReservation } =
    useRegistry();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = registryProducts.find(
    (product) => product.slug === router.query.gift
  );
  const claim = selected ? reservations[selected.reservationId] : undefined;
  const mine = !!claim?.claimedBy && claim.claimedBy === guestId;
  const claimedElsewhere = !!claim?.claimed && !mine;

  const filtered = useMemo(
    () =>
      registryProducts.filter((product) => {
        const gift = reservations[product.reservationId];
        const matchesSearch = `${product.name} ${product.fullName || ""} ${
          product.category
        }`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        return (
          matchesSearch &&
          (filter === "all" ||
            (ready && filter === "available" && !gift?.claimed) ||
            (ready && filter === "mine" && gift?.claimedBy === guestId))
        );
      }),
    [search, filter, reservations, guestId, ready]
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    setActionError("");
    setNotice("");
    if (!selected) {
      if (dialog.open) dialog.close();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selected]);

  const closeDetails = () => {
    if (!router.query.gift) return;
    const query = { ...router.query };
    delete query.gift;
    void router.replace({ pathname: registryPath, query }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  const openDetails = (product: RegistryProduct) => {
    void router.push(
      {
        pathname: registryPath,
        query: { ...router.query, gift: product.slug },
      },
      undefined,
      { shallow: true, scroll: false }
    );
  };

  const reserve = async () => {
    if (!selected) return;
    setActionError("");
    setNotice("");
    const cancelling = mine;
    try {
      if (!(await toggleReservation(selected))) return;
      setNotice(
        cancelling
          ? "Pilihan hadiah telah dibatalkan."
          : "Hadiah ini kini ditandakan sebagai pilihan anda. Terima kasih!"
      );
    } catch (cause) {
      setActionError(
        cause instanceof Error && !cause.message.includes("Firebase")
          ? cause.message
          : "Pilihan belum disimpan. Sila cuba lagi."
      );
    }
  };

  const status = (product: RegistryProduct) => {
    if (!ready) return "Status belum disemak";
    const gift = reservations[product.reservationId];
    if (gift?.claimedBy === guestId) return "Pilihan anda";
    return gift?.claimed ? "Sudah dipilih" : "Masih tersedia";
  };

  return (
    <>
      <Head>
        <title>Hadiah buat Harissa &amp; Faiz</title>
        <meta
          name="description"
          content="Senarai hadiah perkahwinan Harissa dan Faiz. Pilih hadiah, semak butiran produk, dan lihat di Shopee."
        />
        <meta name="theme-color" content="#fffdf8" />
      </Head>
      <main
        className={`${garden.page} ${styles.page} garden-english-wedding-paper`}
      >
        <header className={styles.topbar}>
          <Link href={invitationReturnPath}>
            <ArrowLeft aria-hidden="true" /> Kembali ke undangan
          </Link>
          <span className={titleFont.className}>H &amp; F</span>
        </header>
        <div className={styles.content}>
          <div className={styles.introduction}>
            <p className={styles.eyebrow}>Untuk sebuah kehidupan bersama</p>
            <h1 className={titleFont.className}>Hadiah penuh makna</h1>
            <p className={`${namesFont.className} ${styles.names}`}>
              Harissa &amp; Faiz
            </p>
            <p className={styles["intro-copy"]}>
              Kehadiran dan doa restu anda sudah cukup bermakna. Jika ingin
              menitipkan hadiah, inilah beberapa pilihan buat kediaman kami.
            </p>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari hadiah"
                aria-label="Cari hadiah"
              />
            </label>
            <div
              className={styles.filters}
              role="group"
              aria-label="Tapis hadiah"
            >
              {(
                [
                  ["all", "Semua"],
                  ["available", "Masih tersedia"],
                  ["mine", "Pilihan saya"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  disabled={value !== "all" && !ready}
                  onClick={() => setFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles["list-heading"]}>
            <p aria-live="polite">{filtered.length} pilihan hadiah</p>
            <span>Pilih hadiah untuk melihat butiran</span>
          </div>
          {error && (
            <p className={styles["connection-message"]} role="status">
              {error} Anda masih boleh melihat produk di Shopee.
            </p>
          )}
          <ul className={styles.grid}>
            {filtered.map((product) => (
              <li key={product.slug}>
                <button
                  type="button"
                  className={styles.card}
                  onClick={() => openDetails(product)}
                  aria-label={`Lihat ${product.name}`}
                >
                  <div className={styles["image-wrap"]}>
                    <RegistryProductImage product={product} />
                  </div>
                  <div className={styles["card-copy"]}>
                    <p className={styles.category}>{product.category}</p>
                    <h2 className={titleFont.className}>{product.name}</h2>
                    <span
                      className={styles.status}
                      data-claimed={
                        !!reservations[product.reservationId]?.claimed
                      }
                    >
                      {ready &&
                        reservations[product.reservationId]?.claimed && (
                          <Check aria-hidden="true" />
                        )}
                      {status(product)}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <Gift aria-hidden="true" />
              <p>
                {filter === "mine" && !search
                  ? "Anda belum memilih hadiah."
                  : "Tiada hadiah yang sepadan."}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                Lihat semua hadiah
              </button>
            </div>
          )}
          <p className={styles.note}>
            Tandakan hadiah sebagai pilihan anda sebelum membeli supaya tetamu
            lain tidak memilih hadiah yang sama. Pilihan boleh dibatalkan
            melalui pelayar yang sama.
          </p>
          <footer className={styles.footer}>
            <p className={titleFont.className}>
              Terima kasih atas ingatan anda.
            </p>
            <Link href={invitationReturnPath}>
              <ArrowLeft aria-hidden="true" /> Kembali ke undangan
            </Link>
          </footer>
        </div>

        <dialog
          ref={dialogRef}
          className={styles.dialog}
          aria-labelledby="gift-detail-title"
          onClose={closeDetails}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              const rect = event.currentTarget.getBoundingClientRect();
              if (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
              )
                closeDetails();
            }
          }}
        >
          {selected && (
            <div className={styles["dialog-content"]}>
              <button
                type="button"
                className={styles.close}
                aria-label="Tutup butiran hadiah"
                onClick={closeDetails}
                autoFocus
              >
                <X aria-hidden="true" />
              </button>
              <div className={styles["detail-image"]}>
                <RegistryProductImage key={selected.slug} product={selected} />
              </div>
              <div className={styles["detail-copy"]}>
                <p className={styles.eyebrow}>{selected.category}</p>
                <h2 id="gift-detail-title" className={titleFont.className}>
                  {selected.fullName || selected.name}
                </h2>
                <p className={styles["detail-description"]}>
                  {selected.fullName
                    ? "Semak pilihan warna, saiz dan maklumat penghantaran di Shopee sebelum membeli."
                    : "Lihat maklumat penuh produk, jenama dan pilihan yang tersedia di Shopee."}
                </p>
                <p className={styles["detail-status"]} role="status">
                  {status(selected)}
                </p>
                <div className={styles["detail-actions"]}>
                  <button
                    type="button"
                    className={styles.primary}
                    disabled={!ready || !!pendingId || claimedElsewhere}
                    onClick={() => void reserve()}
                  >
                    {pendingId === selected.reservationId
                      ? "Sedang menyimpan…"
                      : mine
                      ? "Batalkan pilihan saya"
                      : claimedElsewhere
                      ? "Sudah dipilih tetamu lain"
                      : "Saya ingin hadiahkan ini"}
                  </button>
                  <a
                    className={styles.secondary}
                    href={selected.shopUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Beli di Shopee <ArrowUpRight aria-hidden="true" />
                  </a>
                </div>
                {actionError && (
                  <p className={styles["action-error"]} role="alert">
                    {actionError}
                  </p>
                )}
                {notice && (
                  <p className={styles["action-notice"]} role="status">
                    {notice}
                  </p>
                )}
                {!ready && (
                  <p className={styles["detail-note"]}>
                    {error || "Sedang menyemak status hadiah…"}
                  </p>
                )}
                <p className={styles["detail-note"]}>
                  Menandakan pilihan tidak membuat pembelian. Pembelian dibuat
                  terus di Shopee.
                </p>
              </div>
            </div>
          )}
        </dialog>
      </main>
    </>
  );
}
