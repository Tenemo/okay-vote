# okay.vote

[![CI](https://github.com/Tenemo/okay-vote/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/Tenemo/okay-vote/actions/workflows/ci.yml)
[![Production smoke](https://github.com/Tenemo/okay-vote/actions/workflows/production-smoke.yml/badge.svg?branch=master)](https://github.com/Tenemo/okay-vote/actions/workflows/production-smoke.yml)
[![API artifact](https://github.com/Tenemo/okay-vote/actions/workflows/api-artifact.yml/badge.svg?branch=master)](https://github.com/Tenemo/okay-vote/actions/workflows/api-artifact.yml)
[![Netlify Status](https://api.netlify.com/api/v1/badges/5eae5d77-74ff-4f9a-80e7-0ae9922033f0/deploy-status)](https://app.netlify.com/projects/okay-vote/deploys)
[![Coverage](https://codecov.io/gh/Tenemo/okay-vote/graph/badge.svg?branch=master)](https://codecov.io/gh/Tenemo/okay-vote)
[![Node version](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/Tenemo/okay-vote/master/package.json&query=$.engines.node&label=node&logo=nodedotjs&color=5FA04E)](./package.json)

---

[![License](https://img.shields.io/github/license/Tenemo/okay-vote)](./LICENSE)

Monorepo for the [okay.vote](https://okay.vote) web app, API, shared contracts, and shared test helpers.

[okay.vote](https://okay.vote) is the plaintext "shadow" for [sealed.vote](https://sealed.vote), a cryptographically secure voting system. It keeps the core 1-10 score voting flow in a simpler, non-encrypted form.

The sealed.vote repository is [Tenemo/sealed-vote](https://github.com/Tenemo/sealed-vote). You can find more information on how it works, and how it mathematically guarantees vote privacy, in that repository.

## Overview

- `apps/web` contains the React frontend.
- `apps/api` contains the Fastify API.
- `packages/contracts` contains the shared TypeBox schemas and exported TypeScript types.
- `packages/testkit` contains shared API test helpers used by route and integration tests.

## Tech stack

- Frontend: TypeScript, React, Redux Toolkit, Tailwind CSS v4, shadcn/ui, Vite, Vitest
- Backend: TypeScript, Fastify, Drizzle ORM, PostgreSQL, Vitest
- Tooling: pnpm workspaces, Turborepo, Playwright, ESLint

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
pnpm prebuild
pnpm e2e
```

## Deployment

- Railway uses the repository root `railway.toml`. The build runs from the monorepo root, deploys `@okay-vote/api`, runs the built migration script with `pnpm --filter @okay-vote/api db:migrate:dist` before startup, and checks `/api/health-check`.
- Netlify uses the repository root `netlify.toml` for the build command, publish directory, API proxy, and SPA rewrite rule.
- CI publishes a deployable API artifact through `.github/workflows/api-artifact.yml` when API-facing files change.
- `.github/workflows/production-smoke.yml` uses Railway-triggered GitHub deployment statuses to run live production smoke checks against `https://api.okay.vote` and `https://okay.vote`.

## License

This project is licensed under the GNU Affero General Public License v3.0 only.
See [LICENSE](./LICENSE) for the full text.
