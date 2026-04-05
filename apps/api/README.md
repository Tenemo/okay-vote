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

## tests

Start the local Postgres container first:

```bash
pnpm run docker:up
pnpm --filter @okay-vote/api test
```

The local Docker Postgres instance is exposed on `localhost:5433`.
`pnpm run docker:up` initializes the schema automatically.
