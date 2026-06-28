import { findActiveCategoryBySlug } from "@/features/categories/queries";
import { findActiveStoreBySlug } from "@/features/stores/queries";
import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import { getSupabasePublicClient } from "@/shared/lib/supabase/public";

import type { OfferRedirectTarget, OfferWithRelations } from "./types";

const offerRelationsSelect = `
  *,
  store:stores(id, name, slug, logo_url, website_url),
  category:categories(id, name, slug)
`;

function mapOfferRelations(data: unknown[] | null): OfferWithRelations[] {
  return (data ?? []) as OfferWithRelations[];
}

function applyActiveDateWindow<T extends { or: (filters: string) => T }>(query: T) {
  const now = new Date().toISOString();

  return query
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gte.${now}`);
}

export async function findActiveOffers(options: {
  limit?: number;
  storeSlug?: string;
  categorySlug?: string;
  redemptionType?: "discount_code" | "direct_link";
} = {}) {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return [];
  }

  const store = options.storeSlug ? await findActiveStoreBySlug(options.storeSlug) : null;
  const category = options.categorySlug
    ? await findActiveCategoryBySlug(options.categorySlug)
    : null;

  if ((options.storeSlug && !store) || (options.categorySlug && !category)) {
    return [];
  }

  let query = applyActiveDateWindow(
    supabase
      .from("offers")
      .select(offerRelationsSelect)
      .eq("status", "published"),
  )
    .order("is_featured", { ascending: false })
    .order("rank_position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (store) {
    query = query.eq("store_id", store.id);
  }

  if (category) {
    query = query.eq("category_id", category.id);
  }

  if (options.redemptionType) {
    query = query.eq("redemption_type", options.redemptionType);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;

  return mapOfferRelations(data);
}

export async function findActiveOfferBySlug(slug: string) {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return null;
  }

  const { data } = await applyActiveDateWindow(
    supabase
      .from("offers")
      .select(offerRelationsSelect)
      .eq("slug", slug)
      .eq("status", "published"),
  ).single();

  return (data as OfferWithRelations | null) ?? null;
}

export async function findOfferRedirectTarget(id: string): Promise<OfferRedirectTarget | null> {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return null;
  }

  const { data } = await applyActiveDateWindow(
    supabase
      .from("offers")
      .select("id, affiliate_url, store_id, status, starts_at, ends_at")
      .eq("id", id)
      .eq("status", "published"),
  ).single();

  return data;
}

export async function findAdminOffers() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data: offers } = await supabase
    .from("offers")
    .select(offerRelationsSelect)
    .order("rank_position", { ascending: true })
    .order("updated_at", { ascending: false });

  const { data: clickEvents } = await supabase
    .from("click_events")
    .select("offer_id, click_type");

  const websiteCounts = new Map<string, number>();
  const codeCounts = new Map<string, number>();

  for (const event of clickEvents ?? []) {
    const target = event.click_type === "discount_code" ? codeCounts : websiteCounts;
    target.set(event.offer_id, (target.get(event.offer_id) ?? 0) + 1);
  }

  return mapOfferRelations(offers).map((offer) => {
    const websiteClicks = websiteCounts.get(offer.id) ?? 0;
    const codeClicks = codeCounts.get(offer.id) ?? 0;

    return {
      ...offer,
      website_click_count: websiteClicks,
      code_click_count: codeClicks,
      click_count: websiteClicks + codeClicks,
    };
  });
}

export async function findAdminOfferById(id: string) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("offers")
    .select(offerRelationsSelect)
    .eq("id", id)
    .single();

  return (data as OfferWithRelations | null) ?? null;
}
