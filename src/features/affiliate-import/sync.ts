import { revalidatePath } from "next/cache";

import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { getConfiguredAdapters } from "./adapters";
import { MIN_FEED_SIZE_FOR_ARCHIVE, NETWORK_SYNC_DELAY_MS } from "./constants";
import {
  createImportBatch,
  deriveBatchImportStatus,
  finishImportBatch,
  finishNetworkImportRun,
  startNetworkImportRun,
} from "./import-run-log";
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
    result.fetchFailed = true;
    result.errors.push(
      error instanceof Error ? error.message : "Could not fetch offers from network",
    );
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
  batchId?: string | null;
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

  const batchId = await createImportBatch(adapters.map((adapter) => adapter.network));
  const networkResults: NetworkImportResult[] = [];

  for (const [index, adapter] of adapters.entries()) {
    if (index > 0) {
      await sleep(NETWORK_SYNC_DELAY_MS);
    }

    const networkRunId = batchId
      ? await startNetworkImportRun(batchId, adapter.network)
      : null;

    const result = await syncNetwork(adapter);
    networkResults.push(result);

    await finishNetworkImportRun(networkRunId, result);
  }

  const stats = summarizeStats(networkResults);
  const errors = networkResults.flatMap((result) =>
    result.errors.map((message) => `${result.network}: ${message}`),
  );
  const batchStatus = deriveBatchImportStatus(networkResults);

  await finishImportBatch(batchId, batchStatus, stats, errors);

  if (stats.totals.created + stats.totals.updated + stats.totals.archived > 0) {
    revalidatePublicPages();
  }

  const failedNetworks = networkResults.filter(
    (result) => result.errors.length > 0 && result.fetched === 0,
  );

  return {
    ok: batchStatus !== "failed",
    batchId,
    message:
      batchStatus === "failed"
        ? "Importen misslyckades för alla nätverk."
        : batchStatus === "completed_with_errors"
          ? `Import klar med fel i ${failedNetworks.length || "vissa"} nätverk. ${stats.totals.created} nya, ${stats.totals.updated} uppdaterade.`
          : `Import klar. ${stats.totals.created} nya, ${stats.totals.updated} uppdaterade.`,
    stats,
    errors,
  };
}
