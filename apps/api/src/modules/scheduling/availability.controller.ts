import { Body, Controller, Get, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { SetAvailabilitySchema } from "@physio/shared";
import { AvailabilityService } from "./availability.service";

class SetAvailabilityDto extends createZodDto(SetAvailabilitySchema) {}

@ApiTags("scheduling")
@Controller("availability")
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  @Get()
  get(@Query("practitionerId") practitionerId: string) {
    return this.availability.get(practitionerId);
  }

  @Put()
  set(@Body() body: SetAvailabilityDto) {
    return this.availability.set(body);
  }
}
