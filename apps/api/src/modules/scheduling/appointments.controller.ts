import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import {
  CreateAppointmentSchema,
  ListAppointmentsQuerySchema,
  UpdateAppointmentStatusSchema,
} from "@physio/shared";
import { AppointmentsService } from "./appointments.service";

class CreateAppointmentDto extends createZodDto(CreateAppointmentSchema) {}
class ListAppointmentsQueryDto extends createZodDto(
  ListAppointmentsQuerySchema,
) {}
class UpdateAppointmentStatusDto extends createZodDto(
  UpdateAppointmentStatusSchema,
) {}

@ApiTags("scheduling")
@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Post()
  create(@Body() body: CreateAppointmentDto) {
    return this.appointments.create(body);
  }

  @Get()
  list(@Query() query: ListAppointmentsQueryDto) {
    return this.appointments.list(query);
  }

  @Patch(":id/status")
  updateStatus(
    @Param("id") id: string,
    @Body() body: UpdateAppointmentStatusDto,
  ) {
    return this.appointments.updateStatus(id, body);
  }
}
