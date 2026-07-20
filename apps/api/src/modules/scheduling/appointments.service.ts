import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { db, getTenantContext, requireTenantId } from "@physio/db";
import type { AppointmentDto, CreateAppointmentInput } from "@physio/shared";
import { DateTime } from "luxon";

type AppointmentRow = {
  id: string;
  patientId: string;
  practitionerId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  patient: { name: string };
};

@Injectable()
export class AppointmentsService {
  async create(input: CreateAppointmentInput): Promise<AppointmentDto> {
    const tenantId = requireTenantId();
    const practitionerId = getTenantContext()!.userId;

    // Belt-and-suspenders: confirm the patient is in this tenant. RLS hides other
    // tenants' patients, but FK checks run system-level and would otherwise let a
    // cross-tenant patientId slip in.
    const patient = await db.patient.findUnique({
      where: { id: input.patientId },
      select: { id: true },
    });
    if (!patient) {
      throw new NotFoundException("Paciente no encontrado");
    }

    try {
      const appt = (await db.appointment.create({
        data: {
          tenantId,
          patientId: input.patientId,
          practitionerId,
          serviceId: input.serviceId ?? null,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
        },
        include: { patient: { select: { name: true } } },
      })) as AppointmentRow;
      return toDto(appt);
    } catch (err) {
      if (isOverlapViolation(err)) {
        throw new ConflictException(
          "El horario se solapa con otra cita del profesional",
        );
      }
      throw err;
    }
  }

  async listByDay(date: string): Promise<AppointmentDto[]> {
    const tenantId = requireTenantId();
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { timezone: true },
    });
    const zone = tenant?.timezone ?? "UTC";

    // Day bounds in the clinic's timezone, converted to the UTC we store.
    const dayStart = DateTime.fromISO(date, { zone }).startOf("day").toUTC();
    const dayEnd = dayStart.plus({ days: 1 });

    const rows = (await db.appointment.findMany({
      where: {
        startsAt: { gte: dayStart.toJSDate(), lt: dayEnd.toJSDate() },
        status: { not: "CANCELLED" },
      },
      include: { patient: { select: { name: true } } },
      orderBy: { startsAt: "asc" },
    })) as AppointmentRow[];

    return rows.map(toDto);
  }
}

function toDto(a: AppointmentRow): AppointmentDto {
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: a.patient.name,
    practitionerId: a.practitionerId,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status as AppointmentDto["status"],
  };
}

// The exclusion constraint raises Postgres error 23P01. Prisma surfaces it without
// a mapped code, so match on the pg code / constraint name in the message.
function isOverlapViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("23P01") || msg.includes("Appointment_no_overlap");
}
