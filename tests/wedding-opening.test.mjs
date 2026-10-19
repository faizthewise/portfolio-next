import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

const source = ts.transpileModule(
  readFileSync(
    new URL("../src/lib/wedding/mohorOpening.ts", import.meta.url),
    "utf8"
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
).outputText;

class Media extends EventTarget {
  volume = 1;
  currentTime = 0;
  paused = true;
  rejected = false;
  plays = [];
  play() {
    this.plays.push(this.volume);
    if (this.rejected) return Promise.reject(new Error("Playback unavailable"));
    this.paused = false;
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
  }
}

function setup({ reducedMotion = false, rejectSound = false, musicGate } = {}) {
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    setTimeout(fn, delay) {
      const id = ++nextId;
      timers.set(id, { fn, at: now + delay });
      return id;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  });
  const sound = new Media();
  sound.rejected = rejectSound;
  const music = new Media();
  const events = [];
  const cleanup = exports.playMohorOpening({
    sound,
    music,
    musicGate,
    reducedMotion,
    onReveal: () => events.push("reveal"),
    onOpen: () => events.push("open"),
    onMusicChange: (playing) =>
      events.push(playing ? "music" : "music-blocked"),
  });
  const advance = async (milliseconds) => {
    await Promise.resolve();
    const until = now + milliseconds;
    while (true) {
      const next = [...timers.entries()]
        .filter(([, timer]) => timer.at <= until)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      now = next[1].at;
      timers.delete(next[0]);
      next[1].fn();
      await Promise.resolve();
    }
    now = until;
  };
  return { sound, music, events, cleanup, advance };
}

test("the card appears while the chime continues, and the song waits for its end", async () => {
  const { sound, music, events, advance, cleanup } = setup();
  await advance(1800);
  assert.deepEqual(events, ["reveal"]);
  await advance(999);
  assert.deepEqual(events, ["reveal"]);
  await advance(1);
  assert.deepEqual(events, ["reveal", "open"]);
  assert.equal(sound.paused, false);
  assert.deepEqual(music.plays, [0]);
  assert.equal(music.paused, true);
  await advance(2200);
  assert.deepEqual(events, ["reveal", "open"]);
  sound.dispatchEvent(new Event("ended"));
  await advance(0);
  assert.deepEqual(events, ["reveal", "open", "music"]);
  assert.deepEqual(music.plays, [0, 0.55]);
  assert.equal(music.currentTime, 0.5);
  cleanup();
});

test("a short or unavailable sound still allows the flourish to finish", async () => {
  const { events, advance, cleanup } = setup({ rejectSound: true });
  await advance(1799);
  assert.deepEqual(events, []);
  await advance(1);
  assert.deepEqual(events, ["reveal"]);
  await advance(1000);
  assert.deepEqual(events, ["reveal", "open", "music"]);
  cleanup();
});

test("reduced motion reveals immediately but the song still waits for audio", async () => {
  const { sound, events, advance, cleanup } = setup({ reducedMotion: true });
  await advance(0);
  assert.deepEqual(events, ["reveal", "open"]);
  await advance(5000);
  assert.deepEqual(events, ["reveal", "open"]);
  sound.dispatchEvent(new Event("ended"));
  await advance(0);
  assert.deepEqual(events, ["reveal", "open", "music"]);
  cleanup();
});

test("stalled audio cannot leave the guest trapped on the cover", async () => {
  const { sound, events, advance, cleanup } = setup();
  await advance(16000);
  assert.equal(sound.paused, true);
  assert.deepEqual(events, ["reveal", "open", "music"]);
  cleanup();
});

test("leaving during the effect cancels playback and all pending transitions", async () => {
  const { sound, music, events, advance, cleanup } = setup();
  cleanup();
  sound.dispatchEvent(new Event("ended"));
  await advance(20000);
  assert.deepEqual(events, []);
  assert.equal(sound.paused, true);
  assert.equal(music.paused, true);
});

test("duplicate completion signals do not replay the reveal or music", async () => {
  const { sound, events, advance, cleanup } = setup();
  await advance(5000);
  sound.dispatchEvent(new Event("ended"));
  sound.dispatchEvent(new Event("error"));
  await advance(20000);
  assert.deepEqual(events, ["reveal", "open", "music"]);
  cleanup();
});

test("the audio gain stays silent after the card appears until the chime finishes", async () => {
  const musicGate = { gain: { value: 1 } };
  const { sound, advance, cleanup } = setup({ musicGate });
  await advance(2800);
  assert.equal(musicGate.gain.value, 0);
  await advance(2200);
  assert.equal(musicGate.gain.value, 0);
  sound.dispatchEvent(new Event("ended"));
  await advance(0);
  assert.equal(musicGate.gain.value, 1);
  cleanup();
});

test("skip the quiet chime tail and silent song lead-in without overlapping playback", async () => {
  const { sound, music, events, advance, cleanup } = setup();
  await advance(2800);
  sound.currentTime = 4.3;
  sound.dispatchEvent(new Event("timeupdate"));
  assert.deepEqual(events, ["reveal", "open"]);
  assert.equal(sound.paused, false);
  sound.currentTime = 4.4;
  sound.dispatchEvent(new Event("timeupdate"));
  await advance(0);
  assert.equal(sound.paused, true);
  assert.equal(music.currentTime, 0.5);
  assert.deepEqual(events, ["reveal", "open", "music"]);
  cleanup();
});
