import type { SupabaseClient } from "@supabase/supabase-js";

import { isTrackingUrl } from "@/features/tracking/click-reference";
import { currentMarket } from "@/shared/config/market";
import { fetchAllPages } from "@/shared/lib/supabase/fetch-all-pages";
import { createSlug } from "@/shared/lib/slug";
import type { Database } from "@/shared/types/database";

import { IMPORT_BATCH_SIZE, MANUAL_RANK_RESERVE } from "./constants";
import { resolveImportedStore } from "./resolve-store";
import { suggestCategorySlug } from "./suggest-category";
import type { AffiliateNetwork, ImportedOfferDraft } from "./types";

type AdminClient = SupabaseClient<Database>;
type OfferInsert = Database["public"]["Tables"]["offers"]["Insert"];
type OfferUpdate = Database["public"]["Tables"]["offers"]["Update"];
type OfferStatus = Database["public"]["Enums"]["offer_status"];

const EXISTING_OFFER_COLUMNS =
  "id, external_id, slug, title, description, store_id, category_id, redemption_type, discount_type, discount_value, is_up_to, deal_label, discount_code, affiliate_url, terms, image_url, starts_at, ends_at, status, is_import_locked, import_archived_status";

type ExistingOffer = {
  id: string;
  external_id: string | null;
  slug: string;
  title: string;
  description: string;
  store_id: string;
  category_id: string | null;
  redemption_type: Database["public"]["Enums"]["redemption_type"];
  discount_type: Database["public"]["Enums"]["discount_type"] | null;
  discount_value: number | null;
  is_up_to: boolean;
  deal_label: string | null;
  discount_code: string | null;
  affiliate_url: string;
  terms: string | null;
  image_url: string | null;
  starts_at: string | null;
  ends_at: string | null;
  status: OfferStatus;
  is_import_locked: boolean;
  import_archived_status: OfferStatus | null;
};

export type OfferSyncResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function sameInstant(a: string | null, b: string | null | undefined) {
  if (!a || !b) {
    return !a && !b;
  }
  return new Date(a).getTime() === new Date(b).getTime();
}

/** Only content changes count, so that unchanged rows keep their updated_at. */
function buildContent(draft: ImportedOfferDraft, storeId: string) {
  const discountCode =
    draft.redemptionType === "discount_code" ? (draft.discountCode ?? null) : null;

  return {
    title: draft.title,
    description: draft.description,
    store_id: storeId,
    // The database rejects a code redemption without a code.
    redemption_type: discountCode ? ("discount_code" as const) : ("direct_link" as const),
    discount_type: draft.discountType,
    discount_value: draft.discountValue,
    is_up_to: draft.isUpTo,
    deal_label: draft.dealLabel,
    discount_code: discountCode,
    affiliate_url: draft.affiliateUrl,
    terms: draft.terms ?? null,
    image_url: draft.imageUrl ?? null,
    starts_at: draft.startsAt ?? null,
    ends_at: draft.endsAt ?? null,
  };
}

function hasContentChanged(existing: ExistingOffer, next: ReturnType<typeof buildContent>) {
  return (
    existing.title !== next.title ||
    existing.description !== next.description ||
    existing.store_id !== next.store_id ||
    existing.redemption_type !== next.redemption_type ||
    existing.discount_type !== next.discount_type ||
    (existing.discount_value === null ? null : Number(existing.discount_value)) !==
      next.discount_value ||
    existing.is_up_to !== next.is_up_to ||
    existing.deal_label !== next.deal_label ||
    existing.discount_code !== next.discount_code ||
    existing.affiliate_url !== next.affiliate_url ||
    existing.terms !== next.terms ||
    existing.image_url !== next.image_url ||
    !sameInstant(existing.starts_at, next.starts_at) ||
    !sameInstant(existing.ends_at, next.ends_at)
  );
}

function createOfferSlug(draft: ImportedOfferDraft) {
  const suffix = createSlug(`${draft.network}-${draft.externalId}`);
  return `${createSlug(draft.title).slice(0, 80 - suffix.length - 1)}-${suffix}`.replace(/^-/, "");
}

async function insertOffers(supabase: AdminClient, rows: OfferInsert[], result: OfferSyncResult) {
  for (const rows_ of chunk(rows, IMPORT_BATCH_SIZE)) {
    const { error } = await supabase.from("offers").insert(rows_);
    if (!error) {
      result.created += rows_.length;
      continue;
    }

    // One bad row must not cost the whole batch.
    for (const row of rows_) {
      const { error: rowError } = await supabase.from("offers").insert(row);
      if (rowError) {
        result.errors.push(`Kunde inte skapa "${row.title}": ${rowError.message}`);
      } else {
        result.created += 1;
      }
    }
  }
}

async function updateOffers(
  supabase: AdminClient,
  updates: Array<{ id: string; title: string; patch: OfferUpdate }>,
  result: OfferSyncResult,
) {
  for (const batch of chunk(updates, 25)) {
    await Promise.all(
      batch.map(async (update) => {
        const { error } = await supabase.from("offers").update(update.patch).eq("id", update.id);
        if (error) {
          result.errors.push(`Kunde inte uppdatera "${update.title}": ${error.message}`);
        } else {
          result.updated += 1;
        }
      }),
    );
  }
}

