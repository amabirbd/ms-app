import {
  ConflictException,
  ForbiddenException,
  GoneException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import type {
  AcceptInvitation,
  InviteOrganizationMember,
} from "@b2b/contracts";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedPrincipal } from "../auth/auth.types";

export const BUILT_IN_ROLE_IDS = {
  buyer: "10000000-0000-4000-8000-000000000001",
  approver: "10000000-0000-4000-8000-000000000002",
  organizationAdmin: "10000000-0000-4000-8000-000000000003",
  finance: "10000000-0000-4000-8000-000000000004",
} as const;

export interface Member {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  roleIds: readonly string[];
  branchIds: readonly string[];
  departmentIds: readonly string[];
  status: "active" | "suspended";
  joinedAt: string;
}

export interface Invitation {
  id: string;
  organizationId: string;
  email: string;
  roleIds: readonly string[];
  branchIds: readonly string[];
  departmentIds: readonly string[];
  status: "pending" | "accepted" | "revoked";
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
}

interface StoredInvitation extends Invitation {
  tokenHash: string;
}

@Injectable()
export class MembershipService {
  private readonly members = new Map<string, Member>();
  private readonly invitations = new Map<string, StoredInvitation>();
  private readonly knownRoleIds = new Set<string>(
    Object.values(BUILT_IN_ROLE_IDS),
  );

  constructor(private readonly audit: AuditService) {}

  invite(
    actor: AuthenticatedPrincipal,
    command: InviteOrganizationMember,
    now = new Date(),
  ): { invitation: Invitation; acceptanceToken: string } {
    const organizationId = this.requireOrganization(actor);
    const invalidRole = command.roleIds.find(
      (roleId) => !this.knownRoleIds.has(roleId),
    );
    if (invalidRole) {
      throw new NotFoundException({
        detail: `Role ${invalidRole} was not found`,
      });
    }
    const email = command.email.toLocaleLowerCase();
    const duplicateMember = [...this.members.values()].some(
      (member) =>
        member.organizationId === organizationId &&
        member.email === email &&
        member.status === "active",
    );
    const duplicateInvitation = [...this.invitations.values()].some(
      (invitation) =>
        invitation.organizationId === organizationId &&
        invitation.email === email &&
        invitation.status === "pending" &&
        new Date(invitation.expiresAt) > now,
    );
    if (duplicateMember || duplicateInvitation) {
      throw new ConflictException({
        detail: "The user is already a member or has a pending invitation",
      });
    }

    const acceptanceToken = randomBytes(32).toString("base64url");
    const invitation: StoredInvitation = {
      id: randomUUID(),
      organizationId,
      email,
      roleIds: Object.freeze([...command.roleIds]),
      branchIds: Object.freeze([...command.branchIds]),
      departmentIds: Object.freeze([...command.departmentIds]),
      status: "pending",
      invitedBy: actor.userId,
      createdAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + command.expiresInHours * 60 * 60 * 1000,
      ).toISOString(),
      tokenHash: this.hash(acceptanceToken),
    };
    this.invitations.set(invitation.id, invitation);
    this.audit.append({
      tenantId: organizationId,
      actorId: actor.userId,
      action: "organization.member.invited",
      resourceType: "invitation",
      resourceId: invitation.id,
      outcome: "success",
      metadata: { invitedEmail: email },
    });
    return { invitation: this.redact(invitation), acceptanceToken };
  }

  accept(
    actor: AuthenticatedPrincipal,
    command: AcceptInvitation,
    now = new Date(),
  ): Member {
    const tokenHash = this.hash(command.token);
    const invitation = [...this.invitations.values()].find(
      (candidate) => candidate.tokenHash === tokenHash,
    );
    if (!invitation || invitation.status !== "pending") {
      throw new NotFoundException({
        detail: "The invitation is invalid or has already been used",
      });
    }
    if (new Date(invitation.expiresAt) <= now) {
      throw new GoneException({ detail: "The invitation has expired" });
    }
    if (invitation.email !== actor.email.toLocaleLowerCase()) {
      throw new ForbiddenException({
        detail: "The invitation belongs to a different identity",
      });
    }
    const member: Member = {
      id: randomUUID(),
      organizationId: invitation.organizationId,
      userId: actor.userId,
      email: invitation.email,
      roleIds: invitation.roleIds,
      branchIds: invitation.branchIds,
      departmentIds: invitation.departmentIds,
      status: "active",
      joinedAt: now.toISOString(),
    };
    invitation.status = "accepted";
    this.members.set(member.id, member);
    this.audit.append({
      tenantId: invitation.organizationId,
      actorId: actor.userId,
      action: "organization.member.joined",
      resourceType: "member",
      resourceId: member.id,
      outcome: "success",
      metadata: { invitationId: invitation.id },
    });
    return member;
  }

  list(actor: AuthenticatedPrincipal): readonly Member[] {
    const organizationId = this.requireOrganization(actor);
    return [...this.members.values()].filter(
      (member) => member.organizationId === organizationId,
    );
  }

  private requireOrganization(actor: AuthenticatedPrincipal): string {
    if (!actor.organizationId) {
      throw new ForbiddenException({
        detail: "An organization-scoped identity is required",
      });
    }
    return actor.organizationId;
  }

  private hash(token: string): string {
    return createHash("sha256").update(token, "utf8").digest("hex");
  }

  private redact(invitation: StoredInvitation): Invitation {
    const { tokenHash: _tokenHash, ...safe } = invitation;
    return safe;
  }
}
