import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import type { AffiliateNetwork, ImportRunStats, NetworkImportResult } from "./types";

export type ImportBatchStatus = "running" | "completed" | "completed_with_errors" | "failed";
export type NetworkImportStatus = ImportBatchStatus;

export function deriveNetworkImportStatus(result: NetworkImportResult): NetworkImportStatus {
  if (result.fetchFailed && result.created === 0 && result.updated === 0) {
    return "failed";
  }

  if (result.errors.length > 0) {
    return "completed_with_errors";
  }

  return "completed";
}

export function deriveBatchImportStatus(
  networkResults: NetworkImportResult[],
): ImportBatchStatus {
  if (networkResults.length === 0) {
    return "failed";
  }

  const statuses = networkResults.map(deriveNetworkImportStatus);
  const allFailed = statuses.every((status) => status === "failed");
  const anyFailed = statuses.some((status) => status === "failed");
  const anyWarnings = statuses.some((status) => status === "completed_with_errors");

  if (allFailed) {
    return "failed";
  }

  if (anyFailed || anyWarnings) {
    return "completed_with_errors";
  }

  return "completed";
}

export async function createImportBatch(networks: AffiliateNetwork[]) {
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
    console.error("Could not create import batch:", error.message);
    return null;
  }

  return data.id;
}

export async function finishImportBatch(
  batchId: string | null,
  status: ImportBatchStatus,
  stats: ImportRunStats,
  errors: string[],
) {
  if (!batchId) {
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
    .eq("id", batchId);
}

export async function startNetworkImportRun(batchId: string, network: AffiliateNetwork) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("affiliate_import_network_runs")
    .insert({
      batch_id: batchId,
      affiliate_network: network,
      status: "running",
    })
    .select("id")
    .single();

  if (error) {
    console.error(`Could not start network import run for ${network}:`, error.message);
    return null;
  }

  return data.id;
}

export async function finishNetworkImportRun(
  networkRunId: string | null,
  result: NetworkImportResult,
) {
  if (!networkRunId) {
    return;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return;
  }

  const status = deriveNetworkImportStatus(result);

  await supabase
    .from("affiliate_import_network_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      fetched: result.fetched,
      created_count: result.created,
      updated_count: result.updated,
      archived_count: result.archived,
      skipped_count: result.skipped,
      errors: result.errors,
    })
    .eq("id", networkRunId);
}
