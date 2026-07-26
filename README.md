# B2B Commerce Platform

Production-oriented, tenant-safe B2B commerce foundation built as a TypeScript
monorepo. The first runnable slice includes an API gateway with organization,
catalog, pricing, and order capabilities, customer/admin web shells, shared
contracts, local data infrastructure, tests, and architecture documentation.

## Prerequisites

- Node.js 22+
- pnpm 10+
- Docker Desktop

## Start locally

```bash
cp .env.example .env
pnpm install
pnpm infra:up
pnpm --filter @b2b/api-gateway dev
pnpm --filter @b2b/web dev
```

The API is available at `http://localhost:4000/api/v1`, Swagger at
`http://localhost:4000/docs`, and the customer web application at
`http://localhost:3000`.

See [the local development guide](docs/operations/local-development.md) and
[architecture document](docs/architecture/platform.md).
