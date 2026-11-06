import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import type { Database } from "@/shared/types/database";

import { latestRunPerNetwork } from "./mappers";

export type RevenueDimension = "network" | "store" | "offer" | "page";
export type RevenueRow = Database["public"]["Functions"]["revenue_summary"]["Returns"][number];

export async function findRevenueSummary(dimension: RevenueDimension, since: Date): Promise<RevenueRow[]> {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase.rpc("revenue_summary", {
    p_dimension: dimension,
    p_since: since.toISOString(),
  });

  if (error) {
    console.error(`[revenue] Summary failed for ${dimension}`, error.message);
    return [];
  }

  return (data ?? []) as RevenueRow[];
}

export async function findLatestTransactionSyncRuns() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("network_transaction_sync_runs")
    .select("network, status, fetched, error, ran_at")
    .order("ran_at", { ascending: false })
    .limit(20);

  return latestRunPerNetwork(data ?? []);
}

/** Shows whether a test purchase came back with our click id. */
export async function findRecentTransactions() {
  const supabase = getSupabaseAdminClient();

  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("network_transactions")
    .select("id, network, status, commission, currency, transaction_at, click_id, click_ref, program_external_id")
    .order("transaction_at", { ascending: false })
    .limit(15);

  return data ?? [];
}
