import { z } from "zod";

export const tenantIdSchema = z.string().uuid();
export const moneySchema = z.object({
  amountMinor: z.bigint().or(z.number().int().safe()),
  currency: z.string().regex(/^[A-Z]{3}$/),
});

export const createOrganizationSchema = z.object({
  legalName: z.string().trim().min(2).max(200),
  displayName: z.string().trim().min(2).max(120),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  taxIdentifier: z.string().trim().min(3).max(64).optional(),
});

export const priceRequestSchema = z.object({
  sku: z.string().trim().min(1).max(100),
  quantity: z.number().int().positive().max(1_000_000),
  currency: z.string().regex(/^[A-Z]{3}$/),
  organizationId: tenantIdSchema,
  buyerGroupIds: z.array(z.string().uuid()).default([]),
  at: z.coerce.date().default(() => new Date()),
});

export const createOrderSchema = z.object({
  organizationId: tenantIdSchema,
  purchaseOrderNumber: z.string().trim().max(80).optional(),
  idempotencyKey: z.string().min(16).max(128),
  lines: z
    .array(
      z.object({
        sku: z.string().trim().min(1).max(100),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1)
    .max(500),
});

export type CreateOrganization = z.infer<typeof createOrganizationSchema>;
export type PriceRequest = z.infer<typeof priceRequestSchema>;
export type CreateOrder = z.infer<typeof createOrderSchema>;

export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  requestId: string;
  violations?: Array<{ field: string; message: string }>;
}

export interface IntegrationEvent<T extends string, P> {
  eventId: string;
  eventType: T;
  schemaVersion: 1;
  occurredAt: string;
  tenantId: string;
  correlationId: string;
  payload: P;
}
