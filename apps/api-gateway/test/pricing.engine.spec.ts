import { describe, expect, it } from "vitest";
import {
  PricingEngine,
  type PriceCandidate,
} from "../src/pricing/pricing.engine";

const at = new Date("2026-01-15T12:00:00Z");
const prices: PriceCandidate[] = [
  {
    id: "base",
    source: "base",
    amountMinor: 1000,
    minimumQuantity: 1,
    validFrom: new Date("2020-01-01"),
    priority: 0,
    stackable: false,
  },
  {
    id: "volume",
    source: "buyer_group",
    amountMinor: 850,
    minimumQuantity: 10,
    validFrom: new Date("2020-01-01"),
    priority: 1,
    stackable: false,
  },
  {
    id: "contract",
    source: "contract",
    amountMinor: 900,
    minimumQuantity: 1,
    validFrom: new Date("2020-01-01"),
    priority: 1,
    stackable: false,
  },
];

describe("PricingEngine", () => {
  it("gives an eligible contract price precedence over a cheaper group price", () => {
    expect(new PricingEngine().resolve(prices, 10, "USD", at)).toMatchObject({
      amountMinor: 900,
      source: "contract",
      appliedPriceIds: ["contract"],
    });
  });

  it("ignores a quantity break that is not met", () => {
    expect(
      new PricingEngine().resolve(prices.slice(0, 2), 1, "USD", at).amountMinor,
    ).toBe(1000);
  });
});
