import { z } from "zod";

export const subscriberSchema = z.object({
  email: z.string().trim().email("Ange en giltig e-postadress"),
  source: z.string().trim().min(1).default("homepage"),
  company: z.string().trim().optional(),
});

export type SubscriberInput = z.infer<typeof subscriberSchema>;
