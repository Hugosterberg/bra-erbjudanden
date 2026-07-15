import { createSlug } from "@/shared/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/types/database";

import { discountToRankPosition } from "./rank";
import { resolveImportedStore } from "./resolve-store";
import type { AffiliateNetwork, ImportedOfferDraft } from "./types";

type AdminClient = SupabaseClient<Database>;

async function findExistingOffer(
  supabase: AdminClient,
  network: AffiliateNetwork,
  externalId: string,
) {
  const { data } = await supabase
    .from("offers")
    .select("id, slug")
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
) {
  const rankPosition = discountToRankPosition(draft.discountType, draft.discountValue);

  return {
    title: draft.title,
    slug,
    description: draft.description,
    store_id: storeId,
    category_id: null,
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
    rank_position: rankPosition,
    is_featured: false,
    affiliate_network: draft.network,
    external_id: draft.externalId,
    is_imported: true,
    last_synced_at: now,
    updated_at: now,
  };
}

export async function upsertImportedOffer(
  supabase: AdminClient,
  draft: ImportedOfferDraft,
): Promise<"created" | "updated" | "skipped"> {
  if (!draft.affiliateUrl || draft.discountValue <= 0) {
    return "skipped";
  }

  const storeId = await resolveImportedStore(supabase, draft.network, draft.store);
  const existing = await findExistingOffer(supabase, draft.network, draft.externalId);
  const now = new Date().toISOString();
  const baseSlug = createSlug(draft.title);
  const slug =
    existing?.slug ??
    (await findUniqueOfferSlug(supabase, baseSlug, draft.network, draft.externalId));
  const row = buildOfferRow(draft, storeId, slug, now);

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
) {
  const { data: existingOffers, error } = await supabase
    .from("offers")
    .select("id, external_id")
    .eq("affiliate_network", network)
    .eq("is_imported", true)
    .neq("status", "archived");

  if (error || !existingOffers) {
    throw new Error(error?.message ?? "Could not load imported offers for archival");
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

export async function recalculateImportedRanks(supabase: AdminClient, network: AffiliateNetwork) {
  const { data: offers, error } = await supabase
    .from("offers")
    .select("id, discount_type, discount_value")
    .eq("affiliate_network", network)
    .eq("is_imported", true)
    .eq("status", "published");

  if (error || !offers) {
    throw new Error(error?.message ?? "Could not load offers for rank recalculation");
  }

  const sorted = [...offers].sort((a, b) => {
    const aIsPercentage = a.discount_type === "percentage";
    const bIsPercentage = b.discount_type === "percentage";

    if (aIsPercentage !== bIsPercentage) {
      return aIsPercentage ? -1 : 1;
    }

    return b.discount_value - a.discount_value;
  });

  await Promise.all(
    sorted.map((offer, index) =>
      supabase
        .from("offers")
        .update({
          rank_position: index + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", offer.id),
    ),
  );
}
