import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/wedding/songketMotion.ts", import.meta.url),
    "utf8"
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }
).outputText;

function setup(kind, reduced = false) {
  const exports = {};
  const timers = new Map();
  let observer;
  const document = new EventTarget();
  document.hidden = false;
  const motion = new EventTarget();
  motion.matches = reduced;
  const element = new EventTarget();
  element.dataset = {};
  class Observer {
    constructor(callback) {
      this.callback = callback;
      observer = this;
    }
    observe() {
      this.connected = true;
    }
    disconnect() {
      this.connected = false;
    }
    enter(visible) {
      if (this.connected) this.callback([{ isIntersecting: visible }]);
    }
  }
  vm.runInNewContext(source, {
    exports,
    document,
    window: { matchMedia: () => motion, IntersectionObserver: Observer },
    IntersectionObserver: Observer,
    setTimeout(fn) {
      const id = timers.size + 1;
      timers.set(id, fn);
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  });
  const cleanup = exports.observeSongketMotion(element, kind);
  return {
    element,
    document,
    motion,
    timers,
    cleanup,
    enter: (visible) => observer?.enter(visible),
  };
}

test("ambient work pauses offscreen/hidden and cleans up on unmount", () => {
  const s = setup("ambient");
  s.enter(true);
  assert.equal(s.element.dataset.active, "true");
  s.document.hidden = true;
  s.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(s.element.dataset.active, "false");
  s.document.hidden = false;
  s.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(s.element.dataset.active, "true");
  s.enter(false);
  assert.equal(s.element.dataset.active, "false");
  s.cleanup();
  s.enter(true);
  s.document.dispatchEvent(new Event("visibilitychange"));
  assert.deepEqual(s.element.dataset, {});
});

test("an interrupted wishes sequence finishes and does not replay on reentry", () => {
  const s = setup("stitch");
  assert.equal(s.element.dataset.motion, "waiting");
  s.enter(true);
  assert.equal(s.element.dataset.motion, "stitch");
  assert.equal(s.timers.size, 1);
  s.enter(false);
  assert.equal(s.element.dataset.motion, "complete");
  assert.equal(s.timers.size, 0);
  s.enter(true);
  assert.equal(s.element.dataset.motion, "complete");
  s.cleanup();
  assert.equal(s.timers.size, 0);
});

test("reduced motion keeps static artwork and a mid-sequence preference completes it", () => {
  const staticArt = setup("stitch", true);
  assert.deepEqual(staticArt.element.dataset, {});
  assert.equal(staticArt.timers.size, 0);
  staticArt.cleanup();
  const s = setup("stitch");
  s.enter(true);
  s.motion.matches = true;
  s.motion.dispatchEvent(new Event("change"));
  assert.equal(s.element.dataset.motion, "complete");
  assert.equal(s.timers.size, 0);
  s.cleanup();
});
