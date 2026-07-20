import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { PractitionersService } from "./practitioners.service";

@ApiTags("identity")
@Controller("practitioners")
export class PractitionersController {
  constructor(private readonly practitioners: PractitionersService) {}

  @Get()
  list() {
    return this.practitioners.list();
  }
}
