# Incident response

1. Declare severity and incident commander; open a timestamped incident record.
2. Protect customers first: stop a rollout, open a circuit, disable a feature,
   or shed non-critical load.
3. Preserve evidence. Do not delete pods, logs, queues, or suspicious identities
   before snapshots and audit references are captured.
4. Communicate at the severity cadence using confirmed facts and customer
   impact, avoiding speculation.
5. Restore service with the smallest reversible change. Verify error budget,
   order/payment reconciliation, event lag, and tenant isolation.
6. Complete a blameless review with owners and due dates. Security incidents
   follow legal/privacy notification procedures.
