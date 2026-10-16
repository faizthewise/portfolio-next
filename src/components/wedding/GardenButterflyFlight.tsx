import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

import styles from "@/styles/WeddingGarden.module.css";

type Flight = {
  frames: Keyframe[];
  duration: number;
  delay: number;
  style: CSSProperties;
};

function createFlight(index: number, width: number, height: number): Flight {
  const fromLeft = index % 2 === 0;
  const startY = height * (0.3 + Math.random() * 0.3);
  const endY = startY - height * (0.08 + Math.random() * 0.15);
  const phase = Math.random() * Math.PI * 2;
  const lift = height * (0.12 + Math.random() * 0.12);
  const dip = height * (0.06 + Math.random() * 0.1);
  const point = (progress: number) => {
    // Smooth changes of pace, rather than a constant-speed slide.
    const t =
      progress +
      0.035 *
        Math.sin(progress * Math.PI * 2 + phase) *
        Math.sin(progress * Math.PI);
    const u = 1 - t;
    const x =
      -60 * u ** 3 +
      3 * u ** 2 * t * width * 0.18 +
      3 * u * t ** 2 * width * 0.76 +
      t ** 3 * (width + 60);
    const y =
      u ** 3 * startY +
      3 * u ** 2 * t * (startY - lift) +
      3 * u * t ** 2 * (endY + dip) +
      t ** 3 * endY;
    return { x: fromLeft ? x : width - x, y };
  };

  let previousHeading: number | undefined;
  const frames = Array.from({ length: 91 }, (_, frame) => {
    const progress = frame / 90;
    const position = point(progress);
    const before = point(Math.max(0, progress - 0.001));
    const after = point(Math.min(1, progress + 0.001));
    // The body follows the curve; wings hinge separately around the thorax.
    let heading =
      (Math.atan2(after.y - before.y, after.x - before.x) * 180) / Math.PI + 90;
    if (previousHeading !== undefined) {
      while (heading - previousHeading > 180) heading -= 360;
      while (heading - previousHeading < -180) heading += 360;
    }
    previousHeading = heading;
    const bank = 7 * Math.sin(progress * Math.PI * 4 + phase);
    const bob =
      4 *
      Math.sin(progress * Math.PI * 12 + phase) *
      Math.sin(progress * Math.PI);
    const scale = 0.9 + 0.1 * Math.sin(progress * Math.PI);
    return {
      offset: progress,
      opacity: Math.min(0.95, progress * 10, (1 - progress) * 10),
      transform: `translate3d(${position.x}px, ${
        position.y + bob
      }px, 0) rotate(${heading + bank}deg) scale(${scale})`,
    };
  });

  return {
    frames,
    duration: 6800 + Math.random() * 800,
    delay: index * 250,
    style: {
      "--flight-size": `${40 + Math.random() * 12}px`,
      "--wing-duration": `${480 + Math.random() * 160}ms`,
      "--wing-phase": `${-Math.random() * 600}ms`,
    } as CSSProperties,
  };
}

/** A gentle, one-time flourish once the section is comfortably in view. */
export default function GardenButterflyFlight({
  children,
}: {
  children: ReactNode;
}) {
  const layerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    const trigger = triggerRef.current;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!trigger || motion.matches || !("IntersectionObserver" in window))
      return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    let played = false;
    let observer: IntersectionObserver | undefined;
    const stop = () => {
      played = true;
      observer?.disconnect();
      clearTimeout(timer);
      setFlights([]);
    };
    const observe = () => {
      if (played) return;
      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          if (played || !entries.some((entry) => entry.isIntersecting)) return;
          played = true;
          observer?.disconnect();
          const layer = layerRef.current;
          if (!layer) return;
          const nextFlights = Array.from({ length: 4 }, (_, index) =>
            createFlight(index, layer.clientWidth, layer.clientHeight)
          );
          setFlights(nextFlights);
          const finishTime = Math.max(
            ...nextFlights.map((flight) => flight.delay + flight.duration)
          );
          timer = setTimeout(() => setFlights([]), finishTime + 100);
        },
        {
          rootMargin: `0px 0px -${Math.round(window.innerHeight * 0.65)}px 0px`,
        }
      );
      observer.observe(trigger);
    };
    const resize = () => {
      if (played) stop();
      else observe();
    };
    observe();
    motion.addEventListener("change", stop);
    window.addEventListener("resize", resize);
    return () => {
      observer?.disconnect();
      clearTimeout(timer);
      motion.removeEventListener("change", stop);
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    const elements =
      layerRef.current?.querySelectorAll<HTMLElement>("[data-flight]");
    if (!elements) return;
    const animations = flights.map((flight, index) =>
      elements[index].animate(flight.frames, {
        duration: flight.duration,
        delay: flight.delay,
        fill: "both",
        easing: "linear",
      })
    );
    return () => animations.forEach((animation) => animation.cancel());
  }, [flights]);

  return (
    <div
      ref={layerRef}
      className={styles["butterfly-flight"]}
      aria-hidden="true"
    >
      <span ref={triggerRef} className={styles["flight-trigger"]} />
      {flights.map((flight, index) => (
        <span
          key={index}
          data-flight
          className={styles["flying-butterfly"]}
          style={flight.style}
        >
          {children}
        </span>
      ))}
    </div>
  );
}
