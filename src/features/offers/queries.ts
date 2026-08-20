import { cache } from "react";

import { findActiveCategoryBySlug } from "@/features/categories/queries";
import { findActiveStoreBySlug } from "@/features/stores/queries";
import type { AffiliateNetwork } from "@/features/affiliate-import/types";
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

export const findPublishedOfferBySlug = cache(async (slug: string) => {
  const supabase = getSupabasePublicClient();

  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("offers")
    .select(offerRelationsSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  return (data as OfferWithRelations | null) ?? null;
});

export type ActiveOfferFilters = {
  limit?: number;
  storeSlug?: string;
  categorySlug?: string;
  storeId?: string;
  categoryId?: string;
  redemptionType?: "discount_code" | "direct_link";
};

/**
 * React's cache() keys on argument identity, so the filters are collapsed into
 * a stable string. Without this, generateMetadata and the page body would each
 * run the same offer query.
 */
export function findActiveOffers(options: ActiveOfferFilters = {}) {
  const key = JSON.stringify(
    Object.fromEntries(
      Object.entries(options)
        .filter(([, value]) => value !== undefined)
        .sort(([a], [b]) => a.localeCompare(b)),
    ),
  );

  return findActiveOffersByKey(key);
}

const findActiveOffersByKey = cache(async (key: string) => {
  const options = JSON.parse(key) as ActiveOfferFilters;
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

  const storeId = store?.id ?? options.storeId;
  if (storeId) {
    query = query.eq("store_id", storeId);
  }

  const categoryId = category?.id ?? options.categoryId;
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (options.redemptionType) {
    query = query.eq("redemption_type", options.redemptionType);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data } = await query;

  return mapOfferRelations(data);
});

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

export async function findAdminOffers(options: {
  network?: AffiliateNetwork;
  status?: "published" | "draft" | "archived";
  imported?: boolean;
} = {}) {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("offers")
    .select(offerRelationsSelect)
    .order("rank_position", { ascending: true })
    .order("updated_at", { ascending: false });

  if (options.network) {
    query = query.eq("affiliate_network", options.network);
  }

  if (options.status) {
    query = query.eq("status", options.status);
  }

  if (options.imported === true) {
    query = query.eq("is_imported", true);
  } else if (options.imported === false) {
    query = query.eq("is_imported", false);
  }

  const { data: offers } = await query;

  const { data: clickTotals } = await supabase.rpc("count_offer_clicks_by_type");

  const websiteCounts = new Map<string, number>();
  const codeCounts = new Map<string, number>();

  for (const row of clickTotals ?? []) {
    const target = row.click_type === "discount_code" ? codeCounts : websiteCounts;
    target.set(row.offer_id, Number(row.click_count));
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
