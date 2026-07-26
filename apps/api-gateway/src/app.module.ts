import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtAuthGuard } from "./auth/jwt-auth.guard";
import { PermissionsGuard } from "./auth/permissions.guard";
import { AuditService } from "./audit/audit.service";
import { HealthController } from "./health/health.controller";
import { OrganizationController } from "./organization/organization.controller";
import { OrganizationService } from "./organization/organization.service";
import { MembershipController } from "./organization/membership.controller";
import { MembershipService } from "./organization/membership.service";
import { OrderController } from "./order/order.controller";
import { OrderService } from "./order/order.service";
import { PricingController } from "./pricing/pricing.controller";
import { PricingEngine } from "./pricing/pricing.engine";

@Module({
  controllers: [
    HealthController,
    OrganizationController,
    MembershipController,
    PricingController,
    OrderController,
  ],
  providers: [
    OrganizationService,
    MembershipService,
    AuditService,
    PricingEngine,
    OrderService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
