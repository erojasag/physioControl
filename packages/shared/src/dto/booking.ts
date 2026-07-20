import { z } from "zod";

// Public (unauthenticated) self-booking. tenantId is resolved server-side from
// the clinic slug in the URL — never sent by the client.

export const PublicClinicSchema = z.object({
  name: z.string(),
  slug: z.string(),
  timezone: z.string(),
  practitioners: z.array(z.object({ id: z.string(), name: z.string() })),
});
export type PublicClinicDto = z.infer<typeof PublicClinicSchema>;

export const CreateBookingSchema = z
  .object({
    practitionerId: z.string().min(1),
    patientName: z.string().min(1).max(200),
    patientPhone: z.string().max(40).optional(),
    patientEmail: z.string().email().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  })
  .refine((v) => !!v.patientPhone || !!v.patientEmail, {
    message: "provide a phone or email",
    path: ["patientPhone"],
  });
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const BookingResultSchema = z.object({
  appointmentId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
});
export type BookingResultDto = z.infer<typeof BookingResultSchema>;
