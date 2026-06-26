"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { categorySchema, normalizeCategoryInput } from "./schemas";

export type CategoryActionState = {
  ok: boolean;
  message: string;
};

function categoryFormDataToInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "active"),
  };
}

export async function createCategoryAction(formData: FormData): Promise<CategoryActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = categorySchema.safeParse(categoryFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Kategorin kunde inte sparas." };
  }

  const { error } = await supabase.from("categories").insert(normalizeCategoryInput(parsed.data));

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/kategorier");
  revalidatePath("/admin/kategorier");

  return { ok: true, message: "Kategorin sparades." };
}

export async function updateCategoryAction(
  id: string,
  formData: FormData,
): Promise<CategoryActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = categorySchema.safeParse(categoryFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Kategorin kunde inte uppdateras." };
  }

  const { error } = await supabase
    .from("categories")
    .update(normalizeCategoryInput(parsed.data))
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/");
  revalidatePath("/kategorier");
  revalidatePath("/admin/kategorier");

  return { ok: true, message: "Kategorin uppdaterades." };
}
