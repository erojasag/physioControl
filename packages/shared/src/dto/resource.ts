import { z } from "zod";

export const CreateResourceSchema = z.object({
  name: z.string().min(1).max(120),
});
export type CreateResourceInput = z.infer<typeof CreateResourceSchema>;

export const ResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type ResourceDto = z.infer<typeof ResourceSchema>;
