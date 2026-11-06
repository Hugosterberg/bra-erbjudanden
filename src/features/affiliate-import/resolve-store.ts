import type { SupabaseClient } from "@supabase/supabase-js";

import { currentMarket } from "@/shared/config/market";
import { createSlug } from "@/shared/lib/slug";
import type { Database } from "@/shared/types/database";

import type { AffiliateNetwork, ImportedStoreDraft } from "./types";

type AdminClient = SupabaseClient<Database>;

export function normalizeDomain(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}

/**
 * Lets the same store be recognised across networks, so that Zalando in two
 * networks becomes one page instead of /zalando and /zalando-2 competing.
 */
async function findStoreAcrossNetworks(supabase: AdminClient, store: ImportedStoreDraft) {
  const { data: bySlug } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", createSlug(store.name))
    .maybeSingle();

  if (bySlug) {
    return bySlug.id;
  }

  const domain = normalizeDomain(store.websiteUrl);
  if (!domain) {
    return null;
  }

  const { data: byDomain } = await supabase
    .from("stores")
    .select("id, website_url")
    .ilike("website_url", `%${domain}%`)
    .limit(10);

  return (byDomain ?? []).find((row) => normalizeDomain(row.website_url) === domain)?.id ?? null;
}

async function findUniqueSlug(supabase: AdminClient, baseSlug: string) {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { data } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
    if (!data) {
      return slug;
    }

    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

/** Feeds only fill gaps: what an admin has written or disabled is left alone. */
async function fillMissingStoreFields(
  supabase: AdminClient,
  storeId: string,
  store: ImportedStoreDraft,
) {
  const { data: current } = await supabase
    .from("stores")
    .select("website_url, logo_url, affiliate_url")
    .eq("id", storeId)
    .maybeSingle();

  if (!current) {
    return;
  }

  const patch: Database["public"]["Tables"]["stores"]["Update"] = {};
  if (!current.website_url && store.websiteUrl) {
    patch.website_url = store.websiteUrl;
  }
  if (!current.logo_url && store.logoUrl) {
    patch.logo_url = store.logoUrl;
  }
  if (!current.affiliate_url && store.affiliateUrl) {
    patch.affiliate_url = store.affiliateUrl;
  }

  if (Object.keys(patch).length > 0) {
    await supabase.from("stores").update(patch).eq("id", storeId);
  }
}

async function createStore(
  supabase: AdminClient,
  network: AffiliateNetwork,
  store: ImportedStoreDraft,
) {
  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: store.name,
      slug: await findUniqueSlug(supabase, createSlug(store.name)),
      website_url: store.websiteUrl ?? null,
      logo_url: store.logoUrl ?? null,
      affiliate_url: store.affiliateUrl ?? null,
      status: "active",
      affiliate_network: network,
      external_id: store.externalId,
      market: currentMarket.code,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not create store "${store.name}": ${error?.message ?? "unknown"}`);
  }

  return data.id;
}

export async function resolveImportedStore(
  supabase: AdminClient,
  network: AffiliateNetwork,
  store: ImportedStoreDraft,
) {
  const { data: program } = await supabase
    .from("store_affiliate_programs")
    .select("store_id")
    .eq("network", network)
    .eq("external_id", store.externalId)
    .maybeSingle();

  const storeId =
    program?.store_id ??
    (await findStoreAcrossNetworks(supabase, store)) ??
    (await createStore(supabase, network, store));

  const { error } = await supabase.from("store_affiliate_programs").upsert(
    {
      store_id: storeId,
      network,
      external_id: store.externalId,
      tracking_url: store.affiliateUrl ?? null,
    },
    { onConflict: "network,external_id" },
  );

  if (error) {
    throw new Error(`Could not link store "${store.name}": ${error.message}`);
  }

  await fillMissingStoreFields(supabase, storeId, store);

  return storeId;
}
