import { z } from "zod";

import { createSlug } from "@/shared/lib/slug";

export const storeSchema = z.object({
  name: z.string().trim().min(2, "Butiksnamn krävs"),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  seo_intro: z.string().trim().optional(),
  saving_tips: z.string().trim().optional(),
  website_url: z.string().trim().url("Ange en giltig URL").optional().or(z.literal("")),
  affiliate_url: z.string().trim().url("Ange en giltig URL").optional().or(z.literal("")),
  logo_url: z.string().trim().url("Ange en giltig URL").optional().or(z.literal("")),
  is_featured: z.coerce.boolean().default(false),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export type StoreInput = z.infer<typeof storeSchema>;

export function normalizeStoreInput(input: StoreInput) {
  return {
    name: input.name,
    slug: input.slug ? createSlug(input.slug) : createSlug(input.name),
    description: input.description || null,
    seo_intro: input.seo_intro || null,
    saving_tips: input.saving_tips || null,
    website_url: input.website_url || null,
    affiliate_url: input.affiliate_url || null,
    logo_url: input.logo_url || null,
    is_featured: input.is_featured,
    status: input.status,
  };
}
