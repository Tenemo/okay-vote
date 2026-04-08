# okay.vote API

Fastify API for [okay.vote](https://okay.vote).

## Workspace usage

Run the monorepo from the repository root:

```bash
pnpm install
pnpm local:reset
pnpm --filter @okay-vote/api dev
```

If Docker is already running and you only need the schema ready again:

```bash
pnpm --filter @okay-vote/api db:migrate
```

## App commands

From the repository root:

```bash
pnpm --filter @okay-vote/api db:generate
pnpm --filter @okay-vote/api db:migrate
pnpm --filter @okay-vote/api lint
pnpm --filter @okay-vote/api typecheck
pnpm --filter @okay-vote/api test
pnpm --filter @okay-vote/api build
```

## Runtime configuration

The API configuration is centralized in `src/config.ts`.

- `DATABASE_URL` defaults to the local Docker Postgres instance on `localhost:5433`
- `CORS_ALLOWED_ORIGINS` accepts a comma-separated allowlist for non-local frontend origins
- `PORT` is respected for deployments such as Railway
- `HOST` defaults to `0.0.0.0`
- `LOG_LEVEL` defaults to `info`

`GET /api/health-check` reports both service liveness and database reachability.
See [docs/endpoints.md](../../docs/endpoints.md) for the route contract and [docs/operations.md](../../docs/operations.md) for the operational workflow.

## Test layout

- `test/routes` contains route-focused API tests built on the shared `@okay-vote/testkit` helpers
- `test/*.test.ts` contains pure utility coverage for config and slug behavior

The local Docker Postgres instance is exposed on `localhost:5433`.
