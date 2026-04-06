# okay-vote web

Browser application for [okay.vote](https://okay.vote).

## local development

```bash
pnpm --filter @okay-vote/web start
```

Vite serves the app on `http://127.0.0.1:3000` and proxies `/api` requests to the local API on `http://127.0.0.1:4000`.

## build

```bash
pnpm --filter @okay-vote/web build
```

## tests

```bash
pnpm --filter @okay-vote/web test
```

## environment

- `VITE_API_BASE_URL` is the canonical deploy-time API origin.
- `API_BASE_URL` is still accepted as a temporary fallback while old environments are updated.

For Netlify deploys, set `VITE_API_BASE_URL` to the public Railway API origin.

## license

This package is distributed under the GNU Affero General Public License v3.0 only.
