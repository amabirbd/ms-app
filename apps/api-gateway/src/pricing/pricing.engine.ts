import { Injectable, UnprocessableEntityException } from "@nestjs/common";

export type PriceSource = "base" | "buyer_group" | "contract" | "promotion";

export interface PriceCandidate {
  id: string;
  source: PriceSource;
  amountMinor: number;
  minimumQuantity: number;
  validFrom: Date;
  validTo?: Date;
  priority: number;
  stackable: boolean;
}

export interface ResolvedPrice {
  amountMinor: number;
  currency: string;
  appliedPriceIds: string[];
  source: PriceSource;
}

const precedence: Record<PriceSource, number> = {
  contract: 4,
  buyer_group: 3,
  promotion: 2,
  base: 1,
};

@Injectable()
export class PricingEngine {
  resolve(
    candidates: readonly PriceCandidate[],
    quantity: number,
    currency: string,
    at = new Date(),
  ): ResolvedPrice {
    const eligible = candidates
      .filter((candidate) => candidate.minimumQuantity <= quantity)
      .filter(
        (candidate) =>
          candidate.validFrom <= at &&
          (!candidate.validTo || candidate.validTo > at),
      )
      .sort(
        (left, right) =>
          precedence[right.source] - precedence[left.source] ||
          right.priority - left.priority ||
          left.amountMinor - right.amountMinor ||
          left.id.localeCompare(right.id),
      );
    const winner = eligible[0];
    if (!winner) {
      throw new UnprocessableEntityException({
        detail: "No eligible price exists for this product and quantity",
      });
    }
    return {
      amountMinor: winner.amountMinor,
      currency,
      appliedPriceIds: [winner.id],
      source: winner.source,
    };
  }
}
