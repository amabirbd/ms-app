CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

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

CREATE TABLE organization.users (
  id uuid PRIMARY KEY,
  email citext NOT NULL UNIQUE,
  display_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('active', 'locked', 'disabled')),
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE organization.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES organization.organizations(id),
  name text NOT NULL,
  description text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE UNIQUE INDEX roles_name_scope_key
  ON organization.roles (coalesce(tenant_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name))
  WHERE deleted_at IS NULL;

CREATE TABLE organization.permissions (
  code text PRIMARY KEY,
  description text NOT NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('low', 'moderate', 'high', 'critical'))
);

CREATE TABLE organization.role_permissions (
  role_id uuid NOT NULL REFERENCES organization.roles(id) ON DELETE CASCADE,
  permission_code text NOT NULL REFERENCES organization.permissions(code) ON DELETE RESTRICT,
  PRIMARY KEY (role_id, permission_code)
);

CREATE TABLE organization.members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organization.organizations(id),
  user_id uuid NOT NULL REFERENCES organization.users(id),
  status text NOT NULL CHECK (status IN ('active', 'suspended', 'removed')),
  version integer NOT NULL DEFAULT 1,
  joined_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);
CREATE INDEX members_tenant_status_idx ON organization.members (tenant_id, status);

CREATE TABLE organization.member_roles (
  tenant_id uuid NOT NULL,
  member_id uuid NOT NULL REFERENCES organization.members(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES organization.roles(id) ON DELETE RESTRICT,
  assigned_by uuid NOT NULL REFERENCES organization.users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, role_id)
);
CREATE INDEX member_roles_tenant_idx ON organization.member_roles (tenant_id, member_id);

CREATE TABLE organization.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organization.organizations(id),
  email citext NOT NULL,
  token_hash char(64) NOT NULL UNIQUE,
  role_ids uuid[] NOT NULL CHECK (cardinality(role_ids) > 0),
  branch_ids uuid[] NOT NULL DEFAULT '{}',
  department_ids uuid[] NOT NULL DEFAULT '{}',
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_by uuid NOT NULL REFERENCES organization.users(id),
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);
CREATE UNIQUE INDEX invitations_pending_email_key
  ON organization.invitations (tenant_id, lower(email::text))
  WHERE status = 'pending';

CREATE TABLE platform.audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failure')),
  request_id uuid,
  correlation_id uuid,
  source_ip inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);
CREATE TABLE platform.audit_log_default PARTITION OF platform.audit_log DEFAULT;
CREATE INDEX audit_log_tenant_time_idx ON platform.audit_log (tenant_id, occurred_at DESC);

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
ALTER TABLE organization.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization.member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization.invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing.price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordering.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform.outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY products_tenant_isolation ON catalog.products
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY roles_tenant_isolation ON organization.roles
  USING (tenant_id IS NULL OR tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY members_tenant_isolation ON organization.members
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY member_roles_tenant_isolation ON organization.member_roles
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY invitations_tenant_isolation ON organization.invitations
  USING (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);
CREATE POLICY audit_log_tenant_isolation ON platform.audit_log
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
