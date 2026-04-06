# okay.vote web

Browser application for [okay.vote](https://okay.vote).

## Local development

```bash
pnpm --filter @okay-vote/web start
```

Vite serves the app on `http://127.0.0.1:3000` and proxies `/api` requests to the local API on `http://127.0.0.1:4000`.

## Build

```bash
pnpm --filter @okay-vote/web build
```

## Tests

```bash
pnpm --filter @okay-vote/web test
```

## Environment

- `VITE_API_BASE_URL` is the canonical deploy-time API origin.

For Netlify deploys, set `VITE_API_BASE_URL` to the public Railway API origin.
The Vite build validates that variable automatically during Netlify builds.
The SPA rewrite is configured in the repository root `netlify.toml`, so this package does not need a `_redirects` file.

## License

This package is distributed under the GNU Affero General Public License v3.0 only.
