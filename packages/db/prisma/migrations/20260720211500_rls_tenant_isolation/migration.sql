-- Tenant isolation via Postgres Row-Level Security. Build-kit §6.
-- Prisma cannot generate policies, so this is a hand-written raw SQL migration.
--
-- Every tenant-owned table (those carrying "tenantId") gets:
--   * ENABLE + FORCE RLS  — FORCE so even the table OWNER (the single Render app
--     role) is subject to the policy; without FORCE the owner silently bypasses.
--   * A tenant_isolation policy filtering by the request's tenant, set on the
--     connection via `set_config('app.current_tenant_id', ...)` (rls-client.ts).
--
-- Cross-tenant/system reads (auth bootstrap: resolve user by clerkUserId; webhook
-- processing; worker sweeps) set `app.bypass_rls = 'on'` transaction-locally via the
-- systemDb client. GUCs are ONLY ever set by server code — client input never
-- reaches them — so the bypass is not a client-exploitable hole.
--
-- Both GUCs use set_config(..., is_local => true): transaction-scoped, so they
-- cannot leak across a pooled connection into another request.
--
-- Tenant (the tenancy root) and WebhookEvent (global idempotency ledger) have no
-- "tenantId" and are intentionally NOT covered here.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'User', 'Patient', 'Consent', 'Service', 'Resource', 'Availability',
    'Appointment', 'ClinicalNote', 'NoteAmendment', 'Attachment',
    'PatientCharge', 'Subscription', 'Reminder', 'AuditLog'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format(
      $pol$
      CREATE POLICY tenant_isolation ON %I
        USING (
          current_setting('app.bypass_rls', true) = 'on'
          OR "tenantId" = current_setting('app.current_tenant_id', true)
        )
        WITH CHECK (
          current_setting('app.bypass_rls', true) = 'on'
          OR "tenantId" = current_setting('app.current_tenant_id', true)
        )
      $pol$, t);
  END LOOP;
END $$;
