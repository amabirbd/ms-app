import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createOrderSchema, type CreateOrder } from "@b2b/contracts";
import { OrderService, type OrderReceipt } from "./order.service";
import { ZodValidationPipe } from "../platform/zod-validation.pipe";
import { Principal, RequirePermissions } from "../auth/auth.decorators";
import type { AuthenticatedPrincipal } from "../auth/auth.types";
import { ForbiddenException } from "@nestjs/common";

@ApiTags("orders")
@ApiBearerAuth()
@Controller("orders")
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @RequirePermissions("order:create")
  submit(
    @Principal() principal: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(createOrderSchema)) command: CreateOrder,
  ): OrderReceipt {
    if (!principal.organizationId) {
      throw new ForbiddenException({
        detail: "An organization-scoped identity is required",
      });
    }
    return this.orders.submit({
      ...command,
      organizationId: principal.organizationId,
    });
  }
}
