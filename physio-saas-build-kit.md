# PhysioSaaS — Build Kit (Coding Kickoff Spec)

*Everything Claude Code needs to start writing real code, with the strategic decisions already resolved. Feed this file (and the accompanying `CLAUDE.md`) into Claude Code.*

Companion to: `physiotherapy-saas-plan.md` (the strategy). This document is the **executable** layer.

**Platform locked:** Render · **Frontend:** Vue 3 (Vite) · **Backend:** NestJS · **Jobs:** BullMQ worker · **DB:** Render Postgres · **Cache/queue:** Render Key Value.

---

## 0. What was still missing before coding — and the answers

| Missing to start | Decision |
|---|---|
| One concrete stack | **Monorepo: Vue 3 SPA + NestJS API + BullMQ worker, all TypeScript** (§1) |
| Auth approach | **Clerk** — official Vue SDK (`@clerk/vue`) + backend verification (§1) |
| Hosting target | **Render** — Static Site + Web Service + Background Worker + Cron, defined in `render.yaml` (§1, §2) |
| Database + tenant isolation | **Render Postgres + RLS via a Prisma extension** (§5, §6) |
| Where background jobs run | **A dedicated BullMQ worker service** on Render, backed by **Render Key Value** (§8) |
| The payment integration contract | **`BillingProvider` interface + Onvo adapter** (§7) |
| Concrete data model | **Prisma schema** (§5) |
| What to build first | **Vertical-slice build order** (§9) |
| External accounts/keys | **Prerequisites checklist** (§2) — *the real blockers; do them first* |

Remaining genuinely-open items are small and listed in §11.

---

## 1. Locked stack

Render runs **long-running servers**, so this is a classic modular-monolith-plus-worker — no serverless workarounds. A **pnpm monorepo** (optionally Turborepo for caching):

- **Frontend — `apps/web`:** **Vue 3 + Vite + TypeScript** SPA. **Vue Router**, **Pinia** (state), **TanStack Query (Vue Query)** for server data, **Zod** for validation, **Tailwind CSS + shadcn-vue (Reka UI)** for accessible components, **Clerk via `@clerk/vue`**. Built to static assets and deployed as a **Render Static Site** (global CDN).
- **Backend — `apps/api`:** **NestJS + TypeScript**, modular monolith (one Nest module per domain). Runs as a long-running **Render Web Service**. **Prisma** ORM, **Clerk backend SDK** to verify sessions, **Zod at every boundary** (`nestjs-zod`), **Swagger/OpenAPI** auto-generated.
- **Worker — `apps/api` second entrypoint (`worker.ts`):** **BullMQ** processors (reminders, dunning, webhook processing, exports, nightly sweeps). Deployed as a **Render Background Worker** from the same build/image as the API, so it shares code and Prisma models.
- **Database:** **Render Postgres** (managed) with **Row-Level Security**.
- **Cache / queue:** **Render Key Value** (Redis-compatible) — backs BullMQ **and** caching + rate-limiting.
- **Scheduled jobs:** **Render Cron Jobs** and/or BullMQ repeatable jobs (see §8).
- **Shared packages:** `packages/db` (Prisma schema + client + RLS extension), `packages/shared` (Zod schemas, DTO types, the `BillingProvider` interface, billing event types) — imported by both `api` and `web` so the contract is single-sourced.
- **File storage (attachments):** **Cloudflare R2** or **AWS S3** (S3-compatible), private buckets + signed URLs.
- **Email:** **Resend**. **SMS:** Twilio. **WhatsApp:** Meta WhatsApp Cloud API (or Twilio) — always sent from the worker.
- **Payments:** **Onvo Pay** (subscriptions + per-visit charges).
- **Infra as code:** a **`render.yaml` Blueprint** describing every service (static site, web service, worker, cron, Postgres, Key Value) so environments are reproducible.
- **Testing:** Vitest (unit), Playwright (e2e). **Errors:** Sentry (both `web` and `api`).

**Frontend ↔ backend contract:** REST over HTTPS, typed by **shared Zod schemas** in `packages/shared`; the Vue app calls the API through a small typed fetch client + Vue Query. NestJS exposes Swagger for reference. (Set CORS to allow the web origin.)

---

## 2. Prerequisites checklist — do these *before* coding

Claude Code can scaffold immediately, but nothing runs end-to-end until these exist:

