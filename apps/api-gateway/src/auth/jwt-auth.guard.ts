import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from "jose";
import { IS_PUBLIC } from "./auth.decorators";
import type {
  AuthenticatedPrincipal,
  AuthenticatedRequest,
} from "./auth.types";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private keySet?: JWTVerifyGetKey;

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const header = Array.isArray(authorization)
      ? authorization[0]
      : authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({
        detail: "A bearer access token is required",
      });
    }

    const issuer = process.env.JWT_ISSUER;
    const audience = process.env.JWT_AUDIENCE;
    const jwksUrl =
      process.env.JWT_JWKS_URL ??
      (issuer
        ? `${issuer.replace(/\/$/, "")}/.well-known/jwks.json`
        : undefined);
    if (!issuer || !audience || !jwksUrl) {
      throw new ServiceUnavailableException({
        detail: "Identity verification is not configured",
      });
    }

    try {
      this.keySet ??= createRemoteJWKSet(new URL(jwksUrl), {
        cooldownDuration: 30_000,
        timeoutDuration: 3_000,
      });
      const { payload } = await jwtVerify(header.slice(7), this.keySet, {
        issuer,
        audience,
        algorithms: ["RS256", "ES256"],
        clockTolerance: 5,
        maxTokenAge: "10m",
      });
      request.principal = this.toPrincipal(payload);
      return true;
    } catch {
      throw new UnauthorizedException({
        detail: "The access token is invalid or expired",
      });
    }
  }

  private toPrincipal(payload: JWTPayload): AuthenticatedPrincipal {
    const email = typeof payload.email === "string" ? payload.email : undefined;
    if (!payload.sub || !email) {
      throw new Error("Required identity claims are missing");
    }
    const permissions = Array.isArray(payload.permissions)
      ? payload.permissions.filter(
          (permission): permission is string => typeof permission === "string",
        )
      : [];
    return {
      userId: payload.sub,
      email: email.toLocaleLowerCase(),
      permissions,
      ...(typeof payload.org_id === "string"
        ? { organizationId: payload.org_id }
        : {}),
      ...(typeof payload.sid === "string" ? { sessionId: payload.sid } : {}),
    };
  }
}
