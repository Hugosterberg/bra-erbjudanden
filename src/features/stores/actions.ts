"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
import { createSupabaseServerClient } from "@/shared/lib/supabase/server";

import { normalizeStoreInput, storeSchema } from "./schemas";

export type StoreActionState = {
  ok: boolean;
  message: string;
};

function storeFormDataToInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    website_url: String(formData.get("website_url") ?? ""),
    logo_url: String(formData.get("logo_url") ?? ""),
    status: String(formData.get("status") ?? "active"),
  };
}

export async function createStoreAction(formData: FormData): Promise<StoreActionState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const parsed = storeSchema.safeParse(storeFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Butiken kunde inte sparas." };
  }

  const { error } = await supabase.from("stores").insert(normalizeStoreInput(parsed.data));

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/butiker");
  revalidatePath("/admin/butiker");

  return { ok: true, message: "Butiken sparades." };
}

export async function updateStoreAction(
  id: string,
  formData: FormData,
): Promise<StoreActionState> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const parsed = storeSchema.safeParse(storeFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Butiken kunde inte uppdateras." };
  }

  const { error } = await supabase
    .from("stores")
    .update(normalizeStoreInput(parsed.data))
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/butiker");
  revalidatePath("/admin/butiker");

  return { ok: true, message: "Butiken uppdaterades." };
}
