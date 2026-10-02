const path = require("node:path");

function toNetlify(list) {
  return list.map(({ from, to, status }) => `${from}  ${to}  ${status}`).join("\n") + "\n";
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Apache splits directive arguments on whitespace; quote those that contain it.
function apacheArg(str) {
  return /[\s"]/.test(str) ? `"${str.replace(/"/g, '\\"')}"` : str;
}

// RedirectMatch with an anchored, escaped pattern matches the path exactly,
// like Netlify's _redirects. Plain `Redirect` would be a prefix match
// (/old/ would also catch /old/anything), so the same config would behave
// differently depending on the host.
function toApache(list) {
  return (
    list
      .map(({ from, to, status }) => {
        const pattern = apacheArg(`^${escapeRegex(from)}$`);
        return `RedirectMatch ${status} ${pattern} ${apacheArg(to)}`;
      })
      .join("\n") + "\n"
  );
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// JSON.stringify yields a valid JS string literal; escaping "<" additionally
// keeps a target containing "</script>" from closing the inline script early.
function toScriptString(str) {
  return JSON.stringify(String(str)).replace(/</g, "\\u003c");
}

// A static fallback for hosts that can't act on _redirects/.htaccess (e.g.
// GitHub Pages): an actual HTML file at the old URL that both redirects
// browsers instantly and points crawlers at the new canonical URL.
// The script runs before the meta refresh fires and carries the URL fragment
// (#section) over, as a server-side 301 would; the meta refresh remains as the
// no-JS fallback. A target that already has its own fragment keeps it.
function toHtmlPage(to, { lang = "en", message = "This page has moved to" } = {}) {
  const target = escapeAttr(to);
  const hash = String(to).includes("#") ? "" : " + location.hash";
  return `<!doctype html>
<html lang="${escapeAttr(lang)}">
<head>
<meta charset="utf-8">
<title>${escapeAttr(message)} ${target}</title>
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<script>location.replace(${toScriptString(to)}${hash});</script>
</head>
<body>
<p>${escapeAttr(message)} <a href="${target}">${target}</a>.</p>
</body>
</html>
`;
}

// Maps a redirect's `from` path to the file Eleventy's pretty-URL convention
// would expect it at, e.g. "/old-path" -> "old-path/index.html", so an HTML
// fallback page lands exactly where the old URL is requested from.
function toOutputPath(from) {
  const clean = from.replace(/^\/+/, "");
  if (clean === "" || clean.endsWith("/")) return path.join(clean, "index.html");
  if (path.extname(clean)) return clean;
  return path.join(clean, "index.html");
}

module.exports = { toNetlify, toApache, toHtmlPage, toOutputPath };
