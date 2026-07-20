import { Module } from "@nestjs/common";
import { IdentityController } from "./identity.controller";
import { PractitionersController } from "./practitioners.controller";
import { PractitionersService } from "./practitioners.service";

@Module({
  controllers: [IdentityController, PractitionersController],
  providers: [PractitionersService],
})
export class IdentityModule {}
