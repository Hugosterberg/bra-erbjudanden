import { z } from "zod";

import { createSlug } from "@/shared/lib/slug";

export const offerSchema = z
  .object({
    title: z.string().trim().min(3, "Titel krävs"),
    slug: z.string().trim().optional(),
    description: z.string().trim().min(10, "Beskrivningen behöver vara tydligare"),
    store_id: z.string().uuid("Välj butik"),
    category_id: z.string().uuid("Välj kategori").optional().or(z.literal("")),
    redemption_type: z.enum(["discount_code", "direct_link"]),
    discount_type: z.enum(["percentage", "fixed_amount"]),
    discount_value: z.coerce.number().positive("Rabatten måste vara större än 0"),
    discount_code: z.string().trim().optional(),
    affiliate_url: z.string().trim().url("Ange en giltig affiliatelänk"),
    terms: z.string().trim().max(160, "Villkoret är för långt").optional(),
    starts_at: z.string().trim().optional(),
    ends_at: z.string().trim().optional(),
    status: z.enum(["draft", "published", "archived"]),
    rank_position: z.coerce.number().int().min(0),
    is_featured: z.coerce.boolean().default(false),
  })
  .refine(
    (value) =>
      !value.starts_at ||
      !value.ends_at ||
      new Date(value.ends_at).getTime() > new Date(value.starts_at).getTime(),
    {
      message: "Slutdatum måste vara efter startdatum",
      path: ["ends_at"],
    },
  )
  .refine(
    (value) => value.redemption_type === "direct_link" || Boolean(value.discount_code?.trim()),
    {
      message: "Rabattkod krävs när erbjudandetypen är rabattkod",
      path: ["discount_code"],
    },
  );

export type OfferInput = z.infer<typeof offerSchema>;

export function normalizeOfferInput(input: OfferInput) {
  return {
    title: input.title,
    slug: input.slug ? createSlug(input.slug) : createSlug(input.title),
    description: input.description,
    store_id: input.store_id,
    category_id: input.category_id || null,
    redemption_type: input.redemption_type,
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    discount_code: input.redemption_type === "discount_code" ? input.discount_code || null : null,
    affiliate_url: input.affiliate_url,
    terms: input.terms?.trim() || null,
    starts_at: input.starts_at ? new Date(input.starts_at).toISOString() : null,
    ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : null,
    status: input.status,
    rank_position: input.rank_position,
    is_featured: input.is_featured,
  };
}
