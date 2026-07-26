# Local development

1. Install Node.js 22, pnpm 10, and Docker Desktop.
2. Copy `.env.example` to `.env`. Local credentials are intentionally unusable
   outside the Compose network.
3. Run `pnpm install`, then `pnpm infra:up`.
4. Run `pnpm --filter @b2b/api-gateway dev` and
   `pnpm --filter @b2b/web dev` in separate terminals.
5. Verify `/api/v1/health/ready` and open `/docs`.

Run `pnpm typecheck`, `pnpm test`, and `pnpm build` before submitting changes.
Never commit environment files, tokens, production data, or database dumps.

The current in-process organization/order repositories make the initial
vertical slice executable without migrations. Replace them behind repository
interfaces with transactional PostgreSQL implementations before exposing those
write APIs beyond development; the production schema and invariants are already
defined under `infrastructure/postgres`.
