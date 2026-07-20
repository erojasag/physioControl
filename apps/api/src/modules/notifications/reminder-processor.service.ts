import { Inject, Injectable, Logger } from "@nestjs/common";
import { systemDb } from "@physio/db";
import { DateTime } from "luxon";
import { MAILER, type Mailer } from "./mailer";

// Runs in the worker. This is cross-tenant system work, so it uses systemDb.
// Idempotent: a reminder is sent at most once (guarded by sentAt), and jobs use
// the reminderId as jobId so BullMQ won't duplicate an in-flight one.
@Injectable()
export class ReminderProcessorService {
  private readonly log = new Logger("ReminderProcessor");

  constructor(@Inject(MAILER) private readonly mailer: Mailer) {}

  async process(reminderId: string): Promise<void> {
    const reminder = await systemDb.reminder.findUnique({
      where: { id: reminderId },
      include: {
        appointment: {
          include: { patient: true, tenant: { select: { timezone: true } } },
        },
      },
    });

    if (!reminder || reminder.sentAt || reminder.status !== "scheduled") {
      return; // already handled, cancelled, or gone — no-op
    }
    if (reminder.appointment.status === "CANCELLED") {
      await this.mark(reminderId, "cancelled");
      return;
    }

    const to = reminder.appointment.patient.email;
    if (!to) {
      await this.mark(reminderId, "skipped"); // no email on file
      return;
    }

    const when = DateTime.fromJSDate(reminder.appointment.startsAt)
      .setZone(reminder.appointment.tenant.timezone)
      .setLocale("es")
      .toFormat("cccc d 'de' LLLL, HH:mm");

    await this.mailer.send({
      to,
      subject: "Recordatorio de su cita",
      text: `Hola ${reminder.appointment.patient.name}, le recordamos su cita el ${when}.`,
    });

    await systemDb.reminder.update({
      where: { id: reminderId },
      data: { sentAt: new Date(), status: "sent" },
    });
    this.log.log(`sent reminder ${reminderId}`);
  }

  private async mark(id: string, status: string): Promise<void> {
    await systemDb.reminder.update({ where: { id }, data: { status } });
  }
}
