# ADR 0002: Hybrid-ready shared tenancy

- Status: Accepted
- Date: 2026-07-26

## Decision

Use organization tenant IDs in every tenant-owned key, PostgreSQL RLS as defense
in depth, tenant-aware cache/event/search/rate-limit keys, and a placement
registry that can route exceptional tenants to dedicated infrastructure. Use
opaque UUID/ULID identifiers and tenant-scoped sequential business numbers.

## Trade-offs

Shared infrastructure is cost efficient and easy to operate. It requires
careful composite indexes and makes noisy-neighbor controls essential.
Schema-per-tenant complicates migrations; database-per-tenant is expensive for
tens of thousands of organizations. Hybrid placement preserves an escape hatch.

## Security

Tenant context derives from a verified identity/session, never a client header
or request body. Repository transactions set the RLS context. Automated tests
attempt cross-tenant access on every resource family.
