"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
import { resolveUploadedImage } from "@/shared/lib/image-upload";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { normalizeOfferInput, offerSchema } from "./schemas";

export type OfferActionState = {
  ok: boolean;
  message: string;
};

export type OfferImageUploadState = {
  ok: boolean;
  url?: string;
  message?: string;
};

const IMAGE_BUCKET = "offer-images";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = ["png", "jpg", "webp", "svg"];

export async function uploadOfferImageAction(
  formData: FormData,
): Promise<OfferImageUploadState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return { ok: false, message: "Lagringen är inte konfigurerad." };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Välj en bildfil att ladda upp." };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Bilden är för stor (max 4 MB)." };
  }

  const resolved = resolveUploadedImage(file, ALLOWED_IMAGE_EXTENSIONS);

  if (!resolved.ok) {
    return { ok: false, message: resolved.message };
  }

  const path = `${randomUUID()}.${resolved.extension}`;
  const { error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .upload(path, file, { contentType: resolved.mime, upsert: false });

  if (error) {
    return { ok: false, message: error.message };
  }

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);

  return { ok: true, url: data.publicUrl };
}

function offerFormDataToInput(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    description: String(formData.get("description") ?? ""),
    store_id: String(formData.get("store_id") ?? ""),
    category_id: String(formData.get("category_id") ?? ""),
    redemption_type: String(formData.get("redemption_type") ?? "direct_link"),
    discount_type: String(formData.get("discount_type") ?? "percentage"),
    discount_value: String(formData.get("discount_value") ?? "0"),
    discount_code: String(formData.get("discount_code") ?? ""),
    affiliate_url: String(formData.get("affiliate_url") ?? ""),
    terms: String(formData.get("terms") ?? ""),
    image_url: String(formData.get("image_url") ?? ""),
    starts_at: String(formData.get("starts_at") ?? ""),
    ends_at: String(formData.get("ends_at") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    rank_position: String(formData.get("rank_position") ?? "100"),
    is_featured: formData.get("is_featured") === "on",
  };
}

function revalidateOfferSurfaces() {
  revalidatePath("/");
  revalidatePath("/erbjudanden");
  revalidatePath("/butiker");
  revalidatePath("/kategorier");
  revalidatePath("/admin");
  revalidatePath("/admin/erbjudanden");
}

export async function createOfferAction(formData: FormData): Promise<OfferActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = offerSchema.safeParse(offerFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Erbjudandet kunde inte sparas. Kontrollera fälten." };
  }

  const { error } = await supabase.from("offers").insert(normalizeOfferInput(parsed.data));

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateOfferSurfaces();

  return { ok: true, message: "Erbjudandet sparades." };
}

export async function updateOfferAction(
  id: string,
  formData: FormData,
): Promise<OfferActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = offerSchema.safeParse(offerFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Erbjudandet kunde inte uppdateras. Kontrollera fälten." };
  }

  const { error } = await supabase
    .from("offers")
    .update(normalizeOfferInput(parsed.data))
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidateOfferSurfaces();

  return { ok: true, message: "Erbjudandet uppdaterades." };
}

export async function publishOfferAction(id: string) {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    await supabase.from("offers").update({ status: "published" }).eq("id", id);
  }

  revalidateOfferSurfaces();
}

export async function archiveOfferAction(id: string) {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();

  if (supabase) {
    await supabase.from("offers").update({ status: "archived" }).eq("id", id);
  }

  revalidateOfferSurfaces();
}
