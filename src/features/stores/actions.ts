"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
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
const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
};

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

  const extension = ALLOWED_LOGO_TYPES[file.type];

  if (!extension) {
    return { ok: false, message: "Filformatet stöds inte. Använd PNG, JPG, WEBP eller SVG." };
  }

  const path = `${randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

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
    website_url: String(formData.get("website_url") ?? ""),
    logo_url: String(formData.get("logo_url") ?? ""),
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
