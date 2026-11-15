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

export function formatPhotoStampDate(capturedAt: number) {
  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kuala_Lumpur",
  }).format(new Date(capturedAt));
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
      drawPhotoStamp(context, canvas, options);
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
) {
  const shortEdge = Math.min(canvas.width, canvas.height);
  const fontSize = Math.max(1, shortEdge * 0.035);
  context.font = `${fontSize}px Georgia, serif`;
  const maxWidth = canvas.width * 0.9;
  const lines = [
    ...(options.stamp.trim()
      ? wrapPhotoStampLine(context, options.stamp.trim(), maxWidth)
      : []),
    ...wrapPhotoStampLine(context, options.coupleNames, maxWidth),
    ...wrapPhotoStampLine(
      context,
      formatPhotoStampDate(options.capturedAt),
      maxWidth
    ),
  ];
  const lineHeight = fontSize * 1.25;
  const bandHeight = lines.length * lineHeight + fontSize * 1.1;
  const gradient = context.createLinearGradient(
    0,
    canvas.height - bandHeight,
    0,
    canvas.height
  );
  gradient.addColorStop(0, "rgba(22,24,20,0)");
  gradient.addColorStop(0.32, "rgba(22,24,20,.55)");
  gradient.addColorStop(1, "rgba(22,24,20,.74)");
  context.fillStyle = gradient;
  context.fillRect(0, canvas.height - bandHeight, canvas.width, bandHeight);
  context.fillStyle = "#fffdf8";
  context.shadowColor = "rgba(0,0,0,.3)";
  context.shadowBlur = Math.max(1, fontSize / 5);
  context.textAlign = "right";
  lines.forEach((line, index) =>
    context.fillText(
      line,
      canvas.width * 0.95,
      canvas.height -
        fontSize * 0.45 -
        (lines.length - index - 1) * lineHeight,
      maxWidth
    )
  );
}

function clamp(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)));
}
