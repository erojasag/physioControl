import { Module } from "@nestjs/common";
import { NotificationsModule } from "../notifications/notifications.module";
import { BookingController } from "./booking.controller";
import { BookingService } from "./booking.service";

@Module({
  imports: [NotificationsModule],
  controllers: [BookingController],
  providers: [BookingService],
})
export class BookingModule {}
