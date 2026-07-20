import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { CreatePatientSchema } from "@physio/shared";
import { PatientsService } from "./patients.service";

class CreatePatientDto extends createZodDto(CreatePatientSchema) {}

@ApiTags("patients")
@Controller("patients")
export class PatientsController {
  constructor(private readonly patients: PatientsService) {}

  @Post()
  create(@Body() body: CreatePatientDto) {
    return this.patients.create(body);
  }

  @Get()
  list() {
    return this.patients.list();
  }
}
