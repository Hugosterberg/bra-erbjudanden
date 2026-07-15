import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { getConfiguredAdapters } from "./adapters";
import type { AffiliateAdapter } from "./types";
import type { ImportRunStats, NetworkImportResult } from "./types";
import {
  archiveMissingImportedOffers,
  recalculateImportedRanks,
  upsertImportedOffer,
} from "./upsert-offers";

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

  try {
    const offers = await adapter.fetchOffers();
    result.fetched = offers.length;

    for (const offer of offers) {
      try {
        const outcome = await upsertImportedOffer(supabase, offer);
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

    result.archived = await archiveMissingImportedOffers(
      supabase,
      adapter.network,
      offers.map((offer) => offer.externalId),
    );
    await recalculateImportedRanks(supabase, adapter.network);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : "Unknown network sync error");
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

export async function runAffiliateImport() {
  const adapters = getConfiguredAdapters();

  if (adapters.length === 0) {
    return {
      ok: false as const,
      message: "No affiliate networks configured. Add API credentials to environment variables.",
      stats: summarizeStats([]),
    };
  }

  const runId = await createImportRun(adapters.map((adapter) => adapter.network));
  const networkResults: NetworkImportResult[] = [];

  for (const adapter of adapters) {
    networkResults.push(await syncNetwork(adapter));
  }

  const stats = summarizeStats(networkResults);
  const errors = networkResults.flatMap((result) =>
    result.errors.map((message) => `${result.network}: ${message}`),
  );
  const hasErrors = errors.length > 0;

  await finishImportRun(runId, hasErrors ? "failed" : "completed", stats, errors);

  return {
    ok: !hasErrors,
    message: hasErrors
      ? "Import completed with errors."
      : `Import completed. ${stats.totals.created} created, ${stats.totals.updated} updated.`,
    stats,
    errors,
  };
}
