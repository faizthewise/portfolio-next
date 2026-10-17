import { FormEvent, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { RegistryProduct } from "@/lib/wedding/registry";
import { RegistryLocale } from "@/lib/wedding/registryCopy";
import { contributionCopy } from "@/lib/wedding/contributionCopy";
import {
  contributionCents,
  contributionReference,
  ContributionLimitError,
} from "@/lib/wedding/contributions";
import useGiftContributions from "@/lib/wedding/useGiftContributions";
import styles from "@/styles/WeddingRegistry.module.css";

export default function GiftContributionForm({
  product,
  locale,
  contributions,
}: {
  product: RegistryProduct;
  locale: RegistryLocale;
  contributions: ReturnType<typeof useGiftContributions>;
}) {
  const copy = contributionCopy[locale];
  const [amount, setAmount] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [copyNotice, setCopyNotice] = useState("");
  const [qrLoaded, setQrLoaded] = useState(false);
  const [qrFailed, setQrFailed] = useState(false);
  const receiptId = useRef("");
  const qrRef = useRef<HTMLImageElement>(null);
  const submitting = useRef(false);
  const config = product.contribution;
  const target =
    contributions.targets[product.slug] ?? config?.targetCents ?? 0;
  const remaining = Math.max(
    0,
    target - (contributions.totals[product.slug] || 0)
  );
  const reached = contributions.ready && target > 0 && remaining === 0;
  useEffect(() => {
    // An SSR image can finish loading before React attaches the onLoad handler.
    const image = qrRef.current;
    if (image?.complete) {
      setQrLoaded(image.naturalWidth > 0);
      setQrFailed(image.naturalWidth === 0);
    }
  }, [config?.qrImage, reached]);
  if (!config) return null;
  const reference = contributionReference(product.slug);
  const amountCents = contributionCents(amount);
  const recordingBlocker = config.qrIsPlaceholder
    ? copy.sample
    : !contributions.ready
    ? contributions.error
      ? copy.unavailable
      : copy.checking
    : !contributions.targets[product.slug]
    ? copy.setup
    : qrFailed
    ? copy.qrFailed
    : !qrLoaded
    ? copy.qrLoading
    : "";
  const canRecord =
    !recordingBlocker && !reached && !contributions.saving && !saved;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canRecord || !confirmed || submitting.current) return;
    const cents = contributionCents(amount);
    if (cents === null) {
      setError(copy.invalid);
      return;
    }
    if (cents > remaining) {
      setError(copy.exceeds);
      return;
    }
    submitting.current = true;
    setError("");
    if (!receiptId.current) receiptId.current = crypto.randomUUID();
    try {
      if (await contributions.record(product.slug, amount, receiptId.current))
        setSaved(true);
    } catch (cause) {
      setError(
        cause instanceof ContributionLimitError ? copy.changed : copy.failed
      );
    } finally {
      submitting.current = false;
    }
  };
  if (reached)
    return (
      <div className={styles["fund-complete"]} role="status">
        <Check aria-hidden="true" />
        <p>{copy.complete}</p>
        {saved && <p>{copy.saved}</p>}
        {confirmed && !saved && !contributions.saving && !error && (
          <p role="alert">{copy.changed}</p>
        )}
        {error && <p role="alert">{error}</p>}
        <p className={styles["detail-note"]}>{copy.note}</p>
      </div>
    );
  return (
    <form className={styles["contribution-form"]} onSubmit={submit}>
      <p>{copy.instructions}</p>
      <figure className={styles["payment-qr"]}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={qrRef}
          src={config.qrImage}
          alt={config.qrIsPlaceholder ? copy.sampleAlt : copy.qrAlt}
          onLoad={() => {
            setQrLoaded(true);
            setQrFailed(false);
          }}
          onError={() => {
            setQrLoaded(false);
            setQrFailed(true);
          }}
        />
        {config.qrIsPlaceholder && <figcaption>{copy.sample}</figcaption>}
        {qrFailed && <figcaption role="alert">{copy.qrFailed}</figcaption>}
      </figure>
      <div className={styles["transfer-reference"]}>
        <span>{copy.reference}</span>
        <code>{reference}</code>
        <p>{copy.referenceHelp}</p>
        <button
          type="button"
          className={styles.secondary}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(reference);
              setCopyNotice(copy.copied);
            } catch {
              setCopyNotice(copy.copyFailed);
            }
          }}
        >
          <Copy aria-hidden="true" />
          {copy.copy}
        </button>
        {copyNotice && <p role="status">{copyNotice}</p>}
      </div>
      <label htmlFor="gift-contribution-amount">{copy.amount} (RM)</label>
      <input
        id="gift-contribution-amount"
        type="number"
        inputMode="decimal"
        min="0.01"
        max={Math.min(remaining, 100_000_000) / 100}
        step="0.01"
        required
        value={amount}
        disabled={contributions.saving || saved}
        placeholder="100.00"
        onChange={(event) => {
          setAmount(event.target.value);
          setError("");
          setConfirmed(false);
        }}
      />
      {amountCents !== null && amountCents > remaining && (
        <p role="alert">{copy.exceeds}</p>
      )}
      <label className={styles["transfer-confirm"]}>
        <input
          type="checkbox"
          required
          checked={confirmed}
          disabled={contributions.saving || saved}
          onChange={(event) => setConfirmed(event.target.checked)}
        />
        <span>{copy.confirmed}</span>
      </label>
      {recordingBlocker && (
        <p id="contribution-recording-status" role="status">
          {recordingBlocker}
        </p>
      )}
      <button
        className={styles.primary}
        aria-describedby={
          recordingBlocker ? "contribution-recording-status" : undefined
        }
        disabled={
          !canRecord ||
          !confirmed ||
          amountCents === null ||
          amountCents > remaining
        }
      >
        {saved ? (
          <>
            <Check aria-hidden="true" />
            {copy.saved}
          </>
        ) : contributions.saving ? (
          copy.saving
        ) : (
          copy.submit
        )}
      </button>
      {error && (
        <p className={styles["action-error"]} role="alert">
          {error}
        </p>
      )}
      {saved && <p role="status">{copy.saved}</p>}
      <p className={styles["detail-note"]}>{copy.note}</p>
    </form>
  );
}
