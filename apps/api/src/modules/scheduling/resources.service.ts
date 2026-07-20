import { Injectable } from "@nestjs/common";
import { db, requireTenantId } from "@physio/db";
import type { CreateResourceInput, ResourceDto } from "@physio/shared";

@Injectable()
export class ResourcesService {
  async list(): Promise<ResourceDto[]> {
    return db.resource.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  }

  async create(input: CreateResourceInput): Promise<ResourceDto> {
    const tenantId = requireTenantId();
    return db.resource.create({
      data: { tenantId, name: input.name },
      select: { id: true, name: true },
    });
  }
}
