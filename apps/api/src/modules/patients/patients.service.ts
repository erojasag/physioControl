import { Injectable } from "@nestjs/common";
import { db, requireTenantId, type Patient } from "@physio/db";
import type { CreatePatientInput, PatientDto } from "@physio/shared";

@Injectable()
export class PatientsService {
  async create(input: CreatePatientInput): Promise<PatientDto> {
    const tenantId = requireTenantId();
    const patient = await db.patient.create({
      data: {
        tenantId,
        name: input.name,
        phone: input.phone ?? null,
        email: input.email ?? null,
        dob: input.dob ? new Date(input.dob) : null,
      },
    });
    return toDto(patient);
  }

  async list(): Promise<PatientDto[]> {
    const rows = await db.patient.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(toDto);
  }
}

function toDto(p: Patient): PatientDto {
  return {
    id: p.id,
    name: p.name,
    phone: p.phone,
    email: p.email,
    dob: p.dob ? p.dob.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}
