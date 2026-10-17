import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { Cormorant_Garamond, Great_Vibes } from "next/font/google";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Gift,
  Plus,
  Search,
  X,
} from "lucide-react";

import RegistryProductImage from "@/components/wedding/RegistryProductImage";
import {
  invitationReturnPath,
  registryPath,
  RegistryProduct,
} from "@/lib/wedding/registry";
import {
  RegistryLocale,
  registryCopy,
  registryErrorMessage,
} from "@/lib/wedding/registryCopy";
import GiftContributionProgress from "@/components/wedding/GiftContributionProgress";
import GiftContributionForm from "@/components/wedding/GiftContributionForm";
import useGiftContributions from "@/lib/wedding/useGiftContributions";
import { contributionCopy } from "@/lib/wedding/contributionCopy";
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

export default function WeddingRegistryPage({
  locale = "ms",
}: {
  locale?: RegistryLocale;
}) {
  const registry = useRegistry();
  const contributions = useGiftContributions();
  return (
    <RegistryContent
      registry={registry}
      contributions={contributions}
      locale={locale}
    />
  );
}

export function RegistryContent({
  registry,
  contributions,
  locale = "ms",
}: {
  locale?: RegistryLocale;
  registry: ReturnType<typeof useRegistry>;
  contributions: ReturnType<typeof useGiftContributions>;
}) {
  const router = useRouter();
  const copy = registryCopy[locale];
  const fundCopy = contributionCopy[locale];
  const pagePath = locale === "en" ? "/wedding-registry-en" : registryPath;
  const {
    products,
    reservations,
    guestId,
    ready,
    error,
    pendingId,
    toggleReservation,
    addCustomGift,
  } = registry;
  const connectionError = error ? copy.connectionError : "";
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [customOpen, setCustomOpen] = useState(false);
  const [newGift, setNewGift] = useState("");
  const [customError, setCustomError] = useState("");
  const [customNotice, setCustomNotice] = useState("");
  const customGiftId = useRef("");
  const customInput = useRef<HTMLInputElement>(null);
  const customButton = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selected = products.find(
    (product) => product.slug === router.query.gift
  );
  const selectedSlug = selected?.slug;
  const claim = selected ? reservations[selected.reservationId] : undefined;
  const mine = !!claim?.claimedBy && claim.claimedBy === guestId;
  const claimedElsewhere = !!claim?.claimed && !mine;

  const targetReached = (product: RegistryProduct) =>
    !!product.contribution &&
    contributions.ready &&
    (contributions.totals[product.slug] || 0) >=
      (contributions.targets[product.slug] ?? product.contribution.targetCents);

  const filtered = useMemo(
    () =>
      products
        .filter((product) => {
          const gift = reservations[product.reservationId];
          const matchesSearch = `${product.name} ${product.fullName || ""} ${
            copy.categories[product.category]
          }`
            .toLowerCase()
            .includes(search.trim().toLowerCase());
          return (
            matchesSearch &&
            (filter === "all" ||
              (ready &&
                filter === "available" &&
                !gift?.claimed &&
                (!product.contribution ||
                  (contributions.ready &&
                    (contributions.totals[product.slug] || 0) <
                      (contributions.targets[product.slug] ??
                        product.contribution.targetCents)))) ||
              (ready && filter === "mine" && gift?.claimedBy === guestId))
          );
        })
        .sort(
          (a, b) =>
            Number(!!reservations[a.reservationId]?.claimed) -
            Number(!!reservations[b.reservationId]?.claimed)
        ),
    [
      products,
      search,
      filter,
      reservations,
      guestId,
      ready,
      copy,
      contributions,
    ]
  );

  const bigGifts = filtered
    .filter((product) => product.contribution)
    .sort(
      (a, b) =>
        Number(targetReached(a) || !!reservations[a.reservationId]?.claimed) -
        Number(targetReached(b) || !!reservations[b.reservationId]?.claimed)
    );
  const regularGifts = filtered.filter((product) => !product.contribution);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    setActionError("");
    setNotice("");
    if (!selectedSlug) {
      if (dialog.open) dialog.close();
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (!dialog.open) dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedSlug]);

  useEffect(() => {
    if (customOpen) customInput.current?.focus();
  }, [customOpen]);

  const submitCustomGift = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newGift.trim() || !ready || pendingId) return;
    setCustomError("");
    setCustomNotice("");
    if (!customGiftId.current)
      customGiftId.current = `custom-${crypto.randomUUID()}`;
    try {
      if (!(await addCustomGift(newGift.trim(), customGiftId.current))) return;
      setCustomNotice(copy.customAdded(newGift.trim()));
      setNewGift("");
      customGiftId.current = "";
      setCustomOpen(false);
      setSearch("");
      setFilter("mine");
      customButton.current?.focus();
    } catch (cause) {
      setCustomError(registryErrorMessage(cause, locale, copy.giftSaveError));
    }
  };

  const closeDetails = () => {
    if (!router.query.gift) return;
    const query = { ...router.query };
    delete query.gift;
    void router.replace({ pathname: pagePath, query }, undefined, {
      shallow: true,
      scroll: false,
    });
  };

  const openDetails = (product: RegistryProduct) => {
    void router.push(
      {
        pathname: pagePath,
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
      if (cancelling && selected.custom) {
        closeDetails();
        setCustomNotice(copy.cancelled);
      }
      setNotice(cancelling ? copy.cancelled : copy.reservedNotice);
    } catch (cause) {
      setActionError(
        registryErrorMessage(cause, locale, copy.reservationSaveError)
      );
    }
  };

  const status = (product: RegistryProduct) => {
    if (targetReached(product)) return fundCopy.reached;
    if (!ready) return copy.unknown;
    const gift = reservations[product.reservationId];
    if (gift?.claimedBy === guestId) return copy.mine;
    return gift?.claimed
      ? copy.otherReserved
      : product.contribution
      ? contributions.ready
        ? fundCopy.contribute
        : fundCopy.checking
      : copy.available;
  };

  const renderGift = (product: RegistryProduct) => (
    <li key={product.slug}>
      <button
        type="button"
        className={`${styles.card} ${
          product.contribution ? styles["big-gift-card"] : ""
        }`}
        data-claimed={
          targetReached(product) ||
          (ready && !!reservations[product.reservationId]?.claimed)
        }
        onClick={() => openDetails(product)}
        aria-label={`${copy.view} ${product.name} — ${status(product)}`}
      >
        <div className={styles["image-wrap"]}>
          <RegistryProductImage product={product} locale={locale} />
          {(targetReached(product) ||
            (ready && reservations[product.reservationId]?.claimed)) && (
            <span className={styles["claimed-banner"]}>
              <Check aria-hidden="true" />
              {status(product)}
            </span>
          )}
        </div>
        <div className={styles["card-copy"]}>
          <p className={styles.category}>{copy.categories[product.category]}</p>
          <h2 className={titleFont.className}>
            {product.contribution
              ? product.fullName || product.name
              : product.name}
          </h2>
          <span
            className={styles.status}
            data-claimed={!!reservations[product.reservationId]?.claimed}
          >
            {(targetReached(product) ||
              (ready && reservations[product.reservationId]?.claimed)) && (
              <Check aria-hidden="true" />
            )}
            {status(product)}
          </span>
          {product.contribution && (
            <GiftContributionProgress
              target={
                contributions.targets[product.slug] ??
                product.contribution.targetCents
              }
              total={contributions.totals[product.slug] || 0}
              ready={contributions.ready}
              locale={locale}
            />
          )}
        </div>
      </button>
    </li>
  );

  return (
    <>
      <Head>
        <title>{copy.pageTitle}</title>
        <meta name="description" content={copy.meta} />
        <meta name="theme-color" content="#fffdf8" />
      </Head>
      <main
        lang={locale}
        className={`${garden.page} ${styles.page} garden-english-wedding-paper`}
      >
        <header className={styles.topbar}>
          <Link href={invitationReturnPath}>
            <ArrowLeft aria-hidden="true" />
            {copy.back}
          </Link>
          <span className={titleFont.className}>H &amp; F</span>
        </header>
        <div className={styles.content}>
          <div className={styles.introduction}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1 className={titleFont.className}>{copy.heading}</h1>
            <p className={`${namesFont.className} ${styles.names}`}>
              Harissa &amp; Faiz
            </p>
            <p className={styles["intro-copy"]}>{copy.intro}</p>
          </div>

          <div className={styles["registry-guidance"]}>
            <p>{copy.guidance}</p>
            <button
              ref={customButton}
              type="button"
              className={styles.secondary}
              aria-expanded={customOpen}
              aria-controls="custom-gift-form"
              disabled={!!pendingId}
              onClick={() => {
                setCustomOpen(!customOpen);
                setCustomError("");
              }}
            >
              <Plus aria-hidden="true" />
              {copy.addOther}
            </button>
          </div>
          {customOpen && (
            <form
              id="custom-gift-form"
              className={styles["custom-form"]}
              onSubmit={submitCustomGift}
            >
              <h2 className={titleFont.className}>{copy.customTitle}</h2>
              <p>{copy.customIntro}</p>
              <label htmlFor="custom-gift-name">{copy.giftName}</label>
              <input
                ref={customInput}
                id="custom-gift-name"
                name="giftName"
                required
                maxLength={100}
                placeholder={copy.giftPlaceholder}
                value={newGift}
                disabled={!!pendingId}
                onChange={(event) => {
                  setNewGift(event.target.value);
                  customGiftId.current = "";
                }}
              />
              <div className={styles["custom-actions"]}>
                <button
                  className={styles.primary}
                  disabled={!ready || !!pendingId || !newGift.trim()}
                >
                  {pendingId === customGiftId.current
                    ? copy.saving
                    : copy.addReserve}
                </button>
                <button
                  type="button"
                  className={styles.secondary}
                  disabled={!!pendingId}
                  onClick={() => {
                    setCustomOpen(false);
                    customButton.current?.focus();
                  }}
                >
                  {copy.cancel}
                </button>
              </div>
              {!ready && (
                <p role="status">{connectionError || copy.checking}</p>
              )}
              {customError && (
                <p role="alert" className={styles["action-error"]}>
                  {customError}
                </p>
              )}
            </form>
          )}
          {customNotice && (
            <p role="status" className={styles["custom-notice"]}>
              {customNotice}
            </p>
          )}

          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={copy.search}
                aria-label={copy.search}
              />
            </label>
            <div
              className={styles.filters}
              role="group"
              aria-label={copy.filter}
            >
              {(
                [
                  ["all", copy.all],
                  ["available", copy.available],
                  ["mine", copy.myFilter],
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
            <p aria-live="polite">{copy.count(filtered.length)}</p>
            <span>{copy.viewHint}</span>
          </div>
          {error && (
            <p className={styles["connection-message"]} role="status">
              {connectionError} {copy.offlineReference}
            </p>
          )}
          {bigGifts.length > 0 && (
            <section
              className={styles["big-gifts"]}
              aria-labelledby="big-gifts-title"
            >
              <h2 id="big-gifts-title" className={titleFont.className}>
                {fundCopy.heading}
              </h2>
              <p>{fundCopy.intro}</p>
              <ul className={styles["big-gift-grid"]}>
                {bigGifts.map(renderGift)}
              </ul>
            </section>
          )}
          {regularGifts.length > 0 && (
            <>
              <h2
                className={`${titleFont.className} ${styles["regular-heading"]}`}
              >
                {fundCopy.regularHeading}
              </h2>
              <ul className={styles.grid}>{regularGifts.map(renderGift)}</ul>
            </>
          )}
          {filtered.length === 0 && (
            <div className={styles.empty}>
              <Gift aria-hidden="true" />
              <p>
                {filter === "mine" && !search
                  ? copy.emptyMine
                  : copy.emptySearch}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilter("all");
                }}
              >
                {copy.viewAll}
              </button>
            </div>
          )}
          <p className={styles.note}>{copy.reservationNote}</p>
          <footer className={styles.footer}>
            <p className={titleFont.className}>{copy.footer}</p>
            <Link href={invitationReturnPath}>
              <ArrowLeft aria-hidden="true" />
              {copy.back}
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
                aria-label={copy.close}
                onClick={closeDetails}
                autoFocus
              >
                <X aria-hidden="true" />
              </button>
              <div className={styles["detail-image"]}>
                <RegistryProductImage
                  key={selected.slug}
                  product={selected}
                  locale={locale}
                />
              </div>
              <div className={styles["detail-copy"]}>
                <p className={styles.eyebrow}>
                  {copy.categories[selected.category]}
                </p>
                <h2 id="gift-detail-title" className={titleFont.className}>
                  {selected.fullName || selected.name}
                </h2>
                <p className={styles["detail-description"]}>
                  {selected.custom
                    ? copy.customDescription
                    : copy.productDescription}
                </p>
                <p
                  className={styles["detail-status"]}
                  data-claimed={ready && !!claim?.claimed}
                  role="status"
                >
                  {status(selected)}
                </p>
                {selected.contribution && (
                  <GiftContributionProgress
                    target={
                      contributions.targets[selected.slug] ??
                      selected.contribution.targetCents
                    }
                    total={contributions.totals[selected.slug] || 0}
                    ready={contributions.ready}
                    locale={locale}
                  />
                )}
                <div className={styles["detail-actions"]}>
                  {(!selected.contribution || claim?.claimed) && (
                    <button
                      type="button"
                      className={styles.primary}
                      disabled={!ready || !!pendingId || claimedElsewhere}
                      onClick={() => void reserve()}
                    >
                      {pendingId === selected.reservationId
                        ? copy.saving
                        : mine
                        ? copy.cancelReservation
                        : claimedElsewhere
                        ? copy.otherReserved
                        : copy.reserve}
                    </button>
                  )}
                  {selected.shopUrl && (
                    <a
                      className={styles.secondary}
                      href={selected.shopUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {copy.shopee}
                      <ArrowUpRight aria-hidden="true" />
                    </a>
                  )}
                </div>
                {selected.contribution && !claim?.claimed && (
                  <GiftContributionForm
                    key={selected.slug}
                    product={selected}
                    locale={locale}
                    contributions={{
                      ...contributions,
                      ready: ready && contributions.ready,
                    }}
                  />
                )}
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
                    {connectionError || copy.checking}
                  </p>
                )}
                {!selected.contribution && (
                  <p className={styles["detail-note"]}>{copy.detailNote}</p>
                )}
              </div>
            </div>
          )}
        </dialog>
      </main>
    </>
  );
}
