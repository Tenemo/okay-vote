# okay-vote api

Fastify API for [okay.vote](https://okay.vote).

## local development

```bash
pnpm --filter @okay-vote/api dev
```

If you only started Docker manually, migrate the schema first:

```bash
pnpm --filter @okay-vote/api db:migrate
```

The API schema is defined in Drizzle and migrated from `apps/api/drizzle`.
To generate a new migration after changing `src/db/schema.ts`, run:

```bash
pnpm --filter @okay-vote/api db:generate
```

The API configuration is centralized in `src/config.ts`. The main runtime variables are:

- `PORT`
- `HOST`
- `LOG_LEVEL`
- `DATABASE_URL`
- `DATABASE_SSL`
- `CORS_ALLOWED_ORIGINS`

`GET /api/health-check` reports both service liveness and database reachability.

## tests

Start the local Postgres container first:

```bash
pnpm run docker:up
pnpm --filter @okay-vote/api test
```

The local Docker Postgres instance is exposed on `localhost:5433`.
`pnpm run docker:up` runs the shared migration command automatically before the API starts.
