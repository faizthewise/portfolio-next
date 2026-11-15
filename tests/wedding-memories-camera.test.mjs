import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { test } from "node:test";

const source = fs.readFileSync("src/lib/wedding/memoriesCamera.ts", "utf8");
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiled = { exports: {} };
new Function("module", "exports", code)(compiled, compiled.exports);
const { acquireCameraStream, CaptureGate } = compiled.exports;

test("a camera permission that resolves after close stops every late track", async () => {
  let resolveRequest;
  let active = true;
  let stopped = 0;
  const stream = {
    getTracks: () => [{ stop: () => stopped++ }, { stop: () => stopped++ }],
  };
  const pending = acquireCameraStream(
    () => new Promise((resolve) => (resolveRequest = resolve)),
    { video: true, audio: false },
    () => active
  );
  active = false;
  resolveRequest(stream);
  assert.equal(await pending, undefined);
  assert.equal(stopped, 2);
});

test("shutter/save gates reject duplicate concurrent operations", async () => {
  const gate = new CaptureGate();
  let finish;
  let executions = 0;
  const pending = gate.run(
    () => new Promise((resolve) => {
      executions++;
      finish = resolve;
    })
  );
  assert.equal(gate.isBusy, true);
  assert.equal(await gate.run(async () => { executions++; }), false);
  assert.equal(executions, 1);
  finish();
  assert.equal(await pending, true);
  assert.equal(gate.isBusy, false);
  assert.equal(await gate.run(async () => { executions++; }), true);
  assert.equal(executions, 2);
});
