import { contributionCopy } from "@/lib/wedding/contributionCopy";
import { RegistryLocale } from "@/lib/wedding/registryCopy";
import styles from "@/styles/WeddingRegistry.module.css";

export default function GiftContributionProgress({
  target,
  total,
  ready,
  locale,
}: {
  target: number;
  total: number;
  ready: boolean;
  locale: RegistryLocale;
}) {
  const copy = contributionCopy[locale];
  const money = (cents: number) =>
    new Intl.NumberFormat(locale === "en" ? "en-MY" : "ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(cents / 100);
  const reached = ready && total >= target;
  return (
    <div className={styles["fund-progress"]} data-funded={reached}>
      <p>
        <span>{copy.target}</span>
        <strong>{money(target)}</strong>
      </p>
      {ready ? (
        <>
          <p>
            <span>{copy.recorded}</span>
            <strong>{money(total)}</strong>
          </p>
          <progress
            max={target}
            value={Math.min(total, target)}
            aria-label={copy.recorded}
            aria-valuetext={`${money(total)} / ${money(target)}`}
          />
          <p className={styles["fund-balance"]}>
            {reached
              ? copy.reached
              : `${copy.remaining}: ${money(Math.max(0, target - total))}`}
          </p>
        </>
      ) : (
        <p>{copy.checking}</p>
      )}
    </div>
  );
}
