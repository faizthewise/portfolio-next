import styles from "@/styles/WeddingSongket.module.css";

/** Geometric woven borders inspired by bunga tabur and pucuk rebung. */
export function SongketOrnament() {
  return (
    <svg
      className={styles.ornament}
      viewBox="0 0 240 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M8 24h74m76 0h74M28 20h40m104 8h40"
        stroke="currentColor"
        strokeWidth=".7"
      />
      <g stroke="currentColor" strokeWidth=".9">
        <path d="m120 7 5 10h8v5l10 2-10 2v5h-8l-5 10-5-10h-8v-5l-10-2 10-2v-5h8Z" />
        <path d="m120 17 7 7-7 7-7-7ZM88 20l4 4-4 4-4-4ZM152 20l4 4-4 4-4-4Z" />
      </g>
      <path d="m120 21 3 3-3 3-3-3Z" fill="currentColor" />
    </svg>
  );
}

function WovenCrown() {
  return (
    <svg viewBox="0 0 320 96" fill="none" aria-hidden="true" focusable="false">
      <g stroke="currentColor" strokeWidth=".8">
        <path d="M0 88h320M0 92h320M0 84h320" />
        {[0, 40, 80, 120, 160, 200, 240, 280].map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path d="m0 80 20-53 20 53H0Zm6-4 14-38 14 38H6Zm7-4 7-21 7 21H13Z" />
            <path d="M20 48v31M8 76l12-12 12 12M14 60l6-6 6 6" />
            <path d="m20 15 3 5-3 5-3-5Z" fill="currentColor" />
            <path d="m0 69 4 5-4 5-4-5Z" />
          </g>
        ))}
      </g>
    </svg>
  );
}

export default function SongketArtwork() {
  return (
    <div className={styles.artwork} aria-hidden="true">
      <div className={styles["crown-top"]}>
        <WovenCrown />
      </div>
      <div className={styles["crown-bottom"]}>
        <WovenCrown />
      </div>
      <span className={styles.thread} />
    </div>
  );
}
