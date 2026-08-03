const test = require("node:test");
const assert = require("node:assert/strict");

const { normalizeRedirects } = require("../lib/normalize");

test("normalizes an object map of string targets", () => {
  const list = normalizeRedirects({ "/old/": "/new/" }, 301);
  assert.deepEqual(list, [{ from: "/old/", to: "/new/", status: 301 }]);
});

test("normalizes an object map with per-entry status", () => {
  const list = normalizeRedirects({ "/old/": { to: "/new/", status: 302 } }, 301);
  assert.deepEqual(list, [{ from: "/old/", to: "/new/", status: 302 }]);
});

test("adds a leading slash to bare paths", () => {
  const list = normalizeRedirects({ "old": "/new/" }, 301);
  assert.equal(list[0].from, "/old");
});

test("normalizes an array of entries, allowing duplicate from paths", () => {
  const list = normalizeRedirects(
    [
      { from: "/old/", to: "/new-a/" },
      { from: "/old/", to: "/new-b/", status: 302 },
    ],
    301
  );
  assert.deepEqual(list, [
    { from: "/old/", to: "/new-a/", status: 301 },
    { from: "/old/", to: "/new-b/", status: 302 },
  ]);
});

test("throws on an entry missing a target", () => {
  assert.throws(() => normalizeRedirects({ "/old/": "" }, 301), /invalid redirect entry/);
});

test("returns an empty list for no redirects", () => {
  assert.deepEqual(normalizeRedirects({}, 301), []);
  assert.deepEqual(normalizeRedirects(undefined, 301), []);
});
