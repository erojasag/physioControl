import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { db, systemDb, runWithTenantContext } from "./index";

// RELEASE-BLOCKING SPIKE (build-kit §6): prove tenant B cannot read tenant A's
// rows through the app (`db`) client. Requires a real Postgres with the RLS
// migration applied (a non-superuser, non-BYPASSRLS role — RLS does not constrain
// superusers). Runs when DATABASE_URL points at such a DB; skipped otherwise.
const hasDb = !!process.env.DATABASE_URL;

const ctx = (tenantId: string) =>
  ({ tenantId, userId: "sys", role: "OWNER" }) as const;

// Run `fn` as a tenant, awaiting INSIDE the ALS scope so the lazy Prisma query
// executes while the context is still active (the API middleware wraps the whole
// request handler the same way).
const asTenant = <T>(tenantId: string, fn: () => Promise<T>): Promise<T> =>
  runWithTenantContext(ctx(tenantId), async () => await fn());

describe.skipIf(!hasDb)("RLS tenant isolation", () => {
  let tenantA: string;
  let tenantB: string;
  let patientA: string;
  let patientB: string;
  const stamp = Date.now();

  beforeAll(async () => {
    // Tenant has no RLS; create the two tenants via the system client.
    const a = await systemDb.tenant.create({
      data: { name: "Clinic A", slug: `a-${stamp}` },
    });
    const b = await systemDb.tenant.create({
      data: { name: "Clinic B", slug: `b-${stamp}` },
    });
    tenantA = a.id;
    tenantB = b.id;

    // Each patient inserted inside its own tenant context (WITH CHECK enforced).
    patientA = (
      await asTenant(tenantA, () =>
        db.patient.create({ data: { tenantId: tenantA, name: "Ana A" } }),
      )
    ).id;
    patientB = (
      await asTenant(tenantB, () =>
        db.patient.create({ data: { tenantId: tenantB, name: "Bruno B" } }),
      )
    ).id;
  });

  afterAll(async () => {
    await systemDb.patient.deleteMany({
      where: { tenantId: { in: [tenantA, tenantB] } },
    });
    await systemDb.tenant.deleteMany({
      where: { id: { in: [tenantA, tenantB] } },
    });
    await db.$disconnect();
    await systemDb.$disconnect();
  });

  it("A sees only its own patients", async () => {
    const rows = await asTenant(tenantA, () => db.patient.findMany());
    expect(rows.map((r) => r.id)).toEqual([patientA]);
  });

  it("B cannot read A's patient by id", async () => {
    const row = await asTenant(tenantB, () =>
      db.patient.findUnique({ where: { id: patientA } }),
    );
    expect(row).toBeNull();
  });

  it("B cannot update A's patient", async () => {
    const res = await asTenant(tenantB, () =>
      db.patient.updateMany({
        where: { id: patientA },
        data: { name: "hijacked" },
      }),
    );
    expect(res.count).toBe(0);
    const stillAna = await systemDb.patient.findUnique({
      where: { id: patientA },
    });
    expect(stillAna?.name).toBe("Ana A");
  });

  it("cannot insert a row for another tenant (WITH CHECK)", async () => {
    await expect(
      asTenant(tenantA, () =>
        db.patient.create({ data: { tenantId: tenantB, name: "smuggled" } }),
      ),
    ).rejects.toThrow();
  });

  it("no tenant context => zero rows (fail-closed)", async () => {
    const rows = await db.patient.findMany();
    expect(rows).toEqual([]);
  });

  it("systemDb bypass sees both tenants", async () => {
    const rows = await systemDb.patient.findMany({
      where: { id: { in: [patientA, patientB] } },
    });
    expect(rows.length).toBe(2);
  });
});
