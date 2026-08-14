# eleventy-plugin-redirects

[![Buy me a coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/flyewiy)

Eleventy plugin that turns a single, centrally maintained redirects config into the formats your host actually understands: a Netlify `_redirects` file, an Apache `.htaccess`, and/or static HTML fallback pages for hosts that support neither.

## Why

URLs change. Instead of hand-editing `_redirects` (or forgetting to), keep redirects in your Eleventy config next to the rest of your site and let this plugin regenerate the host-specific file on every build.

## Installation

```
npm install eleventy-plugin-redirects
```

```js
const redirectsPlugin = require("eleventy-plugin-redirects");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(redirectsPlugin, {
    redirects: {
      "/old-path/": "/new-path/",
      "/legacy-page/": { to: "/new-page/", status: 302 },
    },
  });
};
```

By default this writes an `_redirects` file into your output directory after every build.

## Options

| Option | Default | Description |
| --- | --- | --- |
| `redirects` | `{}` | Object map (`{ from: to }` or `{ from: { to, status } }`) or array of `{ from, to, status }`. Use the array form if the same `from` needs multiple rules. |
| `defaultStatus` | `301` | Status code used when an entry doesn't specify one. |
| `netlify` | `true` | Write a Netlify `_redirects` file. |
| `netlifyFile` | `"_redirects"` | Filename for the Netlify output, relative to the output directory. |
| `apache` | `false` | Write an Apache `.htaccess` with `Redirect` directives. |
| `apacheFile` | `".htaccess"` | Filename for the Apache output. |
| `html` | `false` | Also write a static HTML fallback page at each `from` URL (meta-refresh + `rel=canonical`), for hosts (e.g. GitHub Pages) that can't act on `_redirects`/`.htaccess`. |
| `log` | `true` | Log a one-line summary after each build. |

## Netlify output

```
/old-path/  /new-path/  301
/legacy-page/  /new-page/  302
```

If your output directory already contains an `_redirects` file (e.g. copied through as a static passthrough for rules this plugin doesn't manage, like an SPA catch-all), the generated rules are **prepended** to it — Netlify uses the first matching rule, so your specific redirects still take priority over any broader existing rule.

## Apache output

```
Redirect 301 /old-path/ /new-path/
Redirect 302 /legacy-page/ /new-page/
```

## HTML fallback pages

With `html: true`, each `from` path also gets a real HTML file at that URL (e.g. `/old-path/` → `old-path/index.html` in the output directory) containing:

```html
<meta http-equiv="refresh" content="0; url=/new-path/">
<link rel="canonical" href="/new-path/">
```

This is a static fallback for platforms without server-side redirect support — a real `_redirects`/`.htaccess` (or your host/CDN's redirect rules) is always the better option when available, since the HTML approach is a moment slower and depends on the browser executing the refresh.

## License

MIT
