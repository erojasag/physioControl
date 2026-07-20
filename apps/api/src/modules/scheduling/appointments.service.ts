import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { db, requireTenantId } from "@physio/db";
import {
  canTransition,
  type AppointmentDto,
  type AppointmentStatus,
  type CreateAppointmentInput,
  type ListAppointmentsQuery,
  type UpdateAppointmentStatusInput,
} from "@physio/shared";
import { DateTime } from "luxon";
import { ReminderSchedulerService } from "../notifications/reminder-scheduler.service";

type AppointmentRow = {
  id: string;
  patientId: string;
  practitionerId: string;
  resourceId: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  patient: { name: string };
};

const INCLUDE = { patient: { select: { name: true } } } as const;

@Injectable()
export class AppointmentsService {
  constructor(private readonly reminders: ReminderSchedulerService) {}

  async create(input: CreateAppointmentInput): Promise<AppointmentDto> {
    const tenantId = requireTenantId();

    // All references must resolve within this tenant. RLS hides other tenants'
    // rows, so a missing row means "not in this tenant" (FK checks are
    // system-level and would otherwise let a foreign id through).
    await this.assertExists("patient", input.patientId, "Paciente no encontrado");
    await this.assertPractitioner(input.practitionerId);
    if (input.resourceId) {
      await this.assertExists(
        "resource",
        input.resourceId,
        "Recurso no encontrado",
      );
    }

    let appt: AppointmentRow;
    try {
      appt = (await db.appointment.create({
        data: {
          tenantId,
          patientId: input.patientId,
          practitionerId: input.practitionerId,
          resourceId: input.resourceId ?? null,
          serviceId: input.serviceId ?? null,
          startsAt: new Date(input.startsAt),
          endsAt: new Date(input.endsAt),
        },
        include: INCLUDE,
      })) as AppointmentRow;
    } catch (err) {
      if (isOverlapViolation(err)) {
        throw new ConflictException(
          "El horario se solapa con otra cita del profesional",
        );
      }
      throw err;
    }

    await this.reminders.scheduleForAppointment({
      id: appt.id,
      tenantId,
      startsAt: appt.startsAt,
    });
    return toDto(appt);
  }

  async updateStatus(
    id: string,
    input: UpdateAppointmentStatusInput,
  ): Promise<AppointmentDto> {
    const current = await db.appointment.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!current) {
      throw new NotFoundException("Cita no encontrada");
    }
    if (!canTransition(current.status as AppointmentStatus, input.status)) {
      throw new ConflictException(
        `Transición no permitida: ${current.status} → ${input.status}`,
      );
    }
    const updated = (await db.appointment.update({
      where: { id },
      data: { status: input.status },
      include: INCLUDE,
    })) as AppointmentRow;
    if (input.status === "CANCELLED") {
      await this.reminders.cancelForAppointment(id);
    }
    return toDto(updated);
  }

  async list(query: ListAppointmentsQuery): Promise<AppointmentDto[]> {
    const tenantId = requireTenantId();
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      select: { timezone: true },
    });
    const zone = tenant?.timezone ?? "UTC";

    const fromDate = query.date ?? query.from!;
    const toDate = query.date ?? query.to!;
    const start = DateTime.fromISO(fromDate, { zone }).startOf("day").toUTC();
    const end = DateTime.fromISO(toDate, { zone })
      .startOf("day")
      .plus({ days: 1 })
      .toUTC();

    const rows = (await db.appointment.findMany({
      where: {
        startsAt: { gte: start.toJSDate(), lt: end.toJSDate() },
        status: { not: "CANCELLED" },
        ...(query.practitionerId
          ? { practitionerId: query.practitionerId }
          : {}),
      },
      include: INCLUDE,
      orderBy: { startsAt: "asc" },
    })) as AppointmentRow[];

    return rows.map(toDto);
  }

  private async assertPractitioner(id: string): Promise<void> {
    const row = await db.user.findFirst({
      where: { id, isPractitioner: true, active: true },
      select: { id: true },
    });
    if (!row) throw new NotFoundException("Profesional no encontrado");
  }

  private async assertExists(
    model: "patient" | "resource",
    id: string,
    message: string,
  ): Promise<void> {
    const row =
      model === "patient"
        ? await db.patient.findUnique({ where: { id }, select: { id: true } })
        : await db.resource.findUnique({ where: { id }, select: { id: true } });
    if (!row) throw new NotFoundException(message);
  }
}

function toDto(a: AppointmentRow): AppointmentDto {
  return {
    id: a.id,
    patientId: a.patientId,
    patientName: a.patient.name,
    practitionerId: a.practitionerId,
    resourceId: a.resourceId,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
    status: a.status as AppointmentDto["status"],
  };
}

// Exclusion constraint raises Postgres 23P01; Prisma leaves it unmapped.
function isOverlapViolation(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("23P01") || msg.includes("Appointment_no_overlap");
}
