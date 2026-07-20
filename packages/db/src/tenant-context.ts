import { AsyncLocalStorage } from "node:async_hooks";
import type { Role } from "@prisma/client";

// Request-scoped tenant context. Set once per request (by the API's tenant-context
// middleware from the verified Clerk session) and read by the RLS-aware client to
// scope every query. tenantId is NEVER accepted from client input — it is derived
// from the authenticated user. See build-kit §6.
export interface TenantContext {
  tenantId: string;
  userId: string;
  role: Role;
}

const storage = new AsyncLocalStorage<TenantContext>();

/** Run `fn` with the given tenant context bound for its entire async lifetime. */
export function runWithTenantContext<T>(ctx: TenantContext, fn: () => T): T {
  return storage.run(ctx, fn);
}

/** Current tenant context, or undefined for unscoped/system code paths. */
export function getTenantContext(): TenantContext | undefined {
  return storage.getStore();
}

/** Current tenantId, throwing if called outside a tenant-scoped request. */
export function requireTenantId(): string {
  const ctx = storage.getStore();
  if (!ctx) {
    throw new Error("No tenant context — this code path must run tenant-scoped");
  }
  return ctx.tenantId;
}
