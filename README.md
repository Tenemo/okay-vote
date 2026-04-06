# okay-vote

Monorepo for the okay.vote web app, API, and shared contracts.

## workspace layout

- `apps/web` contains the React frontend.
- `apps/api` contains the Fastify API.
- `packages/contracts` contains the shared TypeBox schemas and exported TypeScript types.

## development

Use Node `24.14.1` and `pnpm@10.33.0`.

```bash
pnpm install
pnpm run docker:up
pnpm run dev
```

The local Postgres container is published on `localhost:5433` so it does not clash with an existing host Postgres on `5432`.
`pnpm run docker:up` also runs the shared API migration command against the local database.

Useful package-level commands:

```bash
pnpm --filter @okay-vote/web start
pnpm --filter @okay-vote/api dev
pnpm run db:migrate
pnpm --filter @okay-vote/api db:generate
pnpm --filter @okay-vote/api test
pnpm --filter @okay-vote/contracts build
```

## verification

Run the shared checks from the repository root:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run e2e
```

## deployment

- Railway uses the repository root `railway.toml`. The build runs from the monorepo root and deploys `@okay-vote/api`, runs the built migration script with `pnpm --filter @okay-vote/api db:migrate:dist` before startup, and checks `/api/health-check`.
- Netlify should use the repository root as the base directory and can rely on the repository root `netlify.toml` for the build command, publish directory, and SPA rewrite rule.
- Netlify should set `VITE_API_BASE_URL` to the public Railway API origin, for example `https://your-api.up.railway.app`.
- `API_BASE_URL` is still supported as a temporary fallback while old Netlify environments are updated.
- The API reads `CORS_ALLOWED_ORIGINS` as a comma-separated allowlist for trusted production origins. Localhost and `127.0.0.1` are allowed automatically for development.

## license

This project is licensed under the GNU Affero General Public License v3.0 only.
See [LICENSE](LICENSE) for the full text.
