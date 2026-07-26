import { ConflictException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { CreateOrder } from "@b2b/contracts";

export interface OrderReceipt {
  id: string;
  organizationId: string;
  status: "pending_validation";
  submittedAt: string;
}

@Injectable()
export class OrderService {
  private readonly receiptsByIdempotencyKey = new Map<
    string,
    { fingerprint: string; receipt: OrderReceipt }
  >();

  submit(command: CreateOrder & { organizationId: string }): OrderReceipt {
    const fingerprint = JSON.stringify(command);
    const existing = this.receiptsByIdempotencyKey.get(command.idempotencyKey);
    if (existing) {
      if (existing.fingerprint !== fingerprint) {
        throw new ConflictException({
          detail:
            "The idempotency key was already used for a different request",
        });
      }
      return existing.receipt;
    }
    const receipt: OrderReceipt = {
      id: randomUUID(),
      organizationId: command.organizationId,
      status: "pending_validation",
      submittedAt: new Date().toISOString(),
    };
    this.receiptsByIdempotencyKey.set(command.idempotencyKey, {
      fingerprint,
      receipt,
    });
    return receipt;
  }
}
