import { Inject, Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { db } from "@physio/db";
import {
  REMINDER_CHANNEL_EMAIL,
  REMINDER_OFFSETS_MIN,
  type ReminderJob,
} from "../../jobs/reminders.contract";
import { REMINDERS_QUEUE_PROVIDER } from "../../jobs/redis";

// Schedules/cancels appointment reminders. Called from within a request (tenant
// context active), so it uses the tenant-scoped `db` client. Each Reminder row's
// id is reused as the BullMQ jobId, so cancelling is a direct queue.remove(id).
@Injectable()
export class ReminderSchedulerService {
  constructor(
    @Inject(REMINDERS_QUEUE_PROVIDER) private readonly queue: Queue<ReminderJob>,
  ) {}

  async scheduleForAppointment(appt: {
    id: string;
    tenantId: string;
    startsAt: Date;
  }): Promise<void> {
    const now = Date.now();
    for (const offsetMin of REMINDER_OFFSETS_MIN) {
      const sendAt = appt.startsAt.getTime() - offsetMin * 60_000;
      if (sendAt <= now) continue; // lead time already passed

      const reminder = await db.reminder.create({
        data: {
          tenantId: appt.tenantId,
          appointmentId: appt.id,
          channel: REMINDER_CHANNEL_EMAIL,
          scheduledFor: new Date(sendAt),
          status: "scheduled",
        },
      });
      await this.queue.add(
        "send",
        { reminderId: reminder.id },
        {
          jobId: reminder.id,
          delay: sendAt - now,
          removeOnComplete: true,
          removeOnFail: 500,
        },
      );
    }
  }

  async cancelForAppointment(appointmentId: string): Promise<void> {
    const reminders = await db.reminder.findMany({
      where: { appointmentId, status: "scheduled" },
      select: { id: true },
    });
    for (const r of reminders) {
      await this.queue.remove(r.id).catch(() => undefined); // job may have run
      await db.reminder.update({
        where: { id: r.id },
        data: { status: "cancelled" },
      });
    }
  }
}
