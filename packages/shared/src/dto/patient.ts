import { z } from "zod";

export const CreatePatientSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().max(40).optional(),
  email: z.string().email().optional(),
  dob: z.string().datetime().optional(), // ISO 8601 UTC
});
export type CreatePatientInput = z.infer<typeof CreatePatientSchema>;

export const PatientSchema = z.object({
  id: z.string(),
  name: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  dob: z.string().nullable(),
  createdAt: z.string(),
});
export type PatientDto = z.infer<typeof PatientSchema>;
