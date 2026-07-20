import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, systemDb, runWithTenantContext } from "./index";

// Proves the DB-level exclusion constraint (build-kit rule 9): a practitioner
// cannot hold two overlapping non-cancelled appointments. Runs when DATABASE_URL
// points at a migrated Postgres; skipped otherwise (see rls.spike.test.ts).
const hasDb = !!process.env.DATABASE_URL;
const stamp = Date.now();
const tenantId = `ov_t_${stamp}`;
const userId = `ov_u_${stamp}`;
const patientId = `ov_p_${stamp}`;

const asTenant = <T>(fn: () => Promise<T>): Promise<T> =>
  runWithTenantContext(
    { tenantId, userId, role: "OWNER" },
    async () => await fn(),
  );

const appt = (startISO: string, endISO: string) =>
  db.appointment.create({
    data: {
      tenantId,
      patientId,
      practitionerId: userId,
      startsAt: new Date(startISO),
      endsAt: new Date(endISO),
    },
  });

describe.skipIf(!hasDb)("appointment overlap constraint", () => {
  beforeAll(async () => {
    await systemDb.tenant.create({
      data: { id: tenantId, name: "Ov", slug: `ov-${stamp}` },
    });
    await asTenant(async () => {
      await db.user.create({
        data: {
          id: userId,
          clerkUserId: `ck_${stamp}`,
          tenantId,
          name: "Doc",
          email: "d@x.com",
        },
      });
      await db.patient.create({
        data: { id: patientId, tenantId, name: "Pat" },
      });
      await appt("2026-07-21T15:00:00Z", "2026-07-21T15:45:00Z");
    });
  });

  afterAll(async () => {
    await systemDb.appointment.deleteMany({ where: { tenantId } });
    await systemDb.patient.deleteMany({ where: { tenantId } });
    await systemDb.user.deleteMany({ where: { tenantId } });
    await systemDb.tenant.deleteMany({ where: { id: tenantId } });
    await db.$disconnect();
    await systemDb.$disconnect();
  });

  it("rejects an overlapping appointment", async () => {
    await expect(
      asTenant(() => appt("2026-07-21T15:30:00Z", "2026-07-21T16:00:00Z")),
    ).rejects.toThrow();
  });

  it("allows a back-to-back (half-open) appointment", async () => {
    const created = await asTenant(() =>
      appt("2026-07-21T15:45:00Z", "2026-07-21T16:30:00Z"),
    );
    expect(created.id).toBeTruthy();
  });
});
