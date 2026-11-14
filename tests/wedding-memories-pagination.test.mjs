import assert from "node:assert/strict";
import fs from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const source = fs.readFileSync(
  "src/lib/wedding/memoriesPagination.ts",
  "utf8"
);
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const compiled = { exports: {} };
new Function("module", "exports", code)(compiled, compiled.exports);
const {
  appendMemoryRows,
  applyMemoryHead,
  applyMemoryTail,
  beginMemoryPage,
  mergeMemoryRows,
  resetMemoryPage,
} = compiled.exports;

test("a live head update preserves the tail cursor for page three", () => {
  let page = applyMemoryHead(resetMemoryPage(), "head-1", true);
  let rows = [{ id: "p1" }, { id: "p2" }];

  page = beginMemoryPage(page);
  rows = appendMemoryRows(rows, [{ id: "p3" }, { id: "p4" }]);
  page = applyMemoryTail(page, "page-2-tail", true);

  rows = mergeMemoryRows(rows, [{ id: "new-live-photo" }, { id: "p1" }]);
  page = applyMemoryHead(page, "new-head-tail", true);
  assert.equal(page.cursor, "page-2-tail");
  assert.deepEqual(rows.map((row) => row.id), [
    "new-live-photo",
    "p1",
    "p2",
    "p3",
    "p4",
  ]);

  // Page three uses the retained page-two tail as its start cursor.
  const pageThreeStart = page.cursor;
  rows = appendMemoryRows(rows, [{ id: "p5" }, { id: "p6" }]);
  page = applyMemoryTail(page, "page-3-tail", false);
  assert.equal(pageThreeStart, "page-2-tail");
  assert.equal(page.cursor, "page-3-tail");
  assert.equal(page.hasMore, false);
});

test("live head updates do not reopen an exhausted gallery", () => {
  let page = applyMemoryHead(resetMemoryPage(), "head-tail", true);
  page = beginMemoryPage(page);
  page = applyMemoryTail(page, "last-page-tail", false);

  page = applyMemoryHead(page, "newer-head-tail", true);
  assert.equal(page.cursor, "last-page-tail");
  assert.equal(page.hasMore, false);
});
