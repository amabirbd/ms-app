import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import {
  createOrganizationSchema,
  type CreateOrganization,
} from "@b2b/contracts";
import { ZodValidationPipe } from "../platform/zod-validation.pipe";
import { OrganizationService, type Organization } from "./organization.service";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller("organizations")
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createOrganizationSchema))
    command: CreateOrganization,
  ): Organization {
    return this.organizations.create(command);
  }
}
