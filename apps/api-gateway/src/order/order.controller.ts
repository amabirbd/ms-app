import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { createOrderSchema, type CreateOrder } from "@b2b/contracts";
import { OrderService, type OrderReceipt } from "./order.service";
import { ZodValidationPipe } from "../platform/zod-validation.pipe";

@ApiTags("orders")
@ApiBearerAuth()
@Controller("orders")
export class OrderController {
  constructor(private readonly orders: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  submit(
    @Body(new ZodValidationPipe(createOrderSchema)) command: CreateOrder,
  ): OrderReceipt {
    return this.orders.submit(command);
  }
}
