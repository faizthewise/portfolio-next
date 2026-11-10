import styles from "@/styles/WeddingSongket.module.css";

/** A traced gold-foil ornament, echoing the card's embossed cutwork. */
export default function ClassicalSealRelease() {
  return (
    <svg
      className={styles["seal-flourish"]}
      viewBox="0 0 160 160"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="80" cy="80" r="51" pathLength="1" />
      <path
        pathLength="1"
        d="M80 9C88 24 104 21 109 34C125 35 125 53 140 59C133 72 150 80 140 91C125 97 125 115 109 116C104 129 88 126 80 151C72 126 56 129 51 116C35 115 35 97 20 91C10 80 27 72 20 59C35 53 35 35 51 34C56 21 72 24 80 9Z"
      />
      <path
        pathLength="1"
        d="M80 17V25M80 135V143M17 80H25M135 80H143M35 35L41 41M119 119L125 125M35 125L41 119M119 41L125 35"
      />
    </svg>
  );
}
