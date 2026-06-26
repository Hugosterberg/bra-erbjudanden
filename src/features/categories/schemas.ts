import { z } from "zod";

import { createSlug } from "@/shared/lib/slug";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Kategorinamn krävs"),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  status: z.enum(["active", "inactive", "archived"]).default("active"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export function normalizeCategoryInput(input: CategoryInput) {
  return {
    name: input.name,
    slug: input.slug ? createSlug(input.slug) : createSlug(input.name),
    description: input.description || null,
    status: input.status,
  };
}
