import { z } from "zod";

import { createSlug } from "@/shared/lib/slug";
import type { Json } from "@/shared/types/database";

export const productSchema = z.object({
  name: z.string().trim().min(2, "Produktnamn krävs"),
  slug: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  category_id: z.string().uuid().optional().or(z.literal("")),
  description: z.string().trim().optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  product_url: z.string().trim().url().optional().or(z.literal("")),
  current_price: z.coerce.number().positive().optional().or(z.literal("")),
  specifications: z.string().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export type ProductInput = z.infer<typeof productSchema>;

export function normalizeProductInput(input: ProductInput) {
  let specifications: Record<string, string> = {};
  if (input.specifications?.trim()) {
    const parsed = JSON.parse(input.specifications) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      specifications = Object.fromEntries(
        Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      );
    }
  }

  return {
    name: input.name,
    slug: input.slug ? createSlug(input.slug) : createSlug(input.name),
    brand: input.brand?.trim() || null,
    category_id: input.category_id || null,
    description: input.description?.trim() || null,
    image_url: input.image_url?.trim() || null,
    product_url: input.product_url?.trim() || null,
    current_price:
      input.current_price === "" || input.current_price === undefined
        ? null
        : Number(input.current_price),
    specifications: specifications as Json,
    status: input.status,
  };
}
