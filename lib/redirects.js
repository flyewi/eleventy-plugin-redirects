const fs = require("node:fs");
const path = require("node:path");

const { normalizeRedirects } = require("./normalize");
const { toNetlify, toApache, toHtmlPage, toOutputPath } = require("./formats");

const DEFAULTS = {
  redirects: {},
  defaultStatus: 301,
  netlify: true,
  apache: false,
  html: false,
  netlifyFile: "_redirects",
  apacheFile: ".htaccess",
  log: true,
};

function readExisting(file) {
  if (!fs.existsSync(file)) return "";
  const content = fs.readFileSync(file, "utf8");
  return content.endsWith("\n") ? content : `${content}\n`;
}

module.exports = function redirectsPlugin(eleventyConfig, userOptions = {}) {
  const options = { ...DEFAULTS, ...userOptions };
  const list = normalizeRedirects(options.redirects, options.defaultStatus);

  function log(...args) {
    if (options.log) console.log("[redirects]", ...args);
  }

  eleventyConfig.on("eleventy.after", async ({ dir }) => {
    if (list.length === 0) return;

    const outputDir = dir?.output || "_site";
    fs.mkdirSync(outputDir, { recursive: true });

    if (options.netlify) {
      const netlifyPath = path.join(outputDir, options.netlifyFile);
      // Our rules go first: in Netlify's _redirects format the first matching
      // rule wins, so our specific redirects must take priority over any
      // broader rule (e.g. a SPA catch-all) already emitted into this file
      // by a static passthrough copy.
      const existing = readExisting(netlifyPath);
      fs.writeFileSync(netlifyPath, toNetlify(list) + existing);
    }

    if (options.apache) {
      const apachePath = path.join(outputDir, options.apacheFile);
      // Preserve (and prepend ahead of) any existing .htaccess content, e.g.
      // hand-maintained directives (ErrorDocument, mod_deflate, mod_expires)
      // brought in via a static passthrough copy — this plugin only owns the
      // Redirect lines, not the whole file.
      const existing = readExisting(apachePath);
      fs.writeFileSync(apachePath, toApache(list) + existing);
    }

    if (options.html) {
      for (const { from, to } of list) {
        const outPath = path.join(outputDir, toOutputPath(from));
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, toHtmlPage(to));
      }
    }

    log(`wrote ${list.length} redirect(s)`);
  });
};

module.exports.normalizeRedirects = normalizeRedirects;
module.exports.toNetlify = toNetlify;
module.exports.toApache = toApache;
module.exports.toHtmlPage = toHtmlPage;
module.exports.toOutputPath = toOutputPath;
