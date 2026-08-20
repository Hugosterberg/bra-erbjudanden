"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/features/admin/auth";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { articleSchema, normalizeArticleInput } from "./schemas";
import { findAdminArticleById } from "./queries";

export type ArticleActionState = {
  ok: boolean;
  message: string;
};

function emptyIfNone(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return text === "none" ? "" : text;
}

function articleFormDataToInput(formData: FormData) {
  return {
    article_type: String(formData.get("article_type") ?? "guide"),
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    excerpt: String(formData.get("excerpt") ?? ""),
    body: String(formData.get("body") ?? ""),
    category_id: emptyIfNone(formData.get("category_id")),
    store_id: emptyIfNone(formData.get("store_id")),
    product_id: emptyIfNone(formData.get("product_id")),
    author_name: String(formData.get("author_name") ?? "braerbjudanden.se"),
    methodology: String(formData.get("methodology") ?? "editorial_evaluation"),
    featured_image_url: String(formData.get("featured_image_url") ?? ""),
    editorial_score: String(formData.get("editorial_score") ?? ""),
    verdict: String(formData.get("verdict") ?? ""),
    pros: String(formData.get("pros") ?? ""),
    cons: String(formData.get("cons") ?? ""),
    best_for: String(formData.get("best_for") ?? ""),
    not_best_for: String(formData.get("not_best_for") ?? ""),
    compared_products: String(formData.get("compared_products") ?? ""),
    is_sponsored: formData.get("is_sponsored") === "on",
    status: String(formData.get("status") ?? "draft"),
  };
}

function revalidateEditorial() {
  revalidatePath("/");
  revalidatePath("/bast-i-test");
  revalidatePath("/recensioner");
  revalidatePath("/guider");
  revalidatePath("/admin/artiklar");
}

export async function createArticleAction(formData: FormData): Promise<ArticleActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = articleSchema.safeParse(articleFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return {
      ok: false,
      message: parsed.success
        ? "Artikeln kunde inte sparas."
        : parsed.error.issues[0]?.message ?? "Kontrollera fälten.",
    };
  }

  try {
    const payload = normalizeArticleInput(parsed.data);
    const { error } = await supabase.from("articles").insert(payload);
    if (error) {
      return { ok: false, message: error.message };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Jämförelsedata är ogiltig JSON.",
    };
  }

  revalidateEditorial();
  return { ok: true, message: "Artikeln sparades." };
}

export async function updateArticleAction(
  id: string,
  formData: FormData,
): Promise<ArticleActionState> {
  await requireAdmin();
  const supabase = getSupabaseAdminClient();
  const parsed = articleSchema.safeParse(articleFormDataToInput(formData));

  if (!supabase || !parsed.success) {
    return { ok: false, message: "Artikeln kunde inte uppdateras." };
  }

  try {
    const existing = await findAdminArticleById(id);
    const payload = normalizeArticleInput(parsed.data, {
      existingPublishedAt: existing?.published_at,
    });
    const { error } = await supabase.from("articles").update(payload).eq("id", id);
    if (error) {
      return { ok: false, message: error.message };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Jämförelsedata är ogiltig JSON.",
    };
  }

  revalidateEditorial();
  return { ok: true, message: "Artikeln uppdaterades." };
}
