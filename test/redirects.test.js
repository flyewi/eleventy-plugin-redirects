const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const redirectsPlugin = require("../lib/redirects");

function fakeEleventyConfig() {
  let handler;
  return {
    on(event, fn) {
      if (event === "eleventy.after") handler = fn;
    },
    async fireAfter(payload) {
      return handler(payload);
    },
  };
}

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "redirects-plugin-"));
}

test("writes a Netlify _redirects file by default", async () => {
  const outputDir = path.join(tmpDir(), "_site");
  const eleventyConfig = fakeEleventyConfig();

  redirectsPlugin(eleventyConfig, {
    redirects: { "/old/": "/new/" },
    log: false,
  });

  await eleventyConfig.fireAfter({ dir: { output: outputDir } });

  const contents = fs.readFileSync(path.join(outputDir, "_redirects"), "utf8");
  assert.equal(contents, "/old/  /new/  301\n");
});

test("prepends generated rules ahead of an existing _redirects file", async () => {
  const outputDir = path.join(tmpDir(), "_site");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, "_redirects"), "/*  /index.html  200\n");

  const eleventyConfig = fakeEleventyConfig();
  redirectsPlugin(eleventyConfig, {
    redirects: { "/old/": "/new/" },
    log: false,
  });

  await eleventyConfig.fireAfter({ dir: { output: outputDir } });

  const contents = fs.readFileSync(path.join(outputDir, "_redirects"), "utf8");
  assert.equal(contents, "/old/  /new/  301\n/*  /index.html  200\n");
});

test("writes .htaccess only when apache is enabled", async () => {
  const outputDir = path.join(tmpDir(), "_site");
  const eleventyConfig = fakeEleventyConfig();

  redirectsPlugin(eleventyConfig, {
    redirects: { "/old/": "/new/" },
    netlify: false,
    apache: true,
    log: false,
  });

  await eleventyConfig.fireAfter({ dir: { output: outputDir } });

  assert.equal(fs.existsSync(path.join(outputDir, "_redirects")), false);
  const contents = fs.readFileSync(path.join(outputDir, ".htaccess"), "utf8");
  assert.equal(contents, "Redirect 301 /old/ /new/\n");
});

test("prepends generated Redirect lines ahead of an existing .htaccess file", async () => {
  const outputDir = path.join(tmpDir(), "_site");
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, ".htaccess"), "ErrorDocument 404 /404.html\n");

  const eleventyConfig = fakeEleventyConfig();
  redirectsPlugin(eleventyConfig, {
    redirects: { "/old/": "/new/" },
    netlify: false,
    apache: true,
    log: false,
  });

  await eleventyConfig.fireAfter({ dir: { output: outputDir } });

  const contents = fs.readFileSync(path.join(outputDir, ".htaccess"), "utf8");
  assert.equal(contents, "Redirect 301 /old/ /new/\nErrorDocument 404 /404.html\n");
});

test("writes HTML fallback pages at the old URL when html is enabled", async () => {
  const outputDir = path.join(tmpDir(), "_site");
  const eleventyConfig = fakeEleventyConfig();

  redirectsPlugin(eleventyConfig, {
    redirects: { "/old-path/": "/new-path/" },
    netlify: false,
    html: true,
    log: false,
  });

  await eleventyConfig.fireAfter({ dir: { output: outputDir } });

  const contents = fs.readFileSync(path.join(outputDir, "old-path/index.html"), "utf8");
  assert.match(contents, /url=\/new-path\//);
});

test("does nothing when there are no redirects configured", async () => {
  const outputDir = path.join(tmpDir(), "_site");
  const eleventyConfig = fakeEleventyConfig();

  redirectsPlugin(eleventyConfig, { log: false });

  await eleventyConfig.fireAfter({ dir: { output: outputDir } });

  assert.equal(fs.existsSync(outputDir), false);
});
