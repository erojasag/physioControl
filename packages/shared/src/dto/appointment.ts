import { z } from "zod";

// Times are ISO 8601 UTC. tenantId is never in the payload.
export const CreateAppointmentSchema = z
  .object({
    patientId: z.string().min(1),
    practitionerId: z.string().min(1),
    resourceId: z.string().optional(),
    serviceId: z.string().optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime(),
  })
  .refine((v) => new Date(v.endsAt) > new Date(v.startsAt), {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

// Either a single `date` (one day) or a `from`/`to` inclusive range of days,
// optionally filtered to one practitioner.
export const ListAppointmentsQuerySchema = z
  .object({
    date: dateOnly.optional(),
    from: dateOnly.optional(),
    to: dateOnly.optional(),
    practitionerId: z.string().optional(),
  })
  .refine((q) => !!q.date || (!!q.from && !!q.to), {
    message: "provide either date, or both from and to",
  });
export type ListAppointmentsQuery = z.infer<typeof ListAppointmentsQuerySchema>;

export const AppointmentStatusEnum = z.enum([
  "BOOKED",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
]);
export type AppointmentStatus = z.infer<typeof AppointmentStatusEnum>;

// Statuses a user can transition an appointment TO (BOOKED is the initial state).
export const UpdateAppointmentStatusSchema = z.object({
  status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]),
});
export type UpdateAppointmentStatusInput = z.infer<
  typeof UpdateAppointmentStatusSchema
>;

// Allowed status transitions. Terminal states (COMPLETED/CANCELLED/NO_SHOW)
// accept no further changes.
const TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  BOOKED: ["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "NO_SHOW"],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function canTransition(
  from: AppointmentStatus,
  to: AppointmentStatus,
): boolean {
  return TRANSITIONS[from].includes(to);
}

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  patientName: z.string(),
  practitionerId: z.string(),
  resourceId: z.string().nullable(),
  startsAt: z.string(),
  endsAt: z.string(),
  status: AppointmentStatusEnum,
});
export type AppointmentDto = z.infer<typeof AppointmentSchema>;
