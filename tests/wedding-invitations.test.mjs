import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

function loadModule(name, dependencies = {}) {
  const source = ts.transpileModule(
    readFileSync(
      new URL(`../src/lib/wedding/${name}.ts`, import.meta.url),
      "utf8"
    ),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: (path) => {
      assert.ok(path in dependencies, `Unexpected dependency: ${path}`);
      return dependencies[path];
    },
  });
  return exports;
}

const invitations = loadModule("invitations");
const { getInvitationMode, invitationReturnPath } = loadModule(
  "invitationMode",
  {
    "./invitations": invitations,
  }
);

test("registry return links preserve each invitation and its guest mode", () => {
  for (const mode of ["family", "friend", "parentFriend", "sekeluarga"]) {
    for (const side of [undefined, "groom"]) {
      const url = new URL(
        invitationReturnPath(mode, side),
        "https://example.test"
      );
      assert.equal(
        url.pathname,
        side === "groom"
          ? invitations.groomInvitationPath
          : invitations.brideInvitationPath
      );
      assert.equal(url.searchParams.get("mode"), mode);
      assert.equal(url.searchParams.get("registry"), "1");
      assert.equal(
        url.hash,
        ["family", "sekeluarga"].includes(mode) ? "" : "#hadiah"
      );
    }
  }
  assert.equal(getInvitationMode("unknown"), "family");
  assert.equal(getInvitationMode(["friend"]), "family");
  assert.ok(
    invitationReturnPath("friend", "https://example.test").startsWith(
      invitations.brideInvitationPath
    )
  );
});

test("the groom celebration has its own RSVP scope and matching calendar date", () => {
  const { brideInvitation: bride, groomInvitation: groom } = invitations;
  assert.notEqual(groom.eventId, bride.eventId);
  assert.equal(groom.date.toISOString(), "2026-12-27T03:30:00.000Z");
  assert.equal(
    new Intl.DateTimeFormat("en", {
      weekday: "long",
      timeZone: "Asia/Kuala_Lumpur",
    }).format(groom.date),
    "Sunday"
  );
  assert.equal(groom.calendarDates, "20261227T113000/20261227T160000");
  assert.equal(bride.date.toISOString(), "2026-11-28T03:30:00.000Z");
});
