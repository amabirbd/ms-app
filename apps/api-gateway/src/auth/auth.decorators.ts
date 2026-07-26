import { createParamDecorator, SetMetadata } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type {
  AuthenticatedPrincipal,
  AuthenticatedRequest,
} from "./auth.types";

export const IS_PUBLIC = "b2b:is-public";
export const REQUIRED_PERMISSIONS = "b2b:required-permissions";

export const Public = () => SetMetadata(IS_PUBLIC, true);
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);

export const Principal = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedPrincipal => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.principal) {
      throw new Error("Authentication guard did not establish a principal");
    }
    return request.principal;
  },
);
