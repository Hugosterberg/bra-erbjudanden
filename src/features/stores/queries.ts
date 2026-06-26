import { getSupabasePublicClient } from "@/shared/lib/supabase/public";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import type { Store } from "./types";

export async function findActiveStores(): Promise<Store[]> {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("status", "active")
    .order("name", { ascending: true });

  return (data ?? []) as Store[];
}

export async function findActiveStoreBySlug(slug: string): Promise<Store | null> {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  return (data as Store | null) ?? null;
}

export async function findAdminStores(): Promise<Store[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("stores")
    .select("*")
    .order("name", { ascending: true });

  return (data ?? []) as Store[];
}

export async function findAdminStoreById(id: string): Promise<Store | null> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase.from("stores").select("*").eq("id", id).single();

  return (data as Store | null) ?? null;
}
