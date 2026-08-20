"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
import { resolveUploadedImage } from "@/shared/lib/image-upload";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { normalizeStoreInput, storeSchema } from "./schemas";

export type StoreActionState = {
  ok: boolean;
  message: string;
};

export type StoreLogoUploadState = {
  ok: boolean;
  url?: string;
  message?: string;
};

const LOGO_BUCKET = "store-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_EXTENSIONS = ["png", "jpg", "webp", "svg", "ico"];

export async function uploadStoreLogoAction(
  formData: FormData,
): Promise<StoreLogoUploadState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ok: false, message: "Lagringen är inte konfigurerad." };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Välj en bildfil att ladda upp." };
  }

  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, message: "Bilden är för stor (max 2 MB)." };
  }

  const resolved = resolveUploadedImage(file, ALLOWED_LOGO_EXTENSIONS);

  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }

  const path = `${randomUUID()}.${resolved.extension}`;
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: resolved.mime, upsert: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);

  return { ok: true, url: data.publicUrl };
}

function storeFormDataToInput(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    seo_intro: String(formData.get("seo_intro") ?? ""),
    saving_tips: String(formData.get("saving_tips") ?? ""),
    website_url: String(formData.get("website_url") ?? ""),
    affiliate_url: String(formData.get("affiliate_url") ?? ""),
    logo_url: String(formData.get("logo_url") ?? ""),
    is_featured: formData.get("is_featured") === "on",
    status: String(formData.get("status") ?? "active"),
  };
}

export async function createStoreAction(formData: FormData): Promise<StoreActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
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
  const supabase = getSupabaseAdminClient();
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