- [ ] **Render account** + a Git repo connected; plan to define services in `render.yaml`.
- [ ] **Onvo Pay** — test + live API keys, and a **webhook signing secret** (`webhook_secret_…`).
- [ ] **Clerk** application — publishable key (for `web`) + secret key (for `api`); enable MFA; pick email/password + optional Google login.
- [ ] **Render Postgres** — create the database; copy its **internal** connection URL (for services in the same region) and an external one for migrations from your laptop.
- [ ] **Render Key Value** — create it; copy the connection URL (used by BullMQ + cache).
- [ ] **Cloudflare R2** (or AWS S3) bucket — keys + endpoint; keep it **private**.
- [ ] **Resend** API key (verify a sending domain); **WhatsApp** (Meta Cloud API number or Twilio) — can be stubbed in dev.
- [ ] **A domain** (app + per-clinic public booking pages).
- [ ] **Sentry** projects (DSN for web and api).
- [ ] *(Non-code, parallel)* Costa Rican **privacy lawyer**; privacy notice + DPA + consent text; **PRODHAB** database registration; research **factura electrónica (Hacienda)** before real patient billing (strategy §3).

**Dev-mode shortcut:** email/WhatsApp/payments sit behind interfaces (§7-style) and can be console-logging stubs, so you can build scheduling before those accounts exist. Only Render Postgres + Clerk are needed early.

---

## 3. Environment variables

Two services, two `.env` contracts. Generate `.env.example` in each app and validate through a Zod config module (fail fast at boot).

**`apps/api/.env`**
```
NODE_ENV=
API_PORT=3000
WEB_ORIGIN=                   # https://app.yourdomain.com  (CORS)

# Database (Render Postgres)
DATABASE_URL=                 # pooled/internal URL for the service
DIRECT_URL=                   # for Prisma migrations

# Cache + queue (Render Key Value)
REDIS_URL=

# Auth (Clerk) — backend
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=         # user/org sync webhooks

# Storage (R2/S3)
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=

# Messaging
RESEND_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=

# Payments (Onvo)
ONVO_API_KEY=
ONVO_WEBHOOK_SECRET=          # webhook_secret_...
ONVO_BASE_URL=

# Observability
SENTRY_DSN=
```

**`apps/web/.env`**
```
VITE_API_URL=                 # https://api.yourdomain.com
VITE_CLERK_PUBLISHABLE_KEY=
VITE_SENTRY_DSN=
```

The **worker** reuses `apps/api/.env` (same DATABASE_URL, REDIS_URL, messaging + Onvo keys). Secrets live in Render env groups per service/environment — never commit real values.

---

## 4. Repository structure (pnpm monorepo)

```
/
├─ apps/
│  ├─ web/                     # Vue 3 + Vite SPA  → Render Static Site
│  │  ├─ src/
│  │  │  ├─ pages/             # routed views (dashboard, calendar, patients…)
│  │  │  ├─ pages/book/        # public self-booking (/book/:clinicSlug)
│  │  │  ├─ components/        # shadcn-vue based
│  │  │  ├─ stores/            # Pinia
│  │  │  ├─ lib/api.ts         # typed fetch client + Vue Query
│  │  │  └─ lib/auth.ts        # Clerk (@clerk/vue) helpers
│  │  └─ .env.example
│  └─ api/                     # NestJS  → Render Web Service + Background Worker
│     ├─ src/
│     │  ├─ main.ts            # HTTP entrypoint  (web service)
│     │  ├─ worker.ts          # BullMQ entrypoint (background worker)
│     │  ├─ modules/
│     │  │  ├─ identity/       # users, roles, tenant context
│     │  │  ├─ scheduling/     # availability, appointments, self-booking
│     │  │  ├─ patients/       # patients + consent
│     │  │  ├─ clinical/       # SOAP notes, attachments
│     │  │  ├─ billing-patient/      # per-visit one-off charges
│     │  │  ├─ billing-subscription/ # YOUR subscription (tiers, entitlements)
│     │  │  └─ notifications/  # email/WhatsApp/SMS senders
│     │  ├─ jobs/              # BullMQ queues + processors
│     │  ├─ common/            # guards, interceptors (tenant ctx), zod pipe, audit
│     │  └─ webhooks/          # onvo + clerk controllers
│     └─ .env.example
├─ packages/
│  ├─ db/                      # prisma/schema.prisma, generated client, RLS extension
│  └─ shared/                  # zod schemas, DTO types, BillingProvider interface, event types
├─ render.yaml                 # Blueprint: static site, web service, worker, cron, postgres, key-value
├─ pnpm-workspace.yaml
├─ CLAUDE.md
└─ physio-saas-build-kit.md
```

