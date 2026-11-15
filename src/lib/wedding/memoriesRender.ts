export const PHOTO_FILM_PRESETS = [
  { id: "none", name: "Original", description: "Natural color and contrast." },
  { id: "classic-chrome", name: "Classic Chrome", description: "Muted color with cool, defined shadows." },
  { id: "classic-neg", name: "Classic Neg.", description: "Crisp contrast with lively color separation." },
  { id: "nostalgic-neg", name: "Nostalgic Neg.", description: "Amber highlights and deep, rich shadows." },
  { id: "acros", name: "Acros", description: "Detailed monochrome with gentle tonal contrast." },
] as const;

export type SelectablePhotoFilm = (typeof PHOTO_FILM_PRESETS)[number]["id"];
export type PhotoFilm = SelectablePhotoFilm | "warm" | "soft";

/** Legacy looks remain available to old records, but are not offered for new photos. */
export function resolvePhotoFilm(film: PhotoFilm): SelectablePhotoFilm {
  return film === "warm" || film === "soft" ? "classic-chrome" : film;
}
export type PhotoStyle = {
  film: PhotoFilm;
  stamp: string;
  capturedAt: number;
};

export type PhotoRenderOptions = PhotoStyle & {
  coupleNames: string;
  aspectRatio?: number;
  /** Display imprint direction from the canonical saved frame, not rounded preview pixels. */
  stampAspectRatio?: number;
  maxDimension?: number;
  outputWidth?: number;
  outputHeight?: number;
  includeStamp?: boolean;
};

export type PhotoCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CameraFrameGeometry = {
  aspectRatio: number;
  previewWidth: number;
  previewHeight: number;
  captureWidth: number;
  captureHeight: number;
};

export function getCameraFrameGeometry(
  viewportWidth: number,
  viewportHeight: number,
  previewLongEdge = 720,
  captureLongEdge = 1600
): CameraFrameGeometry {
  if (!(viewportWidth > 0 && viewportHeight > 0))
    throw new Error("Camera viewport dimensions are not ready.");
  const viewportLongEdge = Math.max(viewportWidth, viewportHeight);
  const dimensionsFor = (longEdge: number) => {
    const scale = longEdge / viewportLongEdge;
    return {
      width: Math.max(1, Math.round(viewportWidth * scale)),
      height: Math.max(1, Math.round(viewportHeight * scale)),
    };
  };
  const preview = dimensionsFor(previewLongEdge);
  const capture = dimensionsFor(captureLongEdge);
  return {
    aspectRatio: viewportWidth / viewportHeight,
    previewWidth: preview.width,
    previewHeight: preview.height,
    captureWidth: capture.width,
    captureHeight: capture.height,
  };
}

export type PhotoStampLayout = {
  orientation: "portrait" | "landscape";
  bounds: { x: number; y: number; width: number; height: number };
  mainBounds: { x: number; y: number; width: number; height: number };
  customBounds: { x: number; y: number; width: number; height: number } | null;
  reservedLeft: number;
  reservedBottom: number;
  caption: string;
  mainLines: string[];
  customLines: string[];
  mainPositions: { x: number; y: number; rotated: boolean }[];
  customPositions: { x: number; y: number; rotated: boolean }[];
  fontSize: number;
  secondaryFontSize: number;
  letterSpacing: number;
  secondaryLetterSpacing: number;
  edgeInset: number;
};

export function getPhotoDimensions(source: CanvasImageSource) {
  const value = source as {
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    width?: number;
    height?: number;
  };
  return {
    width: value.videoWidth || value.naturalWidth || value.width || 0,
    height: value.videoHeight || value.naturalHeight || value.height || 0,
  };
}

export function getPhotoCrop(
  sourceWidth: number,
  sourceHeight: number,
  targetAspect = sourceWidth / sourceHeight
): PhotoCrop {
  if (!(sourceWidth > 0 && sourceHeight > 0 && targetAspect > 0))
    throw new Error("Photo dimensions are not ready.");
  const sourceAspect = sourceWidth / sourceHeight;
  if (sourceAspect > targetAspect) {
    const width = sourceHeight * targetAspect;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }
  const height = sourceWidth / targetAspect;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
}

