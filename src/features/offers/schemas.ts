import { z } from "zod";

import { createSlug } from "@/shared/lib/slug";

const optionalPrice = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().positive().optional(),
);

export const offerSchema = z
  .object({
    title: z.string().trim().min(3, "Titel krävs"),
    slug: z.string().trim().optional(),
    description: z.string().trim().min(10, "Beskrivningen behöver vara tydligare"),
    store_id: z.string().uuid("Välj butik"),
    category_id: z.string().uuid("Välj kategori").optional().or(z.literal("")),
    redemption_type: z.enum(["discount_code", "direct_link"]),
    discount_type: z.enum(["percentage", "fixed_amount", "none"]),
    discount_value: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.coerce.number().positive("Rabatten måste vara större än 0").optional(),
    ),
    is_up_to: z.coerce.boolean().default(false),
    deal_label: z.string().trim().max(40, "Etiketten är för lång").optional(),
    discount_code: z.string().trim().optional(),
    affiliate_url: z.string().trim().url("Ange en giltig affiliatelänk"),
    terms: z.string().trim().max(2000, "Villkoret är för långt").optional(),
    image_url: z
      .string()
      .trim()
      .url("Ange en giltig bild-URL")
      .optional()
      .or(z.literal("")),
    starts_at: z.string().trim().optional(),
    ends_at: z.string().trim().optional(),
    status: z.enum(["draft", "published", "archived"]),
    rank_position: z.coerce.number().int().min(0),
    is_featured: z.coerce.boolean().default(false),
    is_sponsored: z.coerce.boolean().default(false),
    is_exclusive: z.coerce.boolean().default(false),
    mark_verified: z.coerce.boolean().default(false),
    original_price: optionalPrice,
    current_price: optionalPrice,
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
  .refine((value) => value.discount_type === "none" || value.discount_value !== undefined, {
    message: "Ange rabatten, eller välj att erbjudandet saknar rabatt i siffror",
    path: ["discount_value"],
  })
  .refine(
    (value) => value.redemption_type === "direct_link" || Boolean(value.discount_code?.trim()),
    {
      message: "Rabattkod krävs när erbjudandetypen är rabattkod",
      path: ["discount_code"],
    },
  );

export type OfferInput = z.infer<typeof offerSchema>;

export function normalizeOfferInput(input: OfferInput) {
  const hasDiscount = input.discount_type !== "none";

  return {
    title: input.title,
    slug: input.slug ? createSlug(input.slug) : createSlug(input.title),
    description: input.description,
    store_id: input.store_id,
    category_id: input.category_id || null,
    redemption_type: input.redemption_type,
    discount_type: hasDiscount ? (input.discount_type as "percentage" | "fixed_amount") : null,
    discount_value: hasDiscount ? (input.discount_value ?? null) : null,
    is_up_to: hasDiscount ? input.is_up_to : false,
    deal_label: hasDiscount ? null : input.deal_label?.trim() || null,
    discount_code: input.redemption_type === "discount_code" ? input.discount_code || null : null,
    affiliate_url: input.affiliate_url,
    terms: input.terms?.trim() || null,
    image_url: input.image_url?.trim() || null,
    starts_at: input.starts_at ? new Date(input.starts_at).toISOString() : null,
    ends_at: input.ends_at ? new Date(input.ends_at).toISOString() : null,
    status: input.status,
    rank_position: input.rank_position,
    is_featured: input.is_featured,
    is_sponsored: input.is_sponsored,
    is_exclusive: input.is_exclusive,
    original_price:
      input.original_price === undefined ? null : Number(input.original_price),
    current_price:
      input.current_price === undefined ? null : Number(input.current_price),
    ...(input.mark_verified ? { last_verified_at: new Date().toISOString() } : {}),
  };
}
