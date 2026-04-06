# okay.vote

Monorepo for the [okay.vote](https://okay.vote) web app, API, and shared contracts.

## Workspace layout

- `apps/web` contains the React frontend.
- `apps/api` contains the Fastify API.
- `packages/contracts` contains the shared TypeBox schemas and exported TypeScript types.

## Development

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

## Verification

Run the shared checks from the repository root:

```bash
pnpm run typecheck
pnpm run lint
pnpm run test
pnpm run build
pnpm run e2e
```

## Deployment

- Railway uses the repository root `railway.toml`. The build runs from the monorepo root and deploys `@okay-vote/api`, runs the built migration script with `pnpm --filter @okay-vote/api db:migrate:dist` before startup, and checks `/api/health-check`.
- Netlify should use the repository root as the base directory and can rely on the repository root `netlify.toml` for the build command, publish directory, API proxy, and SPA rewrite rule.
- Netlify should not set `VITE_API_BASE_URL`. The site should use relative `/api` requests so production, `www`, and deploy previews all flow through the Netlify proxy to `https://api.okay.vote`.
- The API only expects `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, and the platform-provided `PORT`. Localhost and `127.0.0.1` origins are allowed automatically for development.

## License

This project is licensed under the GNU Affero General Public License v3.0 only.
See [LICENSE](LICENSE) for the full text.