export function applyPhotoFilter(
  pixels: Uint8ClampedArray,
  film: PhotoFilm
): Uint8ClampedArray {
  if (film === "none") return pixels;
  for (let index = 0; index + 3 < pixels.length; index += 4) {
    const red = pixels[index];
    const green = pixels[index + 1];
    const blue = pixels[index + 2];
    // Preserve the first-pass looks exactly for already-saved photos/jobs.
    if (film === "warm") {
      pixels[index] = clamp(red * 1.045 + 8);
      pixels[index + 1] = clamp(green * 1.015 + 2);
      pixels[index + 2] = clamp(blue * 0.91 - 3);
      continue;
    }
    if (film === "soft") {
      const luminance = red * 0.2126 + green * 0.7152 + blue * 0.0722;
      pixels[index] = clamp((luminance + (red - luminance) * 0.78) * 1.035);
      pixels[index + 1] = clamp(
        (luminance + (green - luminance) * 0.78) * 1.035
      );
      pixels[index + 2] = clamp(
        (luminance + (blue - luminance) * 0.78) * 1.035
      );
      continue;
    }

    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;
    const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
    const shadow =
      smoothstep(0.015, 0.15, luminance) *
      (1 - smoothstep(0.3, 0.48, luminance));
    const highlight =
      smoothstep(0.48, 0.62, luminance) *
      (1 - smoothstep(0.82, 0.96, luminance));
    let outR = r;
    let outG = g;
    let outB = b;

    if (film === "classic-chrome") {
      const tone = filmTone(luminance, 1.14);
      [outR, outG, outB] = addLuminance(r, g, b, tone);
      [outR, outG, outB] = saturate(outR, outG, outB, 0.78);
      outR -= shadow * 0.014;
      outG += shadow * 0.005;
      outB += shadow * 0.032;
      outR += highlight * 0.01;
      outB -= highlight * 0.006;
    } else if (film === "classic-neg") {
      const tone = filmTone(luminance, 1.22);
      [outR, outG, outB] = addLuminance(r, g, b, tone);
      [outR, outG, outB] = saturate(outR, outG, outB, 1.13);
      // A restrained cool-shadow/warm-highlight split creates color separation.
      outR -= shadow * 0.012;
      outG += shadow * 0.009;
      outB += shadow * 0.022;
      outR += highlight * 0.021;
      outG += highlight * 0.006;
      outB -= highlight * 0.018;
    } else if (film === "nostalgic-neg") {
      const tone = filmTone(luminance, 1.12) - shadow * 0.006;
      [outR, outG, outB] = addLuminance(r, g, b, tone);
      [outR, outG, outB] = saturate(outR, outG, outB, 0.96);
      outR += highlight * 0.048;
      outG += highlight * 0.021;
      outB -= highlight * 0.035;
      outB += shadow * 0.012;
    } else if (film === "acros") {
      const mono = r * 0.27 + g * 0.63 + b * 0.1;
      const detailedTone = filmTone(mono, 1.2);
      outR = detailedTone;
      outG = detailedTone;
      outB = detailedTone;
    }

    pixels[index] = clamp(outR * 255);
    pixels[index + 1] = clamp(outG * 255);
    pixels[index + 2] = clamp(outB * 255);
  }
  return pixels;
}

function filmTone(value: number, amount: number) {
  // Keep a little headroom at both endpoints, then apply a gentle S-curve.
  // This adds midtone separation without flattening dark suits or white fabric.
  const base = 0.025 + value * 0.95;
  const centered = base - 0.5;
  const shaped =
    base + centered * (0.5 - Math.abs(centered)) * (amount - 1) * 1.2;
  return Math.max(0, Math.min(1, shaped));
}

