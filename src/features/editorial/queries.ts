import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import { getSupabasePublicClient } from "@/shared/lib/supabase/public";

import type { ArticleType, ArticleWithRelations } from "./types";
import { parseComparedProducts } from "./types";

const articleRelationsSelect = `
  *,
  category:categories(id, name, slug),
  store:stores(id, name, slug),
  product:products(id, name, slug, brand, image_url)
`;

function mapArticle(data: unknown): ArticleWithRelations {
  const article = data as ArticleWithRelations;
  return {
    ...article,
    compared: parseComparedProducts(article.compared_products),
  };
}

function mapArticles(data: unknown[] | null): ArticleWithRelations[] {
  return (data ?? []).map(mapArticle);
}

export async function findPublishedArticles(options: {
  type?: ArticleType;
  categoryId?: string;
  storeId?: string;
  limit?: number;
} = {}) {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("articles")
    .select(articleRelationsSelect)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (options.type) {
    query = query.eq("article_type", options.type);
  }
  if (options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }
  if (options.storeId) {
    query = query.eq("store_id", options.storeId);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return mapArticles(data);
}

export async function findPublishedArticleBySlug(slug: string, type?: ArticleType) {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return null;
  }

  let query = supabase
    .from("articles")
    .select(articleRelationsSelect)
    .eq("slug", slug)
    .eq("status", "published");

  if (type) {
    query = query.eq("article_type", type);
  }

  const { data } = await query.maybeSingle();
  return data ? mapArticle(data) : null;
}

export async function findAdminArticles() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("articles")
    .select(articleRelationsSelect)
    .order("updated_at", { ascending: false });

  return mapArticles(data);
}

export async function findAdminArticleById(id: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("articles")
    .select(articleRelationsSelect)
    .eq("id", id)
    .maybeSingle();

  return data ? mapArticle(data) : null;
}