async function findCategoryIdsBySlug(supabase: AdminClient) {
  const { data } = await supabase.from("categories").select("id, slug").eq("status", "active");
  return new Map((data ?? []).map((row) => [row.slug, row.id]));
}

export async function syncNetworkOffers(
  supabase: AdminClient,
  network: AffiliateNetwork,
  drafts: ImportedOfferDraft[],
  options: { autoPublish: boolean },
): Promise<OfferSyncResult> {
  const result: OfferSyncResult = { created: 0, updated: 0, skipped: 0, errors: [] };
  const now = new Date().toISOString();

  const existingRows = await fetchAllPages<ExistingOffer>((from, to) =>
    supabase
      .from("offers")
      .select(EXISTING_OFFER_COLUMNS)
      .eq("affiliate_network", network)
      .eq("is_imported", true)
      .range(from, to),
  );
  const existingByExternalId = new Map(existingRows.map((row) => [row.external_id, row]));
  const categoryIds = await findCategoryIdsBySlug(supabase);

  const storeIds = new Map<string, string>();
  const inserts: OfferInsert[] = [];
  const updates: Array<{ id: string; title: string; patch: OfferUpdate }> = [];
  const seenIds: string[] = [];
  let untracked = 0;

  for (const draft of drafts) {
    // A link that does not carry the network's tracking earns nothing, and a
    // silently unpaid offer is worse than a missing one.
    if (!isTrackingUrl(network, draft.affiliateUrl)) {
      untracked += 1;
      result.skipped += 1;
      continue;
    }

    let storeId = storeIds.get(draft.store.externalId);
    if (!storeId) {
      try {
        storeId = await resolveImportedStore(supabase, network, draft.store);
        storeIds.set(draft.store.externalId, storeId);
      } catch (error) {
        result.skipped += 1;
        result.errors.push(error instanceof Error ? error.message : "Butiken kunde inte skapas");
        continue;
      }
    }

    const content = buildContent(draft, storeId);
    const suggestedCategory =
      categoryIds.get(suggestCategorySlug(draft.title, draft.description, draft.store.name) ?? "") ??
      null;
    const existing = existingByExternalId.get(draft.externalId);

    if (!existing) {
      inserts.push({
        ...content,
        slug: createOfferSlug(draft),
        category_id: suggestedCategory,
        status: options.autoPublish ? "published" : "draft",
        is_featured: false,
        affiliate_network: network,
        external_id: draft.externalId,
        is_imported: true,
        imported_at: now,
        last_synced_at: now,
        rank_position: MANUAL_RANK_RESERVE + 1,
        market: currentMarket.code,
      });
      continue;
    }

    seenIds.push(existing.id);

    // Back in the feed after an automatic archive: restore what it was before.
    // An offer an admin archived has no such status and stays archived.
    const statusPatch: OfferUpdate = existing.import_archived_status
      ? { status: existing.import_archived_status, import_archived_status: null }
      : {};

    // An admin edit locks the content, so the next sync cannot undo it.
    const contentPatch: OfferUpdate =
      !existing.is_import_locked && hasContentChanged(existing, content) ? content : {};
    const categoryPatch: OfferUpdate =
      !existing.is_import_locked && !existing.category_id && suggestedCategory
        ? { category_id: suggestedCategory }
        : {};

    const patch = { ...statusPatch, ...contentPatch, ...categoryPatch };
    if (Object.keys(patch).length > 0) {
      updates.push({ id: existing.id, title: draft.title, patch });
    }
  }

  await insertOffers(supabase, inserts, result);
  await updateOffers(supabase, updates, result);

  for (const ids of chunk(seenIds, IMPORT_BATCH_SIZE)) {
    await supabase.from("offers").update({ last_synced_at: now }).in("id", ids);
  }

  if (untracked > 0) {
    result.errors.push(
      `${untracked} erbjudanden hoppades över eftersom länken saknade ${network}-spårning.`,
    );
  }

  return result;
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

  const existingOffers = await fetchAllPages<{
    id: string;
    external_id: string | null;
    status: OfferStatus;
  }>((from, to) =>
    supabase
      .from("offers")
      .select("id, external_id, status")
      .eq("affiliate_network", network)
      .eq("is_imported", true)
      .neq("status", "archived")
      .range(from, to),
  );

  const activeSet = new Set(activeExternalIds);
  const toArchive = existingOffers.filter(
    (offer) => offer.external_id && !activeSet.has(offer.external_id),
  );

  for (const status of ["published", "draft"] as const) {
    const ids = toArchive.filter((offer) => offer.status === status).map((offer) => offer.id);

    for (const batch of chunk(ids, IMPORT_BATCH_SIZE)) {
      const { error } = await supabase
        .from("offers")
        .update({ status: "archived", import_archived_status: status })
        .in("id", batch);

      if (error) {
        throw new Error(error.message);
      }
    }
  }

  return toArchive.length;
}

export async function recalculateImportedRanks(supabase: AdminClient, network: AffiliateNetwork) {
  const { error } = await supabase.rpc("recalculate_imported_ranks", {
    p_network: network,
    p_first_rank: MANUAL_RANK_RESERVE + 1,
  });

  if (error) {
    throw new Error(error.message);
  }
}
