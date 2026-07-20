import { Injectable, NestMiddleware } from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import { runWithTenantContext, systemDb, type Role } from "@physio/db";
import type { NextFunction, Request, Response } from "express";
import { loadConfig } from "../config/config";

// Resolves the authenticated tenant for each request and binds it in
// AsyncLocalStorage for the WHOLE handler lifetime, so the RLS-aware `db` client
// scopes every query. tenantId is derived from the verified Clerk session — NEVER
// from client input (build-kit §6). Missing/invalid auth simply runs with no
// context; ClerkAuthGuard rejects protected routes afterwards.
//
// The context MUST wrap next() so that awaits inside the handler still see the
// store (ALS propagates across awaits started within run()).
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  private readonly config = loadConfig();

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const clerkUserId = await this.resolveClerkUserId(req);
    if (!clerkUserId) {
      return next();
    }

    // Cross-tenant bootstrap: which tenant does this Clerk user belong to?
    const user = await systemDb.user.findUnique({
      where: { clerkUserId },
      select: { id: true, tenantId: true, role: true, active: true },
    });
    if (!user || !user.active) {
      return next();
    }

    runWithTenantContext(
      { tenantId: user.tenantId, userId: user.id, role: user.role as Role },
      () => next(),
    );
  }

  private async resolveClerkUserId(req: Request): Promise<string | null> {
    if (this.config.AUTH_DEV_BYPASS) {
      const dev = req.header("x-dev-user");
      return dev ?? null;
    }
    const auth = req.header("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return null;
    try {
      const payload = await verifyToken(token, {
        secretKey: this.config.CLERK_SECRET_KEY,
      });
      return payload.sub ?? null;
    } catch {
      return null;
    }
  }
}
