CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS organization;
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE SCHEMA IF NOT EXISTS pricing;
CREATE SCHEMA IF NOT EXISTS ordering;
CREATE SCHEMA IF NOT EXISTS platform;

CREATE TABLE organization.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  country_code char(2) NOT NULL,
  status text NOT NULL CHECK (status IN ('pending_verification', 'active', 'suspended', 'closed')),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT organizations_legal_name_active_key UNIQUE NULLS NOT DISTINCT (legal_name, deleted_at)
);

CREATE TABLE catalog.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organization.organizations(id),
  sku text NOT NULL,
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'active', 'discontinued')),
  attributes jsonb NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (tenant_id, sku)
);
CREATE INDEX products_tenant_status_idx ON catalog.products (tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX products_attributes_gin_idx ON catalog.products USING gin (attributes);

CREATE TABLE pricing.price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organization.organizations(id),
  product_id uuid NOT NULL REFERENCES catalog.products(id),
  source text NOT NULL CHECK (source IN ('base', 'buyer_group', 'contract', 'promotion')),
  amount_minor bigint NOT NULL CHECK (amount_minor >= 0),
  currency char(3) NOT NULL,
  minimum_quantity integer NOT NULL DEFAULT 1 CHECK (minimum_quantity > 0),
  priority integer NOT NULL DEFAULT 0,
  valid_from timestamptz NOT NULL,
  valid_to timestamptz,
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_to IS NULL OR valid_to > valid_from)
);
CREATE INDEX price_rules_resolution_idx
  ON pricing.price_rules (tenant_id, product_id, currency, minimum_quantity, valid_from DESC);

CREATE TABLE ordering.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organization.organizations(id),
  order_number bigint GENERATED ALWAYS AS IDENTITY,
  status text NOT NULL CHECK (status IN ('pending_validation', 'awaiting_approval', 'confirmed', 'partially_fulfilled', 'fulfilled', 'cancelled')),
  purchase_order_number text,
  total_minor bigint,
  currency char(3),
  version integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, order_number)
);
CREATE INDEX orders_tenant_created_idx ON ordering.orders (tenant_id, created_at DESC);

CREATE TABLE platform.idempotency_keys (
  tenant_id uuid NOT NULL,
  operation text NOT NULL,
  idempotency_key text NOT NULL,
  request_hash char(64) NOT NULL,
  response_status integer,
  response_body jsonb,
  locked_until timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (tenant_id, operation, idempotency_key)
);

CREATE TABLE platform.outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type text NOT NULL,
  schema_version integer NOT NULL DEFAULT 1,
  payload jsonb NOT NULL,
  correlation_id uuid NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  attempt_count integer NOT NULL DEFAULT 0
);
CREATE INDEX outbox_unpublished_idx ON platform.outbox (occurred_at) WHERE published_at IS NULL;

ALTER TABLE catalog.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing.price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordering.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation ON catalog.products
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY prices_tenant_isolation ON pricing.price_rules
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY orders_tenant_isolation ON ordering.orders
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY idempotency_tenant_isolation ON platform.idempotency_keys
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY outbox_tenant_isolation ON platform.outbox
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
