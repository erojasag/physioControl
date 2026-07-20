import { Injectable } from "@nestjs/common";
import { db } from "@physio/db";
import type { PractitionerDto } from "@physio/shared";

@Injectable()
export class PractitionersService {
  async list(): Promise<PractitionerDto[]> {
    const rows = await db.user.findMany({
      where: { isPractitioner: true, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, color: true },
    });
    return rows;
  }
}
