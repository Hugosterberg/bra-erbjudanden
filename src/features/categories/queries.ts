import { getSupabasePublicClient } from "@/shared/lib/supabase/public";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import type { Category } from "./types";

export async function findActiveCategories(): Promise<Category[]> {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  return (data ?? []) as Category[];
}

export async function findActiveCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  return (data as Category | null) ?? null;
}

export async function findAdminCategories(): Promise<Category[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  return (data ?? []) as Category[];
}

export async function findAdminCategoryById(id: string): Promise<Category | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("categories").select("*").eq("id", id).single();

  return (data as Category | null) ?? null;
}
