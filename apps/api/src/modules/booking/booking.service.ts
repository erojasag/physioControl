import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { db, runWithTenantContext, systemDb } from "@physio/db";
import type {
  BookingResultDto,
  CreateBookingInput,
  PublicClinicDto,
} from "@physio/shared";
import { ReminderSchedulerService } from "../notifications/reminder-scheduler.service";

// Public self-booking. The clinic is resolved from the URL slug server-side via
// systemDb (Tenant has no RLS); every subsequent write runs inside that tenant's
// context so RLS scopes it. This service is deliberately narrow: it may only read
// the public practitioner list and create a pending patient + appointment. It
// never exposes existing patients or other tenants' data.
//
// ponytail: no rate limiting yet — an unauthenticated write endpoint. Add a
// Key Value / IP throttle before launch (build-kit §8). Noted, not built.
@Injectable()
export class BookingService {
  constructor(private readonly reminders: ReminderSchedulerService) {}

  async getClinic(slug: string): Promise<PublicClinicDto> {
    const tenant = await this.resolveTenant(slug);
    const practitioners = await runWithTenantContext(
      { tenantId: tenant.id, userId: "self-booking", role: "READ_ONLY" },
      async () =>
        db.user.findMany({
          where: { isPractitioner: true, active: true },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
    );
    return {
      name: tenant.name,
      slug: tenant.slug,
      timezone: tenant.timezone,
      practitioners,
    };
  }

  async book(
    slug: string,
    input: CreateBookingInput,
  ): Promise<BookingResultDto> {
    const tenant = await this.resolveTenant(slug);
    return runWithTenantContext(
      { tenantId: tenant.id, userId: "self-booking", role: "READ_ONLY" },
      async () => {
        const practitioner = await db.user.findFirst({
          where: {
            id: input.practitionerId,
            isPractitioner: true,
            active: true,
          },
          select: { id: true },
        });
        if (!practitioner) {
          throw new NotFoundException("Profesional no encontrado");
        }

        const patient = await db.patient.create({
          data: {
            tenantId: tenant.id,
            name: input.patientName,
            phone: input.patientPhone ?? null,
            email: input.patientEmail ?? null,
          },
        });

        try {
          const appt = await db.appointment.create({
            data: {
              tenantId: tenant.id,
              patientId: patient.id,
              practitionerId: input.practitionerId,
              startsAt: new Date(input.startsAt),
              endsAt: new Date(input.endsAt),
              status: "BOOKED",
              source: "SELF_BOOKING",
            },
          });
          await this.reminders.scheduleForAppointment({
            id: appt.id,
            tenantId: tenant.id,
            startsAt: appt.startsAt,
          });
          return {
            appointmentId: appt.id,
            startsAt: appt.startsAt.toISOString(),
            endsAt: appt.endsAt.toISOString(),
          };
        } catch (err) {
          // Don't orphan the patient row if the slot was taken.
          await db.patient.delete({ where: { id: patient.id } });
          if (isOverlapViolation(err)) {
            throw new ConflictException("El horario ya no está disponible");
          }
          throw err;
        }
      },
    );
  }

  private async resolveTenant(slug: string) {
    const tenant = await systemDb.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, slug: true, timezone: true },
    });
    if (!tenant) {
      throw new NotFoundException("Clínica no encontrada");
    }
    return tenant;
  }
}

function isOverlapViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("23P01") || msg.includes("Appointment_no_overlap");
}
