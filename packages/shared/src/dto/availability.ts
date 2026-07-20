import { z } from "zod";

const MINUTES_IN_DAY = 24 * 60;

export const AvailabilitySlotSchema = z
  .object({
    weekday: z.number().int().min(0).max(6), // 0 = Sunday
    startMinute: z.number().int().min(0).max(MINUTES_IN_DAY),
    endMinute: z.number().int().min(0).max(MINUTES_IN_DAY),
  })
  .refine((s) => s.endMinute > s.startMinute, {
    message: "endMinute must be after startMinute",
    path: ["endMinute"],
  });
export type AvailabilitySlotInput = z.infer<typeof AvailabilitySlotSchema>;

// Replaces the practitioner's whole weekly availability set.
export const SetAvailabilitySchema = z.object({
  practitionerId: z.string().min(1),
  slots: z.array(AvailabilitySlotSchema).max(50),
});
export type SetAvailabilityInput = z.infer<typeof SetAvailabilitySchema>;

export const AvailabilityDtoSchema = z.object({
  id: z.string(),
  practitionerId: z.string(),
  weekday: z.number(),
  startMinute: z.number(),
  endMinute: z.number(),
});
export type AvailabilityDto = z.infer<typeof AvailabilityDtoSchema>;
