import { PrismaClient } from "@prisma/client";
import { getTenantContext } from "./tenant-context";

// RLS-aware Prisma clients. Postgres RLS (see migrations) is the real enforcement;
// these just set the right GUC on the connection before each query.
//
// set_config(..., is_local => true) is transaction-local, so a value set for one
// request cannot leak across the pooled connection into another request.

const base = new PrismaClient();

function withGuc(
  client: PrismaClient,
  guc: (ctx: ReturnType<typeof getTenantContext>) => string | null,
): PrismaClient {
  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        const setting = guc(getTenantContext());
        if (setting === null) {
          // No GUC to set — run plain. Under FORCE RLS with no tenant set, this
          // returns zero rows (fail-closed), which is the safe default.
          return query(args);
        }
        const [, result] = await base.$transaction([
          base.$executeRawUnsafe(setting),
          query(args),
        ]);
        return result;
      },
    },
  }) as unknown as PrismaClient;
}

// Tenant-scoped client — feature code uses this. Scopes every query to the request
// tenant from AsyncLocalStorage. No context => no GUC => RLS returns nothing.
export const db = withGuc(base, (ctx) =>
  ctx
    ? `SELECT set_config('app.current_tenant_id', ${quote(ctx.tenantId)}, true)`
    : null,
);

// System client — bypasses tenant isolation for legitimate cross-tenant/system
// work ONLY: auth bootstrap (resolve user by clerkUserId), webhook processing,
// worker sweeps. Grep for `systemDb` to audit every bypass. NEVER use for
// request-driven feature queries.
export const systemDb = withGuc(
  base,
  () => `SELECT set_config('app.bypass_rls', 'on', true)`,
);

// tenantId/userId are server-derived cuids, but quote defensively — these values
// are interpolated into a set_config literal.
function quote(value: string): string {
  return `'${value.replace(/'/g, "''")}'`;
}
