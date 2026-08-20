import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import { getSupabasePublicClient } from "@/shared/lib/supabase/public";

import type { Product, ProductWithCategory } from "./types";

const productSelect = `
  *,
  category:categories(id, name, slug)
`;

export async function findActiveProducts(options: { categoryId?: string; limit?: number } = {}) {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return [] as ProductWithCategory[];
  }

  let query = supabase
    .from("products")
    .select(productSelect)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (options.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }
  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;
  return (data ?? []) as ProductWithCategory[];
}

export async function findActiveProductBySlug(slug: string) {
  const supabase = getSupabasePublicClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("status", "active")
    .maybeSingle();

  return (data as ProductWithCategory | null) ?? null;
}

export async function findAdminProducts() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [] as Product[];
  }

  const { data } = await supabase.from("products").select("*").order("name", { ascending: true });
  return (data ?? []) as Product[];
}

export async function findAdminProductById(id: string) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
  return (data as Product | null) ?? null;
}
