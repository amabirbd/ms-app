import { describe, expect, it } from "vitest";
import { AuditService } from "../src/audit/audit.service";
import type { AuthenticatedPrincipal } from "../src/auth/auth.types";
import {
  BUILT_IN_ROLE_IDS,
  MembershipService,
} from "../src/organization/membership.service";

const tenantA = "5525ec64-4937-44c1-97e6-6e6f16d914e3";
const tenantB = "87e5667f-7270-4374-a7b8-7c9ccdd41f73";
const administrator: AuthenticatedPrincipal = {
  userId: "identity-admin",
  email: "admin@example.com",
  organizationId: tenantA,
  permissions: ["organization.member:invite"],
};
const invitee: AuthenticatedPrincipal = {
  userId: "identity-buyer",
  email: "buyer@example.com",
  permissions: [],
};

describe("MembershipService", () => {
  it("hashes invitation secrets and accepts a token once for the bound email", () => {
    const audit = new AuditService();
    const service = new MembershipService(audit);
    const created = service.invite(administrator, {
      email: invitee.email,
      roleIds: [BUILT_IN_ROLE_IDS.buyer],
      branchIds: [],
      departmentIds: [],
      expiresInHours: 72,
    });

    expect(JSON.stringify(created.invitation)).not.toContain(
      created.acceptanceToken,
    );
    const member = service.accept(invitee, {
      token: created.acceptanceToken,
    });
    expect(member).toMatchObject({
      organizationId: tenantA,
      userId: invitee.userId,
      roleIds: [BUILT_IN_ROLE_IDS.buyer],
    });
    expect(() =>
      service.accept(invitee, { token: created.acceptanceToken }),
    ).toThrow();
    expect(audit.forTenant(tenantA).map((record) => record.action)).toEqual([
      "organization.member.invited",
      "organization.member.joined",
    ]);
  });

  it("rejects token use by a different identity", () => {
    const service = new MembershipService(new AuditService());
    const created = service.invite(administrator, {
      email: invitee.email,
      roleIds: [BUILT_IN_ROLE_IDS.approver],
      branchIds: [],
      departmentIds: [],
      expiresInHours: 24,
    });
    expect(() =>
      service.accept(
        { ...invitee, email: "attacker@example.com" },
        { token: created.acceptanceToken },
      ),
    ).toThrow();
  });

  it("never exposes another tenant's membership list", () => {
    const service = new MembershipService(new AuditService());
    const created = service.invite(administrator, {
      email: invitee.email,
      roleIds: [BUILT_IN_ROLE_IDS.buyer],
      branchIds: [],
      departmentIds: [],
      expiresInHours: 24,
    });
    service.accept(invitee, { token: created.acceptanceToken });
    expect(
      service.list({ ...administrator, organizationId: tenantB }),
    ).toHaveLength(0);
  });

  it("rejects expired invitations", () => {
    const service = new MembershipService(new AuditService());
    const issuedAt = new Date("2026-01-01T00:00:00Z");
    const created = service.invite(
      administrator,
      {
        email: invitee.email,
        roleIds: [BUILT_IN_ROLE_IDS.buyer],
        branchIds: [],
        departmentIds: [],
        expiresInHours: 1,
      },
      issuedAt,
    );
    expect(() =>
      service.accept(
        invitee,
        { token: created.acceptanceToken },
        new Date("2026-01-01T01:00:00Z"),
      ),
    ).toThrow();
  });
});
