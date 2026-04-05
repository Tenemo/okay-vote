# okay-vote api

Fastify API for [okay.vote](https://okay.vote).

## local development

```bash
pnpm --filter @okay-vote/api dev
```

If you only started Docker manually, initialize the schema first:

```bash
pnpm --filter @okay-vote/api db:init
```

The API schema is defined in Drizzle and migrated from `apps/api/drizzle`.
To generate a new migration after changing `src/db/schema.ts`, run:

```bash
pnpm --filter @okay-vote/api db:generate
```

## tests

Start the local Postgres container first:

```bash
pnpm run docker:up
pnpm --filter @okay-vote/api test
```

The local Docker Postgres instance is exposed on `localhost:5433`.
`pnpm run docker:up` initializes the schema automatically from the Drizzle migrations.
