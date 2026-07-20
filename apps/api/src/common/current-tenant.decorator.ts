import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { getTenantContext, type TenantContext } from "@physio/db";

// Inject the request's tenant context into a controller handler. The guard
// guarantees it is present on non-@Public routes.
export const CurrentTenant = createParamDecorator(
  (_data: unknown, _ctx: ExecutionContext): TenantContext => {
    const context = getTenantContext();
    if (!context) {
      throw new Error("No tenant context on a tenant-scoped route");
    }
    return context;
  },
);