**Rule:** controllers/UI never touch Prisma directly — they call a Nest module's service, which owns tenant scoping + validation. Prisma access goes through the RLS-aware client in `packages/db`.

---

## 5. Core data model (Prisma schema — starting point)

Lives in `packages/db/prisma/schema.prisma`. Every tenant-owned table carries `tenantId` and is protected by RLS (§6).

```prisma
// ---------- Tenancy & identity ----------
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique              // used in /book/:clinicSlug
  timezone  String   @default("America/Costa_Rica")
  createdAt DateTime @default(now())
  users        User[]
  patients     Patient[]
  appointments Appointment[]
  subscription Subscription?
}

enum Role { OWNER CLINIC_ADMIN PRACTITIONER FRONT_DESK READ_ONLY }

model User {
  id             String  @id @default(cuid())
  clerkUserId    String  @unique           // link to Clerk identity
  tenantId       String
  role           Role    @default(PRACTITIONER)
  name           String
  email          String
  isPractitioner Boolean @default(true)
  color          String?                    // calendar color
  active         Boolean @default(true)
  createdAt      DateTime @default(now())
  tenant       Tenant  @relation(fields: [tenantId], references: [id])
  availability Availability[]
  appointments Appointment[] @relation("PractitionerAppointments")
  @@index([tenantId])
}

// ---------- Patients & consent ----------
model Patient {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  phone     String?
  email     String?
  dob       DateTime?
  notes     String?
  createdAt DateTime @default(now())
  tenant       Tenant  @relation(fields: [tenantId], references: [id])
  consents     Consent[]
  appointments Appointment[]
  @@index([tenantId])
}

model Consent {
  id            String   @id @default(cuid())
  tenantId      String
  patientId     String
  purpose       String                      // "treatment" | "reminders" | ...
  noticeVersion String
  grantedAt     DateTime @default(now())
  withdrawnAt   DateTime?
  patient       Patient  @relation(fields: [patientId], references: [id])
  @@index([tenantId])
}

// ---------- Scheduling ----------
model Service {
  id          String  @id @default(cuid())
  tenantId    String
  name        String
  durationMin Int
  priceCents  Int
  currency    String  @default("CRC")
  active      Boolean @default(true)
  @@index([tenantId])
}

model Resource {           // rooms / equipment
  id       String @id @default(cuid())
  tenantId String
  name     String
  @@index([tenantId])
}

model Availability {       // recurring working hours per practitioner
  id             String @id @default(cuid())
  tenantId       String
  practitionerId String
  weekday        Int      // 0-6
  startMinute    Int      // minutes from midnight, clinic-local
  endMinute      Int
  practitioner   User   @relation(fields: [practitionerId], references: [id])
  @@index([tenantId])
}

enum AppointmentStatus { BOOKED CONFIRMED COMPLETED CANCELLED NO_SHOW }
enum AppointmentSource { STAFF SELF_BOOKING }

model Appointment {
  id             String  @id @default(cuid())
  tenantId       String
  patientId      String
  practitionerId String
  resourceId     String?
  serviceId      String?
  startsAt       DateTime                    // stored UTC
  endsAt         DateTime
  status         AppointmentStatus @default(BOOKED)
  source         AppointmentSource @default(STAFF)
  createdAt      DateTime @default(now())
  tenant       Tenant  @relation(fields: [tenantId], references: [id])
  patient      Patient @relation(fields: [patientId], references: [id])
  practitioner User    @relation("PractitionerAppointments", fields: [practitionerId], references: [id])
  note      ClinicalNote?
  charge    PatientCharge?
  reminders Reminder[]
  // prevent double-booking via a Postgres exclusion constraint (raw SQL migration)
  @@index([tenantId, practitionerId, startsAt])
  @@index([tenantId, startsAt])
}

// ---------- Clinical notes (EMR-lite) ----------
model ClinicalNote {
  id            String  @id @default(cuid())
  tenantId      String
  appointmentId String  @unique
  patientId     String
  authorId      String
  soap          Json                         // {subjective, objective, assessment, plan}
  createdAt     DateTime @default(now())
  appointment Appointment @relation(fields: [appointmentId], references: [id])
  amendments  NoteAmendment[]
  attachments Attachment[]
  @@index([tenantId, patientId])
}

model NoteAmendment {      // append-only edit history
  id        String  @id @default(cuid())
  tenantId  String
  noteId    String
  authorId  String
  soap      Json
  createdAt DateTime @default(now())
  note      ClinicalNote @relation(fields: [noteId], references: [id])
  @@index([tenantId])
}

model Attachment {
  id          String  @id @default(cuid())
  tenantId    String
  patientId   String
  noteId      String?
  storageKey  String                         // R2/S3 object key (private)
  filename    String
  contentType String
  createdAt   DateTime @default(now())
  note        ClinicalNote? @relation(fields: [noteId], references: [id])
  @@index([tenantId, patientId])
}

// ---------- Patient billing (per-visit, one-off ONLY) ----------
enum ChargeStatus { PENDING PAID VOID }
enum ChargeMethod { CASH SINPE CARD ONVO_LINK }

model PatientCharge {
  id                  String @id @default(cuid())
  tenantId            String
  appointmentId       String @unique
  patientId           String
  amountCents         Int
  currency            String @default("CRC")
  status              ChargeStatus @default(PENDING)
  method              ChargeMethod?
  onvoPaymentIntentId String?
  paidAt              DateTime?
  createdAt           DateTime @default(now())
  appointment         Appointment @relation(fields: [appointmentId], references: [id])
  @@index([tenantId, status])
}

// ---------- YOUR subscription billing (recurring) ----------
enum PlanTier { TRIAL STARTER PRO }
enum SubStatus { TRIALING ACTIVE PAST_DUE CANCELED }

model Subscription {
  id                 String @id @default(cuid())
  tenantId           String @unique
  tier               PlanTier @default(TRIAL)
  status             SubStatus @default(TRIALING)
  seats              Int      @default(1)
  trialEndsAt        DateTime?
  currentPeriodEnd   DateTime?
  onvoCustomerId     String?
  onvoSubscriptionId String?
  updatedAt          DateTime @updatedAt
  tenant             Tenant @relation(fields: [tenantId], references: [id])
}

// ---------- Cross-cutting ----------
model Reminder {
  id            String @id @default(cuid())
  tenantId      String
  appointmentId String
  channel       String                       // "whatsapp" | "email" | "sms"
  scheduledFor  DateTime
  sentAt        DateTime?
  status        String @default("scheduled")
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  @@index([tenantId])
}

model WebhookEvent {       // idempotency ledger for ALL providers
  id          String @id @default(cuid())
  provider    String                         // "onvo" | "clerk"
  eventId     String
  type        String
  processedAt DateTime @default(now())
  @@unique([provider, eventId])
}

model AuditLog {
  id          String @id @default(cuid())
  tenantId    String
  actorUserId String?
  action      String                         // "note.viewed", "patient.exported"…
  entityType  String
  entityId    String
  metadata    Json?
  createdAt   DateTime @default(now())
  @@index([tenantId, createdAt])
}
```

