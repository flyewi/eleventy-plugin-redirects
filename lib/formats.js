const path = require("node:path");

function toNetlify(list) {
  return list.map(({ from, to, status }) => `${from}  ${to}  ${status}`).join("\n") + "\n";
}

function toApache(list) {
  return list.map(({ from, to, status }) => `Redirect ${status} ${from} ${to}`).join("\n") + "\n";
}

function escapeAttr(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// A static fallback for hosts that can't act on _redirects/.htaccess (e.g.
// GitHub Pages): an actual HTML file at the old URL that both redirects
// browsers instantly and points crawlers at the new canonical URL.
function toHtmlPage(to) {
  const target = escapeAttr(to);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
</head>
<body>
<p>This page has moved to <a href="${target}">${target}</a>.</p>
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
