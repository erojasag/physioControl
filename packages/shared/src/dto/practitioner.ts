import { z } from "zod";

export const PractitionerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  color: z.string().nullable(),
});
export type PractitionerDto = z.infer<typeof PractitionerSchema>;
