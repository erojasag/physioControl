import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { createZodDto } from "nestjs-zod";
import { CreateBookingSchema } from "@physio/shared";
import { Public } from "../../common/public.decorator";
import { BookingService } from "./booking.service";

class CreateBookingDto extends createZodDto(CreateBookingSchema) {}

// Unauthenticated. The tenant comes from the slug, resolved server-side.
@Public()
@ApiTags("booking")
@Controller("book")
export class BookingController {
  constructor(private readonly booking: BookingService) {}

  @Get(":slug")
  clinic(@Param("slug") slug: string) {
    return this.booking.getClinic(slug);
  }

  @Post(":slug")
  book(@Param("slug") slug: string, @Body() body: CreateBookingDto) {
    return this.booking.book(slug, body);
  }
}