Notes:
- Add a **Postgres exclusion constraint** (raw SQL migration) so a practitioner can't hold two overlapping non-cancelled appointments — UI checks aren't enough.
- All `startsAt`/`endsAt` in **UTC**, rendered in `Tenant.timezone`.
- `soap`/`metadata` are JSONB so templates evolve without migrations.

---

## 6. Multi-tenancy & RLS (do a spike first — easier here than on serverless)

Because NestJS holds **persistent connections**, per-request tenant scoping is clean:

1. **Enable RLS** on every tenant table; policy `USING (tenant_id = current_setting('app.current_tenant_id', true))` — written in a raw SQL migration (Prisma won't generate policies).
2. **Tenant context per request:** a Nest **guard/interceptor** reads the Clerk session, resolves `User → tenantId`, and stores `{ tenantId, userId, role }` in **AsyncLocalStorage** (request-scoped).
3. **RLS-aware Prisma client** (`packages/db`): a **Prisma extension** wraps each operation in a transaction that first runs `SELECT set_config('app.current_tenant_id', $tenantId, true)`, reading `tenantId` from AsyncLocalStorage.
4. **Belt-and-suspenders:** module services always scope by the context tenant; **never** accept `tenantId` from client input.
5. **Public booking** (`/book/:clinicSlug`) hits an unauthenticated API route that resolves the tenant from the slug server-side and uses a restricted service allowed only to create a pending appointment + patient.

> The single most important safeguard against cross-tenant health-data leakage. Before building features, write a test proving tenant B cannot read tenant A's rows — **release-blocking** if it fails.

---

## 7. Billing abstraction + Onvo adapter (contract to implement)

All payment logic sits behind one interface in `packages/shared` so Onvo can be extended later (Stripe/Mercado Pago when you leave Costa Rica). Two concerns, one provider today:

```ts
// packages/shared/src/billing/provider.ts
export interface BillingProvider {
  // --- Flow A: YOUR subscriptions (recurring) ---
  ensureCustomer(input: { tenantId: string; email: string; name: string }): Promise<{ customerId: string }>;
  createSubscription(input: {
    customerId: string; priceId: string; seats: number;
    paymentBehavior?: "immediate" | "allow_incomplete";
  }): Promise<{ subscriptionId: string; status: string }>;
  cancelSubscription(subscriptionId: string): Promise<void>;
  changeSubscription(input: { subscriptionId: string; priceId?: string; seats?: number }): Promise<void>;

  // --- Flow B: per-visit patient charges (one-off ONLY) ---
  createOneOffCharge(input: {
    amountCents: number; currency: string; description: string;
    method: "card" | "sinpe"; metadata: Record<string, string>;
  }): Promise<{ paymentIntentId: string; status: string; hostedUrl?: string }>;

  // --- Webhooks ---
  verifyWebhook(headers: Record<string, string>, rawBody: string): boolean;
  parseEvent(rawBody: string): { id: string; type: BillingEventType; data: unknown };
}

export type BillingEventType =
  | "payment.succeeded" | "payment.failed" | "payment.deferred"
  | "subscription.renewal.succeeded" | "subscription.renewal.failed"
  | "checkout.succeeded" | "mobile_transfer.received";
```

**Onvo adapter facts (verified from Onvo docs):**
- **Subscription setup order:** create Product → recurring **Price** (`type:"recurring"`, `interval`+`intervalCount`) → **Customer** + payment method → **Subscription**. `paymentBehavior:"allow_incomplete"` defers the first charge.
- **Amounts in the smallest currency unit** (₡2,500.00 → `250000`). Centralize the conversion.
- **Webhook events Onvo sends:** `payment-intent.succeeded`/`.failed`/`.deferred`, `subscription.renewal.succeeded`/`.failed`, `checkout-session.succeeded`, `mobile-transfer.received` — map these into `BillingEventType`.
- **No `subscription.created/updated/canceled` webhooks** → **your DB is the source of truth**; update `Subscription` when you call the API.
- **Webhook auth:** verify `X-Webhook-Secret` (prefix `webhook_secret_…`) with **constant-time compare**; assume **out-of-order** delivery; dedupe via `WebhookEvent` (`@@unique([provider, eventId])`).
- **SINPE Móvil** = push-based → one-off patient charges only; subscriptions ride on **cards**.

The Onvo webhook controller: read raw body → `verifyWebhook` → dedupe → **enqueue a BullMQ job** and return 200 fast (heavy work in the worker, §8).

---

## 8. Background jobs (BullMQ worker on Render)

The worker (`apps/api/src/worker.ts`, deployed as a Render **Background Worker**, backed by **Render Key Value**) owns all async/scheduled work:

- **Reminder scheduling:** on `appointment.booked`, enqueue delayed jobs (e.g. 24h + 2h before) → send via WhatsApp/email/SMS; idempotent; cancel on appointment cancel. (Use BullMQ **delayed jobs**.)
- **Onvo webhook processing:** consume enqueued events; update `Subscription` / `PatientCharge`; drive dunning.
- **Dunning:** on `subscription.renewal.failed` → `PAST_DUE`, notify clinic, start grace timer, suspend if unresolved; on `renewal.succeeded` → `ACTIVE`.
- **Data export / erasure** jobs (portability + delete-my-data) for compliance.
- **Nightly sweeps** (mark stale appointments `NO_SHOW`, etc.) via a **Render Cron Job** or a BullMQ **repeatable** job.

Render Key Value also backs **caching + rate-limiting** (auth + public booking endpoints).

---

## 9. First vertical slice & build order

Build one thin end-to-end slice, then widen. Each step ends with green types/tests and a Render preview.

1. **Monorepo scaffold:** pnpm workspaces, `apps/web` (Vue+Vite+TS strict+Tailwind+shadcn-vue+Clerk+Vue Query), `apps/api` (NestJS+TS strict+Zod pipe+Swagger+Sentry), `packages/db` (Prisma), `packages/shared`. `render.yaml` with all services. CI green.
2. **Foundations (no features):** Tenant + User models; Clerk wired on both sides (web sign-in, api token verification); **tenant context (AsyncLocalStorage) + RLS extension**; the RLS spike test; audit-log helper; app shell + protected routes.
3. **Vertical slice — a single appointment:** create Patient → create Appointment (double-booking prevented) → see it on a day calendar. Exercises schema, RLS, service, API, and Vue UI in one path.
4. **Scheduling breadth:** availability, week/day calendar, statuses, resources, **public self-booking page** (`/book/:slug`).
5. **Reminders:** BullMQ worker + one channel (email) end-to-end, then WhatsApp.
6. **Your subscription billing:** tiers/entitlements module, Onvo adapter (subscriptions), trial→active→past_due→canceled state machine, webhook controller + worker handler, dunning, in-app billing screen.
7. **EMR-lite:** SOAP notes (JSONB) + amend history + encrypted attachments (signed URLs) + patient timeline.
8. **Per-visit patient billing:** service catalog, one-off charge via Onvo (SINPE + card), receipts, payment status.
9. **Compliance tooling:** consent capture, data export + erasure jobs.

---

## 10. Testing, CI & conventions (short)

- **Vitest** for services (billing math, RLS scoping, availability/overlap logic) on the api side; **Vitest + Vue Test Utils** for web components.
- **Playwright** e2e: sign-in, book appointment, self-booking, subscribe.
- **A dedicated RLS test** (tenant B can't read tenant A) — release-blocking.
- **CI (GitHub Actions):** typecheck + lint + unit + build across the workspace; run Prisma migrate against an ephemeral Postgres.
- **Migrations:** backwards-compatible (expand/contract); a migration hits **all tenants** at once.
- **Money:** integers (cents), never floats; one currency helper.
- **Zod at every boundary;** never trust client input for `tenantId`.
- **`render.yaml`** is the source of truth for services/env groups — keep it updated as you add services.

---

## 11. Remaining open decisions (small — pick as you go)

- **Reminder timing defaults** (24h + 2h? clinic-configurable?).
- **Trial length & card-upfront?** (14 days, no card, is a fine default.)
- **Exact tier prices in CRC** (finalize before launch).
- **UI language:** Spanish-first — configure vue-i18n from the start.
- **Vue component lib:** shadcn-vue (Reka UI) vs PrimeVue — either is fine; shadcn-vue matches the Tailwind approach.
- **R2 vs S3 vs Render disks** for attachments (R2 is cheap + S3-compatible; don't use ephemeral Render disks for patient files).
- **Worker as second entrypoint vs separate `apps/worker`** — second entrypoint in `apps/api` keeps models shared; split later only if it needs independent scaling.

---

## 12. How to feed this to Claude Code

Put both files at the repo root. First prompt, roughly:

> "Read `CLAUDE.md` and `physio-saas-build-kit.md`. Do step 1 of §9: scaffold a pnpm monorepo with `apps/web` (Vue 3 + Vite + TypeScript strict, Tailwind + shadcn-vue, Vue Router, Pinia, TanStack Vue Query, Clerk via @clerk/vue, Sentry), `apps/api` (NestJS + TypeScript strict, Zod validation pipe, Swagger, Sentry), `packages/db` (Prisma), and `packages/shared`. Add a `render.yaml` Blueprint defining a Static Site (web), a Web Service (api), a Background Worker (worker entrypoint), a Cron Job, Render Postgres, and Render Key Value. Generate `.env.example` for api and web per §3, plus a validated Zod config module in each. Add GitHub Actions CI (typecheck, lint, test, build). Stop after the scaffold builds and CI is green — no features yet."

Then proceed one numbered step at a time, PR-sized, tests in the same step. Slow down for the RLS spike (step 2) and verify by hand.
