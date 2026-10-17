import { useState } from "react";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";

import { WeddingWish, WISH_CHARACTER_LIMIT } from "@/lib/wedding/data";
import styles from "@/styles/WeddingWishes.module.css";

const pageSize = 4;

export default function WeddingWishes({
  wishes,
  fontClassName,
}: {
  wishes: WeddingWish[];
  fontClassName: string;
}) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(wishes.length / pageSize));
  const currentPage = Math.min(page, pages - 1);
  const start = currentPage * pageSize;
  const visible = wishes
    .slice()
    .reverse()
    .slice(start, start + pageSize);

  return (
    <div className={styles.wishes}>
      <div className={styles.grid}>
        {visible.map((wish, index) => (
          <blockquote
            key={`${currentPage}-${index}`}
            className={`${styles.card} stationery-panel`}
          >
            <Quote className={styles.quote} aria-hidden="true" />
            <p
              className={`${fontClassName} ${styles.message} ${
                wish.message.length > WISH_CHARACTER_LIMIT ? styles.legacy : ""
              }`}
              tabIndex={
                wish.message.length > WISH_CHARACTER_LIMIT ? 0 : undefined
              }
            >
              {wish.message}
            </p>
            <div className={styles.byline}>
              <footer>— {wish.name}</footer>
            </div>
          </blockquote>
        ))}
      </div>
      {pages > 1 && (
        <div
          className={styles.pagination}
          role="group"
          aria-label="Halaman ucapan"
        >
          <button
            type="button"
            disabled={currentPage === 0}
            onClick={() => setPage(currentPage - 1)}
            aria-label="Ucapan sebelumnya"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <p role="status" aria-live="polite">
            {start + 1}–{Math.min(start + pageSize, wishes.length)} daripada{" "}
            {wishes.length} ucapan
          </p>
          <button
            type="button"
            disabled={currentPage === pages - 1}
            onClick={() => setPage(currentPage + 1)}
            aria-label="Ucapan seterusnya"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
