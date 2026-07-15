import { revalidatePath } from "next/cache";

import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { getConfiguredAdapters } from "./adapters";
import { getCronSkippedNetworks } from "./config";
import { MIN_FEED_SIZE_FOR_ARCHIVE, NETWORK_SYNC_DELAY_MS } from "./constants";
import {
  createImportBatch,
  deriveBatchImportStatus,
  finishImportBatch,
  finishNetworkImportRun,
  markStaleImportRunsFailed,
  startNetworkImportRun,
} from "./import-run-log";
import { findActiveImportRun } from "./queries";
import type { AffiliateAdapter, AffiliateNetwork, ImportRunStats, NetworkImportResult } from "./types";
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
    result.errors.push("Supabase admin-klienten är inte konfigurerad.");
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
      error instanceof Error ? error.message : "Kunde inte hämta erbjudanden från nätverket",
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
        error instanceof Error ? error.message : `Okänt fel för erbjudande ${offer.externalId}`,
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
    result.errors.push(error instanceof Error ? error.message : "Eftersyn misslyckades");
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
  warning?: boolean;
  message: string;
  stats: ImportRunStats;
  errors: string[];
  skipped?: boolean;
  batchId?: string | null;
};

export type RunAffiliateImportOptions = {
  networks?: AffiliateNetwork[];
  /** Cron skips networks listed in AFFILIATE_IMPORT_CRON_SKIP. Manual runs do not. */
  source?: "cron" | "manual";
};

export async function runAffiliateImport(
  options: RunAffiliateImportOptions = {},
): Promise<ImportRunResult> {
  const source = options.source ?? "manual";
  await markStaleImportRunsFailed();

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

  let adapters = getConfiguredAdapters(options.networks);

  if (source === "cron") {
    const cronSkipped = getCronSkippedNetworks();
    adapters = adapters.filter((adapter) => !cronSkipped.includes(adapter.network));
  }

  if (adapters.length === 0) {
    return {
      ok: false,
      message:
        source === "cron"
          ? "Inga nätverk aktiverade för schemalagd import."
          : "Inga affiliatenätverk är konfigurerade. Lägg till API-uppgifter i miljövariabler.",
      stats: summarizeStats([]),
      errors: [],
    };
  }

  const batchId = await createImportBatch(adapters.map((adapter) => adapter.network));
  if (!batchId) {
    return {
      ok: false,
      message: "Kunde inte starta importkörningen. Kontrollera databasanslutningen.",
      stats: summarizeStats([]),
      errors: ["Importloggen kunde inte skapas i databasen."],
    };
  }

  const networkResults: NetworkImportResult[] = [];

  for (const [index, adapter] of adapters.entries()) {
    if (index > 0) {
      await sleep(NETWORK_SYNC_DELAY_MS);
    }

    const networkRunId = await startNetworkImportRun(batchId, adapter.network);

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

  const networkLabel =
    adapters.length === 1 ? adapters[0].network : `${adapters.length} nätverk`;

  const ok = batchStatus === "completed";
  const warning = batchStatus === "completed_with_errors";

  return {
    ok,
    warning,
    batchId,
    message:
      batchStatus === "failed"
        ? `Importen misslyckades för ${networkLabel}.`
        : batchStatus === "completed_with_errors"
          ? `Import klar med fel (${networkLabel}). ${stats.totals.created} nya, ${stats.totals.updated} uppdaterade.`
          : `Import klar (${networkLabel}). ${stats.totals.created} nya, ${stats.totals.updated} uppdaterade.`,
    stats,
    errors,
  };
}
