import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { priceRequestSchema, type PriceRequest } from "@b2b/contracts";
import { ZodValidationPipe } from "../platform/zod-validation.pipe";
import { PricingEngine, type ResolvedPrice } from "./pricing.engine";

@ApiTags("pricing")
@ApiBearerAuth()
@Controller("pricing")
export class PricingController {
  constructor(private readonly pricing: PricingEngine) {}

  @Post("resolve")
  resolve(
    @Body(new ZodValidationPipe(priceRequestSchema)) request: PriceRequest,
  ): ResolvedPrice {
    return this.pricing.resolve(
      [
        {
          id: `base:${request.sku}`,
          source: "base",
          amountMinor: 10_000,
          minimumQuantity: 1,
          validFrom: new Date("2020-01-01T00:00:00Z"),
          priority: 0,
          stackable: false,
        },
        {
          id: `volume:${request.sku}:100`,
          source: "buyer_group",
          amountMinor: 8_500,
          minimumQuantity: 100,
          validFrom: new Date("2020-01-01T00:00:00Z"),
          priority: 10,
          stackable: false,
        },
      ],
      request.quantity,
      request.currency,
      request.at,
    );
  }
}