function smoothstep(edge0: number, edge1: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function addLuminance(r: number, g: number, b: number, nextLuminance: number) {
  const oldLuminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const delta = nextLuminance - oldLuminance;
  return [r + delta, g + delta, b + delta] as const;
}

function saturate(r: number, g: number, b: number, amount: number) {
  const luminance = r * 0.2126 + g * 0.7152 + b * 0.0722;
  return [
    luminance + (r - luminance) * amount,
    luminance + (g - luminance) * amount,
    luminance + (b - luminance) * amount,
  ] as const;
}

/** Fragment shader for the live camera. Still-photo rendering keeps using the CPU renderer. */
export const CAMERA_FILM_FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D u_video;
uniform vec4 u_crop;
uniform int u_film;
varying vec2 v_texcoord;

float smoothUnit(float edge0, float edge1, float value) {
  float t = clamp((value - edge0) / (edge1 - edge0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}
float filmTone(float value, float amount) {
  float base = 0.025 + value * 0.95;
  float centered = base - 0.5;
  float shaped = base + centered * (0.5 - abs(centered)) * (amount - 1.0) * 1.2;
  return clamp(shaped, 0.0, 1.0);
}
float lum(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }
vec3 addLuminance(vec3 color, float nextLuminance) {
  return color + vec3(nextLuminance - lum(color));
}
vec3 saturateColor(vec3 color, float amount) {
  float y = lum(color);
  return vec3(y) + (color - vec3(y)) * amount;
}
void main() {
  vec2 uv = u_crop.xy + v_texcoord * u_crop.zw;
  vec4 source = texture2D(u_video, uv);
  vec3 color = source.rgb;
  float y = lum(color);
  float shadow = smoothUnit(0.015, 0.15, y) * (1.0 - smoothUnit(0.3, 0.48, y));
  float highlight = smoothUnit(0.48, 0.62, y) * (1.0 - smoothUnit(0.82, 0.96, y));

  if (u_film == 1) {
    color = saturateColor(addLuminance(color, filmTone(y, 1.14)), 0.78);
    color += vec3(-shadow * 0.014 + highlight * 0.01,
      shadow * 0.005, shadow * 0.032 - highlight * 0.006);
  } else if (u_film == 2) {
    color = saturateColor(addLuminance(color, filmTone(y, 1.22)), 1.13);
    color += vec3(-shadow * 0.012 + highlight * 0.021,
      shadow * 0.009 + highlight * 0.006,
      shadow * 0.022 - highlight * 0.018);
  } else if (u_film == 3) {
    color = saturateColor(addLuminance(color, filmTone(y, 1.12) - shadow * 0.006), 0.96);
    color += vec3(highlight * 0.048, highlight * 0.021, -highlight * 0.035 + shadow * 0.012);
  } else if (u_film == 4) {
    float mono = dot(color, vec3(0.27, 0.63, 0.1));
    color = vec3(filmTone(mono, 1.2));
  }
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), source.a);
}
`;

export const CAMERA_FILM_VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec2 a_texcoord;
varying vec2 v_texcoord;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texcoord = a_texcoord;
}
`;

export type CameraWebGLPreview = {
  render(source: HTMLVideoElement, frame: CameraFrameGeometry, film: SelectablePhotoFilm): void;
  dispose(): void;
};

export function createCameraWebGLPreview(
  canvas: HTMLCanvasElement,
  onContextLost?: () => void
): CameraWebGLPreview | null {
  let gl: WebGLRenderingContext | null;
  try {
    gl = (canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    }) ?? canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
  } catch {
    return null;
  }
  if (!gl) return null;
  const context = gl;

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let vertexShader: WebGLShader | null = null;
  let fragmentShader: WebGLShader | null = null;
  try {
    vertexShader = compileCameraShader(context, context.VERTEX_SHADER, CAMERA_FILM_VERTEX_SHADER);
    fragmentShader = compileCameraShader(context, context.FRAGMENT_SHADER, CAMERA_FILM_FRAGMENT_SHADER);
    program = context.createProgram();
    if (!program) throw new Error("Could not allocate a camera shader program.");
    context.attachShader(program, vertexShader);
    context.attachShader(program, fragmentShader);
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS))
      throw new Error(context.getProgramInfoLog(program) || "Camera shader link failed.");
    const activeProgram = program;

    buffer = context.createBuffer();
    texture = context.createTexture();
    if (!buffer || !texture) throw new Error("Could not allocate camera preview resources.");
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    context.bufferData(
      context.ARRAY_BUFFER,
      new Float32Array([
        -1, -1, 0, 0,
        1, -1, 1, 0,
        -1, 1, 0, 1,
        1, 1, 1, 1,
      ]),
      context.STATIC_DRAW
    );
    context.bindTexture(context.TEXTURE_2D, texture);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_S, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_WRAP_T, context.CLAMP_TO_EDGE);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MIN_FILTER, context.LINEAR);
    context.texParameteri(context.TEXTURE_2D, context.TEXTURE_MAG_FILTER, context.LINEAR);
    context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL, 1);
    context.useProgram(activeProgram);
    const position = context.getAttribLocation(activeProgram, "a_position");
    const texcoord = context.getAttribLocation(activeProgram, "a_texcoord");
    context.enableVertexAttribArray(position);
    context.vertexAttribPointer(position, 2, context.FLOAT, false, 16, 0);
    context.enableVertexAttribArray(texcoord);
    context.vertexAttribPointer(texcoord, 2, context.FLOAT, false, 16, 8);
    context.uniform1i(context.getUniformLocation(activeProgram, "u_video"), 0);

    let disposed = false;
    let currentCanvasWidth = 0;
    let currentCanvasHeight = 0;
    let currentFilm = -1;
    let currentCrop = "";
    const onLost = (event: Event) => {
      event.preventDefault();
      onContextLost?.();
    };
    canvas.addEventListener("webglcontextlost", onLost);

    return {
      render(source, frame, film) {
        if (disposed) throw new Error("Camera preview renderer has been disposed.");
        if (context.isContextLost()) throw new Error("Camera graphics context was lost.");
        if (canvas.width !== currentCanvasWidth || canvas.height !== currentCanvasHeight) {
          currentCanvasWidth = canvas.width;
          currentCanvasHeight = canvas.height;
          context.viewport(0, 0, canvas.width, canvas.height);
        }
        context.activeTexture(context.TEXTURE0);
        context.bindTexture(context.TEXTURE_2D, texture);
        // Re-specify each video image on the same texture object rather than
        // relying on same-size live-video texSubImage2D refresh behavior.
        context.texImage2D(context.TEXTURE_2D, 0, context.RGBA, context.RGBA, context.UNSIGNED_BYTE, source);
        const dimensions = getPhotoDimensions(source);
        const crop = getPhotoCrop(dimensions.width, dimensions.height, frame.aspectRatio);
        const cropUniform = [
          crop.x / dimensions.width,
          1 - (crop.y + crop.height) / dimensions.height,
          crop.width / dimensions.width,
          crop.height / dimensions.height,
        ];
        const cropKey = cropUniform.join(":");
        const filmIndex = film === "none"
          ? 0
          : PHOTO_FILM_PRESETS.findIndex((preset) => preset.id === film);
        context.useProgram(activeProgram);
        if (currentFilm !== filmIndex) {
          context.uniform1i(context.getUniformLocation(activeProgram, "u_film"), filmIndex);
          currentFilm = filmIndex;
        }
        if (currentCrop !== cropKey) {
          context.uniform4fv(context.getUniformLocation(activeProgram, "u_crop"), cropUniform);
          currentCrop = cropKey;
        }
        context.drawArrays(context.TRIANGLE_STRIP, 0, 4);
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        canvas.removeEventListener("webglcontextlost", onLost);
        if (!context.isContextLost()) {
          if (program) context.deleteProgram(program);
          if (buffer) context.deleteBuffer(buffer);
          if (texture) context.deleteTexture(texture);
          if (vertexShader) context.deleteShader(vertexShader);
          if (fragmentShader) context.deleteShader(fragmentShader);
        }
      },
    };
  } catch {
    if (!context.isContextLost()) {
      if (program) context.deleteProgram(program);
      if (buffer) context.deleteBuffer(buffer);
      if (texture) context.deleteTexture(texture);
      if (vertexShader) context.deleteShader(vertexShader);
      if (fragmentShader) context.deleteShader(fragmentShader);
    }
    return null;
  }
}

function compileCameraShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not allocate a camera shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Camera shader compile failed.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function formatPhotoStampDate(capturedAt: number) {
  const values = new Map(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kuala_Lumpur",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })
      .formatToParts(new Date(capturedAt))
      .map((part) => [part.type, part.value])
  );
  return `${values.get("day")} ${values.get("month")?.toUpperCase()} ${values.get("year")} ${values.get("hour")}:${values.get("minute")} ${values.get("dayPeriod")?.toUpperCase()}`;
}

export function formatPhotoStampCaption(coupleNames: string, capturedAt: number) {
  return `* ${coupleNames.toLocaleUpperCase("en-US")} | ${formatPhotoStampDate(capturedAt)}`;
}

export function renderPhotoCanvas(
  source: CanvasImageSource,
  options: PhotoRenderOptions
) {
  const dimensions = getPhotoDimensions(source);
  const outputAspect = options.outputWidth && options.outputHeight
    ? options.outputWidth / options.outputHeight
    : undefined;
  const crop = getPhotoCrop(
    dimensions.width,
    dimensions.height,
    options.aspectRatio ?? outputAspect ?? dimensions.width / dimensions.height
  );
  const scale = options.outputWidth && options.outputHeight
    ? 1
    : options.maxDimension
      ? Math.min(1, options.maxDimension / Math.max(crop.width, crop.height))
      : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(
    1,
    Math.round(options.outputWidth ?? crop.width * scale)
  );
  canvas.height = Math.max(
    1,
    Math.round(options.outputHeight ?? crop.height * scale)
  );
  return renderPhotoCanvasInto(source, canvas, options, crop);
}

