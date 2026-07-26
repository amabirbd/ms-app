import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { REQUIRED_PERMISSIONS } from "./auth.decorators";
import type { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [
        context.getHandler(),
        context.getClass(),
      ]) ?? [];
    if (required.length === 0) return true;

    const principal = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>().principal;
    const granted = new Set(principal?.permissions ?? []);
    if (!required.every((permission) => granted.has(permission))) {
      throw new ForbiddenException({
        detail: "The authenticated user lacks a required permission",
      });
    }
    return true;
  }
}
