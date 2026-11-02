import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import test from "node:test";
import vm from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../src/", import.meta.url));
const cache = new Map();
let mode = "friend";
let opened = true;

// Exercise the real page tree without browser effects or Firebase writes.
function load(filename) {
  if (cache.has(filename)) return cache.get(filename);
  const exports = {};
  cache.set(filename, exports);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  vm.runInNewContext(source, {
    exports,
    require(path) {
      if (path === "next/font/google")
        return new Proxy(
          {},
          {
            get: () => () => ({ className: "test-font" }),
          }
        );
      if (path === "next/router")
        return {
          useRouter: () => ({ isReady: true, query: { mode } }),
        };
      if (path === "@/components/wedding/WeddingMusicProvider")
        return {
          useWeddingMusic: () => ({ invitationOpened: opened }),
        };
      if (path.endsWith(".module.css"))
        return { __esModule: true, default: {} };
      if (path.startsWith("@/") || path.startsWith(".")) {
        const base = path.startsWith("@/")
          ? `${root}${path.slice(2)}`
          : fileURLToPath(new URL(path, `file://${filename}`));
        return load(existsSync(`${base}.tsx`) ? `${base}.tsx` : `${base}.ts`);
      }
      return require(path);
    },
    console,
  });
  return exports;
}

const Invitation = load(
  `${root}components/wedding/WeddingInvitation.tsx`
).default;
const { brideInvitation, groomInvitation } = load(
  `${root}lib/wedding/invitations.ts`
);
const render = (wedding) =>
  renderToStaticMarkup(React.createElement(Invitation, { wedding }));

test("the groom invitation renders the right hosts, couple order, directions, calendar, and contacts", () => {
  const html = render(groomInvitation);
  assert.match(html, /Hasnul bin Abu Shahir/);
  assert.match(html, /Normah binti Samsuri/);
  assert.match(html, /perkahwinan putera kami/);
  assert.ok(html.indexOf("Muhammad Faiz") < html.indexOf("Harissa Amani"));
  assert.match(html, /27 DISEMBER 2026/);
  assert.match(html, /Urban Park, Alam Impian/);
  assert.match(html, /dates=20261227T113000\/20261227T160000/);
  for (const phone of [
    "60192258819",
    "60184061998",
    "60176949104",
    "60176536578",
  ]) {
    assert.ok(html.includes(`href="tel:+${phone}"`));
    assert.ok(html.includes(`href="https://wa.me/${phone}"`));
  }
  assert.match(html, /invitation=groom/);
  assert.doesNotMatch(html, /LeQAMR|28 NOVEMBER|0126365859/);
});

test("the existing garden invitation retains its details and guest-mode gift visibility", () => {
  const html = render(brideInvitation);
  assert.match(html, /Ts\. Abd Razak bin Mohamad Zin/);
  assert.match(html, /perkahwinan puteri kami/);
  assert.match(html, /28 NOVEMBER 2026/);
  assert.match(html, /LeQAMR Glasshall, Melaka/);
  assert.match(html, /id="hadiah"/);
  assert.doesNotMatch(html, /invitation=groom/);
  mode = "sekeluarga";
  const family = render(groomInvitation);
  assert.match(family, /keluarga.*ke majlis perkahwinan putera kami/);
  assert.doesNotMatch(family, /id="hadiah"/);
  mode = "friend";
});

test("the two unopened covers show their respective dates and artwork", () => {
  opened = false;
  assert.match(render(groomInvitation), /27 \. 12 \. 2026/);
  assert.match(render(groomInvitation), /Faiz <i>&amp;<\/i> Harissa/);
  assert.match(render(brideInvitation), /28 \. 11 \. 2026/);
  assert.match(render(brideInvitation), /wax-seal-fh-v1\.png/);
  opened = true;
});
