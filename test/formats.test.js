const test = require("node:test");
const assert = require("node:assert/strict");

const { toNetlify, toApache, toHtmlPage, toOutputPath } = require("../lib/formats");

const list = [
  { from: "/old-a/", to: "/new-a/", status: 301 },
  { from: "/old-b/", to: "/new-b/", status: 302 },
];

test("toNetlify renders one rule per line", () => {
  assert.equal(toNetlify(list), "/old-a/  /new-a/  301\n/old-b/  /new-b/  302\n");
});

test("toApache renders Redirect directives", () => {
  assert.equal(
    toApache(list),
    "Redirect 301 /old-a/ /new-a/\nRedirect 302 /old-b/ /new-b/\n"
  );
});

test("toHtmlPage escapes the target and includes a meta refresh + canonical", () => {
  const html = toHtmlPage("/new?a=1&b=2");
  assert.match(html, /<meta http-equiv="refresh" content="0; url=\/new\?a=1&amp;b=2">/);
  assert.match(html, /<link rel="canonical" href="\/new\?a=1&amp;b=2">/);
});

test("toOutputPath maps trailing-slash and extensionless paths to index.html", () => {
  assert.equal(toOutputPath("/old-path/"), "old-path/index.html");
  assert.equal(toOutputPath("/old-path"), "old-path/index.html");
  assert.equal(toOutputPath("/"), "index.html");
});

test("toOutputPath leaves paths with an existing extension as-is", () => {
  assert.equal(toOutputPath("/old-feed.xml"), "old-feed.xml");
});
