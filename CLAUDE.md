# CLAUDE.md — PhysioSaaS

Guidance for Claude Code working in this repository. Read this before writing code. Read `physio-saas-build-kit.md` for the full spec (schema, interfaces, build order).

## What this is

A multi-tenant SaaS for physiotherapists (solo + small clinics, Latin America / Costa Rica-first): appointment scheduling, self-booking, reminders, lightweight clinical notes (EMR-lite), and two billing flows. **We store patient health data — treat security and tenant isolation as non-negotiable.**

## Two billing flows — never conflate them

1. **Subscription billing (recurring):** *we* charge each clinic/solo physio a monthly/annual subscription by tier (`TRIAL`/`STARTER`/`PRO`). Lives in `apps/api/src/modules/billing-subscription`.
2. **Patient billing (one-off ONLY):** physios charge *their* patients **per visit**. There is **no recurring patient billing** — do not add subscription/stored-mandate logic here. Lives in `apps/api/src/modules/billing-patient`.

Both use Onvo Pay today, behind the `BillingProvider` interface (`packages/shared`).

## Stack (do not substitute without being asked)

- **Monorepo** (pnpm workspaces), all TypeScript `strict`. Hosted on **Render** (long-running services — not serverless), defined in `render.yaml`.
- **`apps/web`** — **Vue 3 + Vite** SPA: Vue Router, Pinia, TanStack Vue Query, Tailwind + shadcn-vue, **Clerk via `@clerk/vue`**. → Render **Static Site**.
- **`apps/api`** — **NestJS** modular monolith (one module per domain), **Prisma**, Clerk backend verification, **Zod** at every boundary, Swagger. → Render **Web Service**.
- **Worker** — `apps/api/src/worker.ts`, **BullMQ** processors. → Render **Background Worker** (same build as api).
- **Render Postgres** (RLS) · **Render Key Value** (BullMQ + cache/rate-limit) · **Render Cron** · **R2/S3** files · **Resend**/Twilio/WhatsApp messaging · **Onvo Pay** payments · **Sentry**.
- **`packages/db`** = Prisma schema + RLS-aware client. **`packages/shared`** = Zod schemas, DTO types, `BillingProvider` interface, billing event types (imported by api and web).

## Non-negotiable rules

1. **Tenant isolation is sacred.** Every tenant-owned row has `tenantId`. Postgres **RLS** is on for every such table AND api services scope by tenant. Never accept `tenantId` from client input — derive it from the authenticated session via the request tenant context (AsyncLocalStorage). New tenant table → add its RLS policy in the same migration.
2. **Controllers/UI never call Prisma directly.** They call a Nest module service that takes the request `ctx: { tenantId, userId, role }` and owns validation + scoping. DB access goes through the RLS-aware client in `packages/db`.
3. **Validate every boundary with Zod** (api DTOs, webhook bodies, and the web API client). Reject unknown input.
4. **Money is integers (cents), never floats.** Onvo amounts are in the **smallest currency unit** (₡2,500.00 → `250000`). Use the single currency helper; never inline the ×100.
5. **Webhooks: verify, dedupe, then defer.** Verify signatures (Onvo: `X-Webhook-Secret`, constant-time compare). Dedupe via `WebhookEvent` (`@@unique([provider, eventId])`). Assume out-of-order delivery. Enqueue a BullMQ job and return 200 fast; do the work in the worker.
6. **Our DB is the source of truth for subscription state** — Onvo sends no create/cancel webhooks. Update `Subscription` when we call the API, not from a webhook.
7. **Audit sensitive access.** Reads/edits/exports of patient records and notes go through the audit-log helper.
8. **Secrets only via the validated config module** (Zod-parsed at boot in each app). Never hardcode keys; never log secrets or PHI. Secrets live in Render env groups.
9. **Times in UTC in the DB**, rendered in `Tenant.timezone`. Prevent double-booking with a **DB-level exclusion constraint**, not just UI checks.
10. **Clinical notes are append/amend, not overwrite** — preserve history via `NoteAmendment`.

## Conventions

- Nest module per domain under `apps/api/src/modules/*`; jobs under `apps/api/src/jobs/*`; shared contracts in `packages/shared`.
- Keep changes **PR-sized** and write tests **in the same change**.
- Backwards-compatible migrations (expand/contract); a migration affects **all tenants** at once.
- Spanish-first UI copy (primary market) via vue-i18n; don't hardcode English strings in components.
- External services (email, WhatsApp, payments, storage) sit behind interfaces so they can be stubbed in dev.
- `render.yaml` is the source of truth for services + env groups — update it when you add a service.

## Build order

Follow §9 of `physio-saas-build-kit.md`, one numbered step at a time, each ending with green types/tests and a Render preview:
scaffold → foundations+RLS spike → single-appointment vertical slice → scheduling breadth + self-booking → reminders (BullMQ worker) → subscription billing → EMR-lite → per-visit patient billing → compliance tooling.

**The RLS spike is the one place to slow down:** before building features, prove with a test that tenant B cannot read tenant A's rows. A failure here is release-blocking.

## When unsure

- If a task seems to require breaking a non-negotiable rule (exposing `tenantId`, adding recurring patient billing, bypassing RLS for convenience), stop and flag it rather than working around it.
- Health data + fiscal rules (factura electrónica, PRODHAB) are country-specific — don't invent compliance logic; leave a clearly-marked TODO and note it for the human.
