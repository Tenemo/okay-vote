# okay.vote API

Fastify API for [okay.vote](https://okay.vote).

## Local development

```bash
pnpm --filter @okay-vote/api dev
```

The API uses Vite for the production build and the TypeScript runtime used by local development and migration scripts.

If you only started Docker manually, migrate the schema first:

```bash
pnpm --filter @okay-vote/api db:migrate
```

The API schema is defined in Drizzle and migrated from `apps/api/drizzle`.
To generate a new migration after changing `src/db/schema.ts`, run:

```bash
pnpm --filter @okay-vote/api db:generate
```

The API configuration is centralized in `src/config.ts`. The only application-level runtime variables are:

- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`

`PORT` is still respected for platform deployments such as Railway, but it is host-provided rather than something you normally set yourself.

`GET /api/health-check` reports both service liveness and database reachability.

## Tests

Start the local Postgres container first:

```bash
pnpm run docker:up
pnpm --filter @okay-vote/api test
```

The local Docker Postgres instance is exposed on `localhost:5433`.
`pnpm run docker:up` runs the shared migration command automatically before the API starts.
