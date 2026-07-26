import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  acceptInvitationSchema,
  inviteOrganizationMemberSchema,
  type AcceptInvitation,
  type InviteOrganizationMember,
} from "@b2b/contracts";
import { Principal, RequirePermissions } from "../auth/auth.decorators";
import type { AuthenticatedPrincipal } from "../auth/auth.types";
import { ZodValidationPipe } from "../platform/zod-validation.pipe";
import {
  MembershipService,
  type Invitation,
  type Member,
} from "./membership.service";

@ApiTags("organization-members")
@ApiBearerAuth()
@Controller("organization-members")
export class MembershipController {
  constructor(private readonly memberships: MembershipService) {}

  @Get()
  @RequirePermissions("organization.member:read")
  list(@Principal() actor: AuthenticatedPrincipal): readonly Member[] {
    return this.memberships.list(actor);
  }

  @Post("invitations")
  @RequirePermissions("organization.member:invite")
  invite(
    @Principal() actor: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(inviteOrganizationMemberSchema))
    command: InviteOrganizationMember,
  ): { invitation: Invitation; deliveryStatus: "queued" } {
    const result = this.memberships.invite(actor, command);
    // The token is handed to the notification adapter, never returned publicly.
    void result.acceptanceToken;
    return { invitation: result.invitation, deliveryStatus: "queued" };
  }

  @Post("invitations/accept")
  accept(
    @Principal() actor: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(acceptInvitationSchema))
    command: AcceptInvitation,
  ): Member {
    return this.memberships.accept(actor, command);
  }
}
