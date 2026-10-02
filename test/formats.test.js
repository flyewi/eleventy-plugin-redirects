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

test("toHtmlPage carries the URL fragment over via location.replace", () => {
  const html = toHtmlPage("/new/");
  assert.match(html, /<script>location\.replace\("\/new\/" \+ location\.hash\);<\/script>/);
});

test("toHtmlPage keeps a target's own fragment instead of appending location.hash", () => {
  const html = toHtmlPage("/new/#intro");
  assert.match(html, /location\.replace\("\/new\/#intro"\);/);
});

test("toHtmlPage cannot break out of the inline script", () => {
  const html = toHtmlPage("/x</script><script>alert(1)</script>");
  assert.equal(html.match(/<\/script>/g).length, 1);
});

test("toHtmlPage defaults to English and accepts lang and message", () => {
  assert.match(toHtmlPage("/new/"), /<html lang="en">/);
  const html = toHtmlPage("/new/", { lang: "de", message: "Diese Seite ist umgezogen nach" });
  assert.match(html, /<html lang="de">/);
  assert.match(html, /<p>Diese Seite ist umgezogen nach <a href="\/new\/">/);
});

test("toOutputPath maps trailing-slash and extensionless paths to index.html", () => {
  assert.equal(toOutputPath("/old-path/"), "old-path/index.html");
  assert.equal(toOutputPath("/old-path"), "old-path/index.html");
  assert.equal(toOutputPath("/"), "index.html");
});

test("toOutputPath leaves paths with an existing extension as-is", () => {
  assert.equal(toOutputPath("/old-feed.xml"), "old-feed.xml");
});