export function renderCameraFrameInto(
  source: CanvasImageSource,
  canvas: HTMLCanvasElement,
  frame: Pick<CameraFrameGeometry, "aspectRatio" | "captureWidth" | "captureHeight">,
  options: PhotoRenderOptions
) {
  const dimensions = getPhotoDimensions(source);
  const crop = getPhotoCrop(
    dimensions.width,
    dimensions.height,
    frame.aspectRatio
  );
  return renderPhotoCanvasInto(
    source,
    canvas,
    {
      ...options,
      aspectRatio: frame.aspectRatio,
      stampAspectRatio: frame.captureWidth / frame.captureHeight,
    },
    crop
  );
}

export function renderCameraFrame(
  source: CanvasImageSource,
  frame: CameraFrameGeometry,
  options: PhotoRenderOptions
) {
  return renderPhotoCanvas(source, {
    ...options,
    aspectRatio: frame.aspectRatio,
    stampAspectRatio: frame.captureWidth / frame.captureHeight,
    outputWidth: frame.captureWidth,
    outputHeight: frame.captureHeight,
  });
}

export function renderPhotoCanvasInto(
  source: CanvasImageSource,
  canvas: HTMLCanvasElement,
  options: PhotoRenderOptions,
  crop = getPhotoCrop(
    getPhotoDimensions(source).width,
    getPhotoDimensions(source).height,
    canvas.width / canvas.height
  )
) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  const [x, y, width, height] = [crop.x, crop.y, crop.width, crop.height];
  context.save();
  try {
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      source,
      x,
      y,
      width,
      height,
      0,
      0,
      canvas.width,
      canvas.height
    );
    if (options.film !== "none") {
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      applyPhotoFilter(image.data, options.film);
      context.putImageData(image, 0, 0);
    }
    if (options.includeStamp !== false)
      drawPhotoStamp(context, canvas, {
        ...options,
        stampAspectRatio:
          options.stampAspectRatio ?? options.aspectRatio ?? crop.width / crop.height,
      });
    return canvas;
  } finally {
    context.restore();
  }
}

export function wrapPhotoStampLine(
  context: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number
) {
  const output: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const characters = Array.from(word);
    let token = "";
    const fragments: string[] = [];
    for (const character of characters) {
      const candidate = token + character;
      if (token && context.measureText(candidate).width > maxWidth) {
        fragments.push(token);
        token = character;
      } else token = candidate;
    }
    if (token) fragments.push(token);
    for (const fragment of fragments) {
      const candidate = line ? `${line} ${fragment}` : fragment;
      if (line && context.measureText(candidate).width > maxWidth) {
        output.push(line);
        line = fragment;
      } else line = candidate;
    }
  }
  if (line) output.push(line);
  return output;
}

function drawPhotoStamp(
  context: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  options: PhotoRenderOptions
): PhotoStampLayout {
  const layout = getPhotoStampLayout(context, canvas.width, canvas.height, options);
  context.save();
  try {
    context.fillStyle = "#df7137";
    context.shadowColor = "rgba(223, 113, 55, .38)";
    context.shadowBlur = Math.max(1, layout.fontSize * 0.1);
    context.textAlign = "left";
    context.textBaseline = "alphabetic";

    context.font = `700 ${layout.fontSize}px 'Courier New', monospace`;
    layout.mainLines.forEach((line, index) => {
      drawStampLine(context, line, layout.mainPositions[index], layout.letterSpacing);
    });

    context.font = `700 ${layout.secondaryFontSize}px 'Courier New', monospace`;
    context.shadowBlur = Math.max(1, layout.secondaryFontSize * 0.08);
    layout.customLines.forEach((line, index) => {
      drawStampLine(
        context,
        line,
        layout.customPositions[index],
        layout.secondaryLetterSpacing
      );
    });
  } finally {
    context.restore();
  }
  return layout;
}

