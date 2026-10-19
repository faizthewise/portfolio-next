import { useEffect, useRef } from "react";
import styles from "@/styles/WeddingGarden.module.css";

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
  star: boolean;
};

/** A small fairy light leaves a drifting gold-and-rose stardust trail. */
export default function MohorMagic({ fading }: { fading: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let width = 0;
    let height = 0;
    let previous = 0;
    let elapsed = 0;
    let emission = 0;
    const sparks: Spark[] = [];
    const trail: { x: number; y: number; age: number }[] = [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const draw = (time: number) => {
      if (motion.matches) return;
      const dt = previous ? Math.min((time - previous) / 1000, 0.05) : 0;
      previous = time;
      elapsed += dt;
      context.clearRect(0, 0, width, height);
      const spread = Math.min(elapsed / 0.7, 1);
      const x = width * (0.5 + Math.sin(elapsed * 2.7) * 0.32 * spread);
      const y =
        height *
        (0.5 +
          Math.sin(elapsed * 5.4) * 0.14 * spread -
          Math.sin(elapsed * 0.65) * 0.12 * spread);

      trail.push({ x, y, age: 0 });
      for (const point of trail) point.age += dt;
      while (trail.length && trail[0].age > 0.75) trail.shift();
      context.lineCap = "round";
      context.shadowColor = "#ffdc85";
      context.shadowBlur = 12;
      for (let i = 1; i < trail.length; i += 1) {
        context.globalAlpha = (1 - trail[i].age / 0.75) * 0.65;
        context.strokeStyle = "#d6ad61";
        context.lineWidth = 2.5;
        context.beginPath();
        context.moveTo(trail[i - 1].x, trail[i - 1].y);
        context.lineTo(trail[i].x, trail[i].y);
        context.stroke();
      }

      emission += dt * 85;
      while (emission >= 1) {
        emission -= 1;
        sparks.push({
          x: x + (Math.random() - 0.5) * 12,
          y: y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 22,
          vy: 10 + Math.random() * 22,
          age: 0,
          life: 0.65 + Math.random() * 1.2,
          size: 1 + Math.random() * 2.3,
          star: Math.random() > 0.6,
        });
      }

      for (let i = sparks.length - 1; i >= 0; i -= 1) {
        const spark = sparks[i];
        spark.age += dt;
        if (spark.age >= spark.life) {
          sparks.splice(i, 1);
          continue;
        }
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        const alpha = (1 - spark.age / spark.life) ** 1.5;
        const size = spark.size * (0.8 + Math.sin(spark.age * 9) * 0.2);
        context.globalAlpha = alpha;
        context.fillStyle = spark.star ? "#fff8d8" : "#ba9452";
        context.shadowColor = spark.star ? "#f9d382" : "#e9b4cb";
        context.shadowBlur = spark.star ? 12 : 5;
        context.beginPath();
        if (spark.star) {
          context.moveTo(spark.x, spark.y - size * 2.5);
          context.lineTo(spark.x + size * 0.5, spark.y - size * 0.5);
          context.lineTo(spark.x + size * 2.5, spark.y);
          context.lineTo(spark.x + size * 0.5, spark.y + size * 0.5);
          context.lineTo(spark.x, spark.y + size * 2.5);
          context.lineTo(spark.x - size * 0.5, spark.y + size * 0.5);
          context.lineTo(spark.x - size * 2.5, spark.y);
          context.lineTo(spark.x - size * 0.5, spark.y - size * 0.5);
          context.closePath();
        } else {
          context.arc(spark.x, spark.y, size, 0, Math.PI * 2);
        }
        context.fill();
      }

      context.globalAlpha = Math.min(elapsed * 4, 1);
      context.shadowBlur = 0;
      const glow = context.createRadialGradient(x, y, 0, x, y, 25);
      glow.addColorStop(0, "rgba(255, 255, 245, 1)");
      glow.addColorStop(0.15, "rgba(255, 241, 183, 0.95)");
      glow.addColorStop(0.45, "rgba(231, 181, 99, 0.45)");
      glow.addColorStop(1, "rgba(231, 181, 99, 0)");
      context.fillStyle = glow;
      context.fillRect(x - 25, y - 25, 50, 50);
      context.globalAlpha = 1;
      frame = requestAnimationFrame(draw);
    };

    const updateMotion = () => {
      cancelAnimationFrame(frame);
      context.clearRect(0, 0, width, height);
      previous = 0;
      if (!motion.matches) frame = requestAnimationFrame(draw);
    };
    resize();
    updateMotion();
    window.addEventListener("resize", resize);
    motion.addEventListener("change", updateMotion);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      motion.removeEventListener("change", updateMotion);
    };
  }, []);

  return (
    <span
      className={`${styles["mohor-magic"]} ${
        fading ? styles["mohor-magic-fading"] : ""
      }`}
      aria-hidden="true"
    >
      <span className={styles["mohor-glow"]} />
      <canvas ref={canvasRef} className={styles["mohor-trail"]} />
    </span>
  );
}
