import { Module } from "@nestjs/common";
import { Queue } from "bullmq";
import { loadConfig } from "../../config/config";
import { REMINDERS_QUEUE } from "../../jobs/reminders.contract";
import { makeRedisConnection, REMINDERS_QUEUE_PROVIDER } from "../../jobs/redis";
import {
  ConsoleMailer,
  MAILER,
  ResendMailer,
  type Mailer,
} from "./mailer";
import { ReminderProcessorService } from "./reminder-processor.service";
import { ReminderSchedulerService } from "./reminder-scheduler.service";

@Module({
  providers: [
    {
      provide: MAILER,
      useFactory: (): Mailer => {
        const c = loadConfig();
        return c.RESEND_API_KEY
          ? new ResendMailer(c.RESEND_API_KEY, c.RESEND_FROM)
          : new ConsoleMailer();
      },
    },
    {
      provide: REMINDERS_QUEUE_PROVIDER,
      useFactory: () =>
        new Queue(REMINDERS_QUEUE, { connection: makeRedisConnection() }),
    },
    ReminderSchedulerService,
    ReminderProcessorService,
  ],
  exports: [ReminderSchedulerService, ReminderProcessorService],
})
export class NotificationsModule {}
