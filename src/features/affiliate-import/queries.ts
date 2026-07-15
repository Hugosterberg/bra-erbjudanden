import { getSupabaseAdminClient } from "@/shared/lib/supabase/admin";

import { IMPORT_RUN_STALE_MINUTES } from "./constants";
import { AFFILIATE_NETWORKS, type ImportRunStats } from "./types";

export type ImportRunRow = {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  networks: string[];
  stats: ImportRunStats | null;
  errors: string[];
};

function mapImportRun(row: {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  networks: string[] | null;
  stats: unknown;
  errors: unknown;
}): ImportRunRow {
  return {
    id: row.id,
    started_at: row.started_at,
    finished_at: row.finished_at,
    status: row.status,
    networks: row.networks ?? [],
    stats: (row.stats as ImportRunStats | null) ?? null,
    errors: Array.isArray(row.errors) ? (row.errors as string[]) : [],
  };
}

export async function findLatestImportRun() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data } = await supabase
    .from("affiliate_import_runs")
    .select("id, started_at, finished_at, status, networks, stats, errors")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapImportRun(data) : null;
}

export async function findRecentImportRuns(limit = 5) {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return [];
  }

  const { data } = await supabase
    .from("affiliate_import_runs")
    .select("id, started_at, finished_at, status, networks, stats, errors")
    .order("started_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(mapImportRun);
}

export async function findActiveImportRun() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const staleBefore = new Date(Date.now() - IMPORT_RUN_STALE_MINUTES * 60_000).toISOString();

  const { data } = await supabase
    .from("affiliate_import_runs")
    .select("id, started_at, finished_at, status, networks, stats, errors")
    .eq("status", "running")
    .gte("started_at", staleBefore)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? mapImportRun(data) : null;
}

export async function countImportedOffersByNetwork() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {} as Record<string, number>;
  }

  const counts: Record<string, number> = Object.fromEntries(
    AFFILIATE_NETWORKS.map((network) => [network, 0]),
  );

  for (const network of AFFILIATE_NETWORKS) {
    const { count } = await supabase
      .from("offers")
      .select("id", { count: "exact", head: true })
      .eq("affiliate_network", network)
      .eq("is_imported", true)
      .eq("status", "published");

    counts[network] = count ?? 0;
  }

  return counts;
}

export async function countManualOffers() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return 0;
  }

  const { count } = await supabase
    .from("offers")
    .select("id", { count: "exact", head: true })
    .eq("is_imported", false)
    .neq("status", "archived");

  return count ?? 0;
}
