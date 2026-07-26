import { ConflictException, Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { CreateOrganization } from "@b2b/contracts";

export interface Organization {
  id: string;
  legalName: string;
  displayName: string;
  countryCode: string;
  status: "pending_verification" | "active" | "suspended";
  createdAt: string;
}

@Injectable()
export class OrganizationService {
  private readonly organizations = new Map<string, Organization>();

  create(command: CreateOrganization): Organization {
    const duplicate = [...this.organizations.values()].some(
      (organization) =>
        organization.legalName.toLocaleLowerCase() ===
        command.legalName.toLocaleLowerCase(),
    );
    if (duplicate) {
      throw new ConflictException({
        detail: "An organization with this legal name already exists",
      });
    }
    const organization: Organization = {
      id: randomUUID(),
      legalName: command.legalName,
      displayName: command.displayName,
      countryCode: command.countryCode,
      status: "pending_verification",
      createdAt: new Date().toISOString(),
    };
    this.organizations.set(organization.id, organization);
    return organization;
  }
}
