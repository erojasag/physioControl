import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { AppointmentsController } from "./appointments.controller";
import { AppointmentsService } from "./appointments.service";
import { AvailabilityController } from "./availability.controller";
import { AvailabilityService } from "./availability.service";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";

@Module({
  imports: [NotificationsModule],
  controllers: [
    AppointmentsController,
    AvailabilityController,
    ResourcesController,
  ],
  providers: [AppointmentsService, AvailabilityService, ResourcesService],
})
export class SchedulingModule {}
