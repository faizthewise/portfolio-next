import { useEffect, useRef } from "react";
import styles from "@/styles/WeddingGarden.module.css";

// Coordinates follow the original artwork, so each stem bends from its base.
// [flower centre, influence radius, stem base, angle, speed, phase]
type Stem = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];
const topStems: Stem[] = [
  [0.1, 0.085, 0.1, 0.08, 0.13, 0.15, 0.065, 1.15, 0], // Lily
  [0.215, 0.12, 0.07, 0.07, 0.23, 0.18, 0.06, 1.4, 1.8], // Rose
  [0.05, 0.17, 0.08, 0.075, 0.075, 0.23, 0.05, 0.95, 3.4], // Hydrangea
  [0.32, 0.05, 0.16, 0.09, 0.25, 0.14, 0.085, 1.05, 2.3], // Blue sprig
  [0.055, 0.3, 0.065, 0.11, 0.065, 0.2, 0.11, 1.6, 0.9], // Fern tips
  [0.17, 0.23, 0.08, 0.09, 0.13, 0.16, 0.095, 1.3, 4.5], // Small leaves
];
const bottomStems: Stem[] = [
  [0.865, 0.8, 0.13, 0.09, 0.88, 0.9, 0.065, 1.0, 2.8], // Lily
  [0.79, 0.9, 0.1, 0.075, 0.81, 0.97, 0.055, 1.25, 0.5], // Large rose
  [0.69, 0.84, 0.06, 0.055, 0.7, 0.9, 0.075, 1.45, 3.3], // Small rose
  [0.97, 0.58, 0.07, 0.14, 0.95, 0.73, 0.085, 1.15, 1.2], // Tall blue sprig
  [0.59, 0.87, 0.06, 0.08, 0.62, 0.96, 0.11, 1.7, 4.1], // Fern
  [0.47, 0.93, 0.15, 0.065, 0.65, 0.96, 0.075, 0.9, 2.0], // Leafy branch
  [0.94, 0.925, 0.09, 0.07, 0.96, 0.99, 0.045, 1.3, 5.2], // Hydrangea
];

const vertexSource = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position;
    gl_Position = vec4(a_position.x * 2.0 - 1.0, 1.0 - a_position.y * 2.0, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_image;
  uniform float u_offset;
  uniform vec4 u_regions[7];
  uniform vec2 u_anchors[7];
  uniform vec2 u_rotations[7];
  void main() {
    vec2 uv = vec2(v_uv.x, u_offset + v_uv.y * 0.5);
    vec2 displacement = vec2(0.0);
    for (int i = 0; i < 7; i++) {
      vec4 region = u_regions[i];
      float distance = length((uv - region.xy) / region.zw);
      float influence = 1.0 - smoothstep(0.0, 1.0, distance);
      vec2 stem = uv - u_anchors[i];
      // Correct for the source image's proportions when rotating a stem.
      stem.y *= 1403.0 / 1121.0;
      vec2 rotation = u_rotations[i];
      vec2 bent = vec2(
        rotation.x * stem.x - rotation.y * stem.y,
        rotation.y * stem.x + rotation.x * stem.y
      ) - stem;
      bent.y *= 1121.0 / 1403.0;
      displacement += bent * influence;
    }
    gl_FragColor = texture2D(u_image, clamp(uv + displacement, 0.0, 1.0));
  }
`;

function BotanicalCorner({ bottom = false }: { bottom?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    // The original CSS artwork remains visible if WebGL is unavailable.
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
    };
    const vertex = compile(gl.VERTEX_SHADER, vertexSource);
    const fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
    const program = gl.createProgram();
    const buffer = gl.createBuffer();
    const texture = gl.createTexture();
    const release = () => {
      shaders.forEach((shader) => gl.deleteShader(shader));
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
    };
    if (!vertex || !fragment || !program || !buffer || !texture) {
      release();
      return;
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      release();
      return;
    }
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.uniform1i(gl.getUniformLocation(program, "u_image"), 0);
    gl.uniform1f(gl.getUniformLocation(program, "u_offset"), bottom ? 0.5 : 0);

    const stems = bottom ? bottomStems : topStems;
    const regions = new Float32Array(28);
    const anchors = new Float32Array(14);
    const rotations = new Float32Array(14);
    for (let i = 0; i < 7; i += 1) {
      // Keep unused regions outside the image with a non-zero radius.
      regions.set(stems[i]?.slice(0, 4) ?? [2, 2, 1, 1], i * 4);
      anchors.set(stems[i]?.slice(4, 6) ?? [0, 0], i * 2);
    }
    gl.uniform4fv(gl.getUniformLocation(program, "u_regions[0]"), regions);
    gl.uniform2fv(gl.getUniformLocation(program, "u_anchors[0]"), anchors);
    const rotationLocation = gl.getUniformLocation(program, "u_rotations[0]");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let visible = true;
    let loaded = false;
    let disposed = false;

    const draw = () => {
      for (let i = 0; i < 7; i += 1) {
        const stem = stems[i];
        const angle =
          stem && !motion.matches
            ? stem[6] *
              Math.min(elapsed / 1.2, 1) *
              (Math.sin(elapsed * stem[7] + stem[8]) * 0.8 +
                Math.sin(elapsed * stem[7] * 1.73 + stem[8]) * 0.2)
            : 0;
        rotations[i * 2] = Math.cos(angle);
        rotations[i * 2 + 1] = Math.sin(angle);
      }
      gl.uniform2fv(rotationLocation, rotations);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const animate = (time: number) => {
      if (disposed || !loaded) return;
      if (motion.matches || !visible || document.hidden) {
        draw();
        return;
      }
      if (time - lastFrame >= 1000 / 30) {
        elapsed += lastFrame ? Math.min((time - lastFrame) / 1000, 0.1) : 0;
        lastFrame = time;
        draw();
      }
      frame = requestAnimationFrame(animate);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      lastFrame = 0;
      if (!loaded || disposed) return;
      draw();
      if (visible && !document.hidden && !motion.matches)
        frame = requestAnimationFrame(animate);
    };
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(bounds.width * ratio));
      canvas.height = Math.max(1, Math.round(bounds.height * ratio));
      gl.viewport(0, 0, canvas.width, canvas.height);
      update();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      update();
    });
    observer.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const onContextLost = () => {
      loaded = false;
      delete canvas.dataset.ready;
      cancelAnimationFrame(frame);
    };
    canvas.addEventListener("webglcontextlost", onContextLost);
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    const image = new Image();
    image.onload = () => {
      if (disposed || gl.isContextLost()) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
      );
      loaded = true;
      resize();
      canvas.dataset.ready = "true";
    };
    image.src = "/images/arched-invitation-garden-v1.webp";

    return () => {
      disposed = true;
      image.onload = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      delete canvas.dataset.ready;
      release();
    };
  }, [bottom]);

  return (
    <span className={styles[bottom ? "artwork-bottom" : "artwork-top"]}>
      <canvas ref={canvasRef} className={styles["botanical-canvas"]} />
    </span>
  );
}

export default function BotanicalArtwork() {
  return (
    <div className={styles["hero-artwork"]} aria-hidden="true">
      <BotanicalCorner />
      <BotanicalCorner bottom />
    </div>
  );
}
