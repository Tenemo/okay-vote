# okay-vote

Monorepo for the okay.vote web app, API, and shared contracts.

## workspace layout

- `apps/web` contains the React frontend.
- `apps/api` contains the Fastify API.
- `packages/contracts` contains the shared TypeBox schemas and exported TypeScript types.

## development

Use Node 20 and `pnpm@10.33.0`.

```bash
pnpm install
pnpm run docker:up
pnpm run dev
```

The local Postgres container is published on `localhost:5433` so it does not clash with an existing host Postgres on `5432`.
`pnpm run docker:up` also initializes the local API schema from `apps/api/src/sql/create.sql`.

Useful package-level commands:

```bash
pnpm --filter @okay-vote/web start
pnpm --filter @okay-vote/api dev
pnpm --filter @okay-vote/api db:init
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
```

## deployment

- Netlify should use the repository root as the base directory and `pnpm --filter @okay-vote/web build` as the build command.
- Railway should connect the API service to `apps/api` and inject a PostgreSQL `DATABASE_URL`.
- Update `apps/web/_redirects` to the real Railway API domain after the first API deploy. The checked-in file still points at the current live backend until that URL exists.
