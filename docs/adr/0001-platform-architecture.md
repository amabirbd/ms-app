# ADR 0001: Evolutionary service architecture

- Status: Accepted
- Date: 2026-07-26

## Context

The domain is broad, but premature fine-grained services would multiply
operational and consistency costs before team and traffic boundaries are known.

## Decision

Use coarse independently deployable domain services, database schema and role
per service, REST for required decisions, Kafka integration events for facts,
local ACID transactions, transactional outbox, and persisted sagas.

## Alternatives

A modular monolith is simpler but limits independent scaling and blast-radius
control. Forty-two fine-grained services maximize theoretical autonomy but
create excessive call chains and ownership overhead. Shared databases simplify
joins but destroy data ownership.

## Consequences

Teams can extract modules when scale or ownership proves the need. Cross-service
queries use read models. Eventual consistency is visible in workflows. Contract,
schema, and observability discipline are mandatory.

## Risks and mitigations

Network and Kafka failures are handled by deadlines, outbox delivery,
idempotency, circuit breakers, DLQs, and reconciliation. Coarse services may
become large; architecture tests enforce module boundaries and operational data
guides extraction.
