# okay.vote web

App for [okay.vote](https://okay.vote).

## Workspace usage

Run the monorepo from the repository root:

```bash
pnpm install
pnpm local:reset
pnpm --filter @okay-vote/web dev
```

Vite serves the app on `http://127.0.0.1:3000` and proxies `/api` requests to the local API on `http://127.0.0.1:4000`.

## App commands

From the repository root:

```bash
pnpm --filter @okay-vote/web lint
pnpm --filter @okay-vote/web typecheck
pnpm --filter @okay-vote/web test
pnpm --filter @okay-vote/web build
```

## Deployment and environment

- `VITE_API_BASE_URL` is optional for non-Netlify deployments that need an explicit API origin.
- On `okay.vote`, `www.okay.vote`, and `*.netlify.app`, the app intentionally prefers the repository proxy and relative `/api` requests even if `VITE_API_BASE_URL` is set.
- For Netlify deploys, leave `VITE_API_BASE_URL` unset so the repository root `netlify.toml` can proxy relative `/api` requests to `https://api.okay.vote`.
- The SPA rewrite and cache headers are configured in the repository root `netlify.toml`.

See [docs/operations.md](../../docs/operations.md) for the repository-level deployment workflow.

## License

This package is distributed under the GNU Affero General Public License v3.0 only.