/** Draws only the transparent imprint layer, for the live camera overlay. */
export function renderPhotoStampLayer(
  canvas: HTMLCanvasElement,
  options: PhotoRenderOptions
): PhotoStampLayout {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  return drawPhotoStamp(context, canvas, options);
}

function drawStampLine(
  context: CanvasRenderingContext2D,
  line: string,
  position: PhotoStampLayout["mainPositions"][number],
  spacing: number
) {
  context.save();
  try {
    if (position.rotated) {
      context.translate(position.x, position.y);
      context.rotate(Math.PI / 2);
      drawTrackedText(context, line, 0, 0, spacing);
    } else drawTrackedText(context, line, position.x, position.y, spacing);
  } finally {
    context.restore();
  }
}

function drawTrackedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number
) {
  let cursor = x;
  for (const character of Array.from(text)) {
    context.fillText(character, cursor, y);
    cursor += context.measureText(character).width + spacing;
  }
}

function trackedWidth(
  context: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  spacing: number
) {
  const characters = Array.from(text);
  return characters.reduce((width, character) => width + context.measureText(character).width, 0) +
    Math.max(0, characters.length - 1) * spacing;
}

function wrapTrackedText(
  context: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
  spacing: number
) {
  const lines: string[] = [];
  let line = "";
  for (const token of text.match(/\s+|\S+/g) ?? []) {
    if (/^\s+$/.test(token)) {
      if (line && trackedWidth(context, line + token, spacing) <= maxWidth)
        line += token;
      continue;
    }
    if (line && trackedWidth(context, line + token, spacing) <= maxWidth) {
      line += token;
      continue;
    }
    if (line) {
      lines.push(line.trimEnd());
      line = "";
    }
    let fragment = "";
    for (const character of Array.from(token)) {
      if (fragment && trackedWidth(context, fragment + character, spacing) > maxWidth) {
        lines.push(fragment);
        fragment = character;
      } else fragment += character;
    }
    line = fragment;
  }
  if (line) lines.push(line.trimEnd());
  return lines.length ? lines : [""];
}

