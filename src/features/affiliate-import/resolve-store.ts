import { createSlug } from "@/shared/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/types/database";

import type { AffiliateNetwork, ImportedStoreDraft } from "./types";

type AdminClient = SupabaseClient<Database>;

async function findExistingStore(
  supabase: AdminClient,
  network: AffiliateNetwork,
  externalId: string,
) {
  const { data } = await supabase
    .from("stores")
    .select("id")
    .eq("affiliate_network", network)
    .eq("external_id", externalId)
    .maybeSingle();

  return data?.id ?? null;
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

export async function resolveImportedStore(
  supabase: AdminClient,
  network: AffiliateNetwork,
  store: ImportedStoreDraft,
) {
  const existingId = await findExistingStore(supabase, network, store.externalId);
  if (existingId) {
    await supabase
      .from("stores")
      .update({
        name: store.name,
        website_url: store.websiteUrl,
        logo_url: store.logoUrl,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingId);

    return existingId;
  }

  const baseSlug = createSlug(store.name);
  const slug = await findUniqueSlug(supabase, baseSlug);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("stores")
    .insert({
      name: store.name,
      slug,
      website_url: store.websiteUrl,
      logo_url: store.logoUrl,
      status: "active",
      affiliate_network: network,
      external_id: store.externalId,
      created_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Could not create store "${store.name}": ${error?.message ?? "unknown"}`);
  }

  return data.id;
}
