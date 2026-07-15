import { revalidatePath } from "next/cache";

import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { getConfiguredAdapters } from "./adapters";
import { MIN_FEED_SIZE_FOR_ARCHIVE, NETWORK_SYNC_DELAY_MS } from "./constants";
import { findActiveImportRun } from "./queries";
import type { AffiliateAdapter, ImportRunStats, NetworkImportResult } from "./types";
import {
  archiveMissingImportedOffers,
  createStoreCache,
  recalculateImportedRanks,
  upsertImportedOffer,
} from "./upsert-offers";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function syncNetwork(adapter: AffiliateAdapter): Promise<NetworkImportResult> {
  const supabase = getSupabaseAdminClient();
  const result: NetworkImportResult = {
    network: adapter.network,
    fetched: 0,
    created: 0,
    updated: 0,
    archived: 0,
    skipped: 0,
    errors: [],
  };

  if (!supabase) {
    result.errors.push("Supabase admin client is not configured.");
    return result;
  }

  let fetchFailed = false;
  let offers: Awaited<ReturnType<AffiliateAdapter["fetchOffers"]>> = [];

  try {
    offers = await adapter.fetchOffers();
    result.fetched = offers.length;
  } catch (error) {
    fetchFailed = true;
    result.errors.push(error instanceof Error ? error.message : "Could not fetch offers from network");
    return result;
  }

  const storeCache = createStoreCache();

  for (const offer of offers) {
    try {
      const outcome = await upsertImportedOffer(supabase, offer, storeCache);
      if (outcome === "created") {
        result.created += 1;
      } else if (outcome === "updated") {
        result.updated += 1;
      } else {
        result.skipped += 1;
      }
    } catch (error) {
      result.errors.push(
        error instanceof Error ? error.message : `Unknown error for offer ${offer.externalId}`,
      );
    }
  }

  const allowArchive =
    !fetchFailed &&
    (offers.length >= MIN_FEED_SIZE_FOR_ARCHIVE || result.created + result.updated > 0);

  try {
    result.archived = await archiveMissingImportedOffers(
      supabase,
      adapter.network,
      offers.map((offer) => offer.externalId),
      { allowArchive },
    );
    await recalculateImportedRanks(supabase, adapter.network);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Post-sync cleanup failed");
  }

  return result;
}

function summarizeStats(networkResults: NetworkImportResult[]): ImportRunStats {
  const totals = {
    fetched: 0,
    created: 0,
    updated: 0,
    archived: 0,
    skipped: 0,
  };

  for (const result of networkResults) {
    totals.fetched += result.fetched;
    totals.created += result.created;
    totals.updated += result.updated;
    totals.archived += result.archived;
    totals.skipped += result.skipped;
  }

  return { totals, networks: networkResults };
}

async function createImportRun(networks: string[]) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("affiliate_import_runs")
    .insert({
      status: "running",
      networks,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Could not create affiliate import run:", error.message);
    return null;
  }

  return data.id;
}

async function finishImportRun(
  runId: string | null,
  status: "completed" | "failed",
  stats: ImportRunStats,
  errors: string[],
) {
  if (!runId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  await supabase
    .from("affiliate_import_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      stats,
      errors,
    })
    .eq("id", runId);
}

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/kampanjer");
  revalidatePath("/butiker");
  revalidatePath("/kategorier");
  revalidatePath("/admin");
  revalidatePath("/admin/import");
  revalidatePath("/admin/erbjudanden");
}

export type ImportRunResult = {
  ok: boolean;
  message: string;
  stats: ImportRunStats;
  errors: string[];
  skipped?: boolean;
};

export async function runAffiliateImport(): Promise<ImportRunResult> {
  const activeRun = await findActiveImportRun();
  if (activeRun) {
    return {
      ok: false,
      skipped: true,
      message: "En import körs redan. Vänta tills den är klar.",
      stats: summarizeStats([]),
      errors: [],
    };
  }

  const adapters = getConfiguredAdapters();

  if (adapters.length === 0) {
    return {
      ok: false,
      message: "Inga affiliatenätverk är konfigurerade. Lägg till API-uppgifter i miljövariabler.",
      stats: summarizeStats([]),
      errors: [],
    };
  }

  const runId = await createImportRun(adapters.map((adapter) => adapter.network));
  const networkResults: NetworkImportResult[] = [];

  for (const [index, adapter] of adapters.entries()) {
    if (index > 0) {
      await sleep(NETWORK_SYNC_DELAY_MS);
    }

    networkResults.push(await syncNetwork(adapter));
  }

  const stats = summarizeStats(networkResults);
  const errors = networkResults.flatMap((result) =>
    result.errors.map((message) => `${result.network}: ${message}`),
  );

  const networksWithData = networkResults.filter((result) => result.fetched > 0).length;
  const allNetworksFailed = networksWithData === 0 && errors.length > 0;

  await finishImportRun(runId, allNetworksFailed ? "failed" : "completed", stats, errors);

  if (stats.totals.created + stats.totals.updated + stats.totals.archived > 0) {
    revalidatePublicPages();
  }

  return {
    ok: !allNetworksFailed,
    message: allNetworksFailed
      ? "Importen misslyckades för alla nätverk."
      : errors.length > 0
        ? `Import klar med varningar. ${stats.totals.created} nya, ${stats.totals.updated} uppdaterade.`
        : `Import klar. ${stats.totals.created} nya, ${stats.totals.updated} uppdaterade.`,
    stats,
    errors,
  };
}
