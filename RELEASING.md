# Releasing

Releases are published to npm by GitHub Actions ([`.github/workflows/publish.yml`](.github/workflows/publish.yml)) using [npm trusted publishing](https://docs.npmjs.com/trusted-publishers) (OIDC). No npm token is stored anywhere, and every version gets a [provenance statement](https://docs.npmjs.com/generating-provenance-statements) linking it to the commit and workflow run that built it.

## Steps

```sh
git switch main && git pull
npm test

npm version patch            # or minor / major — bumps package.json, commits, tags vX.Y.Z
git push --follow-tags
gh release create vX.Y.Z --generate-notes
```

Publishing the GitHub Release triggers the workflow. It runs `npm ci` and `npm test`, checks that the release tag matches the `package.json` version, and runs `npm publish`.

Watch it with `gh run watch`. After a successful run, the new version can take a few minutes to show up on npm. A fresh `npm install` may still report `ETARGET` for a while; retry with `--prefer-online`.

## Versioning

Pre-1.0, following [semver](https://semver.org/) for 0.x:

- **patch** (`0.3.x`): bug fixes, no change in generated output for valid configs
- **minor** (`0.x.0`): new options, or any change to the generated output — call out breaking changes in the release notes (e.g. 0.3.0 switched Apache output from prefix-matching `Redirect` to exact `RedirectMatch`)

## One-time setup (already done)

- **npm** → package settings → *Trusted Publisher* → GitHub Actions: user `flyewi`, repository `eleventy-plugin-redirects`, workflow `publish.yml`, environment `npm`.
  Under *Allowed actions*, **Direct npm publish** must be enabled. Without it the token exchange still succeeds, but the publish fails with `403 OIDC permission denied for this action`.
- **npm** → *Publishing access*: "Require two-factor authentication and disallow tokens".
- **GitHub** → repository environment `npm` (optionally with required reviewers to gate releases).

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `404 Not Found - PUT …` in the publish step | OIDC wasn't used, and npm fell back to a token without permission. Don't set `registry-url` on `actions/setup-node`: its placeholder `NODE_AUTH_TOKEN` makes npm skip OIDC. |
| `403 … OIDC permission denied for this action` | Trusted publisher found, but *Direct npm publish* isn't an allowed action. |
| Workflow fails at "Check release tag" | Tag and `package.json` version differ. Use `npm version`, not a hand-made tag. |

A failed run can be retried with `gh run rerun <id>` after fixing npm-side settings. Workflow file changes need a new release, because the workflow runs from the tagged commit.
