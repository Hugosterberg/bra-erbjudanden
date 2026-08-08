import { z } from "zod";

export const createSponsorshipSchema = z.object({
  offerId: z.string().uuid("Invalid offer ID"),
  sponsorName: z.string().min(1, "Sponsor name required").max(200),
  sponsorWebsiteUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  pricingModel: z.enum(["cpc", "cpm", "flat_daily"]),
  amount: z.number().positive("Amount must be positive"),
  currency: z.string().default("SEK").max(3),
  startsAt: z.string().datetime("Invalid date"),
  endsAt: z.string().datetime("Invalid date"),
  reservedPosition: z.number().int().min(1).max(20).optional(),
  impressionsGoal: z.number().int().positive().optional(),
  clicksGoal: z.number().int().positive().optional(),
  notes: z.string().max(1000).optional(),
});

export const updateSponsorshipSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  status: z.enum(["active", "paused", "completed"]).optional(),
  reservedPosition: z.number().int().min(1).max(20).optional(),
  notes: z.string().max(1000).optional(),
});

export const updateDisclosureSettingsSchema = z.object({
  disclosureText: z.string().max(2000).optional(),
  privacyPolicyUrl: z.string().url("Invalid URL").optional(),
  affiliatePolicyUrl: z.string().url("Invalid URL").optional(),
  faqUrl: z.string().url("Invalid URL").optional(),
  showDisclosureBadge: z.boolean().optional(),
  showNetworkAttribution: z.boolean().optional(),
});

export type CreateSponsorshipInput = z.infer<typeof createSponsorshipSchema>;
export type UpdateSponsorshipInput = z.infer<typeof updateSponsorshipSchema>;
export type UpdateDisclosureSettingsInput = z.infer<typeof updateDisclosureSettingsSchema>;
