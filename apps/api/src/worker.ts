import "reflect-metadata";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { loadConfig } from "./config/config";

// BullMQ background worker entrypoint. Same build/image as the API (shares Prisma
// models + code). Owns reminders, dunning, webhook processing, exports, sweeps.
// Processors are registered in build order steps 5+ — this is the scaffold shell.
async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const connection = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  // Placeholder queue so the process has something to run; real queues added later.
  const worker = new Worker(
    "system",
    async (job) => {
      return { handled: job.name };
    },
    { connection },
  );

  worker.on("ready", () => {
    console.log("[worker] ready");
  });
}

void bootstrap();
