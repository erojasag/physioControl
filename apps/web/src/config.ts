import { z } from "zod";

// Validated web config, Zod-parsed at module load. Fail fast if a required
// VITE_ var is missing at build/boot.
const schema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  VITE_SENTRY_DSN: z.string().optional(),
});

const parsed = schema.safeParse(import.meta.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(`Invalid web environment configuration:\n${issues}`);
}

export const config = parsed.data;
