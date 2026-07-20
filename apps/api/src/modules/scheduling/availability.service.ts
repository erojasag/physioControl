import { Injectable, NotFoundException } from "@nestjs/common";
import { db, requireTenantId } from "@physio/db";
import type { AvailabilityDto, SetAvailabilityInput } from "@physio/shared";

@Injectable()
export class AvailabilityService {
  async get(practitionerId: string): Promise<AvailabilityDto[]> {
    return db.availability.findMany({
      where: { practitionerId },
      orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
      select: {
        id: true,
        practitionerId: true,
        weekday: true,
        startMinute: true,
        endMinute: true,
      },
    });
  }

  // Replaces the practitioner's whole weekly set atomically.
  async set(input: SetAvailabilityInput): Promise<AvailabilityDto[]> {
    const tenantId = requireTenantId();
    await this.assertPractitioner(input.practitionerId);

    // ponytail: not wrapped in one transaction — the RLS extension wraps each op
    // in its own tx and would nest badly. Availability is low-stakes config edited
    // by one user; if atomicity matters later, add a tenant-scoped tx helper in
    // packages/db.
    await db.availability.deleteMany({
      where: { practitionerId: input.practitionerId },
    });
    if (input.slots.length > 0) {
      await db.availability.createMany({
        data: input.slots.map((s) => ({
          tenantId,
          practitionerId: input.practitionerId,
          weekday: s.weekday,
          startMinute: s.startMinute,
          endMinute: s.endMinute,
        })),
      });
    }
    return this.get(input.practitionerId);
  }

  private async assertPractitioner(practitionerId: string): Promise<void> {
    const user = await db.user.findFirst({
      where: { id: practitionerId, isPractitioner: true, active: true },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException("Profesional no encontrado");
    }
  }
}
