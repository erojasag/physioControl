import { Injectable } from "@nestjs/common";
import { db, getTenantContext, type Prisma } from "@physio/db";

// Audit-log helper (build-kit rule 7). Reads/edits/exports of patient records and
// notes must go through here. Writes via the tenant-scoped `db` client, so the
// audit row lands in the actor's tenant and is itself RLS-protected.
@Injectable()
export class AuditService {
  async log(entry: {
    action: string; // "note.viewed", "patient.exported", ...
    entityType: string;
    entityId: string;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    const ctx = getTenantContext();
    if (!ctx) {
      throw new Error("audit.log requires a tenant context");
    }
    await db.auditLog.create({
      data: {
        tenantId: ctx.tenantId,
        actorUserId: ctx.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
      },
    });
  }
}
