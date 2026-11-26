import { Eye, Heart } from "lucide-react";
import { useId } from "react";
import {
  ContributionActions,
  ContributionPrimary,
} from "./MemoryContributionSheet";
import styles from "./MemoryWishContribution.module.css";

export const WISH_CHARACTER_LIMIT = 2000;

export function isMemoryWishValid(wish: string) {
  return Boolean(wish.trim()) && wish.length <= WISH_CHARACTER_LIMIT;
}

export function MemoryWishContribution({
  coupleNames,
  guestName,
  wish,
  busy,
  onChange,
  onShare,
}: {
  coupleNames: string;
  guestName: string;
  wish: string;
  busy: boolean;
  onChange: (wish: string) => void;
  onShare: () => void;
}) {
  const inputId = useId();
  const countId = useId();
  const limit = WISH_CHARACTER_LIMIT.toLocaleString("en-US");
  const overLimit = wish.length > WISH_CHARACTER_LIMIT;

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && isMemoryWishValid(wish)) onShare();
      }}
    >
      <div className={styles.paper}>
        <p aria-hidden="true" className={styles.salutation}>
          Dear {coupleNames},
        </p>
        <label className="sr-only" htmlFor={inputId}>
          Your wish
        </label>
        <textarea
          id={inputId}
          className={styles.wish}
          value={wish}
          readOnly={busy}
          aria-describedby={countId}
          aria-invalid={overLimit || undefined}
          placeholder="Write something from the heart…"
          onChange={(event) => onChange(event.target.value)}
        />
        <p id={countId} className={overLimit ? styles.overLimit : styles.count}>
          {overLimit && "Shorten to 2,000 characters. "}
          {wish.length.toLocaleString("en-US")} / {limit}
          <span className="sr-only"> characters</span>
        </p>
      </div>
      <p className={styles.signature}>
        <span>With love,</span>{" "}
        {guestName ? (
          <strong>{guestName}</strong>
        ) : (
          <span className={styles.unsigned}>Add your name when you share</span>
        )}
      </p>
      <ContributionActions>
        <ContributionPrimary
          type="submit"
          disabled={busy || !isMemoryWishValid(wish)}
        >
          <Heart size={17} aria-hidden="true" />
          {busy ? "Sharing your wish…" : "Share wish"}
        </ContributionPrimary>
        <p className={styles.visibility}>
          <Eye size={15} aria-hidden="true" />
          Visible to anyone with the album link.
        </p>
      </ContributionActions>
    </form>
  );
}
