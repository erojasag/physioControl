import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { TenantContext } from "@physio/db";
import { CurrentTenant } from "../../common/current-tenant.decorator";

@ApiTags("identity")
@Controller("me")
export class IdentityController {
  // Protected: proves the auth + tenant-context wiring end to end.
  @Get()
  me(@CurrentTenant() ctx: TenantContext): TenantContext {
    return ctx;
  }
}
