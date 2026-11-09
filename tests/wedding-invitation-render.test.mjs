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
let salam = false;
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
          useRouter: () => ({
            isReady: true,
            query: { mode, salam: salam ? "1" : undefined },
          }),
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
  assert.match(html, /Urban Park Hall, Alam Impian/);
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
  const groomCover = render(groomInvitation);
  assert.match(groomCover, /27 \. 12 \. 2026/);
  const cardContent = groomCover.match(/<button\b[^>]*>(.*?)<\/button>/s)?.[1];
  assert.ok(cardContent);
  assert.doesNotMatch(cardContent, /Faiz|Harissa|Walimatulurus/);
  assert.match(cardContent, /wax-seal-fh-burgundy-v2\.webp/);
  assert.match(render(brideInvitation), /28 \. 11 \. 2026/);
  assert.match(render(brideInvitation), /wax-seal-fh-v1\.png/);
  opened = true;
});

test("songket has one host-led welcome card before the quotation", () => {
  opened = true;
  const groom = render(groomInvitation);
  const hero = groom.slice(
    groom.indexOf('data-part="hero"'),
    groom.indexOf('data-part="quotation"')
  );
  const visible = hero.replace(/<[^>]*>/g, "").replace(/\s+/g, " ");
  assert.doesNotMatch(groom, /id="undangan"|Undangan dengan penuh kesyukuran/);
  assert.equal((hero.match(/<h1\b/g) || []).length, 1);
  assert.ok(
    hero.indexOf('data-part="hosts"') < hero.indexOf('data-part="couple-names"')
  );
  for (const name of [
    "Muhammad Faiz bin Hasnul",
    "Harissa Amani binti Abd Razak",
  ]) {
    assert.equal(visible.split(name).length - 1, 1);
  }
  assert.match(visible, /Hasnul bin Abu Shahir/);
  assert.match(visible, /Normah binti Samsuri/);
  assert.match(visible, /perkahwinan putera kami/);
  assert.doesNotMatch(groom, /15 November 2026/);
  assert.match(render(brideInvitation), /15 November 2026/);
  assert.match(groom, /Sedang memuatkan ucapan/);
});

test("both suites preserve gifts, hashtag, registry scope, and language in every mode", () => {
  for (const wedding of [groomInvitation, brideInvitation]) {
    for (const guestMode of [
      "family",
      "friend",
      "parentFriend",
      "sekeluarga",
    ]) {
      mode = guestMode;
      const html = render(wedding);
      const gifts = guestMode === "friend" || guestMode === "parentFriend";
      assert.equal(html.includes('id="hadiah"'), gifts);
      assert.equal(
        html.includes("#FaIzTheOneForHarissa"),
        guestMode === "friend"
      );
      assert.equal(
        html.includes("invitation=groom"),
        gifts && wedding.side === "groom"
      );
      assert.match(
        html,
        guestMode === "sekeluarga" ? /bersama keluarga/ : /bersama pasangan/
      );
      assert.doesNotMatch(html, /id="salam-kaut"/);
    }
  }
  mode = "friend";
});

test("songket hero includes the event time before its actions", () => {
  const html = render(groomInvitation);
  const hero = html.slice(
    html.indexOf('data-part="hero"'),
    html.indexOf('data-part="quotation"')
  );
  assert.match(
    hero,
    /data-part="hero-time"[^>]*>11\.30 pagi - 4\.00 petang<\/p>/
  );
  assert.ok(
    hero.indexOf('data-part="hero-time"') <
      hero.indexOf('data-part="hero-links"')
  );
  assert.equal((hero.match(/27 DISEMBER 2026/g) || []).length, 1);
  assert.match(html, /<section data-part="quotation">/);
});

test("Salam Kaut links to the existing QR section only when enabled", () => {
  try {
    for (const invitation of [groomInvitation, brideInvitation]) {
      salam = false;
      assert.doesNotMatch(render(invitation), /href="#salam-kaut"/);
      salam = true;
      const html = render(invitation);
      assert.match(html, /href="#salam-kaut"/);
      assert.match(html, /id="salam-kaut"/);
      assert.match(html, /src="\/images\/harissa-qr.jpeg"/);
    }
  } finally {
    salam = false;
  }
});
