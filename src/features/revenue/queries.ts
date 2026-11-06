import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";
import type { Database } from "@/shared/types/database";

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
    .limit(10);

  return data ?? [];
}
