import { createSlug } from "@/shared/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/types/database";

import { MANUAL_RANK_RESERVE } from "./constants";
import { compareImportedOffers } from "./rank";
import { resolveImportedStore } from "./resolve-store";
import type { AffiliateNetwork, ImportedOfferDraft, ImportedStoreDraft } from "./types";

type AdminClient = SupabaseClient<Database>;

export type StoreCache = Map<string, string>;

function storeCacheKey(network: AffiliateNetwork, externalId: string) {
  return `${network}:${externalId}`;
}

export function createStoreCache() {
  return new Map<string, string>();
}

async function findExistingOffer(
  supabase: AdminClient,
  network: AffiliateNetwork,
  externalId: string,
) {
  const { data } = await supabase
    .from("offers")
    .select("id, slug, is_featured, category_id")
    .eq("affiliate_network", network)
    .eq("external_id", externalId)
    .maybeSingle();

  return data;
}

async function findUniqueOfferSlug(
  supabase: AdminClient,
  baseSlug: string,
  network: AffiliateNetwork,
  externalId: string,
) {
  const preferred = `${baseSlug}-${network}-${externalId}`.slice(0, 80);
  const { data } = await supabase.from("offers").select("id").eq("slug", preferred).maybeSingle();

  if (!data) {
    return preferred;
  }

  const slug = baseSlug;
  let suffix = 2;

  while (true) {
    const candidate = `${slug}-${suffix}`.slice(0, 80);
    const { data: existing } = await supabase
      .from("offers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!existing) {
      return candidate;
    }

    suffix += 1;
  }
}

function buildOfferRow(
  draft: ImportedOfferDraft,
  storeId: string,
  slug: string,
  now: string,
  preserve?: { is_featured: boolean; category_id: string | null },
) {
  return {
    title: draft.title,
    slug,
    description: draft.description,
    store_id: storeId,
    category_id: preserve?.category_id ?? null,
    redemption_type: draft.redemptionType,
    discount_type: draft.discountType,
    discount_value: draft.discountValue,
    discount_code: draft.redemptionType === "discount_code" ? draft.discountCode : null,
    affiliate_url: draft.affiliateUrl,
    terms: draft.terms,
    image_url: draft.imageUrl,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt,
    status: "published" as const,
    is_featured: preserve?.is_featured ?? false,
    affiliate_network: draft.network,
    external_id: draft.externalId,
    is_imported: true,
    last_synced_at: now,
    updated_at: now,
  };
}

async function resolveStoreWithCache(
  supabase: AdminClient,
  network: AffiliateNetwork,
  store: ImportedStoreDraft,
  cache: StoreCache,
) {
  const key = storeCacheKey(network, store.externalId);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const storeId = await resolveImportedStore(supabase, network, store);
  cache.set(key, storeId);
  return storeId;
}

export async function upsertImportedOffer(
  supabase: AdminClient,
  draft: ImportedOfferDraft,
  cache: StoreCache = createStoreCache(),
): Promise<"created" | "updated" | "skipped"> {
  if (!draft.affiliateUrl || draft.discountValue <= 0) {
    return "skipped";
  }

  const storeId = await resolveStoreWithCache(supabase, draft.network, draft.store, cache);
  const existing = await findExistingOffer(supabase, draft.network, draft.externalId);
  const now = new Date().toISOString();
  const baseSlug = createSlug(draft.title);
  const slug =
    existing?.slug ??
    (await findUniqueOfferSlug(supabase, baseSlug, draft.network, draft.externalId));
  const row = buildOfferRow(draft, storeId, slug, now, existing ?? undefined);

  if (existing?.id) {
    const { error } = await supabase.from("offers").update(row).eq("id", existing.id);
    if (error) {
      throw new Error(`Could not update offer "${draft.title}": ${error.message}`);
    }

    return "updated";
  }

  const { error } = await supabase.from("offers").insert({
    ...row,
    imported_at: now,
    created_at: now,
    rank_position: MANUAL_RANK_RESERVE + 1,
  });

  if (error) {
    throw new Error(`Could not create offer "${draft.title}": ${error.message}`);
  }

  return "created";
}

export async function archiveMissingImportedOffers(
  supabase: AdminClient,
  network: AffiliateNetwork,
  activeExternalIds: string[],
  options?: { allowArchive?: boolean },
) {
  if (options?.allowArchive === false) {
    return 0;
  }

  const { data: existingOffers, error } = await supabase
    .from("offers")
    .select("id, external_id")
    .eq("affiliate_network", network)
    .eq("is_imported", true)
    .neq("status", "archived");

  if (error || !existingOffers) {
    throw new Error(error?.message ?? "Kunde inte läsa importerade erbjudanden för arkivering");
  }

  const activeSet = new Set(activeExternalIds);
  const toArchive = existingOffers.filter(
    (offer) => offer.external_id && !activeSet.has(offer.external_id),
  );

  if (toArchive.length === 0) {
    return 0;
  }

  const now = new Date().toISOString();
  const { error: archiveError } = await supabase
    .from("offers")
    .update({ status: "archived", updated_at: now, last_synced_at: now })
    .in(
      "id",
      toArchive.map((offer) => offer.id),
    );

  if (archiveError) {
    throw new Error(archiveError.message);
  }

  return toArchive.length;
}

async function batchUpdateRanks(
  supabase: AdminClient,
  updates: Array<{ id: string; rank_position: number }>,
) {
  const chunkSize = 50;
  const now = new Date().toISOString();

  for (let index = 0; index < updates.length; index += chunkSize) {
    const chunk = updates.slice(index, index + chunkSize);
    await Promise.all(
      chunk.map((item) =>
        supabase
          .from("offers")
          .update({ rank_position: item.rank_position, updated_at: now })
          .eq("id", item.id),
      ),
    );
  }
}

export async function recalculateImportedRanks(supabase: AdminClient, network: AffiliateNetwork) {
  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, discount_type, discount_value")
    .eq("affiliate_network", network)
    .eq("is_imported", true)
    .eq("status", "published");

  if (error || !offers) {
    throw new Error(error?.message ?? "Kunde inte läsa erbjudanden för omrankning");
  }

  const sorted = [...offers].sort(compareImportedOffers);
  const updates = sorted.map((offer, index) => ({
    id: offer.id,
    rank_position: MANUAL_RANK_RESERVE + 1 + index,
  }));

  await batchUpdateRanks(supabase, updates);
}
