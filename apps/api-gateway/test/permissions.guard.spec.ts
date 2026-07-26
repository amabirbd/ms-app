import { ForbiddenException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";
import { PermissionsGuard } from "../src/auth/permissions.guard";

function context(permissions: string[]) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({
      getRequest: () => ({
        principal: {
          userId: "user",
          email: "buyer@example.com",
          permissions,
        },
      }),
    }),
  } as never;
}

describe("PermissionsGuard", () => {
  it("requires every declared permission", () => {
    const reflector = {
      getAllAndOverride: vi
        .fn()
        .mockReturnValue(["order:create", "credit:use"]),
    };
    const guard = new PermissionsGuard(reflector as never);
    expect(guard.canActivate(context(["order:create", "credit:use"]))).toBe(
      true,
    );
    expect(() => guard.canActivate(context(["order:create"]))).toThrow(
      ForbiddenException,
    );
  });
});
