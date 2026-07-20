import { z } from "zod";

// Validated config, Zod-parsed at boot. Fail fast if required secrets are missing.
// Never read process.env elsewhere — import `config` from here. Never log secrets.
const schema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  API_PORT: z.coerce.number().default(3000),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"), // CORS

  // Database (Render Postgres)
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1).optional(),

  // Cache + queue (Render Key Value)
  REDIS_URL: z.string().min(1),

  // Auth (Clerk) — backend
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  // Skip Clerk verification in local dev (trust an x-dev-user header instead).
  // NEVER set in production; guarded against NODE_ENV=production at boot.
  AUTH_DEV_BYPASS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),

  // Storage (R2/S3) — stub-able in dev
  S3_ENDPOINT: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // Messaging — stub-able in dev
  RESEND_API_KEY: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  WHATSAPP_TOKEN: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),

  // Payments (Onvo) — stub-able in dev
  ONVO_API_KEY: z.string().optional(),
  ONVO_WEBHOOK_SECRET: z.string().optional(),
  ONVO_BASE_URL: z.string().url().optional(),

  // Observability
  SENTRY_DSN: z.string().optional(),
});

export type AppConfig = z.infer<typeof schema>;

let cached: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  if (parsed.data.AUTH_DEV_BYPASS && parsed.data.NODE_ENV === "production") {
    throw new Error("AUTH_DEV_BYPASS must never be enabled in production");
  }
  cached = parsed.data;
  return cached;
}
