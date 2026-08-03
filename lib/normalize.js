function normalizePath(p) {
  return p.startsWith("/") ? p : `/${p}`;
}

// Accepts redirects as either an object map ({ "/old/": "/new/" } or
// { "/old/": { to: "/new/", status: 302 } }) or an array of
// { from, to, status } entries, and returns a single normalized array.
// Object form is more convenient for hand-written config; array form allows
// duplicate `from` paths (e.g. generated redirects) that an object key can't.
function normalizeRedirects(redirects, defaultStatus) {
  const list = [];

  const addEntry = (from, to, status) => {
    if (!from || !to) {
      throw new Error(
        `eleventy-plugin-redirects: invalid redirect entry (from: "${from}", to: "${to}")`
      );
    }
    list.push({
      from: normalizePath(from),
      to,
      status: status || defaultStatus,
    });
  };

  if (Array.isArray(redirects)) {
    for (const entry of redirects) {
      addEntry(entry.from, entry.to, entry.status);
    }
  } else if (redirects && typeof redirects === "object") {
    for (const [from, value] of Object.entries(redirects)) {
      if (typeof value === "string") {
        addEntry(from, value);
      } else if (value && typeof value === "object") {
        addEntry(from, value.to, value.status);
      }
    }
  }

  return list;
}

module.exports = { normalizeRedirects, normalizePath };
