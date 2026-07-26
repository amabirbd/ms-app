import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../auth/auth.decorators";

@ApiTags("health")
@Public()
@Controller("health")
export class HealthController {
  @Get("live")
  live(): { status: "ok" } {
    return { status: "ok" };
  }

  @Get("ready")
  ready(): { status: "ready"; checks: Record<string, string> } {
    return { status: "ready", checks: { application: "up" } };
  }
}
