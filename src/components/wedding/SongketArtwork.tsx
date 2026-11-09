import { ReactNode, useId, useState } from "react";

import { SongketThreadLight } from "./SongketThreadwork";

import styles from "@/styles/WeddingSongket.module.css";

/** Restrained floral geometry and stepped borders, shared across the suite. */
export function SongketOrnament({
  variant = "divider",
}: {
  variant?: "divider" | "minor";
}) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      className={styles.ornament}
      viewBox="0 0 240 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={
        variant === "minor" ? { width: "5rem", height: "1.5rem" } : undefined
      }
    >
      <defs>
        <linearGradient id={`${id}-thread`} x2="0" y2="1">
          <stop stopColor="#e8d4a1" />
          <stop offset=".45" stopColor="#b49155" />
          <stop offset="1" stopColor="#8b6836" />
        </linearGradient>
      </defs>
      {variant === "divider" && (
        <path
          d="M8 24h74m76 0h74M28 27h40m104-6h40"
          stroke="currentColor"
          strokeWidth=".9"
        />
      )}
      <g stroke={`url(#${id}-thread)`} strokeWidth="1.2">
        <path
          d="m120 7 5 10h8v5l10 2-10 2v5h-8l-5 10-5-10h-8v-5l-10-2 10-2v-5h8Z"
          fill="#b49155"
          fillOpacity=".2"
        />
        <path d="m120 17 7 7-7 7-7-7ZM88 20l4 4-4 4-4-4ZM152 20l4 4-4 4-4-4Z" />
      </g>
      <path d="m120 21 3 3-3 3-3-3Z" fill="currentColor" />
    </svg>
  );
}

export function SongketBorder() {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 320 64" fill="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-gold`} x2="0" y2="1">
          <stop stopColor="#e8d4a1" />
          <stop offset=".5" stopColor="#b49155" />
          <stop offset="1" stopColor="#8b6836" />
        </linearGradient>
      </defs>
      <g stroke="#8b6836" strokeWidth="1.2">
        <path d="M0 57h320M0 62h320" />
      </g>
      <g stroke={`url(#${id}-gold)`} strokeWidth="1">
        {[0, 40, 80, 120, 160, 200, 240, 280].map((x) => (
          <g key={x} transform={`translate(${x} 0)`}>
            <path
              d="M1 53v-7h5v-8h5v-8h5v-9h8v9h5v8h5v8h5v7Z"
              fill="#b49155"
              fillOpacity=".28"
            />
            <path d="M8 50v-7h6v-9h6v-6m0 6h6v9h6v7M20 34v19m-8-5 8-8 8 8" />
            <path d="m20 5 4 5-4 5-4-5ZM0 40l4 5-4 5-4-5Z" fill="#b49155" />
            <path d="m20 45 3 3-3 3-3-3Z" fill="#e8d4a1" />
          </g>
        ))}
      </g>
    </svg>
  );
}

/** Each corner has its own flow slot, independent of the card's text height. */
export function SongketCrest({
  edge,
  opened = false,
}: {
  edge: "top" | "bottom";
  opened?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`${styles.crest} ${styles[`crest-${edge}`]}`}
      data-part={`hero-art-${edge}`}
      aria-hidden="true"
    >
      {failed ? (
        <div className={styles["crest-fallback"]}>
          <SongketBorder />
        </div>
      ) : (
        // A local transparent overlay retains its stitched texture at both sizes.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={
            edge === "top"
              ? "/images/songket-interior-corner-v2.webp"
              : "/images/songket-interior-corner-bottom-v2.webp"
          }
          width={1200}
          height={400}
          alt=""
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
      {!failed && <SongketThreadLight edge={edge} enabled={opened} />}
    </div>
  );
}

/** Flexible reading paper between independently scaled embroidered edges. */
export function SongketPaperBody({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  return enabled ? (
    <div data-part="hero-writing" className={styles["hero-writing"]}>
      {children}
    </div>
  ) : (
    <>{children}</>
  );
}

/** Dedicated closing artwork; the geometric hero failure border stays separate. */
export function SongketClosingFlourish() {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={styles["closing-flourish"]}
      data-part="closing-flourish"
      aria-hidden="true"
    >
      {failed ? (
        <SongketOrnament />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src="/images/songket-closing-flourish-v1.webp"
          width={1000}
          height={142}
          alt=""
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
