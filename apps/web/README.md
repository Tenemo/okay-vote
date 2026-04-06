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

- `VITE_API_BASE_URL` is optional for non-Netlify deployments that need an explicit API origin.

For Netlify deploys, leave `VITE_API_BASE_URL` unset. The app should use relative `/api` requests, and the repository root `netlify.toml` proxies them to `https://api.okay.vote`.
The SPA rewrite is configured in the repository root `netlify.toml`, so this package does not need a `_redirects` file.

## License

This package is distributed under the GNU Affero General Public License v3.0 only.
