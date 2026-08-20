import { z } from "zod";

export const subscriberSchema = z.object({
  email: z.string().trim().email("Ange en giltig e-postadress"),
  source: z.string().trim().min(1).max(80).default("homepage"),
  company: z.string().trim().optional(),
  interests: z.array(z.string()).optional(),
});

export type SubscriberInput = z.infer<typeof subscriberSchema>;
