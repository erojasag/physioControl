import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { CreateResourceSchema } from "@physio/shared";
import { ResourcesService } from "./resources.service";

class CreateResourceDto extends createZodDto(CreateResourceSchema) {}

@ApiTags("scheduling")
@Controller("resources")
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get()
  list() {
    return this.resources.list();
  }

  @Post()
  create(@Body() body: CreateResourceDto) {
    return this.resources.create(body);
  }
}