export function getPhotoStampLayout(
  context: Pick<CanvasRenderingContext2D, "save" | "restore" | "font" | "measureText">,
  width: number,
  height: number,
  options: Pick<PhotoRenderOptions, "stamp" | "capturedAt" | "coupleNames" | "aspectRatio" | "stampAspectRatio">
): PhotoStampLayout {
  const shortEdge = Math.min(width, height);
  const fontSize = Math.max(1, shortEdge * 0.025);
  const secondaryFontSize = fontSize * 0.58;
  const letterSpacing = fontSize * 0.1;
  const secondaryLetterSpacing = secondaryFontSize * 0.12;
  const edgeInset = Math.max(1, shortEdge * 0.047);
  const portrait = (options.stampAspectRatio ?? options.aspectRatio ?? width / height) < 0.92;
  const orientation = portrait ? "portrait" : "landscape";
  const caption = formatPhotoStampCaption(options.coupleNames, options.capturedAt);
  const maxAxis = Math.max(fontSize * 1.2, (portrait ? height : width) - edgeInset * 2);
  context.save();
  try {
    context.font = `700 ${fontSize}px 'Courier New', monospace`;
    const mainLines = wrapTrackedText(context, caption, maxAxis, letterSpacing);
    const mainWidths = mainLines.map((line) =>
      trackedWidth(context, line, letterSpacing)
    );
    context.font = `700 ${secondaryFontSize}px 'Courier New', monospace`;
    const customLines = options.stamp
      ? wrapTrackedText(context, options.stamp, maxAxis, secondaryLetterSpacing)
      : [];
    const customWidths = customLines.map((line) =>
      trackedWidth(context, line, secondaryLetterSpacing)
    );

    let mainPositions: PhotoStampLayout["mainPositions"];
    let customPositions: PhotoStampLayout["customPositions"];
    let bounds: PhotoStampLayout["bounds"];
    let mainBounds: PhotoStampLayout["mainBounds"];
    let customBounds: PhotoStampLayout["customBounds"] = null;
    let reservedLeft = 0;
    let reservedBottom = 0;

    if (portrait) {
      const mainColumnGap = fontSize * 0.42;
      const mainColumnWidth = fontSize + mainColumnGap;
      const customColumnGap = secondaryFontSize * 0.35;
      const customColumnWidth = secondaryFontSize + customColumnGap;
      const customStartX = edgeInset + mainLines.length * mainColumnWidth + fontSize * 0.2;
      mainPositions = mainLines.map((line, index) => ({
        x: edgeInset + index * mainColumnWidth,
        y: height - edgeInset - mainWidths[index],
        rotated: true,
      }));
      customPositions = customLines.map((line, index) => ({
        x: customStartX + index * customColumnWidth,
        y: height - edgeInset - customWidths[index],
        rotated: true,
      }));
      const mainTop = Math.min(...mainPositions.map((position) => position.y));
      mainBounds = {
        x: edgeInset,
        y: mainTop - fontSize * 0.85,
        width: mainLines.length * fontSize + (mainLines.length - 1) * mainColumnGap,
        height: height - edgeInset - (mainTop - fontSize * 0.85),
      };
      if (customPositions.length) {
        const customTop = Math.min(...customPositions.map((position) => position.y));
        customBounds = {
          x: customStartX,
          y: customTop - secondaryFontSize * 0.85,
          width: customLines.length * secondaryFontSize + (customLines.length - 1) * customColumnGap,
          height: height - edgeInset - (customTop - secondaryFontSize * 0.85),
        };
      }
      const textRight = customPositions.length
        ? customPositions.at(-1)!.x + secondaryFontSize
        : mainPositions.at(-1)!.x + fontSize;
      const top = Math.min(mainBounds.y, customBounds?.y ?? height - edgeInset);
      bounds = {
        x: edgeInset,
        y: top,
        width: textRight - edgeInset,
        height: height - edgeInset - top,
      };
      reservedLeft = textRight + edgeInset * 0.28;
      reservedBottom = edgeInset + fontSize * 0.35;
    } else {
      const mainLineHeight = fontSize * 1.32;
      const secondaryLineHeight = secondaryFontSize * 1.3;
      const gap = customLines.length ? secondaryFontSize * 0.7 : 0;
      mainPositions = mainLines.map((_, index) => ({
        x: edgeInset,
        y: height - edgeInset - (mainLines.length - index - 1) * mainLineHeight,
        rotated: false,
      }));
      const customBottom =
        (mainPositions[0]?.y ?? height - edgeInset) -
        (customLines.length ? fontSize * 1.2 : 0);
      customPositions = customLines.map((_, index) => ({
        x: edgeInset,
        y: customBottom - (customLines.length - index - 1) * secondaryLineHeight,
        rotated: false,
      }));
      const mainTop = (mainPositions[0]?.y ?? height - edgeInset) - fontSize * 0.85;
      const mainBottom =
        (mainPositions.at(-1)?.y ?? height - edgeInset) + fontSize * 0.2;
      // mainWidths were measured before switching the context to the smaller
      // secondary font. Keep the reported bounds aligned with the painted line.
      const mainWidth = Math.max(...mainWidths, 0);
      mainBounds = {
        x: edgeInset,
        y: mainTop,
        width: mainWidth,
        height: mainBottom - mainTop,
      };
      if (customPositions.length) {
        const customTop = customPositions[0].y - secondaryFontSize * 0.85;
        const customBottom = customPositions.at(-1)!.y + secondaryFontSize * 0.2;
        const customWidth = Math.max(
          ...customLines.map((line) => trackedWidth(context, line, secondaryLetterSpacing)),
          0
        );
        customBounds = {
          x: edgeInset,
          y: customTop,
          width: customWidth,
          height: customBottom - customTop,
        };
      }
      const right = Math.max(
        ...mainWidths.map((lineWidth) => edgeInset + lineWidth),
        ...customWidths.map((lineWidth) => edgeInset + lineWidth),
        edgeInset
      );
      const textTop = Math.min(mainBounds.y, customBounds?.y ?? mainBounds.y);
      const textBottom = Math.max(
        mainBounds.y + mainBounds.height,
        (customBounds?.y ?? 0) + (customBounds?.height ?? 0)
      );
      bounds = {
        x: edgeInset,
        y: textTop,
        width: right - edgeInset,
        height: textBottom - textTop,
      };
      reservedBottom = height - bounds.y + gap + edgeInset * 0.25;
    }

    return {
      orientation,
      bounds,
      mainBounds,
      customBounds,
      reservedLeft,
      reservedBottom,
      caption,
      mainLines,
      customLines,
      mainPositions,
      customPositions,
      fontSize,
      secondaryFontSize,
      letterSpacing,
      secondaryLetterSpacing,
      edgeInset,
    };
  } finally {
    context.restore();
  }
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
