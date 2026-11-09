import { CSSProperties, useEffect, useId, useRef } from "react";
import { observeSongketMotion } from "@/lib/wedding/songketMotion";
import styles from "@/styles/WeddingSongket.module.css";

export function SongketThreadLight({
  edge,
  enabled,
}: {
  edge: "top" | "bottom";
  enabled: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (enabled && ref.current)
      return observeSongketMotion(ref.current, "ambient");
  }, [enabled]);
  return (
    <div
      ref={ref}
      className={styles["thread-light"]}
      data-part="thread-light"
      aria-hidden="true"
    >
      <svg viewBox="0 0 1200 400" fill="none" focusable="false">
        <path
          pathLength="1"
          d={edge === "top" ? "M28 18 284 166" : "M928 288 1176 140"}
        />
        <path
          pathLength="1"
          d={edge === "top" ? "M76 19 321 161" : "M892 270 1140 122"}
        />
      </svg>
    </div>
  );
}

/** Complete embroidered flower is the default, enhanced once on entry. */
export function SongketWishesMotif() {
  const ref = useRef<HTMLDivElement>(null);
  const id = useId().replace(/:/g, "");
  useEffect(() => {
    if (ref.current) return observeSongketMotion(ref.current, "stitch");
  }, []);
  return (
    <div
      ref={ref}
      className={styles["woven-motif"]}
      data-part="wishes-motif"
      aria-hidden="true"
    >
      <svg viewBox="0 0 96 96" focusable="false">
        <defs>
          <linearGradient id={`${id}-gold`} x2="1" y2="1">
            <stop stopColor="#f3dfad" />
            <stop offset=".4" stopColor="#c49a50" />
            <stop offset="1" stopColor="#795328" />
          </linearGradient>
          <pattern
            id={`${id}-weave`}
            width="4"
            height="4"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 1h4M1 0v4" stroke="#fff1cf" strokeWidth=".65" />
            <path d="M0 3h4M3 0v4" stroke="#785027" strokeWidth=".4" />
          </pattern>
        </defs>
        <path
          data-lead=""
          d="M9 72C8 53 34 64 28 42S44 13 48 9"
          fill="none"
          stroke="#98713b"
          strokeWidth="1.4"
          pathLength="1"
        />
        {Array.from({ length: 8 }, (_, index) => (
          <g
            key={index}
            data-stitch=""
            transform={`rotate(${index * 45} 48 48)`}
            style={
              { "--stitch-delay": `${0.22 + index * 0.21}s` } as CSSProperties
            }
          >
            <path
              d="M48 47C34 37 34 24 48 13C62 24 62 37 48 47Z"
              fill={`url(#${id}-gold)`}
              stroke="#8b6233"
              strokeWidth="1.1"
              pathLength="1"
            />
            <path
              d="M48 43C39 35 39 26 48 18C57 26 57 35 48 43Z"
              fill={`url(#${id}-weave)`}
            />
            <path
              d="M48 19v23m-6-14 6 5 6-5m-12 6 6 5 6-5"
              fill="none"
              stroke="#fff0c5"
              strokeWidth=".8"
            />
          </g>
        ))}
        <g data-finish="">
          <path
            d="m48 38 10 10-10 10-10-10Z"
            fill="#795328"
            stroke="#f0d59c"
            strokeWidth="1.4"
          />
          <path d="m48 42 6 6-6 6-6-6Z" fill={`url(#${id}-weave)`} />
        </g>
      </svg>
    </div>
  );
}
