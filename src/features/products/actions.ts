"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { normalizeProductInput, productSchema } from "./schemas";

export type ProductActionState = {
  ok: boolean;
  message: string;
};

function productFormDataToInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    brand: String(formData.get("brand") ?? ""),
    category_id: String(formData.get("category_id") ?? "") === "none"
      ? ""
      : String(formData.get("category_id") ?? ""),
    description: String(formData.get("description") ?? ""),
    image_url: String(formData.get("image_url") ?? ""),
    product_url: String(formData.get("product_url") ?? ""),
    current_price: String(formData.get("current_price") ?? ""),
    specifications: String(formData.get("specifications") ?? ""),
    status: String(formData.get("status") ?? "active"),
  };
}

export async function createProductAction(formData: FormData): Promise<ProductActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = productSchema.safeParse(productFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Produkten kunde inte sparas." };
  }

  try {
    const { error } = await supabase.from("products").insert(normalizeProductInput(parsed.data));
    if (error) {
      return { ok: false, message: error.message };
    }
  } catch {
    return { ok: false, message: "Specifikationer måste vara giltig JSON." };
  }

  revalidatePath("/admin/produkter");
  return { ok: true, message: "Produkten sparades." };
}

export async function updateProductAction(
  id: string,
  formData: FormData,
): Promise<ProductActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = productSchema.safeParse(productFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Produkten kunde inte uppdateras." };
  }

  try {
    const { error } = await supabase
      .from("products")
      .update(normalizeProductInput(parsed.data))
      .eq("id", id);
    if (error) {
      return { ok: false, message: error.message };
    }
  } catch {
    return { ok: false, message: "Specifikationer måste vara giltig JSON." };
  }

  revalidatePath("/admin/produkter");
  revalidatePath("/recensioner");
  return { ok: true, message: "Produkten uppdaterades." };
}
