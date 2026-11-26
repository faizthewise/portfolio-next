import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = fs.readFileSync("src/lib/wedding/memoriesRender.ts", "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
function loadRenderer(includeInkBounds = true) {
  const compiled = { exports: {} };
  const document = {
    createElement(tag) {
      assert.equal(tag, "canvas");
      const calls = [];
      const context = {
        save() {},
        restore() {},
        clearRect() {},
        drawImage(...args) {
          calls.push(["draw", ...args]);
        },
        getImageData() {
          return { data: new Uint8ClampedArray([124, 90, 80, 255]) };
        },
        putImageData(image) {
          calls.push(["film", [...image.data]]);
        },
        measureText(value) {
          const size = parseFloat(this.font.split(" ")[1]);
          const width = Array.from(value).length * size * 0.6;
          return includeInkBounds
            ? {
                width,
                actualBoundingBoxAscent: size * 0.7,
                actualBoundingBoxLeft: 0,
              }
            : { width };
        },
        translate(x, y) {
          calls.push(["translate", x, y]);
        },
        rotate(radians) {
          calls.push(["rotate", radians]);
        },
        fillText(value, x, y) {
          calls.push([
            "stamp",
            value,
            x,
            y,
            this.fillStyle,
            this.measureText(value),
            this.font,
          ]);
        },
      };
      return { calls, getContext: () => context };
    },
  };
  new Function("module", "exports", "document", code)(
    compiled,
    compiled.exports,
    document
  );
  return compiled.exports;
}

const { formatWeddingPhotoStamp, renderWeddingPhoto } = loadRenderer();
const time = Date.UTC(2026, 10, 27, 16, 35);
const coupleNames = "Harissa & Faiz";
const caption = "HARISSA & FAIZ | 28 NOV 2026 12:35 AM";

test("wedding stamp formats event-local time and omits an unavailable date", () => {
  assert.equal(formatWeddingPhotoStamp("  Harissa \n & Faiz  ", time), caption);
  for (const invalid of [undefined, NaN, Infinity, 1e18]) {
    assert.equal(
      formatWeddingPhotoStamp(coupleNames, invalid),
      "HARISSA & FAIZ"
    );
  }
});

test("full wedding renders preserve the frame, cap the long edge and stamp once after filtering", () => {
  for (const [width, height, outputWidth, outputHeight] of [
    [3000, 6000, 2048, 4096],
    [6000, 3000, 4096, 2048],
    [6000, 6000, 4096, 4096],
  ]) {
    const photo = { width, height };
    const result = renderWeddingPhoto(photo, {
      film: "fp2",
      coupleNames,
      time,
    });
    assert.equal(result.width, outputWidth);
    assert.equal(result.height, outputHeight);
    assert.deepEqual(
      result.calls.map(([kind]) => kind),
      ["draw", "film", "translate", "rotate", "stamp"]
    );
    const [draw, film, translation, rotation, stamp] = result.calls;
    assert.deepEqual(draw, [
      "draw",
      photo,
      0,
      0,
      width,
      height,
      0,
      0,
      outputWidth,
      outputHeight,
    ]);
    assert.notDeepEqual(film[1], [124, 90, 80, 255]);
    assert.deepEqual(rotation, ["rotate", -Math.PI / 2]);
    assert.deepEqual(stamp.slice(1, 5), [caption, 0, 0, "#E98A43"]);
    const { width: length, actualBoundingBoxAscent: ascent } = stamp[5];
    assert.ok(Math.abs(translation[1] - ascent - outputWidth * 0.035) < 0.001);
    assert.equal(translation[2], outputHeight * 0.96);
    assert.ok(length >= outputHeight * 0.45 && length <= outputHeight * 0.61);
    assert.match(stamp[6], /^700 .+px 'Courier New', monospace$/);
  }
});

test("a wedding thumbnail crops the original to a square before painting long names", () => {
  const photo = {
    naturalWidth: 1000,
    naturalHeight: 1400,
    width: 10,
    height: 14,
  };
  const result = renderWeddingPhoto(photo, {
    film: "none",
    coupleNames: coupleNames.repeat(6),
    thumbnail: true,
  });
  assert.equal(result.width, 400);
  assert.equal(result.height, 400);
  assert.deepEqual(
    result.calls.map(([kind]) => kind),
    ["draw", "translate", "rotate", "stamp"]
  );
  assert.deepEqual(result.calls[0], [
    "draw",
    photo,
    0,
    200,
    1000,
    1000,
    0,
    0,
    400,
    400,
  ]);
  const stamp = result.calls.at(-1);
  assert.equal(stamp[1], coupleNames.toUpperCase().repeat(6));
  assert.ok(stamp[5].width <= 241);

  const small = renderWeddingPhoto(
    { width: 120, height: 80 },
    { film: "none", coupleNames }
  );
  assert.deepEqual([small.width, small.height], [120, 80]);
  const capped = renderWeddingPhoto(photo, {
    film: "none",
    coupleNames,
    maxDimension: 700,
  });
  assert.deepEqual([capped.width, capped.height], [500, 700]);
});

test("the wedding stamp remains visible when text metrics only report width", () => {
  const renderer = loadRenderer(false);
  const result = renderer.renderWeddingPhoto(
    { width: 600, height: 800 },
    { film: "none", coupleNames, time }
  );
  const [, translation, rotation, stamp] = result.calls;
  const fontSize = parseFloat(stamp[6].split(" ")[1]);
  assert.deepEqual(translation, [
    "translate",
    600 * 0.035 + fontSize * 0.75,
    800 * 0.96,
  ]);
  assert.deepEqual(rotation, ["rotate", -Math.PI / 2]);
  assert.equal(stamp[1], caption);
});
