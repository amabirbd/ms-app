import { BadRequestException } from "@nestjs/common";

export function requireTenantId(raw: string | undefined): string {
  if (
    !raw ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      raw,
    )
  ) {
    throw new BadRequestException({
      detail: "A valid tenant context is required",
    });
  }
  return raw;
}
