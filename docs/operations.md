# Operations guide

## Local reset

Use the repository root commands:

```bash
pnpm install
pnpm local:reset
pnpm dev
```

`pnpm local:reset` recreates the Docker services, waits for PostgreSQL to become healthy, and migrates the API schema.

## Verification

Run the shared checks from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

The backend test layout is intentionally layered:

- pure utility tests for config and slug behavior
- route-focused tests under `apps/api/test/routes`
- browser end-to-end tests under `tests/e2e`

## API artifact

`.github/workflows/api-artifact.yml` produces a deployable API artifact whenever API-facing files change.
The artifact contains:

- the root `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, and `.env.example`
- the built `apps/api/dist` output and its package metadata
- the built `packages/contracts/dist` output and its package metadata

## Deployment

- Railway deploys the API from the repository root using `railway.toml`
- Netlify deploys the web app from the repository root using `netlify.toml`
- Netlify should not set `VITE_API_BASE_URL`; the site should rely on relative `/api` requests through the configured proxy
