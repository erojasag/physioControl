import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import {
  CreateAppointmentSchema,
  ListAppointmentsQuerySchema,
} from "@physio/shared";
import { AppointmentsService } from "./appointments.service";

class CreateAppointmentDto extends createZodDto(CreateAppointmentSchema) {}
class ListAppointmentsQueryDto extends createZodDto(
  ListAppointmentsQuerySchema,
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
    return this.appointments.listByDay(query.date);
  }
}
