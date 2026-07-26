import { Module } from "@nestjs/common";
import { HealthController } from "./health/health.controller";
import { OrganizationController } from "./organization/organization.controller";
import { OrganizationService } from "./organization/organization.service";
import { OrderController } from "./order/order.controller";
import { OrderService } from "./order/order.service";
import { PricingController } from "./pricing/pricing.controller";
import { PricingEngine } from "./pricing/pricing.engine";

@Module({
  controllers: [
    HealthController,
    OrganizationController,
    PricingController,
    OrderController,
  ],
  providers: [OrganizationService, PricingEngine, OrderService],
})
export class AppModule {}
