import { CSSProperties, ReactNode, useEffect, useRef } from "react";

import styles from "@/styles/WeddingGarden.module.css";

/** Content stays visible until the observer is ready, including without JavaScript. */
export default function GardenReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || motion.matches || !("IntersectionObserver" in window))
      return;

    let observer: IntersectionObserver | undefined;
    let revealed = false;
    const reveal = () => {
      revealed = true;
      element.dataset.revealed = "true";
      observer?.disconnect();
    };
    const observe = () => {
      if (revealed) return;
      observer?.disconnect();
      // rootMargin percentages use viewport WIDTH. Use pixels to place the
      // trigger above the bottom quarter of a portrait phone's viewport.
      const inset = Math.round(
        window.innerHeight * (window.innerWidth < 640 ? 0.25 : 0.18)
      );
      // Cap the visible portion so even a form taller than the screen reveals.
      const threshold = Math.min(
        0.2,
        Math.min(96, window.innerHeight * 0.12) /
          Math.max(1, element.offsetHeight)
      );
      observer = new IntersectionObserver(
        (entries) => {
          if (
            entries.some(
              (entry) =>
                entry.isIntersecting && entry.intersectionRatio >= threshold
            )
          )
            reveal();
        },
        { threshold, rootMargin: `0px 0px -${inset}px 0px` }
      );
      observer.observe(element);
    };

    element.dataset.revealed = "false";
    observe();
    // A keyboard user must never land on an invisible link or form field.
    element.addEventListener("focusin", reveal);
    motion.addEventListener("change", reveal);
    window.addEventListener("resize", observe);
    return () => {
      observer?.disconnect();
      element.removeEventListener("focusin", reveal);
      motion.removeEventListener("change", reveal);
      window.removeEventListener("resize", observe);
      delete element.dataset.revealed;
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${styles.reveal} ${className}`}
      data-direction={direction}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
