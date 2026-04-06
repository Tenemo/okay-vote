# okay.vote

Monorepo for the [okay.vote](https://okay.vote) web app, API, shared contracts, and shared test helpers.

## Overview

- `apps/web` contains the React frontend.
- `apps/api` contains the Fastify API.
- `packages/contracts` contains the shared TypeBox schemas and exported TypeScript types.
- `packages/testkit` contains shared API test helpers used by route and integration tests.

## Tech stack

- Frontend: TypeScript, React, Redux Toolkit, Material UI, Vite, Vitest
- Backend: TypeScript, Fastify, Drizzle ORM, PostgreSQL, Vitest
- Tooling: pnpm workspaces, Turborepo, Playwright, ESLint, stylelint

## Local development

### Requirements

- Node.js `24.14.1`
- `pnpm@10.33.0`
- Docker Desktop or another Docker engine with Compose support

### Running the full stack

From the repository root:

```bash
pnpm install
pnpm local:reset
pnpm dev
```

The default local setup serves:

- the web app at `http://127.0.0.1:3000`
- the API at `http://127.0.0.1:4000`
- PostgreSQL on `localhost:5433`

## Workspace documentation

- [apps/api/README.md](./apps/api/README.md) for API workspace usage and runtime configuration
- [apps/web/README.md](./apps/web/README.md) for frontend workspace usage and deploy notes
- [docs/endpoints.md](./docs/endpoints.md) for endpoint behavior and response expectations
- [docs/operations.md](./docs/operations.md) for local reset, verification, CI, and deployment workflows

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

## Deployment

- Railway uses the repository root `railway.toml`. The build runs from the monorepo root, deploys `@okay-vote/api`, runs the built migration script with `pnpm --filter @okay-vote/api db:migrate:dist` before startup, and checks `/api/health-check`.
- Netlify uses the repository root `netlify.toml` for the build command, publish directory, API proxy, and SPA rewrite rule.
- CI publishes a deployable API artifact through `.github/workflows/api-artifact.yml` when API-facing files change.

## License

This project is licensed under the GNU Affero General Public License v3.0 only.
See [LICENSE](./LICENSE) for the full text.
