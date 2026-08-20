import { z } from "zod";

import { createSlug } from "@/shared/lib/slug";
import type { Json } from "@/shared/types/database";

const comparedProductSchema = z.object({
  product_id: z.string().uuid().optional(),
  name: z.string().trim().min(2),
  brand: z.string().trim().optional(),
  image_url: z.string().trim().url().optional().or(z.literal("")),
  product_url: z.string().trim().url().optional().or(z.literal("")),
  current_price: z.coerce.number().optional().nullable(),
  award: z.enum(["best_overall", "best_value", "premium", "best_for"]).optional(),
  award_label: z.string().trim().optional(),
  editorial_score: z.coerce.number().min(0).max(10),
  verdict: z.string().trim().min(8),
  pros: z.array(z.string().trim().min(2)).default([]),
  cons: z.array(z.string().trim().min(2)).default([]),
  best_for: z.string().trim().optional(),
  not_best_for: z.string().trim().optional(),
});

export const articleSchema = z.object({
  article_type: z.enum(["best_in_test", "review", "guide"]),
  title: z.string().trim().min(6, "Titel krävs"),
  slug: z.string().trim().optional(),
  excerpt: z.string().trim().optional(),
  body: z.string().trim().min(40, "Brödtexten behöver vara tydligare"),
  category_id: z.string().uuid().optional().or(z.literal("")),
  store_id: z.string().uuid().optional().or(z.literal("")),
  product_id: z.string().uuid().optional().or(z.literal("")),
  author_name: z.string().trim().min(2).default("braerbjudanden.se"),
  methodology: z.enum(["tested_by_us", "editorial_evaluation", "compared_from_sources"]),
  featured_image_url: z.string().trim().url().optional().or(z.literal("")),
  editorial_score: z.coerce.number().min(0).max(10).optional().or(z.literal("")),
  verdict: z.string().trim().optional(),
  pros: z.string().optional(),
  cons: z.string().optional(),
  best_for: z.string().trim().optional(),
  not_best_for: z.string().trim().optional(),
  compared_products: z.string().optional(),
  is_sponsored: z.coerce.boolean().default(false),
  status: z.enum(["draft", "published", "archived"]),
});

export type ArticleInput = z.infer<typeof articleSchema>;

function splitLines(value?: string) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function normalizeArticleInput(
  input: ArticleInput,
  options: { existingPublishedAt?: string | null } = {},
) {
  let compared: unknown[] = [];
  if (input.compared_products?.trim()) {
    const parsed = JSON.parse(input.compared_products) as unknown;
    compared = z.array(comparedProductSchema).parse(parsed);
  }

  const score =
    input.editorial_score === "" || input.editorial_score === undefined
      ? null
      : Number(input.editorial_score);

  return {
    article_type: input.article_type,
    title: input.title,
    slug: input.slug ? createSlug(input.slug) : createSlug(input.title),
    excerpt: input.excerpt?.trim() || null,
    body: input.body,
    category_id: input.category_id || null,
    store_id: input.store_id || null,
    product_id: input.product_id || null,
    author_name: input.author_name,
    methodology: input.methodology,
    featured_image_url: input.featured_image_url?.trim() || null,
    editorial_score: Number.isFinite(score) ? score : null,
    verdict: input.verdict?.trim() || null,
    pros: splitLines(input.pros),
    cons: splitLines(input.cons),
    best_for: input.best_for?.trim() || null,
    not_best_for: input.not_best_for?.trim() || null,
    compared_products: compared as Json,
    is_sponsored: input.is_sponsored,
    status: input.status,
    published_at:
      input.status === "published"
        ? options.existingPublishedAt ?? new Date().toISOString()
        : null,
  };
}
