import { z } from "zod";

// Times are ISO 8601 UTC. The practitioner is always the authenticated user in
// this slice, so it is not part of the payload (tenantId never is either).
export const CreateAppointmentSchema = z
  .object({
    patientId: z.string().min(1),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
    serviceId: z.string().optional(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const ListAppointmentsQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD"),
});
export type ListAppointmentsQuery = z.infer<typeof ListAppointmentsQuerySchema>;

export const AppointmentStatusEnum = z.enum([
  "BOOKED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  practitionerId: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: AppointmentStatusEnum,
});
export type AppointmentDto = z.infer<typeof AppointmentSchema>;
