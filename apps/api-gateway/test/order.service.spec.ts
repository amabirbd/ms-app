import { describe, expect, it } from "vitest";
import { OrderService } from "../src/order/order.service";

const command = {
  organizationId: "5525ec64-4937-44c1-97e6-6e6f16d914e3",
  idempotencyKey: "order-key-00000001",
  lines: [{ sku: "PAPER-A4", quantity: 10 }],
};

describe("OrderService", () => {
  it("returns the original receipt when a submission is retried", () => {
    const service = new OrderService();
    expect(service.submit(command)).toEqual(service.submit(command));
  });

  it("rejects reuse of a key for a different payload", () => {
    const service = new OrderService();
    service.submit(command);
    expect(() =>
      service.submit({
        ...command,
        lines: [{ sku: "PAPER-A4", quantity: 11 }],
      }),
    ).toThrow();
  });
});
