import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { Worker } from "bullmq";
import { AppModule } from "./app.module";
import { loadConfig } from "./config/config";
import {
  REMINDERS_QUEUE,
  type ReminderJob,
} from "./jobs/reminders.contract";
import { makeRedisConnection } from "./jobs/redis";
import { ReminderProcessorService } from "./modules/notifications/reminder-processor.service";

// BullMQ background worker. Same build/image as the API; boots a Nest application
// context (no HTTP) to reuse DI — config, Prisma, mailer, processors.
async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const log = new Logger("worker");

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });
  const processor = app.get(ReminderProcessorService);

  const worker = new Worker<ReminderJob>(
    REMINDERS_QUEUE,
    async (job) => processor.process(job.data.reminderId),
    { connection: makeRedisConnection() },
  );

  worker.on("failed", (job, err) =>
    log.error(`reminder job ${job?.id} failed: ${err.message}`),
  );
  worker.on("ready", () => log.log(`ready (env=${config.NODE_ENV})`));

  const shutdown = async (): Promise<void> => {
    await worker.close();
    await app.close();
    process.exit(0);
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

void bootstrap();
